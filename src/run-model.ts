import { InferenceSession, Tensor } from "onnxruntime-node";
import * as fs from "fs";
import * as path from "path";
import decode from "wav-decoder";

export async function runModel(modelPath: string, genre: string, audioFilePaths: string[], instruments: string[]): Promise<[number[], number[]]> {
  const session = await InferenceSession.create(modelPath);
  const genres = [
    "Classical",
    "Electronic/Fusion",
    "Jazz",
    "Musical Theatre",
    "Pop",
    "Rap",
    "Rock",
    "Singer/Songwriter",
    "World/Folk",
    "Unknown"
  ];
  const genreIndex = genres.indexOf(genre);
  const genreTensor = new Tensor("int64", new BigInt64Array([BigInt(genreIndex)]), [1, 1]);

  const fixedLength = 485052;
  const numChannels = 2; // Model expects stereo

  const allTracksData = new Float32Array(audioFilePaths.length * numChannels * fixedLength);
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
    const rightChannel = audioData.channelData.length > 1 ? audioData.channelData[1] : leftChannel;
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

  const instrumentVocabulary = [
    "Vocal", "Guitar", "Bass", "Drums", "Piano", "Strings", "Synth", "Percussion", "Other"
  ];

  const instrumentIndices = instruments.map(inst => {
    // A simple match, assuming instrument names are like "Vocal_Lead.wav" -> "Vocal"
    const instType = inst.split("_")[0];
    const index = instrumentVocabulary.indexOf(instType);
    return index === -1 ? instrumentVocabulary.indexOf("Other") : index;
  });

  const instrumentsTensor = new Tensor('int64', BigInt64Array.from(instrumentIndices.map(BigInt)), [1, instruments.length]);

  const validMask = new Uint8Array(instruments.length).fill(1);
  const validMaskTensor = new Tensor('bool', validMask, [1, instruments.length]);

  const feeds = {
    "genre": genreTensor,
    "tracks": tracksTensor,
    "instruments": instrumentsTensor,
    "valid_mask": validMaskTensor
  };
  const results = await session.run(feeds);
  const outputTensor = results[session.outputNames[0]];
  const outputData = outputTensor.data as Float32Array;

  const postGains = Array.from(outputData.slice(0, 8));
  const pans = Array.from(outputData.slice(8, 16));

  return [postGains, pans];
}
