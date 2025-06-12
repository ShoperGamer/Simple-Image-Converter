// ==== pdf-converter.js (รวมไว้ในไฟล์เดียวกับ index.js) ====

window.pdfConverter = {
  async convertPdfToImages(file, format = 'png') {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const links = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;

      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      const dataUrl = canvas.toDataURL(mimeType);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${file.name.replace(/\.pdf$/i, '')}_page${i}.${format}`;
      link.textContent = `ดาวน์โหลด ${link.download}`;
      link.className = 'btn btn-outline-primary d-block mb-2';
      links.push(link);
    }

    return links;
  }
};