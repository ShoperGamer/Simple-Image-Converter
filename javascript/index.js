document.addEventListener('DOMContentLoaded', () => {
  // DOM Variables
  const dropZone = document.getElementById('drop-zone');
  const fileList = document.getElementById('file-list');
  const convertBtn = document.getElementById('convert-btn');
  const convertImageBtn = document.getElementById('convert-image-btn');
  const formatSelect = document.getElementById('format-select');
  const resultArea = document.getElementById('result-area');
  const clearAllBtn = document.getElementById('clear-all-btn'); 
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent'); // Added this variable

  // State Variables
  let selectedFiles = [];
  let draggingItem = null;
  let touchStartY = 0;
  let touchStartX = 0;
  let touchMoveThreshold = 10;
  let isTouchDragging = false;

  // Event Listeners
  dropZone.addEventListener('click', handleClick);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  convertBtn.addEventListener('click', convertToPdf);
  convertImageBtn.addEventListener('click', convertImages);
  clearAllBtn.addEventListener('click', clearAllFiles); 

  // Mouse drag events
  fileList.addEventListener('dragstart', handleDragStart);
  fileList.addEventListener('dragover', handleListDragOver);
  fileList.addEventListener('drop', handleListDrop);
  fileList.addEventListener('dragend', handleDragEnd);

  // Touch events
  fileList.addEventListener('touchstart', handleTouchStart, { passive: false });
  fileList.addEventListener('touchmove', handleTouchMove, { passive: false });
  fileList.addEventListener('touchend', handleTouchEnd);
  fileList.addEventListener('touchcancel', handleTouchEnd);

  // Add dynamic styles for drag & drop and removing animation
  const style = document.createElement('style');
  style.textContent = `
    #file-list li.touch-dragging {
      opacity: 0.8;
      box-shadow: 0 0 15px rgba(0,0,0,0.4);
      background-color: #f8f9fa !important;
      z-index: 1000;
      position: relative;
    }
    #file-list li.drag-over-top {
      border-top: 3px solid #0d6efd;
      margin-top: 5px;
    }
    #file-list li.drag-over-bottom {
      border-bottom: 3px solid #0d6efd;
      margin-bottom: 5px;
    }
    #file-list li.dragging {
      opacity: 0.5;
    }
    @media (hover: none) {
      #file-list li {
        touch-action: pan-y;
        user-select: none;
        -webkit-user-drag: none;
      }
    }
    /* Style for removing item */
    #file-list li.removing-item,
    #result-area .d-flex.align-items-center.mb-2.removing-item {
      opacity: 0;
      transform: translateX(-20px);
      transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);

  // Function to handle file input click
  function handleClick() {
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = '.png,.jpg,.jpeg,.webp,.avif,.gif,.pdf,.svg';
    tempInput.multiple = true;
    tempInput.style.display = 'none';
    tempInput.addEventListener('change', (e) => handleFiles(e.target.files));
    document.body.appendChild(tempInput);
    tempInput.click();
    setTimeout(() => document.body.removeChild(tempInput), 100);
  }

  function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  }

  function handleDragLeave() {
    dropZone.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  }

  function handleFiles(files) {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/webp', 
      'image/avif', 'image/gif', 'application/pdf',
      'image/svg+xml'
    ];
    const newFiles = Array.from(files).filter(file => {
      const isAllowed = allowedTypes.includes(file.type);
      const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size);
      return isAllowed && !isDuplicate;
    });

    if (newFiles.length === 0) return;

    selectedFiles.push(...newFiles);
    updateFileList();
    convertBtn.disabled = false;
    convertImageBtn.disabled = false;
    clearAllBtn.disabled = false; 
  }

  function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.setAttribute('draggable', 'true'); 
      li.dataset.index = index; 

      const fileName = document.createElement('span');
      fileName.textContent = file.name;
      fileName.className = 'flex-grow-1 me-2 text-truncate';

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn btn-sm btn-outline-danger';
      btnRemove.textContent = 'ลบ';
      btnRemove.title = 'ลบไฟล์นี้';
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        const removedFileName = file.name;
        const listItem = e.target.closest('li');
        listItem.classList.add('removing-item');
        setTimeout(() => {
            selectedFiles.splice(index, 1);
            updateFileList();
            if (selectedFiles.length === 0) {
                convertBtn.disabled = true;
                convertImageBtn.disabled = true;
                clearAllBtn.disabled = true;
                resultArea.innerHTML = '';
            }
            showToast(`'${removedFileName}' ถูกลบแล้ว!`);
        }, 300);
      });

      const btnGroup = document.createElement('div');
      btnGroup.className = 'd-flex';
      btnGroup.appendChild(btnRemove); 

      li.appendChild(fileName);
      li.appendChild(btnGroup);

      fileList.appendChild(li);
    });
    fileList.style.display = selectedFiles.length ? 'block' : 'none';
  }

  function clearAllFiles() {
    selectedFiles = [];
    updateFileList();
    convertBtn.disabled = true;
    convertImageBtn.disabled = true;
    clearAllBtn.disabled = true;
    resultArea.innerHTML = '';
    showToast('ล้างไฟล์ทั้งหมดแล้ว!');
  }

  // Progress Bar Functions
  function updateProgress(percentage, message = '') {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressText.textContent = message || `กำลังประมวลผล... ${percentage}%`;
    progressPercent.textContent = `${percentage}%`; // Use progressPercent instead of direct DOM access
  }

  function showProgress() {
    progressContainer.style.display = 'block';
    updateProgress(0, 'กำลังเริ่มต้น...');
  }

  function hideProgress() {
    progressContainer.style.display = 'none';
  }

  // Function to display Toast Notification
  function showToast(message) {
      const toastEl = document.getElementById('liveToast');
      if (toastEl) {
          const toastBody = toastEl.querySelector('.toast-body');
          if (toastBody) {
              toastBody.textContent = message;
          }
          const toast = new bootstrap.Toast(toastEl, {
              delay: 3000
          });
          toast.show();
      } else {
          console.warn('Toast element not found. Please ensure #liveToast exists in your HTML.');
      }
  }


  // --- Mouse Drag and Drop Functions ---
  function handleDragStart(e) {
    if (e.target.tagName === 'LI') {
      draggingItem = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', e.target.dataset.index);
      e.target.classList.add('dragging');
    }
  }

  function handleListDragOver(e) {
    e.preventDefault();
    if (e.target.tagName === 'LI' && draggingItem && e.target !== draggingItem) {
      const bounding = e.target.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);

      // Remove previous highlights
      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      if (e.clientY - offset > 0) {
        e.target.classList.add('drag-over-bottom');
      } else {
        e.target.classList.add('drag-over-top');
      }
    }
  }

  function handleListDrop(e) {
    e.preventDefault();
    if (e.target.tagName === 'LI' && draggingItem) {
      const fromIndex = parseInt(draggingItem.dataset.index);
      let toIndex = parseInt(e.target.dataset.index);

      const bounding = e.target.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);

      if (e.clientY - offset > 0) {
        toIndex++; // Drop below the target item
      }

      // Ensure toIndex is within bounds
      if (toIndex > selectedFiles.length) {
          toIndex = selectedFiles.length;
      }
      if (toIndex < 0) {
          toIndex = 0;
      }

      // Reorder the selectedFiles array
      const [movedItem] = selectedFiles.splice(fromIndex, 1);
      selectedFiles.splice(toIndex > fromIndex ? toIndex -1 : toIndex, 0, movedItem); 

      updateFileList();
    }
  }

  function handleDragEnd(e) {
    if (draggingItem) {
      draggingItem.classList.remove('dragging');
      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      draggingItem = null;
    }
  }

  // --- Touch Drag and Drop Functions ---
  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;

    // -- START: FIX for Mobile Delete Button --
    const targetElement = e.target;
    // If the touch started on the remove button, let the click event handle it.
    // Prevent the drag behavior from interfering.
    if (targetElement.tagName === 'BUTTON' && targetElement.classList.contains('btn-outline-danger')) {
        return;
    }
    // -- END: FIX for Mobile Delete Button --

    const touch = e.touches[0];
    const li = touch.target.closest('li');
    if (!li) return;

    e.preventDefault(); // Prevent default only if we are likely starting a drag
    draggingItem = li;
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    isTouchDragging = false; // Reset drag state

    li.classList.add('touch-dragging');

    // Temporarily disable pointer events on the remove button to prevent accidental clicks during drag
    const btnRemove = li.querySelector('.btn-outline-danger');
    if (btnRemove) {
      btnRemove.style.pointerEvents = 'none';
    }
  }

  function handleTouchMove(e) {
    if (!draggingItem || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;

    // Check if the movement is significant enough to be considered a drag
    if (!isTouchDragging && Math.abs(deltaY) < touchMoveThreshold && Math.abs(deltaX) < touchMoveThreshold) {
        return;
    }

    e.preventDefault(); // Prevent scrolling only if a drag is confirmed or in progress
    isTouchDragging = true;

    // Apply transform only for vertical dragging
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      draggingItem.style.transform = `translateY(${deltaY}px)`;
      draggingItem.style.transition = 'none'; // Disable transition during drag

      const touchY = touch.clientY;
      // Get elements at the current touch position
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      // Find the list item that is NOT the one being dragged
      const targetLi = elements.find(el => el.tagName === 'LI' && el !== draggingItem);

      // Clear previous highlights
      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      if (targetLi) {
        const targetRect = targetLi.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        if (touchY < targetMiddle) {
          targetLi.classList.add('drag-over-top');
        } else {
          targetLi.classList.add('drag-over-bottom');
        }
      }
    }
  }

  function handleTouchEnd(e) {
    if (!draggingItem) return;

    e.preventDefault(); // Prevent default tap behavior if a drag occurred
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;

    // Reset styles
    draggingItem.style.transform = '';
    draggingItem.style.transition = '';
    draggingItem.classList.remove('touch-dragging');

    // Re-enable pointer events on the remove button
    const btnRemove = draggingItem.querySelector('.btn-outline-danger');
    if (btnRemove) {
      btnRemove.style.pointerEvents = '';
    }

    // Only reorder if a drag actually happened
    if (isTouchDragging && Math.abs(deltaY) > touchMoveThreshold) {
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetLi = elements.find(el => el.tagName === 'LI' && el !== draggingItem);

      if (targetLi) {
        const fromIndex = parseInt(draggingItem.dataset.index);
        let toIndex = parseInt(targetLi.dataset.index);

        const targetRect = targetLi.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        if (touch.clientY > targetMiddle) {
          toIndex++;
        }

        // Ensure toIndex is within bounds
        if (toIndex > selectedFiles.length) toIndex = selectedFiles.length;
        if (toIndex < 0) toIndex = 0;

        // Perform the reordering
        const [movedItem] = selectedFiles.splice(fromIndex, 1);
        selectedFiles.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedItem);

        updateFileList(); // Re-render the list
      }
    }

    // Clear any lingering drag-over highlights
    document.querySelectorAll('#file-list li').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Reset drag state variables
    draggingItem = null;
    isTouchDragging = false;
  }

  // Function to convert image files to PDF
  async function convertToPdf() {
    if (selectedFiles.length === 0) return;

    convertBtn.disabled = true;
    showProgress();
    resultArea.innerHTML = '';

    const { jsPDF } = window.jspdf;

    const pdfTypeSelect = document.getElementById('pdf-type-select');
    const isGrayscale = pdfTypeSelect.value === 'grayscale';

    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      resultArea.innerHTML = `<p class="text-danger">ไม่มีไฟล์ภาพที่สามารถแปลงเป็น PDF ได้</p>`;
      convertBtn.disabled = false;
      hideProgress();
      return;
    }

    // --- Check image orientation for PDF page orientation ---
    let allImagesAreLandscape = true;
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const img = new Image();
        img.src = await readImage(file);
        await new Promise(res => (img.onload = res));
        if (img.height >= img.width) { // If any image is portrait or square
          allImagesAreLandscape = false;
          break;
        }
      }
    }

    // Set PDF orientation based on image analysis
    const orientation = allImagesAreLandscape ? 'l' : 'p'; // 'l' for landscape, 'p' for portrait
    const doc = new jsPDF(orientation, 'mm', 'a4'); // Create doc with determined orientation

    try {
      const totalFiles = imageFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = imageFiles[i];
        const progress = Math.floor((i / totalFiles) * 100);
        updateProgress(progress, `กำลังแปลงไฟล์ ${i+1}/${totalFiles}...`);
        
        const imgData = await readImage(file); 
        const img = new Image();
        img.src = imgData;
        await new Promise(res => (img.onload = res));

        const canvas = document.createElement('canvas');
        // Added willReadFrequently for potential performance optimization
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); 
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (isGrayscale) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let j = 0; j < data.length; j += 4) {
            const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
            data[j] = avg;
            data[j + 1] = avg;
            data[j + 2] = avg;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        const imageDataForPdf = canvas.toDataURL('image/jpeg', 0.9); 

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        if (i > 0) doc.addPage(); // Add a new page for each image after the first
        doc.addImage(imageDataForPdf, 'JPEG', x, y, width, height);
      }

      updateProgress(100, 'แปลงไฟล์เสร็จสิ้น!');
      setTimeout(() => hideProgress(), 1000);

      const pdfUrl = doc.output('bloburl');

      const wrapper = document.createElement('div');
      wrapper.className = 'd-flex align-items-center mb-2';

      const link = document.createElement('a');
      link.className = 'btn btn-success me-2';
      link.href = pdfUrl;
      link.download = 'converted.pdf';
      link.textContent = 'ดาวน์โหลด PDF';

      const btnRemoveResult = document.createElement('button');
      btnRemoveResult.className = 'btn btn-outline-danger btn-sm';
      btnRemoveResult.textContent = 'ลบ';
      btnRemoveResult.addEventListener('click', () => {
        const removedFileName = link.download;
        const resultWrapper = btnRemoveResult.closest('.d-flex.align-items-center.mb-2');
        resultWrapper.classList.add('removing-item');
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl); // Clean up blob URL
            resultWrapper.remove();
            showToast(`'${removedFileName}' ถูกลบแล้วจากรายการดาวน์โหลด!`);
        }, 300);
      });

      wrapper.appendChild(link);
      wrapper.appendChild(btnRemoveResult);
      resultArea.appendChild(wrapper);

    } catch (error) {
      console.error('PDF conversion error:', error);
      resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาดในการสร้าง PDF: ${error.message}</p>`;
      hideProgress();
    } finally {
      convertBtn.disabled = false;
    }
  }

  // Converts images or PDFs to selected image format
  async function convertImages() {
    if (selectedFiles.length === 0) return;

    convertImageBtn.disabled = true;
    showProgress(); // Show progress bar
    resultArea.innerHTML = '';
    
    const targetFormat = formatSelect.value;
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/') || f.type === 'image/svg+xml');
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    const allLinks = [];

    try {
      const totalFilesCount = imageFiles.length + pdfFiles.length; // Total files to process
      let processedFiles = 0;

      // Process image files (including SVG)
      for (const file of imageFiles) {
        const progress = Math.floor((processedFiles / totalFilesCount) * 100);
        updateProgress(progress, `กำลังแปลงภาพ ${file.name} (${processedFiles+1}/${totalFilesCount})...`);
        
        if (targetFormat === 'svg') {
          if (file.type === 'image/svg+xml') {
            // If source is SVG and target is SVG, just provide download link
            const svgData = await readFileAsText(file);
            const link = createDownloadLink(new Blob([svgData], { type: 'image/svg+xml' }), 'image/svg+xml', file.name);
            allLinks.push(link);
          } else {
            // Convert raster image to SVG (basic conversion)
            const svgData = await convertImageToSvg(file);
            const link = createDownloadLink(new Blob([svgData], { type: 'image/svg+xml' }), 'image/svg+xml', file.name.replace(/\.\w+$/, '.svg'));
            allLinks.push(link);
          }
        } 
        else if (file.type === 'image/svg+xml') {
          // Convert SVG to raster image (PNG, JPG, WebP)
          const imageBlob = await convertSvgToImage(file, targetFormat);
          const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
          const link = createDownloadLink(imageBlob, mimeType, file.name.replace(/\.svg$/, `.${targetFormat}`));
          allLinks.push(link);
        }
        else {
          // Convert raster image to another raster format
          const imageBlob = await convertImageToFormat(file, targetFormat);
          const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
          const link = createDownloadLink(imageBlob, mimeType, file.name.replace(/\.\w+$/, `.${targetFormat}`));
          allLinks.push(link);
        }
        
        processedFiles++;
      }

      // Process PDF files (convert to images)
      if (pdfFiles.length > 0) {
        // Check if pdfConverter is loaded
        if (typeof pdfConverter === 'undefined' || !pdfConverter.convertPdfToImages) {
          throw new Error('ไม่พบตัวแปลง PDF (pdf-converter.js อาจจะไม่ได้โหลดหรือไม่ถูกต้อง)');
        }

        for (const pdfFile of pdfFiles) {
            // Calculate base progress for this PDF file to ensure overall progress is accurate
            const baseProgress = Math.floor((processedFiles / totalFilesCount) * 100);

            // Call convertPdfToImages and pass a progress callback
            const pdfLinks = await pdfConverter.convertPdfToImages(
                pdfFile, 
                targetFormat, 
                (pagePercentage, message) => {
                    // Update overall progress by factoring in the PDF's internal progress
                    // and its proportion of the total files
                    const currentOverallProgress = baseProgress + (pagePercentage / totalFilesCount);
                    updateProgress(
                        Math.min(100, Math.floor(currentOverallProgress)), // Cap at 100%
                        `กำลังแปลง PDF ${pdfFile.name}: ${message}` // Specific message for PDF conversion
                    );
                }
            );
            pdfLinks.forEach(link => {
              // Add event listener for individual download link removal and toast notification
              const originalClick = link.onclick; // Preserve existing click handler if any
              link.onclick = (event) => {
                if (originalClick) originalClick(event);
                const removedFileName = link.download;
                const resultWrapper = link.closest('.d-flex.align-items-center.mb-2');
                if (resultWrapper) {
                  resultWrapper.classList.add('removing-item');
                  setTimeout(() => {
                    URL.revokeObjectURL(link.href); // Clean up blob URL for individual image
                    resultWrapper.remove();
                    showToast(`'${removedFileName}' ถูกลบแล้วจากรายการดาวน์โหลด!`);
                  }, 300);
                }
              };
              allLinks.push(link);
            });
            processedFiles++; // Increment overall processed files count after PDF is done
        }
      }
      
      updateProgress(100, 'แปลงไฟล์เสร็จสิ้น!'); // Final update to 100%
      setTimeout(() => hideProgress(), 1000); // Hide progress bar after a short delay

      // If multiple files were converted, offer a "Download All" ZIP option
      if (allLinks.length > 1) {
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.textContent = 'ดาวน์โหลดทั้งหมด (.zip)';
        downloadAllBtn.className = 'btn btn-primary mb-3 d-block w-100';
        downloadAllBtn.id = 'download-all-btn';
        downloadAllBtn.addEventListener('click', async () => {
          // Ensure JSZip library is loaded
          if (typeof JSZip === 'undefined') {
            alert('ไม่สามารถดาวน์โหลดทั้งหมดได้ เนื่องจากไม่พบไลบรารี JSZip');
            return;
          }
          
          downloadAllBtn.disabled = true;
          downloadAllBtn.textContent = 'กำลังบีบอัดไฟล์...';
          
          try {
            const zip = new JSZip();
            // Select all successfully converted links for zipping (both PDF-to-image and image-to-image)
            const linksToZip = resultArea.querySelectorAll('a.btn-outline-success, a.btn-outline-primary'); 

            for (const link of linksToZip) {
              // Fetch the blob data from each data URL
              const response = await fetch(link.href);
              const blob = await response.blob();
              zip.file(link.download, blob); // Add file to zip with its original download name
            }

            // Generate the zip file as a Blob
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            // Create a temporary URL for the zip blob and trigger download
            const url = URL.createObjectURL(zipBlob);
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.download = 'converted_files.zip';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            URL.revokeObjectURL(url); // Clean up blob URL for the zip

          } catch (err) {
            console.error("Error zipping files:", err);
            alert("เกิดข้อผิดพลาดในการบีบอัดไฟล์");
          } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.textContent = 'ดาวน์โหลดทั้งหมด (.zip)';
          }
        });
        resultArea.appendChild(downloadAllBtn);
      }

      // Append all individual download links to the result area
      allLinks.forEach(el => resultArea.appendChild(el));

    } catch (error) {
      console.error('Conversion error:', error);
      resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาด: ${error.message}</p>`;
      hideProgress();
    } finally {
      convertImageBtn.disabled = false;
    }
  }

  // Helper function to read image file as Data URL
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  }

  // Helper function to read file as plain text (useful for SVG)
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsText(file);
    });
  }

  // Helper function to create a download link element
  function createDownloadLink(blob, mimeType, fileName) {
    const url = URL.createObjectURL(blob);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center mb-2';
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.textContent = `ดาวน์โหลด ${fileName}`;
    link.className = 'btn btn-outline-success me-2'; // Button style for individual downloads
    
    // Add image preview if it's an image file
    if (mimeType.startsWith('image/')) {
        const imgPreview = document.createElement('img');
        imgPreview.src = url;
        imgPreview.style.maxHeight = '50px';
        imgPreview.className = 'me-2';
        wrapper.appendChild(imgPreview);
    }
    
    // Add a remove button for each generated result
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'ลบ';
    btnRemove.className = 'btn btn-outline-danger btn-sm';
    btnRemove.addEventListener('click', () => {
        const removedFileName = link.download;
        const resultWrapper = btnRemove.closest('.d-flex.align-items-center.mb-2');
        resultWrapper.classList.add('removing-item'); // Trigger removal animation
        setTimeout(() => {
            URL.revokeObjectURL(url); // Clean up blob URL
            resultWrapper.remove();
            showToast(`'${removedFileName}' ถูกลบแล้วจากรายการดาวน์โหลด!`);
        }, 300); // Match CSS transition duration
    });
    wrapper.appendChild(link);
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  // Helper function to convert a raster image to a basic SVG (embedding as image)
  async function convertImageToSvg(file) {
    const imgData = await readImage(file);
    const img = new Image();
    img.src = imgData;
    await new Promise(res => (img.onload = res));
    
    // Create a simple SVG that embeds the raster image
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}">
        <image href="${imgData}" width="${img.width}" height="${img.height}"/>
      </svg>
    `;
  }

  // Helper function to convert SVG to a raster image (PNG, JPG, WebP)
  async function convertSvgToImage(svgFile, targetFormat) {
    const svgData = await readFileAsText(svgFile);
    const img = new Image();
    // Create an object URL for the SVG data to use as image source
    const svgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
    img.src = svgUrl;
    await new Promise(res => (img.onload = res));
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    // Added willReadFrequently for potential performance optimization
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); 
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve) => {
      // Convert canvas to Blob in the target format
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl); // Clean up the object URL
        resolve(blob);
      }, `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, 0.9); // Quality 0.9 for JPG/WebP
    });
  }

  // Helper function to convert one raster image format to another
  async function convertImageToFormat(file, targetFormat) {
    const imgData = await readImage(file);
    const img = new Image();
    img.src = imgData;
    await new Promise(res => (img.onload = res));
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    // Added willReadFrequently for potential performance optimization
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); 
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve) => {
      // Convert canvas to Blob in the target format
      canvas.toBlob((blob) => {
        resolve(blob);
      }, `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, 0.9); // Quality 0.9 for JPG/WebP
    });
  }

  // Initialize button states and hide list/progress on page load
  convertBtn.disabled = true;
  convertImageBtn.disabled = true;
  clearAllBtn.disabled = true; 
  fileList.style.display = 'none';
  progressContainer.style.display = 'none';
});