"use client";

import type { Prompt } from "@/lib/types";

export type ExportFormat = "txt" | "md" | "csv" | "pdf" | "docx";

function formatPromptMeta(prompt: Prompt): string {
  const lines = [
    `Title: ${prompt.title}`,
    `Category: ${prompt.category}`,
    `Platform: ${prompt.ai_platform || "N/A"}`,
    `Tags: ${(prompt.tags || []).join(", ") || "None"}`,
    `Created: ${new Date(prompt.created_at).toLocaleDateString()}`,
    `Updated: ${new Date(prompt.updated_at).toLocaleDateString()}`,
  ];
  if (prompt.description) lines.splice(1, 0, `Description: ${prompt.description}`);
  return lines.join("\n");
}

export function generateTXT(prompts: Prompt[]): string {
  return prompts
    .map((p) => {
      return `===== ${p.title} =====\n${formatPromptMeta(p)}\n\n${p.prompt_text}\n`;
    })
    .join("\n---\n\n");
}

export function generateMarkdown(prompts: Prompt[]): string {
  return prompts
    .map((p) => {
      const parts = [
        `# ${p.title}`,
        "",
        `**Category:** ${p.category}  `,
        `**Platform:** ${p.ai_platform || "N/A"}  `,
        `**Tags:** ${(p.tags || []).join(", ") || "None"}  `,
        `**Created:** ${new Date(p.created_at).toLocaleDateString()}  `,
        `**Updated:** ${new Date(p.updated_at).toLocaleDateString()}  `,
        "",
      ];
      if (p.description) {
        parts.splice(2, 0, `> ${p.description}`);
        parts.splice(3, 0, "");
      }
      parts.push("---");
      parts.push("");
      parts.push(p.prompt_text);
      parts.push("");
      return parts.join("\n");
    })
    .join("\n\n---\n\n");
}

export function generateCSV(prompts: Prompt[]): string {
  const header = "title,description,category,ai_platform,tags,prompt_text\n";
  const rows = prompts
    .map((p) => {
      const escape = (s: string | null | undefined) => {
        const val = (s || "").replace(/"/g, '""');
        return `"${val}"`;
      };
      return [
        escape(p.title),
        escape(p.description),
        escape(p.category),
        escape(p.ai_platform),
        escape((p.tags || []).join("; ")),
        escape(p.prompt_text),
      ].join(",");
    })
    .join("\n");
  return header + rows;
}

export async function generatePDF(prompts: Prompt[]): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    if (i > 0) doc.addPage();

    doc.setFontSize(18);
    doc.text(p.title, 20, 20);

    doc.setFontSize(10);
    let y = 30;
    const meta = [
      `Category: ${p.category}`,
      `Platform: ${p.ai_platform || "N/A"}`,
      `Tags: ${(p.tags || []).join(", ") || "None"}`,
    ];
    if (p.description) meta.unshift(`Description: ${p.description}`);
    for (const line of meta) {
      doc.text(line, 20, y);
      y += 5;
    }

    y += 5;
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(p.prompt_text, 170);
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    }
  }

  return doc.output("blob");
}

export async function generateDOCX(prompts: Prompt[]): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
  } = await import("docx");

  const children: any[] = [];

  for (const p of prompts) {
    children.push(
      new Paragraph({
        text: p.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    if (p.description) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p.description, italics: true })],
          spacing: { after: 200 },
        })
      );
    }

    const metaRows = [
      ["Category", p.category],
      ["Platform", p.ai_platform || "N/A"],
      ["Tags", (p.tags || []).join(", ") || "None"],
    ];

    children.push(
      new Table({
        rows: metaRows.map(
          ([key, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: key, bold: true })] })],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph({ text: val })],
                  width: { size: 12000, type: WidthType.DXA },
                }),
              ],
            })
        ),
      })
    );

    children.push(
      new Paragraph({
        text: p.prompt_text,
        spacing: { before: 300 },
        alignment: AlignmentType.LEFT,
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "", size: 1 })],
        spacing: { before: 600 },
        pageBreakBefore: true,
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportPrompts(
  prompts: Prompt[],
  format: ExportFormat,
  filename: string
) {
  switch (format) {
    case "txt": {
      const content = generateTXT(prompts);
      const blob = new Blob([content], { type: "text/plain" });
      downloadBlob(blob, `${filename}.txt`);
      break;
    }
    case "md": {
      const content = generateMarkdown(prompts);
      const blob = new Blob([content], { type: "text/markdown" });
      downloadBlob(blob, `${filename}.md`);
      break;
    }
    case "csv": {
      const content = generateCSV(prompts);
      const blob = new Blob([content], { type: "text/csv" });
      downloadBlob(blob, `${filename}.csv`);
      break;
    }
    case "pdf": {
      const blob = await generatePDF(prompts);
      downloadBlob(blob, `${filename}.pdf`);
      break;
    }
    case "docx": {
      const blob = await generateDOCX(prompts);
      downloadBlob(blob, `${filename}.docx`);
      break;
    }
  }
}
