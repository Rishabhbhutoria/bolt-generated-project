import React, { useState } from 'react';
    import * as pdfjsLib from 'pdfjs-dist/build/pdf';
    import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    function App() {
      const [invoiceFile, setInvoiceFile] = useState(null);
      const [labelFile, setLabelFile] = useState(null);
      const [invoiceText, setInvoiceText] = useState('');
      const [labelText, setLabelText] = useState('');

      const handleFileChange = (e, setFile) => {
        setFile(e.target.files[0]);
      };

      const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const maxPages = pdf.numPages;
        const textContent = [];

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const text = await page.getTextContent();
          textContent.push(text.items.map(item => item.str).join(' '));
        }

        return textContent.join(' ');
      };

      const extractAndCopySKU = async () => {
        if (!invoiceFile || !labelFile) {
          alert('Please upload both invoice and label PDF files.');
          return;
        }

        try {
          const extractedInvoiceText = await extractTextFromPDF(invoiceFile);
          setInvoiceText(extractedInvoiceText);

          const extractedLabelText = await extractTextFromPDF(labelFile);
          setLabelText(extractedLabelText);

          alert('Text extraction complete. Check the display below.');
        } catch (error) {
          console.error('Error reading PDFs:', error);
          alert('Failed to read PDF files.');
        }
      };

      return (
        <div>
          <h1>PDF SKU Extractor</h1>
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setInvoiceFile)} />
          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setLabelFile)} />
          <button onClick={extractAndCopySKU}>Extract and Copy SKU</button>
          <div>
            <h2>Extracted Invoice Text</h2>
            <pre>{invoiceText}</pre>
          </div>
          <div>
            <h2>Extracted Label Text</h2>
            <pre>{labelText}</pre>
          </div>
        </div>
      );
    }

    export default App;
