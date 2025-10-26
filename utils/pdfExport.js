const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../models');

exports.generatePdf = async (student, outputDir = 'id_card') => {
  return new Promise(async (resolve, reject) => {
    // Validate student object
    if (!student || !student.id || !student.collegeId) {
      return reject(new ApiError(400, 'Invalid student data: Missing id or collegeId'));
    }

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create full file path
    const filePath = path.join(outputDir, `${student.id}.pdf`);

    const doc = new PDFDocument({
      size: [350, 550], // ID card size
      margins: { top: 20, left: 20, right: 20, bottom: 20 },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // === COLORS ===
    const primaryColor = '#0B2341';
    const accentColor = '#F4B400';
    const textWhite = '#FFFFFF';

    // === Fetch College Details ===
    const college = await db.College.findOne({ where: { id: student.collegeId } });
    if (!college) {
      return reject(new ApiError(404, `College not found for collegeId: ${student.collegeId}`));
    }

    // === BACKGROUND ===
    doc.rect(0, 0, 350, 550).fill(primaryColor);

    // === HEADER with Dynamic College Name ===
    doc
      .fillColor(textWhite)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(college.name.toUpperCase(), 20, 25, { align: 'center', width: 310 })
      .text('STUDENT IDENTITY CARD', 20, 45, { align: 'center', width: 310 });

    // === PHOTO ===
    const defaultImage = path.resolve('./default-student.jpg'); // Ensure this path exists
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
      .text(`ID Number    : ${student.id}`, 40, 300)
      .text(`Name        : ${student.name}`, 40, 320)
      .text(`Father's Name: ${student.fatherName || 'N/A'}`, 40, 340)
      .text(`Course      : ${student.Course?.name || 'N/A'}`, 40, 360)
      .text(`Contact     : ${student.contact || '+91 XXXXXXXX65'}`, 40, 380)
      .text(`Address     : ${student.address || '123 Anywhere St, Any City'}`, 40, 400, { width: 260 });

    // === SIGNATURE and STAMP ===
    if (college.signature && fs.existsSync(path.resolve(college.signature))) {
      doc.image(path.resolve(college.signature), 60, 430, { width: 50, height: 30 });
    } else {
      doc.fillColor('#FFFFFF').fontSize(10).text('No Signature', 60, 440);
    }
    doc.moveTo(60, 470).lineTo(250, 470).strokeColor('#FFFFFF').stroke();
    doc.fillColor('#FFFFFF').fontSize(12).text('Authorized Signature', 100, 475);

    if (college.stamp && fs.existsSync(path.resolve(college.stamp))) {
      doc.image(path.resolve(college.stamp), 200, 430, { width: 50, height: 30 });
    } else {
      doc.fillColor('#FFFFFF').fontSize(10).text('No Stamp', 200, 440);
    }

    // === FOOTER ===
    doc
      .fillColor(accentColor)
      .fontSize(10)
      .text('Powered by', 120, 510, { align: 'center' })
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('MyNexus', 0, 525, { align: 'center' });

    doc.end();

    // Wait for write to finish, then read file
    stream.on('finish', () => {
      resolve(fs.readFileSync(filePath));
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

