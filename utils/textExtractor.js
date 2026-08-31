import fs from "fs";

/**
 * Robust extraction of plain text from docx, pdf, or text files
 */
export async function extractTextFromFile(filePath, mimeType = "text/plain", filename = "") {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return "";
    }

    const fname = (filename || filePath).toLowerCase();
    const isPdf = mimeType === "application/pdf" || fname.endsWith(".pdf");
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fname.endsWith(".docx") || fname.endsWith(".doc");

    if (isDocx) {
      try {
        const mammoth = await import("mammoth");
        const extraction = await mammoth.default.extractRawText({ path: filePath });
        if (extraction.value && extraction.value.trim().length > 0) {
          return extraction.value;
        }
      } catch (docErr) {
        // Fallback to reading file buffer if docx extraction fails
      }
      return fs.readFileSync(filePath, "utf-8");
    } else if (isPdf) {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfModule = await import("pdf-parse");
      const pdf = pdfModule.default || pdfModule;
      
      if (typeof pdf === "function") {
        const data = await pdf(fileBuffer);
        return data.text || "";
      } else if (pdf && pdf.PDFParse) {
        const parser = new pdf.PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return textResult.text || "";
      } else {
        return fileBuffer.toString("utf-8");
      }
    } else {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.error(`Error extracting text from file ${filePath}:`, error);
    return "";
  }
}

export default {
  extractTextFromFile
};
