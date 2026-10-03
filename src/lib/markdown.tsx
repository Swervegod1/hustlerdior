import { createElement, type ReactNode } from "react";
import Link from "next/link";
import { siteRelativeHref } from "./guide-parse";

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function link(href: string, children: ReactNode, key: string) {
  const resolved = siteRelativeHref(href);
  if (isInternalHref(resolved)) {
    return createElement(Link, { key, href: resolved }, children);
  }
  return createElement(
    "a",
    { key, href: resolved, target: "_blank", rel: "noopener noreferrer" },
    children,
  );
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length) {
    const next = remaining.match(
      /(\*\*[^*]+?\*\*|\*[^*]+?\*|\[[^\]]+?\]\([^)]+?\))/,
    );
    if (!next || next.index === undefined) {
      nodes.push(remaining);
      break;
    }
    if (next.index > 0) nodes.push(remaining.slice(0, next.index));
    const token = next[0];
    if (token.startsWith("**")) {
      nodes.push(createElement("strong", { key: key++ }, token.slice(2, -2)));
    } else if (token.startsWith("*")) {
      nodes.push(createElement("em", { key: key++ }, token.slice(1, -1)));
    } else {
      const parsed = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (parsed) nodes.push(link(parsed[2], parsed[1], String(key++)));
    }
    remaining = remaining.slice(next.index + token.length);
  }
  return nodes;
}

function heading(level: 2 | 3, text: string, key: number) {
  return createElement(`h${level}`, { key }, renderInline(text));
}

function paragraph(text: string, key: number) {
  return createElement("p", { key }, renderInline(text));
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableRow(line: string) {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function table(header: string[], rows: string[][], key: number) {
  return createElement(
    "div",
    { key, className: "fit-table-wrap" },
    createElement(
      "table",
      { className: "fit-table" },
      createElement(
        "thead",
        null,
        createElement(
          "tr",
          null,
          header.map((cell, index) =>
            createElement("th", { key: index }, renderInline(cell)),
          ),
        ),
      ),
      createElement(
        "tbody",
        null,
        rows.map((row, rowIndex) =>
          createElement(
            "tr",
            { key: rowIndex },
            row.map((cell, cellIndex) =>
              createElement("td", { key: cellIndex }, renderInline(cell)),
            ),
          ),
        ),
      ),
    ),
  );
}

function list(ordered: boolean, items: string[], key: number) {
  return createElement(
    ordered ? "ol" : "ul",
    { key },
    items.map((item, i) => createElement("li", { key: i }, renderInline(item))),
  );
}

export function markdownToReact(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push(createElement("hr", { key: key++ }));
      i += 1;
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      blocks.push(heading(3, h3[1], key++));
      i += 1;
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      blocks.push(heading(2, h2[1], key++));
      i += 1;
      continue;
    }
    if (/^#\s+/.test(line)) {
      // Body H1s are rendered by the page shell so crawlers see a single title.
      i += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(list(false, items, key++));
      continue;
    }
    if (isTableRow(line) && isTableSeparator(lines[i + 1] ?? "")) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push(table(header, rows, key++));
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(list(true, items, key++));
      continue;
    }
    const paragraphLines = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push(paragraph(paragraphLines.join(" "), key++));
  }
  return blocks;
}
