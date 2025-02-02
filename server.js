const express = require('express');
  const fileUpload = require('express-fileupload');
  const fs = require('fs');
  const pdfParse = require('pdf-parse');
  const path = require('path');
  const PDFDocument = require('pdfkit');

  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(fileUpload());

  const uploadsDir = path.join(__dirname, 'uploads');

  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

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

  app.post('/upload', (req, res) => {
    const invoiceFile = req.files?.invoice;
    const labelFile = req.files?.label;

    if (!invoiceFile || !labelFile) {
      return res.status(400).send('No files were uploaded.');
    }

    const invoicePath = path.join(uploadsDir, invoiceFile.name);
    const labelPath = path.join(uploadsDir, labelFile.name);

    invoiceFile.mv(invoicePath, async (err) => {
      if (err) return res.status(500).send(err);

      labelFile.mv(labelPath, async (err) => {
        if (err) return res.status(500).send(err);

        try {
          const invoiceText = await extractTextFromPDF(invoicePath);
          const labelText = await extractTextFromPDF(labelPath);

          const updatedLabels = matchAndCopySKU(invoiceText, labelText);

          // Create a PDF document
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
            res.download(pdfPath, 'updated_labels.pdf', (err) => {
              if (err) {
                console.error('Error downloading the file:', err);
                res.status(500).send('Error downloading the file');
              } else {
                // Delete the PDF file after successful download
                fs.unlinkSync(pdfPath);
              }
            });
          });

          writeStream.on('error', (err) => {
            console.error('Error writing the PDF file:', err);
            res.status(500).send('Error creating the PDF file');
          });

          fs.unlinkSync(invoicePath);
          fs.unlinkSync(labelPath);
        } catch (error) {
          res.status(500).send('Error processing files');
        }
      });
    });
  });

  // Serve the index.html file at the root URL
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.use(express.static(path.join(__dirname)));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
