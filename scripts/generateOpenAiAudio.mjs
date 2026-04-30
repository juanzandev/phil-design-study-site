import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const DATA_FILE = path.resolve("src", "data", "readings.json");
const OUT_DIR = path.resolve("public", "audio");
const MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const VOICE = process.env.OPENAI_TTS_VOICE || "alloy";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  const data = JSON.parse(raw);
  await ensureDir(OUT_DIR);

  const byAudioPath = new Map();
  for (const reading of data.readings) {
    if (!byAudioPath.has(reading.audioPath)) byAudioPath.set(reading.audioPath, reading);
  }

  let generated = 0;
  for (const [audioPath, reading] of byAudioPath.entries()) {
    const outPath = path.resolve("public", audioPath);
    try {
      await fs.access(outPath);
      continue;
    } catch {
      // file does not exist yet
    }

    const input = `${reading.textName} by ${reading.author}. ${reading.summary.join(" ")}`;
    const audio = await client.audio.speech.create({
      model: MODEL,
      voice: VOICE,
      input,
      format: "mp3",
    });
    const buffer = Buffer.from(await audio.arrayBuffer());
    await fs.writeFile(outPath, buffer);
    generated += 1;
    console.log(`Generated: ${audioPath}`);
  }

  console.log(`Done. Generated ${generated} new files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
