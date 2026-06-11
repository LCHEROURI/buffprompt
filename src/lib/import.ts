"use client";

export interface ParsedImport {
  title: string;
  description: string | null;
  category: string;
  ai_platform: string | null;
  tags: string[];
  prompt_text: string;
}

export async function parseTXT(content: string): Promise<ParsedImport[]> {
  const blocks = content.split(/={5,}\s*/).filter(Boolean);
  if (blocks.length === 0) {
    // Treat whole file as one prompt
    return [
      {
        title: "Imported Prompt",
        description: null,
        category: "Custom",
        ai_platform: null,
        tags: [],
        prompt_text: content.trim(),
      },
    ];
  }

  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    const titleLine = lines[0]?.replace(/^=+\s*|\s*=+$/g, "").trim() || "Imported Prompt";
    const textStart = lines.findIndex((l) => l.startsWith("---"));
    const metaLines = textStart > 0 ? lines.slice(1, textStart) : [];
    const promptText = textStart > 0 ? lines.slice(textStart + 1).join("\n").trim() : lines.slice(1).join("\n").trim();

    const meta: Record<string, string> = {};
    for (const line of metaLines) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        meta[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
      }
    }

    return {
      title: titleLine,
      description: meta["description"] || null,
      category: meta["category"] || "Custom",
      ai_platform: meta["platform"] || null,
      tags: meta["tags"] ? meta["tags"].split(",").map((t) => t.trim()).filter(Boolean) : [],
      prompt_text: promptText,
    };
  });
}

export async function parseCSV(content: string): Promise<ParsedImport[]> {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const results: ParsedImport[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 2) continue;

    const get = (key: string) => {
      const idx = header.indexOf(key);
      return idx >= 0 ? (row[idx] || "").trim() : "";
    };

    const promptText = get("prompt_text");
    if (!promptText) continue;

    const tagsStr = get("tags");

    results.push({
      title: get("title") || "Imported Prompt",
      description: get("description") || null,
      category: get("category") || "Custom",
      ai_platform: get("ai_platform") || null,
      tags: tagsStr ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean) : [],
      prompt_text: promptText,
    });
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function parseDOCX(file: File): Promise<ParsedImport[]> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
  if (!text) return [];

  return [
    {
      title: file.name.replace(/\.docx$/i, "") || "Imported Document",
      description: null,
      category: "Custom",
      ai_platform: null,
      tags: [],
      prompt_text: text,
    },
  ];
}

export async function parseFile(file: File): Promise<ParsedImport[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "csv": {
      const text = await file.text();
      return parseCSV(text);
    }
    case "docx": {
      return parseDOCX(file);
    }
    case "txt":
    case "md":
    case "markdown": {
      const text = await file.text();
      return parseTXT(text);
    }
    default: {
      // Try as plain text
      const text = await file.text();
      return parseTXT(text);
    }
  }
}
