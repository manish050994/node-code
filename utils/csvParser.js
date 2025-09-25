const { parse } = require('csv-parse');
const fs = require('fs').promises;

const parseCsv = async (file) => {
  try {
    // Read the file buffer
    const content = await fs.readFile(file.path);
    
    return new Promise((resolve, reject) => {
      const records = [];
      parse(content, {
        columns: true, // Treat first row as headers
        skip_empty_lines: true,
        trim: true,
      })
        .on('data', (record) => records.push(record))
        .on('end', () => resolve(records))
        .on('error', (error) => reject(new Error(`CSV parsing failed: ${error.message}`)));
    });
  } catch (error) {
    throw new Error(`Failed to read CSV file: ${error.message}`);
  }
};

module.exports = { parseCsv };