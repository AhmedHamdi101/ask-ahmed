import fs from "node:fs";
import path from "node:path";

const rawDir = path.join(process.cwd(), "data", "raw");
const outPath = path.join(process.cwd(), "data", "kb.json");
const allowedExt = new Set([".txt", ".md", ".csv", ".json"]);

function chunkText(text, chunkSize = 1000) {
  const chunks = [];
  let idx = 0;
  while (idx < text.length) {
    chunks.push(text.slice(idx, idx + chunkSize).trim());
    idx += chunkSize;
  }
  return chunks.filter(Boolean);
}

function inferSection(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("cv") || lower.includes("resume")) return "CV";
  if (lower.includes("publication") || lower.includes("scholar")) return "Publications";
  if (lower.includes("project")) return "Projects";
  if (lower.includes("linkedin")) return "Professional Profile";
  if (lower.includes("research")) return "Research";
  return "General";
}

function listRawFiles() {
  if (!fs.existsSync(rawDir)) return [];
  return fs
    .readdirSync(rawDir)
    .filter((file) => file.toLowerCase() !== "readme.md")
    .filter((file) => allowedExt.has(path.extname(file).toLowerCase()));
}

function loadRawFiles() {
  return listRawFiles().map((file) => {
    const full = path.join(rawDir, file);
    const text = fs.readFileSync(full, "utf8");
    return { file, text };
  });
}

function buildKb() {
  const files = loadRawFiles();
  const records = [];

  for (const { file, text } of files) {
    const section = inferSection(file);
    const chunks = chunkText(text);
    chunks.forEach((chunk, i) => {
      records.push({
        id: `${file}-${i + 1}`,
        source: file,
        section,
        text: chunk,
        url: null,
      });
    });
  }

  fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`Built ${records.length} KB chunks from ${files.length} files -> ${outPath}`);
}

buildKb();
