import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "src/content/help");

export type HelpNavItem = { slug: string; title: string; order: number };

const STATIC_SLUGS = ["summary", "screens", "api", "env"] as const;

export function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  if (!raw.startsWith("---\n")) {
    return { meta: {}, body: raw };
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { meta: {}, body: raw };
  }
  const fm = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

export function getHelpNav(): HelpNavItem[] {
  const items: HelpNavItem[] = [];
  for (const slug of STATIC_SLUGS) {
    const p = path.join(CONTENT_DIR, `${slug}.md`);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    const { meta } = parseFrontmatter(raw);
    items.push({
      slug,
      title: meta.title || slug,
      order: parseInt(meta.order || "99", 10),
    });
  }
  const linesPath = path.join(CONTENT_DIR, "lines.generated.md");
  if (fs.existsSync(linesPath)) {
    items.push({ slug: "lines", title: "파일별 라인 수", order: 4 });
  }
  items.sort((a, b) => a.order - b.order);
  return items;
}

export function getHelpBody(slug: string): { title: string; content: string } | null {
  if (slug === "lines") {
    const p = path.join(CONTENT_DIR, "lines.generated.md");
    if (!fs.existsSync(p)) return null;
    return {
      title: "파일별 라인 수",
      content: fs.readFileSync(p, "utf8"),
    };
  }
  const p = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return { title: meta.title || slug, content: body };
}

export function getHelpSlugs(): string[] {
  return getHelpNav().map((i) => i.slug);
}
