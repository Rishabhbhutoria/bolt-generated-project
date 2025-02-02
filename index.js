const fs = require('fs');
  const pdfParse = require('pdf-parse');

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

  async function processFiles(invoicePath, labelPath, outputPath) {
    try {
      const invoiceText = await extractTextFromPDF(invoicePath);
      const labelText = await extractTextFromPDF(labelPath);

      const updatedLabels = matchAndCopySKU(invoiceText, labelText);

      fs.writeFileSync(outputPath, updatedLabels);
      console.log('Updated shipping labels saved to', outputPath);
    } catch (error) {
      console.error('Error processing files:', error);
    }
  }

  const invoicePath = 'invoices.pdf';
  const labelPath = 'labels.pdf';
  const outputPath = 'updated_labels.txt';

  processFiles(invoicePath, labelPath, outputPath);
