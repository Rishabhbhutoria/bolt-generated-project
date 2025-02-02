const express = require('express');
  const fileUpload = require('express-fileupload');
  const fs = require('fs');
  const pdfParse = require('pdf-parse');
  const path = require('path');

  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(fileUpload());

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

    return updatedLabels.join('\n');
  }

  app.post('/upload', (req, res) => {
    const invoiceFile = req.files?.invoice;
    const labelFile = req.files?.label;

    if (!invoiceFile || !labelFile) {
      return res.status(400).send('No files were uploaded.');
    }

    const invoicePath = path.join(__dirname, 'uploads', invoiceFile.name);
    const labelPath = path.join(__dirname, 'uploads', labelFile.name);

    invoiceFile.mv(invoicePath, async (err) => {
      if (err) return res.status(500).send(err);

      labelFile.mv(labelPath, async (err) => {
        if (err) return res.status(500).send(err);

        try {
          const invoiceText = await extractTextFromPDF(invoicePath);
          const labelText = await extractTextFromPDF(labelPath);

          const updatedLabels = matchAndCopySKU(invoiceText, labelText);

          fs.unlinkSync(invoicePath);
          fs.unlinkSync(labelPath);

          res.send(updatedLabels);
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
