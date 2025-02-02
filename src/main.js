document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('/.netlify/functions/process-pdf', {
      method: 'POST',
      body: formData
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'updated_labels.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      document.getElementById('result').textContent = 'Error processing files';
    }
  });
