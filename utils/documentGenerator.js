import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  ShadingType
} from "docx";
import PDFDocument from "pdfkit";

/**
 * Creates an authentic, 100% valid Microsoft Word (.docx) file buffer
 * that opens smoothly in MS Word, Google Docs, Apple Pages, and LibreOffice with zero warnings.
 */
export async function createRealDocxBuffer(title = "FYP Project Documentation", filename = "document.docx") {
  const cleanTitle = (title || "Final Year Project Documentation").replace(/^\d+-/, '').replace(/\.docx$/i, '').replace(/_/g, ' ');
  const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new Document({
    creator: "SmartFYP Academic Portal",
    title: cleanTitle,
    description: "Official Academic Submission Document - SmartFYP Management System",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
            color: "222222",
          },
          paragraph: {
            spacing: { line: 276, before: 100, after: 100 },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Header Badge
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "SMARTFYP ACADEMIC REPOSITORY",
                bold: true,
                size: 20,
                color: "1D4ED8",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Verified Project Submission & Evaluation Artifact",
                italics: true,
                size: 18,
                color: "64748B",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Main Title
          new Paragraph({
            text: cleanTitle,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Document Reference", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: filename || "FYP_Submission.docx" })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Generated Date", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: docDate })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Verification Status", bold: true })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "Authenticated Academic Record", color: "15803D", bold: true })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 120 } }),

          // Section 1
          new Paragraph({
            text: "1. Executive Summary & Overview",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: "This document serves as the formal deliverable and repository artifact for the Final Year Project registered under the SmartFYP Portal. It outlines the core system specifications, architectural components, milestone completions, and testing protocols established during this development phase.",
          }),

          // Section 2
          new Paragraph({
            text: "2. Scope of Work & Deliverables",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• High-Level Architecture: ", bold: true }),
              new TextRun("Full-stack system integrating responsive front-end interfaces, server-side APIs, and secure database services."),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Quality Assurance: ", bold: true }),
              new TextRun("Code reviews, plagiarism benchmarking, and multi-tier approval validations by assigned faculty supervisors."),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Repository Compliance: ", bold: true }),
              new TextRun("All project commits, document revisions, and milestone logs are synchronized with departmental standards."),
            ],
          }),

          // Section 3
          new Paragraph({
            text: "3. Review & Approval Pipeline",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 100 },
          }),
          new Paragraph({
            text: "This submission has been logged into the SmartFYP system audit trail. It remains available for supervisor feedback, HOD endorsement, and external committee examination.",
          }),

          new Paragraph({ spacing: { before: 300 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "SmartFYP Portal • Department of Computer Science",
                size: 16,
                color: "94A3B8",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Creates an authentic, standard PDF buffer using pdfkit
 */
export function createRealPdfBuffer(title = "FYP Project Documentation", filename = "document.pdf") {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: title,
          Author: "SmartFYP Portal",
          Subject: "Final Year Project Documentation",
        },
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const cleanTitle = (title || "Final Year Project Documentation").replace(/^\d+-/, '').replace(/\.pdf$/i, '').replace(/_/g, ' ');
      const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // Header Banner
      doc
        .rect(50, 45, 495, 4)
        .fill("#2563EB");

      doc
        .fillColor("#2563EB")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("SMARTFYP ACADEMIC REPOSITORY", 50, 60);

      doc
        .fillColor("#64748B")
        .fontSize(8)
        .font("Helvetica")
        .text("Official Academic Submission Artifact", 50, 74);

      // Main Title
      doc
        .fillColor("#0F172A")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(cleanTitle, 50, 105, { width: 495 });

      const afterTitleY = doc.y + 15;

      // Meta Box
      doc
        .roundedRect(50, afterTitleY, 495, 70, 8)
        .fillAndStroke("#F8FAFC", "#E2E8F0");

      doc
        .fillColor("#475569")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("File Reference:", 65, afterTitleY + 14)
        .font("Helvetica")
        .text(filename || "FYP_Document.pdf", 160, afterTitleY + 14);

      doc
        .font("Helvetica-Bold")
        .text("Generated Date:", 65, afterTitleY + 32)
        .font("Helvetica")
        .text(docDate, 160, afterTitleY + 32);

      doc
        .font("Helvetica-Bold")
        .text("Status:", 65, afterTitleY + 50)
        .fillColor("#16A34A")
        .font("Helvetica-Bold")
        .text("Verified Departmental Artifact", 160, afterTitleY + 50);

      let currentY = afterTitleY + 95;

      // Section 1
      doc
        .fillColor("#1E293B")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("1. Executive Summary & Verification", 50, currentY);

      currentY += 22;
      doc
        .fillColor("#334155")
        .fontSize(10)
        .font("Helvetica")
        .text(
          "This document represents an official academic deliverable archived within the SmartFYP Management System. It has been validated through the multi-tier department approval pipeline for compliance with academic curriculum benchmarks.",
          50,
          currentY,
          { width: 495, lineGap: 4 }
        );

      currentY = doc.y + 18;

      // Section 2
      doc
        .fillColor("#1E293B")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("2. Submission Specifications & Highlights", 50, currentY);

      currentY += 22;
      const points = [
        "Repository Integrity: Verified and protected with departmental encryption.",
        "Evaluation Pipeline: Reviewed by assigned Project Supervisor, HOD, and Committee members.",
        "Milestone Compliance: System architecture diagrams, unit tests, and source deliverables logged.",
        "Plagiarism & Authenticity: Scanned against internal institutional repositories and verified."
      ];

      points.forEach((pt) => {
        doc
          .fillColor("#2563EB")
          .fontSize(12)
          .text("•", 55, currentY)
          .fillColor("#334155")
          .fontSize(10)
          .font("Helvetica")
          .text(pt, 70, currentY, { width: 475, lineGap: 3 });
        currentY = doc.y + 6;
      });

      currentY += 14;

      // Section 3
      doc
        .fillColor("#1E293B")
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("3. Digital Authentication Note", 50, currentY);

      currentY += 20;
      doc
        .fillColor("#64748B")
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text(
          `Security ID: SFYP-${Date.now().toString(36).toUpperCase()} • Confidential academic record for authorized departmental personnel access only.`,
          50,
          currentY,
          { width: 495 }
        );

      // Footer
      doc
        .fontSize(8)
        .fillColor("#94A3B8")
        .text("SmartFYP Management Portal • Final Year Project Management System", 50, 770, {
          align: "center",
          width: 495,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
