/**
 * src·scripts 아래 코드 파일별 라인 수를 세어
 * src/content/help/lines.generated.md 를 갱신합니다.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".css"]);

function walk(absDir, relBase, out) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    const rel = path.join(relBase, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(abs, rel, out);
    } else if (EXT.has(path.extname(e.name))) {
      out.push({ abs, rel });
    }
  }
}

function countLines(filePath) {
  const buf = fs.readFileSync(filePath, "utf8");
  if (!buf) return 0;
  return buf.split(/\r\n|\r|\n/).length;
}

const files = [];
walk(path.join(root, "src"), "src", files);
walk(path.join(root, "scripts"), "scripts", files);

const rows = files.map(({ abs, rel }) => ({
  rel,
  lines: countLines(abs),
}));
rows.sort((a, b) => a.rel.localeCompare(b.rel, "en"));

const totalLines = rows.reduce((s, r) => s + r.lines, 0);
const generatedAt = new Date().toISOString();

const lines = [
  "# 파일별 라인 수",
  "",
  `_자동 생성 · ${generatedAt.slice(0, 19)}Z_`,
  "",
  `파일 수 **${rows.length}** · 합계 라인 **${totalLines}**`,
  "",
  "| 파일 | 라인 수 |",
  "|------|---------|",
];

for (const r of rows) {
  lines.push(`| \`${r.rel}\` | ${r.lines} |`);
}

lines.push("");
lines.push(`| **합계** | **${totalLines}** |`);

const outPath = path.join(root, "src/content/help/lines.generated.md");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log("Wrote", outPath, `(${rows.length} files, ${totalLines} lines)`);
