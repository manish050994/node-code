// utils\pdfExport.js (updated: pdfkit)
const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.generatePdf = (html) => {
  const doc = new PDFDocument();
  const file = 'export.pdf';
  doc.pipe(fs.createWriteStream(file));
  doc.text(html);
  doc.end();
  return fs.readFileSync(file);
};