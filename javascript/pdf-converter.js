pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; 

// Expose the pdfConverter object globally (or via window) so it can be accessed from index.js
window.pdfConverter = {
  /**
   * Converts a PDF file (Blob or File object) into an array of image download links.
   * Each page of the PDF will be converted into a separate image.
   * * @param {File | Blob} file The PDF file to convert.
   * @param {string} format The desired output image format ('png', 'jpg', 'webp'). Defaults to 'png'.
   * @param {function(number, string): void} onProgress Callback function for progress updates.
   * Takes two arguments: percentage (0-100) and a status message. Defaults to a no-op function.
   * @returns {Promise<HTMLAnchorElement[]>} A promise that resolves to an array of anchor (<a>) elements,
   * each representing a download link for a converted image page.
   * @throws {Error} If an invalid file is provided or if the PDF.js library fails to load/process.
   */
  async convertPdfToImages(file, format = 'png', onProgress = () => {}) { 
    if (!file || !(file instanceof File || file instanceof Blob)) {
      throw new Error("Invalid file provided. Expected a File or Blob object.");
    }
    // Validate output format and set default if invalid
    if (!['png', 'jpg', 'webp'].includes(format.toLowerCase())) {
      console.warn(`Unsupported format: ${format}. Defaulting to 'png'.`);
      format = 'png';
    }

    try {
      // Read the PDF file as an ArrayBuffer
      const pdfData = await file.arrayBuffer();
      
      // Load the PDF document using PDF.js
      // .promise ensures the document is fully loaded before proceeding
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      
      const links = []; // Array to store all generated download links
      const totalPages = pdf.numPages; // Get total number of pages in the PDF

      // Loop through each page of the PDF
      for (let i = 1; i <= totalPages; i++) {
        // Calculate the progress percentage for the current page
        // (i - 1) because pages are 1-indexed, but progress should start from 0 for the first page
        const percentage = Math.floor(((i - 1) / totalPages) * 100);
        // Call the onProgress callback to update the UI in index.js
        onProgress(percentage, `กำลังแปลง PDF หน้าที่ ${i}/${totalPages}...`); 

        const page = await pdf.getPage(i);
        
        // Get the viewport for the page, scaled for higher resolution output.
        // A scale of 2 means the image will be twice the size of the original PDF page dimensions.
        // Adjust this 'scale' value as needed for desired image quality vs. file size.
        const viewport = page.getViewport({ scale: 2 }); 
        
        // Create a canvas element to render the PDF page onto
        const canvas = document.createElement('canvas');
        // Get the 2D rendering context of the canvas.
        // The { willReadFrequently: true } hint tells the browser that we will be performing
        // frequent readback operations (like toDataURL), which can optimize internal caching.
        const context = canvas.getContext('2d', { willReadFrequently: true }); 
        
        // Set canvas dimensions to match the scaled viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the PDF page onto the canvas
        // .promise ensures rendering is complete before proceeding
        await page.render({ canvasContext: context, viewport }).promise;

        // Determine the MIME type for the output image
        const mimeType = `image/${format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase()}`;
        // Convert the canvas content to a Data URL (Base64 encoded image)
        const dataUrl = canvas.toDataURL(mimeType);

        // Create an anchor (<a>) element for downloading the image
        const link = document.createElement('a');
        link.href = dataUrl;
        // Construct the download filename, replacing .pdf extension with the new format
        link.download = `${file.name.replace(/\.pdf$/i, '')}_page${i}.${format.toLowerCase()}`;
        link.textContent = `ดาวน์โหลด ${link.download}`;
        // Apply Bootstrap classes for styling
        link.className = 'btn btn-outline-primary d-block mb-2'; 
        
        links.push(link); // Add the link to our array
      }

      // Final progress update once all pages are processed
      onProgress(100, 'แปลง PDF เสร็จสิ้น!'); 
      return links; // Return all generated links
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      // Re-throw the error so the calling function in index.js can handle it
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }
};