// Optimized JavaScript - ลดการรีโหลดและเพิ่มประสิทธิภาพ
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const elements = {
    dropZone: document.getElementById('drop-zone'),
    fileList: document.getElementById('file-list'),
    convertBtn: document.getElementById('convert-btn'),
    convertImageBtn: document.getElementById('convert-image-btn'),
    formatSelect: document.getElementById('format-select'),
    resultArea: document.getElementById('result-area'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    pdfTypeSelect: document.getElementById('pdf-type-select'),
    filenameModal: document.getElementById('filenameModal'),
    filenameInput: document.getElementById('filename-input'),
    useOriginalName: document.getElementById('use-original-name'),
    confirmFilename: document.getElementById('confirm-filename')
  };

  // State management
  const state = {
    selectedFiles: [],
    draggingItem: null,
    touchStartY: 0,
    touchStartX: 0,
    touchMoveThreshold: 10,
    isTouchDragging: false,
    isProcessing: false,
    conversionResults: null,
    conversionType: null // 'image' or 'pdf'
  };

  // Event delegation for better performance
  function initEventDelegation() {
    // Drop zone events
    elements.dropZone.addEventListener('click', handleClick);
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);

    // Button events
    elements.convertBtn.addEventListener('click', () => {
      state.conversionType = 'pdf';
      convertToPdf();
    });
    elements.convertImageBtn.addEventListener('click', () => {
      state.conversionType = 'image';
      convertImages();
    });
    elements.clearAllBtn.addEventListener('click', clearAllFiles);
    elements.confirmFilename.addEventListener('click', handleFilenameConfirmation);

    // File list events (delegated)
    elements.fileList.addEventListener('click', handleFileListClick);
    elements.fileList.addEventListener('dragstart', handleDragStart);
    elements.fileList.addEventListener('dragover', handleListDragOver);
    elements.fileList.addEventListener('drop', handleListDrop);
    elements.fileList.addEventListener('dragend', handleDragEnd);

    // Touch events
    elements.fileList.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.fileList.addEventListener('touchmove', handleTouchMove, { passive: false });
    elements.fileList.addEventListener('touchend', handleTouchEnd);
    elements.fileList.addEventListener('touchcancel', handleTouchEnd);

    // Dark mode toggle
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    if (toggleDarkModeBtn) {
      toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
    }

    // Modal events
    elements.filenameModal.addEventListener('show.bs.modal', () => {
      elements.filenameInput.value = generateDefaultFilename();
    });
  }

  // Filename handling functions
  function generateDefaultFilename() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `converted_${dateStr}_${timeStr}`;
  }

  function handleFilenameConfirmation() {
    const modal = bootstrap.Modal.getInstance(elements.filenameModal);
    modal.hide();

    if (elements.useOriginalName.checked) {
      // ใช้ชื่อไฟล์เดิม
      displayConversionResults(state.conversionResults, true);
    } else {
      // ใช้ชื่อใหม่ที่ผู้ใช้ตั้ง
      const customName = elements.filenameInput.value.trim() || generateDefaultFilename();
      displayConversionResults(state.conversionResults, false, customName);
    }
  }

  function displayConversionResults(results, useOriginalNames = false, customName = '') {
    elements.resultArea.innerHTML = '';
    
    if (!results) {
      console.error('No conversion results to display');
      return;
    }
    
    if (state.conversionType === 'pdf') {
      // สำหรับ PDF (ไฟล์เดียว)
      const { blob, originalName } = results;
      const fileName = useOriginalNames ? 
        originalName.replace(/\.\w+$/, '.pdf') : 
        `${customName}.pdf`;
      
      createResultLink(URL.createObjectURL(blob), fileName, `ดาวน์โหลด ${fileName}`, true);
    } else {
      // สำหรับภาพ (หลายไฟล์)
      if (!Array.isArray(results)) {
        console.error('Results for image conversion should be an array', results);
        elements.resultArea.innerHTML = '<p class="text-danger">เกิดข้อผิดพลาดในการแสดงผลลัพธ์</p>';
        return;
      }
      
      const allLinks = [];
      
      results.forEach((result, index) => {
        const { blob, originalName, extension } = result;
        const fileName = useOriginalNames ? 
          originalName.replace(/\.\w+$/, `.${extension}`) :
          results.length === 1 ? 
            `${customName}.${extension}` : 
            `${customName} ${index + 1}.${extension}`;
        
        const linkWrapper = createDownloadLink(blob, blob.type, fileName);
        allLinks.push(linkWrapper);
        elements.resultArea.appendChild(linkWrapper);
      });
      
      // เพิ่มปุ่มดาวน์โหลดทั้งหมดถ้ามีหลายไฟล์
      if (allLinks.length > 1) {
        createDownloadAllButton(allLinks, customName);
      }
    }
    
    // รีเซ็ต state
    state.conversionResults = null;
    state.conversionType = null;
  }

  // Optimized file list click handler
  function handleFileListClick(e) {
    const target = e.target;
    if (target.classList.contains('btn-outline-danger')) {
      e.stopPropagation();
      const li = target.closest('li');
      if (li) {
        const index = parseInt(li.dataset.index);
        removeFile(index);
      }
    }
  }

  // File handling functions
  function handleClick() {
    if (state.isProcessing) return;
    
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = '.png,.jpg,.jpeg,.webp,.avif,.gif,.pdf,.svg';
    tempInput.multiple = true;
    tempInput.style.cssText = 'position:fixed;top:-100px;left:-100px;visibility:hidden;';
    
    tempInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      document.body.removeChild(tempInput);
    });
    
    document.body.appendChild(tempInput);
    tempInput.click();
  }

  function handleDragOver(e) {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
  }

  function handleDragLeave(e) {
    if (!elements.dropZone.contains(e.relatedTarget)) {
      elements.dropZone.classList.remove('dragover');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  }

  function handleFiles(files) {
    if (state.isProcessing) return;

    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/webp', 
      'image/avif', 'image/gif', 'application/pdf',
      'image/svg+xml'
    ];

    const newFiles = Array.from(files).filter(file => {
      const isAllowed = allowedTypes.includes(file.type);
      const isDuplicate = state.selectedFiles.some(f => 
        f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
      );
      return isAllowed && !isDuplicate;
    });

    if (newFiles.length === 0) return;

    state.selectedFiles.push(...newFiles);
    updateFileList();
    updateButtonStates();
  }

  // Optimized file list rendering
  function updateFileList() {
    if (state.selectedFiles.length === 0) {
      elements.fileList.style.display = 'none';
      elements.fileList.innerHTML = '';
      return;
    }

    elements.fileList.style.display = 'block';
    
    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    state.selectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.setAttribute('draggable', 'true');
      li.dataset.index = index.toString();

      const fileName = document.createElement('span');
      fileName.className = 'flex-grow-1 me-2 text-truncate';
      fileName.textContent = file.name;
      fileName.title = file.name;

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn btn-sm btn-outline-danger';
      btnRemove.textContent = 'ลบ';
      btnRemove.title = 'ลบไฟล์นี้';

      const btnGroup = document.createElement('div');
      btnGroup.className = 'd-flex';
      btnGroup.appendChild(btnRemove);

      li.appendChild(fileName);
      li.appendChild(btnGroup);
      fragment.appendChild(li);
    });

    elements.fileList.innerHTML = '';
    elements.fileList.appendChild(fragment);
  }

  function removeFile(index) {
    if (index < 0 || index >= state.selectedFiles.length) return;
    
    const removedFile = state.selectedFiles[index];
    const listItem = elements.fileList.children[index];
    
    if (listItem) {
      listItem.classList.add('removing-item');
      setTimeout(() => {
        state.selectedFiles.splice(index, 1);
        updateFileList();
        updateButtonStates();
        showToast(`'${removedFile.name}' ถูกลบแล้ว!`);
      }, 300);
    }
  }

  function clearAllFiles() {
    if (state.isProcessing) return;
    
    state.selectedFiles = [];
    updateFileList();
    updateButtonStates();
    elements.resultArea.innerHTML = '';
    showToast('ล้างไฟล์ทั้งหมดแล้ว!');
  }

  function updateButtonStates() {
    const hasFiles = state.selectedFiles.length > 0;
    elements.convertBtn.disabled = !hasFiles || state.isProcessing;
    elements.convertImageBtn.disabled = !hasFiles || state.isProcessing;
    elements.clearAllBtn.disabled = !hasFiles || state.isProcessing;
  }

  // Progress management
  function updateProgress(percentage, message = '') {
    elements.progressBar.style.width = `${percentage}%`;
    elements.progressBar.setAttribute('aria-valuenow', percentage);
    elements.progressText.textContent = message || `กำลังประมวลผล... ${percentage}%`;
    elements.progressPercent.textContent = `${percentage}%`;
  }

  function showProgress() {
    elements.progressContainer.style.display = 'block';
    updateProgress(0, 'กำลังเริ่มต้น...');
    state.isProcessing = true;
    updateButtonStates();
  }

  function hideProgress() {
    elements.progressContainer.style.display = 'none';
    state.isProcessing = false;
    updateButtonStates();
  }

  // Toast notification
  function showToast(message) {
    // Create toast if it doesn't exist
    let toastEl = document.getElementById('liveToast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'liveToast';
      toastEl.className = 'toast position-fixed top-0 end-0 m-3';
      toastEl.style.zIndex = '1060';
      toastEl.innerHTML = `
        <div class="toast-header">
          <strong class="me-auto">Image Converter</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body"></div>
      `;
      document.body.appendChild(toastEl);
    }

    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
  }

  // Drag and drop functions (เหลือเฉพาะส่วนที่จำเป็น)
  function handleDragStart(e) {
    if (e.target.tagName === 'LI') {
      state.draggingItem = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', e.target.dataset.index);
      e.target.classList.add('dragging');
    }
  }

  function handleListDragOver(e) {
    e.preventDefault();
    if (e.target.tagName === 'LI' && state.draggingItem && e.target !== state.draggingItem) {
      const bounding = e.target.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);

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
    if (e.target.tagName === 'LI' && state.draggingItem) {
      const fromIndex = parseInt(state.draggingItem.dataset.index);
      let toIndex = parseInt(e.target.dataset.index);

      const bounding = e.target.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);

      if (e.clientY - offset > 0) toIndex++;

      toIndex = Math.max(0, Math.min(toIndex, state.selectedFiles.length));
      
      const [movedItem] = state.selectedFiles.splice(fromIndex, 1);
      state.selectedFiles.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedItem);
      updateFileList();
    }
  }

  function handleDragEnd() {
    if (state.draggingItem) {
      state.draggingItem.classList.remove('dragging');
      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      state.draggingItem = null;
    }
  }

  // Touch events (optimized)
  function handleTouchStart(e) {
    if (e.touches.length !== 1 || state.isProcessing) return;

    const target = e.target;
    if (target.tagName === 'BUTTON' && target.classList.contains('btn-outline-danger')) {
      return;
    }

    const touch = e.touches[0];
    const li = touch.target.closest('li');
    if (!li) return;

    e.preventDefault();
    state.draggingItem = li;
    state.touchStartY = touch.clientY;
    state.touchStartX = touch.clientX;
    state.isTouchDragging = false;

    li.classList.add('touch-dragging');
    
    const btnRemove = li.querySelector('.btn-outline-danger');
    if (btnRemove) btnRemove.style.pointerEvents = 'none';
  }

  function handleTouchMove(e) {
    if (!state.draggingItem || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - state.touchStartY;
    const deltaX = touch.clientX - state.touchStartX;

    if (!state.isTouchDragging && Math.abs(deltaY) < state.touchMoveThreshold && Math.abs(deltaX) < state.touchMoveThreshold) {
      return;
    }

    e.preventDefault();
    state.isTouchDragging = true;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      state.draggingItem.style.transform = `translateY(${deltaY}px)`;
      state.draggingItem.style.transition = 'none';

      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetLi = elements.find(el => el.tagName === 'LI' && el !== state.draggingItem);

      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      if (targetLi) {
        const targetRect = targetLi.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        if (touch.clientY < targetMiddle) {
          targetLi.classList.add('drag-over-top');
        } else {
          targetLi.classList.add('drag-over-bottom');
        }
      }
    }
  }

  function handleTouchEnd(e) {
    if (!state.draggingItem) return;

    e.preventDefault();
    const touch = e.changedTouches[0];

    state.draggingItem.style.transform = '';
    state.draggingItem.style.transition = '';
    state.draggingItem.classList.remove('touch-dragging');

    const btnRemove = state.draggingItem.querySelector('.btn-outline-danger');
    if (btnRemove) btnRemove.style.pointerEvents = '';

    if (state.isTouchDragging) {
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetLi = elements.find(el => el.tagName === 'LI' && el !== state.draggingItem);

      if (targetLi) {
        const fromIndex = parseInt(state.draggingItem.dataset.index);
        let toIndex = parseInt(targetLi.dataset.index);

        const targetRect = targetLi.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        if (touch.clientY > targetMiddle) toIndex++;
        toIndex = Math.max(0, Math.min(toIndex, state.selectedFiles.length));

        const [movedItem] = state.selectedFiles.splice(fromIndex, 1);
        state.selectedFiles.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, movedItem);
        updateFileList();
      }
    }

    document.querySelectorAll('#file-list li').forEach(item => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    state.draggingItem = null;
    state.isTouchDragging = false;
  }

  // Dark mode toggle
  function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    const icon = this.querySelector('i');
    const text = this.querySelector('span');
    
    if (isDarkMode) {
      icon.className = 'bi bi-sun-fill me-2';
      text.textContent = 'LightMode';
      localStorage.setItem('darkMode', 'enabled');
    } else {
      icon.className = 'bi bi-moon-stars-fill me-2';
      text.textContent = 'DarkMode';
      localStorage.setItem('darkMode', 'disabled');
    }
  }

  // Load dark mode preference
  function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    const toggleBtn = document.getElementById('toggle-dark-mode');
    
    if (darkMode === 'enabled' && toggleBtn) {
      document.body.classList.add('dark-mode');
      const icon = toggleBtn.querySelector('i');
      const text = toggleBtn.querySelector('span');
      icon.className = 'bi bi-sun-fill me-2';
      text.textContent = 'LightMode';
    }
  }

  // PDF conversion (optimized)
  async function convertToPdf() {
    if (state.selectedFiles.length === 0 || state.isProcessing) return;

    elements.convertBtn.disabled = true;
    showProgress();
    elements.resultArea.innerHTML = '';

    try {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) throw new Error('PDF library not loaded');

      const isGrayscale = elements.pdfTypeSelect.value === 'grayscale';
      const imageFiles = state.selectedFiles.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        throw new Error('ไม่มีไฟล์ภาพที่สามารถแปลงเป็น PDF ได้');
      }

      // Determine orientation
      let allImagesAreLandscape = true;
      for (const file of imageFiles) {
        const img = new Image();
        img.src = await readImage(file);
        await img.decode();
        if (img.height >= img.width) {
          allImagesAreLandscape = false;
          break;
        }
      }

      const orientation = allImagesAreLandscape ? 'l' : 'p';
      const doc = new jsPDF(orientation, 'mm', 'a4');

      const totalFiles = imageFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = imageFiles[i];
        const progress = Math.floor((i / totalFiles) * 100);
        updateProgress(progress, `กำลังแปลงไฟล์ ${i+1}/${totalFiles}...`);
        
        const imgData = await readImage(file);
        const img = new Image();
        img.src = imgData;
        await img.decode();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (isGrayscale) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let j = 0; j < data.length; j += 4) {
            const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
            data[j] = data[j + 1] = data[j + 2] = avg;
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
      
      const pdfBlob = doc.output('blob');
      
      // Store results and show filename modal
      state.conversionResults = {
        blob: pdfBlob,
        originalName: imageFiles[0]?.name || 'converted'
      };
      
      const modal = new bootstrap.Modal(elements.filenameModal);
      modal.show();

    } catch (error) {
      console.error('PDF conversion error:', error);
      elements.resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาด: ${error.message}</p>`;
    } finally {
      setTimeout(() => hideProgress(), 1000);
    }
  }

  // Image conversion (optimized)
  async function convertImages() {
    if (state.selectedFiles.length === 0 || state.isProcessing) return;

    elements.convertImageBtn.disabled = true;
    showProgress();
    elements.resultArea.innerHTML = '';
    
    const targetFormat = elements.formatSelect.value;
    const imageFiles = state.selectedFiles.filter(f => f.type.startsWith('image/') || f.type === 'image/svg+xml');
    const pdfFiles = state.selectedFiles.filter(f => f.type === 'application/pdf');

    try {
      const totalFiles = imageFiles.length + pdfFiles.length;
      let processedFiles = 0;
      const conversionResults = [];

      // Process images
      for (const file of imageFiles) {
        const progress = Math.floor((processedFiles / totalFiles) * 100);
        updateProgress(progress, `กำลังแปลงภาพ ${file.name} (${processedFiles+1}/${totalFiles})...`);
        
        let resultBlob, fileName, extension = targetFormat;
        
        if (targetFormat === 'svg') {
          if (file.type === 'image/svg+xml') {
            const svgData = await readFileAsText(file);
            resultBlob = new Blob([svgData], { type: 'image/svg+xml' });
          } else {
            const svgData = await convertImageToSvg(file);
            resultBlob = new Blob([svgData], { type: 'image/svg+xml' });
          }
        } else if (file.type === 'image/svg+xml') {
          resultBlob = await convertSvgToImage(file, targetFormat);
          extension = targetFormat;
        } else {
          resultBlob = await convertImageToFormat(file, targetFormat);
          extension = targetFormat;
        }
        
        conversionResults.push({
          blob: resultBlob,
          originalName: file.name,
          extension: extension
        });
        processedFiles++;
      }

      // Process PDFs
      if (pdfFiles.length > 0 && window.pdfConverter) {
        for (const pdfFile of pdfFiles) {
          const baseProgress = Math.floor((processedFiles / totalFiles) * 100);
          const pdfResults = await window.pdfConverter.convertPdfToImages(
            pdfFile, 
            targetFormat,
            (pagePercentage, message) => {
              const currentProgress = baseProgress + (pagePercentage / totalFiles);
              updateProgress(Math.min(100, Math.floor(currentProgress)), message);
            }
          );
          
          // แก้ไขบัค: ตรวจสอบว่า pdfResults เป็น array ก่อนใช้งาน
          if (Array.isArray(pdfResults)) {
            conversionResults.push(...pdfResults);
          } else {
            console.error('pdfResults is not an array:', pdfResults);
            // เพิ่มผลลัพธ์ว่างหรือข้ามไป
          }
          processedFiles++;
        }
      }

      updateProgress(100, 'แปลงไฟล์เสร็จสิ้น!');
      
      // Store results and show filename modal
      state.conversionResults = conversionResults;
      const modal = new bootstrap.Modal(elements.filenameModal);
      modal.show();

    } catch (error) {
      console.error('Conversion error:', error);
      elements.resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาด: ${error.message}</p>`;
    } finally {
      setTimeout(() => hideProgress(), 1000);
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
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsText(file);
    });
  }

  function createDownloadLink(blob, mimeType, fileName) {
    const url = URL.createObjectURL(blob);
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center mb-2';
    
    if (mimeType.startsWith('image/')) {
      const imgPreview = document.createElement('img');
      imgPreview.src = url;
      imgPreview.style.maxHeight = '50px';
      imgPreview.className = 'me-2';
      imgPreview.loading = 'lazy';
      wrapper.appendChild(imgPreview);
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.textContent = `ดาวน์โหลด ${fileName}`;
    link.className = 'btn btn-outline-success me-2';
    
    const btnRemove = document.createElement('button');
    btnRemove.textContent = 'ลบ';
    btnRemove.className = 'btn btn-outline-danger btn-sm';
    btnRemove.addEventListener('click', () => {
      wrapper.classList.add('removing-item');
      setTimeout(() => {
        URL.revokeObjectURL(url);
        wrapper.remove();
        showToast(`'${fileName}' ถูกลบแล้ว!`);
      }, 300);
    });
    
    wrapper.appendChild(link);
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  function createResultLink(url, fileName, linkText, isPdf = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex align-items-center mb-2';
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.textContent = linkText;
    link.className = isPdf ? 'btn btn-success me-2' : 'btn btn-outline-success me-2';
    
    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn btn-outline-danger btn-sm';
    btnRemove.textContent = 'ลบ';
    btnRemove.addEventListener('click', () => {
      wrapper.classList.add('removing-item');
      setTimeout(() => {
        URL.revokeObjectURL(url);
        wrapper.remove();
        showToast(`'${fileName}' ถูกลบแล้ว!`);
      }, 300);
    });
    
    wrapper.appendChild(link);
    wrapper.appendChild(btnRemove);
    elements.resultArea.appendChild(wrapper);
  }

  function createDownloadAllButton(links, customName = 'converted') {
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.textContent = 'ดาวน์โหลดทั้งหมด (.zip)';
    downloadAllBtn.className = 'btn btn-primary mb-3 d-block w-100';
    
    downloadAllBtn.addEventListener('click', async () => {
      if (typeof JSZip === 'undefined') {
        alert('ไม่พบไลบรารีบีบอัดไฟล์');
        return;
      }
      
      downloadAllBtn.disabled = true;
      downloadAllBtn.textContent = 'กำลังบีบอัดไฟล์...';
      
      try {
        const zip = new JSZip();
        const linkPromises = Array.from(links).map(async (linkWrapper) => {
          const link = linkWrapper.querySelector('a');
          if (link) {
            const response = await fetch(link.href);
            const blob = await response.blob();
            zip.file(link.download, blob);
          }
        });
        
        await Promise.all(linkPromises);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        
        const tempLink = document.createElement('a');
        tempLink.href = zipUrl;
        tempLink.download = `${customName || 'converted_files'}.zip`;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        URL.revokeObjectURL(zipUrl);
        
        showToast('ดาวน์โหลดไฟล์ ZIP เสร็จสิ้น!');
        
      } catch (err) {
        console.error("Error zipping files:", err);
        alert("เกิดข้อผิดพลาดในการบีบอัดไฟล์");
      } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.textContent = 'ดาวน์โหลดทั้งหมด (.zip)';
      }
    });
    
    elements.resultArea.insertBefore(downloadAllBtn, elements.resultArea.firstChild);
  }

  async function convertImageToSvg(file) {
    const imgData = await readImage(file);
    const img = new Image();
    img.src = imgData;
    await img.decode();
    
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
    await img.decode();
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
    await img.decode();
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 
        `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`, 0.9);
    });
  }

  // Initialize application
  function init() {
    initEventDelegation();
    loadDarkModePreference();
    updateButtonStates();
    
    // Set PDF.js worker path
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    // Initialize pdfConverter
    window.pdfConverter = {
      async convertPdfToImages(file, format = 'png', onProgress = () => {}) {
        if (!file || !(file instanceof File || file instanceof Blob)) {
          throw new Error("Invalid file provided");
        }
        
        if (!['png', 'jpg', 'webp'].includes(format.toLowerCase())) {
          format = 'png';
        }

        try {
          const pdfData = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          const results = [];
          const totalPages = pdf.numPages;

          for (let i = 1; i <= totalPages; i++) {
            const percentage = Math.floor(((i - 1) / totalPages) * 100);
            onProgress(percentage, `กำลังแปลง PDF หน้าที่ ${i}/${totalPages}...`);

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({ canvasContext: context, viewport }).promise;

            const mimeType = `image/${format.toLowerCase() === 'jpg' ? 'jpeg' : format}`;
            
            const blob = await new Promise((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob);
              }, mimeType, 0.9);
            });

            results.push({
              blob: blob,
              originalName: `${file.name.replace(/\.pdf$/i, '')}_page${i}`,
              extension: format
            });
          }

          onProgress(100, 'แปลง PDF เสร็จสิ้น!');
          return results;
        } catch (error) {
          throw new Error(`Failed to convert PDF: ${error.message}`);
        }
      }
    };
  }

  // Start the application
  init();
});