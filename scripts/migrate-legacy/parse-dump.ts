import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

export type Row = Record<string, string | null>;

/**
 * Streams a phpMyAdmin/mysqldump SQL file and yields rows for the requested
 * tables. Handles multi-row INSERT statements, quoted strings with escapes,
 * and NULL. Nothing is executed; the file is only parsed.
 */
export async function parseDump(
  file: string,
  tables: string[],
): Promise<Map<string, Row[]>> {
  const wanted = new Set(tables);
  const out = new Map<string, Row[]>(tables.map((t) => [t, []]));
  const rl = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });

  let table: string | null = null;
  let columns: string[] = [];
  let buffer = "";

  // The statement ends at the first ";" that is outside a quoted string.
  const flush = () => {
    if (table && buffer.trim()) {
      const rows = out.get(table)!;
      for (const tuple of splitTuples(buffer)) {
        const values = splitValues(tuple);
        const row: Row = {};
        columns.forEach((c, i) => (row[c] = values[i] ?? null));
        rows.push(row);
      }
    }
    buffer = "";
    table = null;
  };

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO `([^`]+)` \(([^)]*)\) VALUES/);
    if (m) {
      flush();
      if (!wanted.has(m[1])) continue;
      table = m[1];
      columns = m[2].split(",").map((c) => c.trim().replace(/`/g, ""));
      buffer = line.slice(m[0].length);
      if (/;\s*$/.test(buffer) && !insideString(buffer)) flush();
      continue;
    }
    if (table) {
      buffer += "\n" + line;
      if (/;\s*$/.test(line) && !insideString(buffer)) flush();
    }
  }
  flush();
  return out;
}

function insideString(s: string): boolean {
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === "'") inStr = false;
    } else if (ch === "'") inStr = true;
  }
  return inStr;
}

/** Splits "(a,b),(c,d);" into ["a,b", "c,d"] respecting quotes. */
function splitTuples(body: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let cur = "";
  let inStr = false;
  let esc = false;
  for (const ch of body) {
    if (inStr) {
      cur += ch;
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === "'") inStr = false;
      continue;
    }
    if (ch === "'") {
      inStr = true;
      cur += ch;
      continue;
    }
    if (ch === "(") {
      depth++;
      if (depth === 1) {
        cur = "";
        continue;
      }
    }
    if (ch === ")") {
      depth--;
      if (depth === 0) {
        tuples.push(cur);
        cur = "";
        continue;
      }
    }
    if (depth >= 1) cur += ch;
  }
  return tuples;
}

/** Splits one tuple body into decoded values; unquoted NULL becomes null. */
function splitValues(tuple: string): (string | null)[] {
  const values: (string | null)[] = [];
  let cur = "";
  let inStr = false;
  let esc = false;
  let quoted = false;
  const push = () => {
    values.push(!quoted && cur.trim() === "NULL" ? null : quoted ? cur : cur.trim());
    cur = "";
    quoted = false;
  };
  for (const ch of tuple) {
    if (inStr) {
      if (esc) {
        cur += { n: "\n", r: "\r", t: "\t", "0": "\0" }[ch] ?? ch;
        esc = false;
      } else if (ch === "\\") esc = true;
      else if (ch === "'") inStr = false;
      else cur += ch;
      continue;
    }
    if (ch === "'") {
      inStr = true;
      quoted = true;
      cur = ""; // drop whitespace that preceded the opening quote
      continue;
    }
    if (ch === ",") {
      push();
      continue;
    }
    cur += ch;
  }
  push();
  return values;
}
