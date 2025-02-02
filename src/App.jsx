import React, { useState, useEffect } from 'react';
    import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
    import { PDFDocument, rgb } from 'pdf-lib';

    function App() {
      const [invoiceFile, setInvoiceFile] = useState(null);
      const [labelFile, setLabelFile] = useState(null);
      const [extractedText, setExtractedText] = useState('');

      useEffect(() => {
        import('pdfjs-dist/build/pdf.worker.entry').then((worker) => {
          GlobalWorkerOptions.workerSrc = URL.createObjectURL(
            new Blob([`importScripts('${worker}');`], { type: 'application/javascript' })
          );
        });
      }, []);

      const handleFileChange = (e, setFile) => {
        setFile(e.target.files[0]);
      };

      const extractTextFromPDF = async (file) => {
        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
          fileReader.onload = async function () {
            try {
              const typedArray = new Uint8Array(this.result);
              const loadingTask = getDocument(typedArray);
              const pdf = await loadingTask.promise;
              let textContent = '';

              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const text = await page.getTextContent();
                textContent += text.items.map(item => item.str).join(' ') + '\n';
              }

              resolve(textContent);
            } catch (error) {
              reject(error);
            }
          };
          fileReader.readAsArrayBuffer(file);
        });
      };

      const extractAndCopySKU = async () => {
        if (!invoiceFile || !labelFile) {
          alert('Please upload both invoice and label PDF files.');
          return;
        }

        try {
          // Extract text from the invoice PDF
          const invoiceText = await extractTextFromPDF(invoiceFile);

          // Extract SKUs using a regular expression
          const skuPattern = /\b[A-Z0-9]+-[A-Z0-9-]+\b/g;
          const skus = invoiceText.match(skuPattern);

          if (!skus || skus.length === 0) {
            alert('No SKUs found in the invoice PDF.');
            return;
          }

          // Load the shipping label PDF
          const labelBytes = await labelFile.arrayBuffer();
          const labelPdf = await PDFDocument.load(labelBytes);

          // Add SKUs to the first page of the label PDF
          const labelPages = labelPdf.getPages();
          const firstPage = labelPages[0];
          const { width, height } = firstPage.getSize();

          skus.forEach((sku, index) => {
            firstPage.drawText(sku, {
              x: 50,
              y: height - 50 - index * 20,
              size: 12,
              color: rgb(0, 0, 0),
            });
          });

          // Serialize the PDFDocument to bytes (a Uint8Array)
          const pdfBytes = await labelPdf.save();

          // Create a blob and download the modified PDF
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'modified-labels.pdf';
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error processing PDFs:', error);
          alert('An error occurred while processing the PDFs.');
        }
      };

      return (
        <div>
          <h1>PDF SKU Overlay System</h1>
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setInvoiceFile)} />
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setLabelFile)} />
          <button onClick={extractAndCopySKU}>Extract and Copy SKU</button>
        </div>
      );
    }

    export default App;
