// src/apply-mix.ts

// --- Polyfill localStorage for Node ---
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) { return store[key] ?? null; },
    setItem(key: string, value: any) { store[key] = String(value); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import dotenv from "dotenv";
import { runModel } from "./run-model2";

////////////////////////////////////////////////////////////////////////////////
// 1) Load .env (double insurance: first dotenv, then manual parsing)
////////////////////////////////////////////////////////////////////////////////

// Prefer CWD/.env
const ENV_PATHS_TO_TRY = [
  path.resolve(process.cwd(), ".env"),
  // Then try the script’s own directory’s .env (in case CWD is not project root)
  path.resolve(__dirname, "../.env"),
];

function safeRead(p: string): string | null {
  try {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
    return null;
  } catch { return null; }
}

// First try regular dotenv loading
dotenv.config({ path: ENV_PATHS_TO_TRY[0] });

// Then manually parse (only overwrite undefined keys)
function manualEnvInject() {
  for (const p of ENV_PATHS_TO_TRY) {
    const raw = safeRead(p);
    if (!raw) continue;

    // Handle CRLF, BOM, and Chinese punctuation
    const text = raw.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/);

    const found: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();

      // Remove paired quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      found[key] = val;
      if (process.env[key] === undefined) process.env[key] = val;
    }

    console.log(`[env] Loaded from ${p}:`, Object.keys(found).sort());
    if (found.POSTGAINS) console.log("[env] file POSTGAINS =", found.POSTGAINS);
    if (found.PANS) console.log("[env] file PANS      =", found.PANS);
    // As long as one file is read, stop trying next paths
    break;
  }
}
manualEnvInject();

////////////////////////////////////////////////////////////////////////////////
// 2) Parse arguments (including cleaning Chinese commas/whitespace etc.)
////////////////////////////////////////////////////////////////////////////////

const TARGET_COUNT = 8;

function normalizeListString(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/[，、；;]+/g, ",")   // Chinese comma/list/semicolon -> comma
    .replace(/\s+/g, ",")         // Any whitespace -> comma
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width/invisible
    .replace(/,+/g, ",")          // Merge multiple commas
    .replace(/^,|,$/g, "")        // Trim leading/trailing commas
    .trim();
}

function parseNumberList(raw: string | undefined, expectedLen: number, fallback: number): number[] {
  const norm = normalizeListString(raw);
  const parts = norm ? norm.split(",") : [];
  const arr = parts
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => Number(v))
    .map((v) => (Number.isFinite(v) ? v : fallback));

  while (arr.length < expectedLen) arr.push(fallback);
  return arr.slice(0, expectedLen);
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// —— Read env —— //
const AT_PAT = process.env.AT_PAT ?? "";
const AT_PROJECT_URL = process.env.AT_PROJECT_URL ?? "";
const AT_NEXUS_MODULE = process.env.AT_NEXUS_MODULE || undefined;

let POSTGAINS: number[] = [];
let PANS: number[] = [];

console.log("[env] cwd:", process.cwd());
console.log("[env] AT_PAT present?:", Boolean(AT_PAT));
console.log("[env] AT_PROJECT_URL:", AT_PROJECT_URL);
console.log("[env] AT_NEXUS_MODULE:", AT_NEXUS_MODULE ?? "(auto-discover)");
console.log("[env] parsed POSTGAINS:", POSTGAINS);
console.log("[env] parsed PANS:", PANS);

if (!AT_PAT) throw new Error("Missing AT_PAT in .env");
if (!AT_PROJECT_URL) throw new Error("Missing AT_PROJECT_URL in .env");

////////////////////////////////////////////////////////////////////////////////
// 3) Load Audiotool SDK & open project
////////////////////////////////////////////////////////////////////////////////

function discoverAudiotoolCandidates(): string[] {
  const candidates = new Set<string>();
  if (AT_NEXUS_MODULE) candidates.add(AT_NEXUS_MODULE);
  candidates.add("@audiotool/nexus");
  candidates.add("@audiotool/nexus-js");
  candidates.add("audiotool-nexus");

  try {
    const scopeDir = path.join(process.cwd(), "node_modules", "@audiotool");
    const entries = fs.readdirSync(scopeDir, { withFileTypes: true });
    for (const e of entries) if (e.isDirectory()) candidates.add(`@audiotool/${e.name}`);
  } catch {}

  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
    for (const name of Object.keys(deps)) if (name.startsWith("@audiotool/")) candidates.add(name);
  } catch {}

  return [...candidates];
}

async function loadAudiotoolModule(): Promise<any | null> {
  for (const id of discoverAudiotoolCandidates()) {
    try {
      const mod = await import(id);
      console.log(`[ok] Loaded Audiotool SDK module: ${id}`);
      return mod;
    } catch {}
  }
  console.warn("[info] Could not load Audiotool SDK. Please install nexus.tgz or set AT_NEXUS_MODULE.");
  return null;
}

async function openSyncedProject(mod: any) {
  if (typeof mod.createAudiotoolClient === "function") {
    const client = await mod.createAudiotoolClient();
    if (typeof client.setPAT === "function") client.setPAT(AT_PAT);
    const nexus = await client.createSyncedDocument({ mode: "online", project: AT_PROJECT_URL });
    if (typeof nexus.start === "function") await nexus.start();
    return { client, nexus, startStyle: "new" as const };
  }
  if (typeof mod.createClient === "function" && typeof mod.createSyncedDocument === "function") {
    const client = mod.createClient();
    if (typeof client.setPAT === "function") client.setPAT(AT_PAT);
    const nexus = mod.createSyncedDocument({ mode: "online", project: AT_PROJECT_URL });
    if (typeof nexus.start === "function") await nexus.start(client);
    return { client, nexus, startStyle: "old" as const };
  }
  throw new Error("Unsupported @audiotool/nexus API shape.");
}

////////////////////////////////////////////////////////////////////////////////
/** 4) Apply 8 sets of postGain & pan to the first 8 mixer channels */
////////////////////////////////////////////////////////////////////////////////
async function applyMixToFirstEight(nexus: any) {
  console.log("\n=== APPLYING MIX (first 8 mixer channels) ===");

  const mixerChannels = nexus.queryEntities.ofTypes("mixerChannel").get().sort((a: any, b: any) => {
    const ai = a.fields?.channelIndex?.value ?? a.fields?.index?.value ?? 1e9;
    const bi = b.fields?.channelIndex?.value ?? b.fields?.index?.value ?? 1e9;
    if (ai !== bi) return ai - bi;
    const an = (a.fields?.name?.value ?? "").toString();
    const bn = (b.fields?.name?.value ?? "").toString();
    return an.localeCompare(bn);
  });

  console.log(`Found ${mixerChannels.length} mixer channels in project.`);
  const targets = mixerChannels.slice(0, TARGET_COUNT);

  targets.forEach((ch: any, i: number) => {
    const idx = ch.fields?.channelIndex?.value ?? ch.fields?.index?.value ?? "(n/a)";
    const name = (ch.fields?.name?.value ?? "").toString();
    console.log(`Target[${i}] -> index=${idx}, name="${name}"`);
  });

  for (let i = 0; i < targets.length; i++) {
    const channel = targets[i];
    const setGain = POSTGAINS[i];
    const setPan = PANS[i];

    console.log(`\n→ Applying to channel #${i + 1}: postGain=${setGain}, pan=${setPan}`);

    await nexus.modify((t: any) => {
      const f = channel.fields?.faderParameters?.fields;
      if (!f) { console.log("  ⚠️  No faderParameters; skipping."); return; }

      if (f.postGain) {
        console.log(`  postGain: ${f.postGain.value} → ${setGain}`);
        t.update(f.postGain, setGain);
      } else {
        console.log(`  ⚠️  No 'postGain'. Fields: ${f ? Object.keys(f).join(", ") : "none"}`);
      }

      const panField = f.pan || f.balance || f.stereoPosition || f.panning;
      if (panField) {
        console.log(`  pan: ${panField.value} → ${setPan}`);
        t.update(panField, setPan);
      } else {
        console.log("  ⚠️  No pan-like field.");
      }
    });
  }

  console.log("\n✓ Mix applied to target channels.");
}

////////////////////////////////////////////////////////////////////////////////
// 5) Main process
////////////////////////////////////////////////////////////////////////////////
async function main() {
  console.log("=== AUDIOTOOL MIXER APPLIER (8 tracks) ===\n");

  const audioFilePaths = fs.readdirSync("downloads").map(file => path.join("downloads", file));
  const instruments = [
    "Vocal",
    "Guitar",
    "Bass",
    "Drums",
    "Piano",
    "Strings",
    "Synth",
    "Percussion"
  ];
  [POSTGAINS, PANS] = await runModel("AImix_model.onnx", "Pop", audioFilePaths, instruments);

  const mod = await loadAudiotoolModule();
  if (!mod) return;

  console.log("Connecting to Audiotool project...");
  const { nexus } = await openSyncedProject(mod);
  console.log("✓ Connected!\n");

  try {
    await applyMixToFirstEight(nexus);
    console.log("\n=== DONE ===");
  } catch (err: any) {
    console.error("Error:", err?.message || err);
  } finally {
    if (typeof (nexus as any)?.stop === "function") {
      console.log("Disconnecting...");
      await (nexus as any).stop();
    }
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
