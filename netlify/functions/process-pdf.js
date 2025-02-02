const fs = require('fs');
  const path = require('path');
  const pdfParse = require('pdf-parse');
  const PDFDocument = require('pdfkit');
  const multiparty = require('multiparty');

  exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const form = new multiparty.Form();
    const uploadsDir = '/tmp';

    return new Promise((resolve, reject) => {
      form.parse(event, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          return resolve({ statusCode: 500, body: 'Error parsing form' });
        }

        try {
          const invoiceFile = files.invoice[0];
          const labelFile = files.label[0];

          const invoicePath = path.join(uploadsDir, invoiceFile.originalFilename);
          const labelPath = path.join(uploadsDir, labelFile.originalFilename);

          fs.renameSync(invoiceFile.path, invoicePath);
          fs.renameSync(labelFile.path, labelPath);

          const invoiceText = await extractTextFromPDF(invoicePath);
          const labelText = await extractTextFromPDF(labelPath);

          const updatedLabels = matchAndCopySKU(invoiceText, labelText);

          const pdfPath = path.join(uploadsDir, 'updated_labels.pdf');
          const doc = new PDFDocument();
          const writeStream = fs.createWriteStream(pdfPath);

          doc.pipe(writeStream);

          updatedLabels.forEach(label => {
            doc.text(label);
            doc.moveDown();
          });

          doc.end();

          writeStream.on('finish', () => {
            const pdfData = fs.readFileSync(pdfPath);
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=updated_labels.pdf'
              },
              body: pdfData.toString('base64'),
              isBase64Encoded: true
            });
          });

          writeStream.on('error', (err) => {
            console.error('Error writing the PDF file:', err);
            resolve({ statusCode: 500, body: 'Error creating the PDF file' });
          });
        } catch (error) {
          console.error('Error processing files:', error);
          resolve({ statusCode: 500, body: 'Error processing files' });
        }
      });
    });
  };

  async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  function matchAndCopySKU(invoiceText, labelText) {
    const invoiceLines = invoiceText.split('\n');
    const labelLines = labelText.split('\n');

    const customerToSKU = {};

    invoiceLines.forEach(line => {
      const [customerName, sku] = line.split(' - ');
      if (customerName && sku) {
        customerToSKU[customerName.trim()] = sku.trim();
      }
    });

    const updatedLabels = labelLines.map(line => {
      const customerName = line.trim();
      const sku = customerToSKU[customerName];
      return sku ? `${line} - SKU: ${sku}` : line;
    });

    return updatedLabels;
  }
