import React, { useState } from 'react';
    import { PDFDocument, rgb } from 'pdf-lib';

    function App() {
      const [invoiceFile, setInvoiceFile] = useState(null);
      const [labelFile, setLabelFile] = useState(null);

      const handleFileChange = (e, setFile) => {
        setFile(e.target.files[0]);
      };

      const extractAndCopySKU = async () => {
        if (!invoiceFile || !labelFile) {
          alert('Please upload both invoice and label PDF files.');
          return;
        }

        try {
          // Read the invoice PDF
          const invoiceBytes = await invoiceFile.arrayBuffer();
          const invoicePdfDoc = await PDFDocument.load(invoiceBytes);
          const invoicePages = invoicePdfDoc.getPages();
          let invoiceText = '';

          // Extract text from all pages
          for (const page of invoicePages) {
            const { textContent } = await page.getTextContent();
            invoiceText += textContent.items.map(item => item.str).join(' ');
          }

          // Extract SKUs from the invoice text
          const skuRegex = /\b[A-Z0-9-]+\b/g; // Adjust regex as needed
          const skus = invoiceText.match(skuRegex) || [];

          if (skus.length === 0) {
            alert('No SKUs found in the invoice PDF.');
            return;
          }

          // Read the shipping label PDF
          const labelBytes = await labelFile.arrayBuffer();
          const labelPdfDoc = await PDFDocument.load(labelBytes);

          // Add SKUs to the first page of the shipping label PDF
          const pages = labelPdfDoc.getPages();
          const firstPage = pages[0];
          const { width, height } = firstPage.getSize();
          const fontSize = 12;
          const textYPosition = height - 50; // Adjust position as needed

          skus.forEach((sku, index) => {
            firstPage.drawText(sku, {
              x: 50,
              y: textYPosition - index * (fontSize + 5),
              size: fontSize,
              color: rgb(0, 0, 0),
            });
          });

          // Serialize the PDFDocument to bytes (a Uint8Array)
          const pdfBytes = await labelPdfDoc.save();

          // Create a blob from the PDF bytes
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });

          // Create a link element to download the blob
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'updated-shipping-labels.pdf';
          link.click();
        } catch (error) {
          console.error('Error processing PDFs:', error);
          alert('An error occurred while processing the PDFs. Please check the console for more details.');
        }
      };

      return (
        <div>
          <h1>PDF SKU Extractor</h1>
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setInvoiceFile)} />
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setLabelFile)} />
          <button onClick={extractAndCopySKU}>Extract and Copy SKU</button>
        </div>
      );
    }

    export default App;
