import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  VerticalAlign,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";
import type { AuditProject, TaskStatus } from "../data/checklist";

const statusEmoji: Record<TaskStatus, string> = {
  pass: "✅",
  fail: "❌",
  na: "➖",
  pending: "☐",
};

const COLORS = {
  headerBg: "1B2A4A",
  headerText: "FFFFFF",
  sectionBg: "2D4A7A",
  sectionText: "FFFFFF",
  subHeaderBg: "E8EDF5",
  subHeaderText: "1B2A4A",
  rowEvenBg: "F7F9FC",
  rowOddBg: "FFFFFF",
  cellText: "333333",
  accent: "3B82F6",
  border: "CBD5E1",
};

function shading(color: string) {
  return {
    type: ShadingType.CLEAR,
    color: "auto",
    fill: color,
  };
}

function cellBorders() {
  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: COLORS.border,
  };
  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
  };
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18,
            color: COLORS.subHeaderText,
            font: "Calibri",
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
      }),
    ],
    shading: shading(COLORS.subHeaderBg),
    borders: cellBorders(),
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function dataCell(text: string, isEven: boolean): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 17,
            color: COLORS.cellText,
            font: "Calibri",
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 30, after: 30 },
      }),
    ],
    shading: shading(isEven ? COLORS.rowEvenBg : COLORS.rowOddBg),
    borders: cellBorders(),
    verticalAlign: VerticalAlign.CENTER,
  });
}

function statusCell(status: TaskStatus, isEven: boolean): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: statusEmoji[status],
            size: 20,
            font: "Segoe UI Emoji",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 30, after: 30 },
      }),
    ],
    shading: shading(isEven ? COLORS.rowEvenBg : COLORS.rowOddBg),
    borders: cellBorders(),
    verticalAlign: VerticalAlign.CENTER,
  });
}

function sectionHeaderRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                size: 20,
                color: COLORS.sectionText,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
          }),
        ],
        shading: shading(COLORS.sectionBg),
        borders: cellBorders(),
        verticalAlign: VerticalAlign.CENTER,
        columnSpan: 4,
      }),
    ],
  });
}

function subHeaderRow(): TableRow {
  return new TableRow({
    children: [
      headerCell("✅ Tarea", 35),
      headerCell("🔧 Herramienta", 25),
      headerCell("📌 Qué mirar", 30),
      headerCell("Estado", 10),
    ],
  });
}

export function useExportDocx() {
  async function exportToDocx(project: AuditProject) {
    const tableRows: TableRow[] = [];

    for (const section of project.sections) {
      // Section header
      tableRows.push(sectionHeaderRow(`${section.number}. ${section.title}`));

      // Sub-headers
      tableRows.push(subHeaderRow());

      // Task rows
      section.tasks.forEach((task, idx) => {
        const isEven = idx % 2 === 0;
        const notesText = task.notes
          ? ` — ${task.notes
              .replace(/\[Automático\]\s*/g, "")
              .replace(/\n/g, " ")
              .substring(0, 120)}`
          : "";

        tableRows.push(
          new TableRow({
            children: [
              dataCell(task.title, isEven),
              dataCell(task.tool, isEven),
              dataCell(task.whatToCheck + notesText, isEven),
              statusCell(task.status, isEven),
            ],
          }),
        );
      });
    }

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [3663, 2616, 3140, 1047], // 100% of page width in DXA (~10466 total)
      layout: TableLayoutType.FIXED,
    });

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 22,
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "CHECKLIST AUDITORÍA SEO TÉCNICA",
                  bold: true,
                  size: 32,
                  color: COLORS.headerBg,
                  font: "Calibri",
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.LEFT,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Dominio: ${project.domain || "(no especificado)"}  |  Auditor: ${project.auditor || "(no especificado)"}  |  Fecha: ${project.startDate || new Date().toLocaleDateString("es-ES")}`,
                  size: 18,
                  color: "666666",
                  font: "Calibri",
                  italics: true,
                }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Herramientas: Google Search Console · Screaming Frog · Ahrefs / Semrush · PageSpeed Insights · SSL Labs · Browser DevTools",
                  size: 16,
                  color: "888888",
                  font: "Calibri",
                }),
              ],
              spacing: { after: 200 },
            }),
            table,
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generado con SEO On-Page Auditor — ${new Date().toLocaleDateString("es-ES")}`,
                  size: 14,
                  color: "AAAAAA",
                  italics: true,
                  font: "Calibri",
                }),
              ],
              spacing: { before: 300 },
              alignment: AlignmentType.RIGHT,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const domain = project.domain || "auditoria";
    const filename = `seo-audit-${domain}-${new Date().toISOString().split("T")[0]}.docx`;
    saveAs(blob, filename);
  }

  return { exportToDocx };
}
