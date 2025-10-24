const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


exports.generatePdf = (student, outputPath = 'student_id_card.pdf') => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [350, 550], // ID card size
      margins: { top: 20, left: 20, right: 20, bottom: 20 },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // === COLORS ===
    const primaryColor = '#0B2341';
    const accentColor = '#F4B400';
    const textWhite = '#FFFFFF';

    // === BACKGROUND ===
    doc.rect(0, 0, 350, 550).fill(primaryColor);

    // === HEADER ===
    doc
      .fillColor(textWhite)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('BORCELLE', 20, 25)
      .text('UNIVERSITY', 20, 45);

    // === PHOTO ===
    const defaultImage = path.resolve('./IMG-20250928-WA0024.jpg');
    const imagePath = student.profilePic
      ? path.resolve(student.profilePic)
      : defaultImage;

    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, 75, 80, { width: 200, height: 150, fit: [200, 150] });
    } else {
      doc.rect(75, 80, 200, 150).strokeColor('#FFFFFF').stroke();
      doc.fillColor('#FFFFFF').fontSize(12).text('No Image', 140, 150);
    }

    // === BANNER ===
    doc
      .rect(0, 250, 350, 30)
      .fill(accentColor)
      .fillColor('#000000')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('STUDENT ID CARD', 0, 258, { align: 'center' });

    // === DETAILS ===
    doc
      .fillColor(textWhite)
      .font('Helvetica')
      .fontSize(12)
      .text(`ID Number : ${student.id}`, 40, 300)
      .text(`Name      : ${student.name}`, 40, 320)
      .text(`F's Name  : ${student.fatherName || 'N/A'}`, 40, 340)
      .text(`Class     : ${student.className || 'High School'}`, 40, 360)
      .text(`Contact   : ${student.contact || '+91 XXXXXXXX65'}`, 40, 380)
      .text(`Address   : ${student.address || '123 Anywhere St, Any City'}`, 40, 400, { width: 260 });

    // === SIGNATURE ===
    doc.moveTo(60, 460).lineTo(250, 460).strokeColor('#FFFFFF').stroke();
    doc.fillColor('#FFFFFF').fontSize(12).text('Signature', 120, 470);

    // === FOOTER ===
    doc
      .fillColor(accentColor)
      .fontSize(10)
      .text('Powered by', 120, 510, { align: 'center' })
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('MyNexus', 0, 525, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      // Wait until file fully written
      resolve(fs.readFileSync(outputPath));
    });

    stream.on('error', (err) => reject(err));
  });
};

exports.generatePaySlip = (html) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Simple HTML to PDF rendering (basic, can be enhanced with pdfkit-table or html-pdf)
    doc.font('Helvetica').fontSize(12).text(html, { align: 'left' });
    doc.end();
  });
};

