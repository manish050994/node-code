const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.generatePdf = (html, outputPath = 'export.pdf') => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream(outputPath));
  
  // Proper ID card layout
  doc.fontSize(25).text('Student ID Card', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(html); // html is now student details string
  doc.rect(50, 100, 200, 250).stroke(); // Border for photo/ID
  doc.fontSize(12).text('Signature: ________________', 300, 300);
  
  doc.end();
  return fs.readFileSync(outputPath);
};