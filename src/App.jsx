import React, { useState } from 'react';
    import { PDFDocument } from 'pdf-lib';

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

        // Logic to extract SKUs from invoice and copy to labels
        // This is a placeholder for the actual implementation
        alert('Extracting SKUs and copying to labels...');
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
