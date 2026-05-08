import "server-only";
import fs from "node:fs";
import path from "node:path";

export type MediaFile = { path: string; bytes: number; modified: number; folder: string };

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const SCAN_ROOTS = ["generated", "admin-uploads"];

export function listMediaFiles(filter?: { q?: string; folder?: string }): MediaFile[] {
  const files: MediaFile[] = [];
  for (const root of SCAN_ROOTS) {
    const abs = path.join(PUBLIC_DIR, root);
    if (!fs.existsSync(abs)) continue;
    walk(abs, (p, st) => {
      if (!/\.(webp|png|jpg|jpeg|svg|gif)$/i.test(p)) return;
      const rel = "/" + path.relative(PUBLIC_DIR, p).replace(/\\/g, "/");
      const folder = path.relative(PUBLIC_DIR, path.dirname(p)).replace(/\\/g, "/");
      files.push({ path: rel, bytes: st.size, modified: st.mtimeMs, folder });
    });
  }
  return files
    .filter((f) => !filter?.q || f.path.toLowerCase().includes(filter.q.toLowerCase()))
    .filter((f) => !filter?.folder || f.folder === filter.folder)
    .sort((a, b) => b.modified - a.modified);
}

export function listMediaFolders(): string[] {
  const out = new Set<string>();
  for (const root of SCAN_ROOTS) {
    const abs = path.join(PUBLIC_DIR, root);
    if (!fs.existsSync(abs)) continue;
    walk(abs, (p, st) => {
      if (!st.isDirectory()) return;
      const rel = path.relative(PUBLIC_DIR, p).replace(/\\/g, "/");
      out.add(rel);
    }, true);
  }
  return Array.from(out).sort();
}

function walk(dir: string, fn: (p: string, st: fs.Stats) => void, includeDirs = false): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    try {
      const st = fs.statSync(full);
      if (e.isDirectory()) {
        if (includeDirs) fn(full, st);
        walk(full, fn, includeDirs);
      } else fn(full, st);
    } catch {
      /* skip */
    }
  }
}
