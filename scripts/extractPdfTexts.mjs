import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const ROOT = path.resolve("..", "Philosophy of Design", "Phil Design");
const OUT_ROOT = path.resolve("src", "data", "pdf-texts");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function cleanText(raw) {
  return raw
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

async function extractOne(pdfPath) {
  const parser = new PDFParse({ data: await fs.readFile(pdfPath) });
  const result = await parser.getText();
  await parser.destroy();
  return cleanText(result.text ?? "");
}

async function main() {
  await ensureDir(OUT_ROOT);
  const categories = await fs.readdir(ROOT);
  let count = 0;

  for (const category of categories) {
    const categoryPath = path.join(ROOT, category);
    const stat = await fs.stat(categoryPath);
    if (!stat.isDirectory()) continue;

    const outCategory = path.join(OUT_ROOT, category);
    await ensureDir(outCategory);

    const files = (await fs.readdir(categoryPath)).filter((f) => f.toLowerCase().endsWith(".pdf"));
    for (const file of files) {
      const pdfPath = path.join(categoryPath, file);
      const txtName = file.replace(/\.pdf$/i, ".txt");
      const txtPath = path.join(outCategory, txtName);
      const text = await extractOne(pdfPath);
      await fs.writeFile(txtPath, text, "utf-8");
      count += 1;
    }
  }

  console.log(`Extracted ${count} PDFs to ${OUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
