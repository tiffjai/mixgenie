import { InferenceSession, Tensor } from "onnxruntime-node";
import * as fs from "fs";
import decode from "wav-decoder";

export async function runModel(
  modelPath: string,
  genre: string,
  audioFilePaths: string[],
  instruments: string[]
): Promise<[number[], number[]]> {
  const session = await InferenceSession.create(modelPath);

  // ✅ Fixed genre mapping
  const genreMapping: Record<string, number> = {
    "Classical": 0,
    "Electronic/Fusion": 1,
    "Jazz": 2,
    "Musical Theatre": 3,
    "Pop": 4,
    "Rap": 5,
    "Rock": 6,
    "Singer/Songwriter": 7,
    "World/Folk": 8,
    "unknown": 9
  };
  const genreIndex = genreMapping[genre] ?? genreMapping["unknown"];
  const genreTensor = new Tensor(
    "int64",
    new BigInt64Array([BigInt(genreIndex)]),
    [1, 1]
  );

  // Audio preprocessing
  const fixedLength = 485052;
  const numChannels = 2;
  const allTracksData = new Float32Array(
    audioFilePaths.length * numChannels * fixedLength
  );
  let currentOffset = 0;

  for (const filePath of audioFilePaths) {
    const buffer = fs.readFileSync(filePath);
    const audioData = await decode.decode(buffer);

    // Left channel
    const leftChannel = audioData.channelData[0];
    const paddedLeft = new Float32Array(fixedLength);
    paddedLeft.set(leftChannel.slice(0, fixedLength));
    allTracksData.set(paddedLeft, currentOffset);
    currentOffset += fixedLength;

    // Right channel (duplicate left if mono)
    const rightChannel =
      audioData.channelData.length > 1
        ? audioData.channelData[1]
        : leftChannel;
    const paddedRight = new Float32Array(fixedLength);
    paddedRight.set(rightChannel.slice(0, fixedLength));
    allTracksData.set(paddedRight, currentOffset);
    currentOffset += fixedLength;
  }

  const tracksTensor = new Tensor(
    "float32",
    allTracksData,
    [1, audioFilePaths.length, numChannels, fixedLength]
  );

  // ✅ Fixed instrument mapping
  const instrumentMapping: Record<string, number> = {
    "aux_perc": 0,
    "bass": 1,
    "brass": 2,
    "drum": 3,
    "fx": 4,
    "guitar": 5,
    "keys": 6,
    "kick": 7,
    "misc": 8,
    "organ": 9,
    "percussion": 10,
    "room": 11,
    "silence": 12,
    "snare": 13,
    "string": 14,
    "synth": 15,
    "vocal": 16,
    "woodwind": 17
  };

  const instrumentIndices = instruments.map(inst => {
    const key = inst.toLowerCase().split("_")[0]; // normalize prefix
    return instrumentMapping[key] ?? instrumentMapping["misc"];
  });

  const instrumentsTensor = new Tensor(
    "int64",
    BigInt64Array.from(instrumentIndices.map(BigInt)),
    [1, instruments.length]
  );

  const validMask = new Uint8Array(instruments.length).fill(1);
  const validMaskTensor = new Tensor("bool", validMask, [1, instruments.length]);

  // Run model
  const feeds = {
    genre: genreTensor,
    tracks: tracksTensor,
    instruments: instrumentsTensor,
    valid_mask: validMaskTensor,
  };
  const results = await session.run(feeds);
  const outputTensor = results[session.outputNames[0]];
  const outputData = outputTensor.data as Float32Array;

  // Extract outputs
  const rawGains = Array.from(outputData.slice(0, 8));
  const rawPans = Array.from(outputData.slice(8, 16));

  // ✅ Apply denormalization
    // rawGains are in [0,1] from model trained with -48 to +12
    const gains = rawGains.map(v => {
    const dB_old = -48 + v * 60;          // map back to old training range
    const g_new = (dB_old + 48) / 54;     // renormalize to new range (-48 → 0, +6 → 1)
    return Math.min(Math.max(g_new, 0), 1); // clamp safety
    });

  const pans = rawPans.map(v => v * 2 - 1);       // [0,1] → [-1, 1]

  return [gains, pans];
}
