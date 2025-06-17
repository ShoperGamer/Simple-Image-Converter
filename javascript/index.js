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

  // Add touch style
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
        selectedFiles.splice(index, 1);
        updateFileList();
        if (selectedFiles.length === 0) {
          convertBtn.disabled = true;
          convertImageBtn.disabled = true;
          clearAllBtn.disabled = true;
          resultArea.innerHTML = '';
        }
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
  }

  // Progress Bar Functions
  function updateProgress(percentage, message = '') {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressText.textContent = message || `กำลังประมวลผล... ${percentage}%`;
    document.getElementById('progress-percent').textContent = `${percentage}%`;
  }

  function showProgress() {
    progressContainer.style.display = 'block';
    updateProgress(0, 'กำลังเริ่มต้น...');
  }

  function hideProgress() {
    progressContainer.style.display = 'none';
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

      if (e.clientY - offset > 0) {
        e.target.classList.remove('drag-over-top');
        e.target.classList.add('drag-over-bottom');
      } else {
        e.target.classList.remove('drag-over-bottom');
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
        toIndex++; 
      }

      if (toIndex > selectedFiles.length) {
          toIndex = selectedFiles.length;
      }
      if (toIndex < 0) {
          toIndex = 0;
      }

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
    
    const touch = e.touches[0];
    const li = touch.target.closest('li');
    if (!li) return;
    
    e.preventDefault();
    draggingItem = li;
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    isTouchDragging = false;
    
    li.classList.add('touch-dragging');
    
    const btnRemove = li.querySelector('.btn-outline-danger');
    if (btnRemove) {
      btnRemove.style.pointerEvents = 'none';
    }
  }
  
  function handleTouchMove(e) {
    if (!draggingItem || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;
    
    if (!isTouchDragging && Math.abs(deltaY) < touchMoveThreshold) return;
    
    isTouchDragging = true;
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      draggingItem.style.transform = `translateY(${deltaY}px)`;
      draggingItem.style.transition = 'none';
      
      const touchY = touch.clientY;
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetLi = elements.find(el => el.tagName === 'LI' && el !== draggingItem);
      
      if (targetLi) {
        document.querySelectorAll('#file-list li').forEach(item => {
          item.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        
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
    
    e.preventDefault();
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    
    draggingItem.style.transform = '';
    draggingItem.style.transition = '';
    draggingItem.classList.remove('touch-dragging');
    
    const btnRemove = draggingItem.querySelector('.btn-outline-danger');
    if (btnRemove) {
      btnRemove.style.pointerEvents = '';
    }
    
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
        
        if (toIndex > selectedFiles.length) toIndex = selectedFiles.length;
        if (toIndex < 0) toIndex = 0;
        
        const [movedItem] = selectedFiles.splice(fromIndex, 1);
        selectedFiles.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedItem);
        
        updateFileList();
      }
    }
    
    document.querySelectorAll('#file-list li').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    
    draggingItem = null;
    isTouchDragging = false;
  }

  // ฟังก์ชันแปลงไฟล์ภาพเป็น PDF
  async function convertToPdf() {
    if (selectedFiles.length === 0) return;

    convertBtn.disabled = true;
    showProgress();
    resultArea.innerHTML = '';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pdfTypeSelect = document.getElementById('pdf-type-select');
    const isGrayscale = pdfTypeSelect.value === 'grayscale';

    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      resultArea.innerHTML = `<p class="text-danger">ไม่มีไฟล์ภาพที่สามารถแปลงเป็น PDF ได้</p>`;
      convertBtn.disabled = false;
      hideProgress();
      return;
    }

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
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (isGrayscale) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
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

        if (i > 0) doc.addPage();
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

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn btn-outline-danger btn-sm';
      btnRemove.textContent = 'ลบ';
      btnRemove.addEventListener('click', () => {
        wrapper.remove();
      });

      wrapper.appendChild(link);
      wrapper.appendChild(btnRemove);
      resultArea.appendChild(wrapper);

    } catch (error) {
      console.error('PDF conversion error:', error);
      resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาดในการสร้าง PDF: ${error.message}</p>`;
      hideProgress();
    } finally {
      convertBtn.disabled = false;
    }
  }

  // แปลงภาพหรือ PDF เป็นไฟล์ภาพในฟอร์แมตที่เลือก
  async function convertImages() {
    if (selectedFiles.length === 0) return;

    convertImageBtn.disabled = true;
    showProgress();
    resultArea.innerHTML = '';
    
    const targetFormat = formatSelect.value;
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/') || f.type === 'image/svg+xml');
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    const allLinks = [];

    try {
      const totalFiles = imageFiles.length + pdfFiles.length;
      let processedFiles = 0;

      // แปลงไฟล์ภาพ (รวมถึง SVG)
      for (const file of imageFiles) {
        const progress = Math.floor((processedFiles / totalFiles) * 100);
        updateProgress(progress, `กำลังแปลงไฟล์ ${processedFiles+1}/${totalFiles}...`);
        
        if (targetFormat === 'svg') {
          if (file.type === 'image/svg+xml') {
            const svgData = await readFileAsText(file);
            const link = createDownloadLink(new Blob([svgData], { type: 'image/svg+xml' }), 'image/svg+xml', file.name);
            allLinks.push(link);
          } else {
            const svgData = await convertImageToSvg(file);
            const link = createDownloadLink(new Blob([svgData], { type: 'image/svg+xml' }), 'image/svg+xml', file.name.replace(/\.\w+$/, '.svg'));
            allLinks.push(link);
          }
        } 
        else if (file.type === 'image/svg+xml') {
          const imageBlob = await convertSvgToImage(file, targetFormat);
          const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
          const link = createDownloadLink(imageBlob, mimeType, file.name.replace(/\.svg$/, `.${targetFormat}`));
          allLinks.push(link);
        }
        else {
          const imageBlob = await convertImageToFormat(file, targetFormat);
          const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
          const link = createDownloadLink(imageBlob, mimeType, file.name.replace(/\.\w+$/, `.${targetFormat}`));
          allLinks.push(link);
        }
        
        processedFiles++;
      }

      // แปลงไฟล์ PDF เป็นภาพ (ถ้ามี)
      if (pdfFiles.length > 0) {
        if (typeof pdfConverter === 'undefined' || !pdfConverter.convertPdfToImages) {
          throw new Error('ไม่พบตัวแปลง PDF');
        }

        for (const pdfFile of pdfFiles) {
          const progress = Math.floor((processedFiles / totalFiles) * 100);
          updateProgress(progress, `กำลังแปลงไฟล์ ${processedFiles+1}/${totalFiles}...`);
          
          try {
            const pdfLinks = await pdfConverter.convertPdfToImages(pdfFile, targetFormat);
            pdfLinks.forEach(link => allLinks.push(link));
            processedFiles++;
          } catch (error) {
            console.error('PDF conversion error:', error);
            const errMsg = document.createElement('p');
            errMsg.className = 'text-danger';
            errMsg.textContent = `แปลง ${pdfFile.name} ไม่สำเร็จ: ${error.message}`;
            resultArea.appendChild(errMsg);
            processedFiles++;
          }
        }
      }
      
      updateProgress(100, 'แปลงไฟล์เสร็จสิ้น!');
      setTimeout(() => hideProgress(), 1000);

      if (allLinks.length > 1) {
        const downloadAllBtn = document.createElement('button');
        downloadAllBtn.textContent = 'ดาวน์โหลดทั้งหมด (.zip)';
        downloadAllBtn.className = 'btn btn-primary mb-3 d-block w-100';
        downloadAllBtn.id = 'download-all-btn';
        downloadAllBtn.addEventListener('click', async () => {
          if (typeof JSZip === 'undefined') {
            alert('ไม่สามารถดาวน์โหลดทั้งหมดได้ เนื่องจากไม่พบไลบรารี JSZip');
            return;
          }
          
          downloadAllBtn.disabled = true;
          downloadAllBtn.textContent = 'กำลังบีบอัดไฟล์...';
          
          try {
            const zip = new JSZip();
            const linksToZip = resultArea.querySelectorAll('a.btn-outline-success');

            for (const link of linksToZip) {
              const response = await fetch(link.href);
              const blob = await response.blob();
              zip.file(link.download, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.download = 'converted_files.zip';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            URL.revokeObjectURL(url);

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

      allLinks.forEach(el => resultArea.appendChild(el));

    } catch (error) {
      console.error('Conversion error:', error);
      resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาด: ${error.message}</p>`;
      hideProgress();
    } finally {
      convertImageBtn.disabled = false;
    }
  }

  // Helper functions
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ SVG ได้'));
      reader.readAsText(file);
    });
  }

  function createDownloadLink(blob, mimeType, fileName) {
    const url = URL.createObjectURL(blob);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center mb-2';
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.textContent = `ดาวน์โหลด ${fileName}`;
    link.className = 'btn btn-outline-success me-2';
    
    if (mimeType.startsWith('image/')) {
        const imgPreview = document.createElement('img');
        imgPreview.src = url;
        imgPreview.style.maxHeight = '50px';
        imgPreview.className = 'me-2';
        wrapper.appendChild(imgPreview);
    }
    
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'ลบ';
    btnRemove.className = 'btn btn-outline-danger btn-sm';
    btnRemove.addEventListener('click', () => {
        URL.revokeObjectURL(url);
        wrapper.remove();
    });  
    wrapper.appendChild(link);
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  async function convertImageToSvg(file) {
    // ตัวอย่างง่ายๆ สำหรับการแปลงภาพเป็น SVG
    const imgData = await readImage(file);
    const img = new Image();
    img.src = imgData;
    await new Promise(res => (img.onload = res));
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}">
        <image href="${imgData}" width="${img.width}" height="${img.height}"/>
      </svg>
    `;
  }

  async function convertSvgToImage(svgFile, targetFormat) {
    const svgData = await readFileAsText(svgFile);
    const img = new Image();
    const svgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
    img.src = svgUrl;
    await new Promise(res => (img.onload = res));
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl);
        resolve(blob);
      }, `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, 0.9);
    });
  }

  async function convertImageToFormat(file, targetFormat) {
    const imgData = await readImage(file);
    const img = new Image();
    img.src = imgData;
    await new Promise(res => (img.onload = res));
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, 0.9);
    });
  }

  // Initialize
  convertBtn.disabled = true;
  convertImageBtn.disabled = true;
  clearAllBtn.disabled = true; 
  fileList.style.display = 'none';
  progressContainer.style.display = 'none';
});