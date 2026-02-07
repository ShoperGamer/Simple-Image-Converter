document.addEventListener('DOMContentLoaded', () => {

    // Paths to your local libraries (Lazy Load)
    const LIBS = {
      pdfjs: 'js/pdf.min.js',
      pdfworker: 'js/pdf.worker.min.js',
      jspdf: 'js/jspdf.umd.min.js',
      jszip: 'js/jszip.min.js'
    };
  
    // --- Lazy Load Helper ---
    const loadedScripts = {};
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (loadedScripts[src]) return resolve(); // Already loaded
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { loadedScripts[src] = true; resolve(); };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };
  
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
  
    const state = {
      selectedFiles: [], 
      isProcessing: false,
      conversionResults: null,
      conversionType: null,
      dragStartIndex: null
    };
  
    const MAX_IMAGE_DIMENSION = 1600; 
    const JPEG_QUALITY = 0.70;        
    const WEBP_QUALITY = 0.50;        
    const isLowSpec = (navigator.hardwareConcurrency || 4) <= 4;
    const PDF_SCALE = isLowSpec ? 1.0 : 1.5;
    const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';
  
    function initEventDelegation() {
      // Load user preference on startup
      loadUserPreference();

      elements.dropZone.addEventListener('click', handleClick);
      elements.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); });
      elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
      elements.dropZone.addEventListener('drop', handleDrop);
  
      elements.convertBtn.addEventListener('click', () => { state.conversionType = 'pdf'; convertToPdf(); });
      elements.convertImageBtn.addEventListener('click', () => { state.conversionType = 'image'; convertImages(); });
      elements.clearAllBtn.addEventListener('click', clearAllFiles);
      elements.confirmFilename.addEventListener('click', handleFilenameConfirmation);
  
      window.addEventListener('beforeunload', (e) => {
        if (state.isProcessing) { e.preventDefault(); e.returnValue = ''; }
      });
  
      const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
      if (toggleDarkModeBtn) toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
      
      elements.filenameModal.addEventListener('show.bs.modal', () => {
        elements.filenameInput.value = generateDefaultFilename();
      });
    }

    // --- Local Storage Logic for Preferences ---
    function loadUserPreference() {
      try {
        const stats = JSON.parse(localStorage.getItem('formatUsageStats') || '{}');
        if (Object.keys(stats).length === 0) return;

        // Find the format with the highest usage count
        const preferredFormat = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);

        // If the format exists in our dropdown, select it
        if (elements.formatSelect.querySelector(`option[value="${preferredFormat}"]`)) {
          elements.formatSelect.value = preferredFormat;
        }
      } catch (e) {
        console.warn('Could not load preferences', e);
      }
    }

    function trackUserPreference(format) {
      try {
        const stats = JSON.parse(localStorage.getItem('formatUsageStats') || '{}');
        stats[format] = (stats[format] || 0) + 1;
        localStorage.setItem('formatUsageStats', JSON.stringify(stats));
      } catch (e) {
        console.warn('Could not save preferences', e);
      }
    }
  
    function getCanvas(width, height) {
      if (supportsOffscreen) return new OffscreenCanvas(width, height);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      return canvas;
    }
  
    async function canvasToBlob(canvas, type, quality) {
      if (supportsOffscreen && canvas.convertToBlob) return await canvas.convertToBlob({ type, quality });
      return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    }
  
    function getOptimalDimensions(width, height) {
      if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) return { width, height };
      const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
      return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
    }
  
    async function processImageToCanvas(imgDataUrl) {
      const img = new Image();
      img.src = imgDataUrl;
      await img.decode();
      const { width, height } = getOptimalDimensions(img.width, img.height);
      const canvas = getCanvas(width, height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return { canvas, width, height };
    }
  
    // --- Async Thumbnail Generation (Lazy loads PDF lib) ---
    async function generateThumbnail(file) {
      try {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        } else if (file.type === 'application/pdf') {
            // Lazy load PDF.js only when needed
            if (typeof pdfjsLib === 'undefined') {
                await loadScript(LIBS.pdfjs);
                pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfworker;
            }

            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            return canvas.toDataURL();
        }
      } catch (e) {
        console.warn('Thumbnail failed', e);
        return null; 
      }
      return null;
    }
  
    // --- Main: Convert TO PDF ---
    async function convertToPdf() {
      if (state.selectedFiles.length === 0 || state.isProcessing) return;
      
      // Lazy Load Libraries
      elements.convertBtn.disabled = true;
      elements.resultArea.innerHTML = '<div class="text-muted mb-3"><div class="spinner-border spinner-border-sm me-2"></div>กำลังโหลดส่วนเสริม...</div>';
      
      try {
          // Load dependencies concurrently
          await Promise.all([
              loadScript(LIBS.jspdf),
              (state.selectedFiles.some(f => f.type === 'application/pdf') && typeof pdfjsLib === 'undefined') 
                ? loadScript(LIBS.pdfjs).then(() => { pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfworker; }) 
                : Promise.resolve()
          ]);
      } catch(e) {
          elements.resultArea.innerHTML = `<div class="text-danger">Failed to load libraries: ${e.message}</div>`;
          elements.convertBtn.disabled = false;
          return;
      }

      showProgress();
      elements.resultArea.innerHTML = '';
  
      try {
        const { jsPDF } = window.jspdf;
        const isGrayscale = elements.pdfTypeSelect.value === 'grayscale';
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const files = state.selectedFiles.map(item => item.file);
          
        if (!files.length) throw new Error('ไม่พบไฟล์ที่รองรับ');
  
        for (let i = 0; i < files.length; i++) {
          await new Promise(r => setTimeout(r, 0));
          updateProgress(Math.floor((i / files.length) * 100), `รวมไฟล์ ${i+1}/${files.length}...`);
  
          if (files[i].type === 'application/pdf') {
            await processPdfToMerged(files[i], doc, isGrayscale, i > 0);
          } else {
            await processImageToMerged(files[i], doc, isGrayscale, i > 0);
          }
        }
  
        updateProgress(100, 'เสร็จสิ้น!');
        state.conversionResults = { blob: doc.output('blob'), originalName: 'merged_document', type: 'application/pdf' };
        new bootstrap.Modal(elements.filenameModal).show();
      } catch (error) {
        elements.resultArea.innerHTML = `<div class="text-danger small">Error: ${error.message}</div>`;
      } finally {
        setTimeout(hideProgress, 1000);
      }
    }
  
    async function processImageToMerged(file, doc, isGrayscale, addPage) {
      const data = await readImage(file);
      const { canvas, width, height } = await processImageToCanvas(data);
      if (isGrayscale) applyGrayscale(canvas.getContext('2d'), width, height);
      const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
      const imgData = new Uint8Array(await blob.arrayBuffer());
      addImageToPdfPage(doc, { width, height }, imgData, addPage);
      canvas.width = 0; 
    }
  
    async function processPdfToMerged(file, doc, isGrayscale, startNewPage) {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  
      for (let j = 1; j <= pdf.numPages; j++) {
        const page = await pdf.getPage(j);
        const viewport = page.getViewport({ scale: PDF_SCALE });
        const canvas = getCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (isGrayscale) applyGrayscale(ctx, viewport.width, viewport.height);
        const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
        const imgData = new Uint8Array(await blob.arrayBuffer());
        
        const shouldAdd = (j === 1) ? startNewPage : true;
        addImageToPdfPage(doc, { width: viewport.width, height: viewport.height }, imgData, shouldAdd);
        canvas.width = 0;
      }
    }
  
    // --- Main: Convert TO Image ---
    async function convertImages() {
      if (state.selectedFiles.length === 0 || state.isProcessing) return;
      
      elements.convertImageBtn.disabled = true;
      const hasPdf = state.selectedFiles.some(item => item.file.type === 'application/pdf');
      const format = elements.formatSelect.value;
      const isPerPdf = format === 'perpdf';

      // ** Track user preference here **
      trackUserPreference(format);

      // Lazy Load JS
      if (hasPdf || isPerPdf) {
         elements.resultArea.innerHTML = '<div class="text-muted mb-3"><div class="spinner-border spinner-border-sm me-2"></div>กำลังโหลดส่วนเสริม...</div>';
         try {
             const proms = [];
             if (hasPdf && typeof pdfjsLib === 'undefined') proms.push(loadScript(LIBS.pdfjs).then(() => { pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfworker; }));
             if (isPerPdf && typeof window.jspdf === 'undefined') proms.push(loadScript(LIBS.jspdf));
             await Promise.all(proms);
         } catch(e) {
            elements.resultArea.innerHTML = `<div class="text-danger">Failed load libs: ${e.message}</div>`;
            elements.convertImageBtn.disabled = false;
            return;
         }
      }

      showProgress();
      elements.resultArea.innerHTML = '';
      
      try {
        const results = [];
        const total = state.selectedFiles.length;
        
        for (let i = 0; i < total; i++) {
          await new Promise(r => setTimeout(r, 0));
          updateProgress(Math.floor((i / total) * 100), `แปลงไฟล์ ${i+1}/${total}...`);
          
          const file = state.selectedFiles[i].file;
          
          // Handle PDF Input Separately
          if (file.type === 'application/pdf') {
             const pdfResults = await processPdfInputForConversion(file, format, isPerPdf);
             results.push(...pdfResults);
          } 
          // Handle Image Input
          else {
              let blob, ext = format;
              if (isPerPdf) {
                blob = await convertImageToPdfBlob(file);
                ext = 'pdf';
              } else if (format === 'svg' && file.type !== 'image/svg+xml') {
                 blob = new Blob([await convertImageToSvg(file)], { type: 'image/svg+xml' });
              } else if (format === 'svg') {
                 blob = file;
              } else {
                 blob = await convertImageFormat(file, format);
              }
              results.push({ 
                  blob, 
                  originalName: file.name, 
                  extension: ext, 
                  type: ext === 'pdf' ? 'application/pdf' : `image/${ext}` 
              });
          }
        }
        
        updateProgress(100, 'เสร็จสิ้น!');
        state.conversionResults = results;
        new bootstrap.Modal(elements.filenameModal).show();
      } catch (e) {
        console.error(e);
        elements.resultArea.innerHTML = `<div class="text-danger small">Error: ${e.message}</div>`;
      } finally {
        setTimeout(hideProgress, 1000);
      }
    }
  
    // Helper: Handle PDF Input for Image Conversion
    async function processPdfInputForConversion(file, format, isPerPdf) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const results = [];
        
        for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const viewport = page.getViewport({ scale: PDF_SCALE });
            const canvas = getCanvas(viewport.width, viewport.height);
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            let blob, ext, mime;
            if (isPerPdf) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF(viewport.width > viewport.height ? 'l' : 'p', 'mm', 'a4');
                const imgBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
                const imgData = new Uint8Array(await imgBlob.arrayBuffer());
                addImageToPdfPage(doc, { width: viewport.width, height: viewport.height }, imgData, false);
                blob = doc.output('blob');
                ext = 'pdf';
                mime = 'application/pdf';
            } else {
                ext = format;
                mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
                const quality = format === 'webp' ? WEBP_QUALITY : JPEG_QUALITY;
                blob = await canvasToBlob(canvas, mime, quality);
            }
            results.push({ blob, originalName: `${file.name}_page${j}`, extension: ext, type: mime });
            canvas.width = 0; 
        }
        return results;
    }
  
    async function convertImageFormat(file, format) {
      const data = await readImage(file);
      const { canvas } = await processImageToCanvas(data);
      const quality = format === 'webp' ? WEBP_QUALITY : JPEG_QUALITY;
      const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const blob = await canvasToBlob(canvas, mime, quality);
      canvas.width = 0;
      return blob;
    }
  
    async function convertImageToPdfBlob(file) {
      const data = await readImage(file);
      const { canvas, width, height } = await processImageToCanvas(data);
      const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
      const imgData = new Uint8Array(await blob.arrayBuffer());
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF(width > height ? 'l' : 'p', 'mm', 'a4');
      addImageToPdfPage(doc, { width, height }, imgData, false);
      canvas.width = 0;
      return doc.output('blob');
    }
  
    function addImageToPdfPage(doc, imgDim, imgData, addPage) {
      if (addPage) doc.addPage('a4', imgDim.width > imgDim.height ? 'l' : 'p');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / imgDim.width, pageHeight / imgDim.height);
      const w = imgDim.width * ratio;
      const h = imgDim.height * ratio;
      const x = (pageWidth - w) / 2;
      const y = (pageHeight - h) / 2;
      doc.addImage(imgData, 'JPEG', x, y, w, h);
    }
  
    function applyGrayscale(ctx, width, height) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
        d[i] = d[i+1] = d[i+2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  
    function handleClick() {
      if (state.isProcessing) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = e => { handleFiles(e.target.files); document.body.removeChild(input); };
      input.click();
    }
  
    async function handleFiles(files) {
      if (state.isProcessing) return;
      const validFiles = Array.from(files).filter(f => !state.selectedFiles.some(s => s.file.name === f.name && s.file.size === f.size));
      
      if (validFiles.length) {
          const newItems = await Promise.all(validFiles.map(async (f) => {
              const thumb = await generateThumbnail(f);
              return {
                  file: f,
                  id: 'file-' + Math.random().toString(36).substr(2, 9),
                  thumbnail: thumb
              };
          }));
          
          state.selectedFiles.push(...newItems);
          updateFileList();
          updateButtonStates();
      }
    }
  
    const readImage = f => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); });
    const convertImageToSvg = async f => `<svg xmlns="http://www.w3.org/2000/svg"><image href="${await readImage(f)}"/></svg>`;
    
    function updateFileList() {
      if (!state.selectedFiles.length) { elements.fileList.style.display = 'none'; return; }
      elements.fileList.style.display = 'block';
      elements.fileList.innerHTML = ''; 
  
      state.selectedFiles.forEach((item, i) => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center file-item';
          li.draggable = true;
          li.dataset.index = i;
          li.dataset.id = item.id;
  
          const thumbHtml = item.thumbnail 
            ? `<img src="${item.thumbnail}" class="file-thumb me-3">` 
            : `<div class="file-thumb me-3 d-flex align-items-center justify-content-center text-muted border"><small>${item.file.name.split('.').pop()}</small></div>`;
  
          li.innerHTML = `
            <div class="d-flex align-items-center overflow-hidden" style="width: 80%;">
                <span class="text-muted me-2" style="cursor: move;">☰</span>
                ${thumbHtml}
                <span class="text-truncate small">${item.file.name}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger py-0 delete-btn">×</button>
          `;
  
          addDragEvents(li);
          
          li.querySelector('.delete-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              removeFile(i);
          });
  
          elements.fileList.appendChild(li);
      });
    }
  
    // --- Drag and Drop Logic ---
    function addDragEvents(li) {
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragenter', handleDragEnter);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDropSort);
      li.addEventListener('dragend', handleDragEnd);
      li.addEventListener('touchstart', handleTouchStart, {passive: false});
      li.addEventListener('touchmove', handleTouchMove, {passive: false});
      li.addEventListener('touchend', handleTouchEnd);
    }
  
    let dragSrcEl = null;
    function handleDragStart(e) {
      dragSrcEl = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.outerHTML);
      this.classList.add('dragging');
      state.dragStartIndex = Number(this.dataset.index);
    }
    function handleDragEnter(e) { e.preventDefault(); }
    function handleDragOver(e) {
      if (e.preventDefault) e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
      return false;
    }
    function handleDropSort(e) {
      e.stopPropagation();
      e.preventDefault();
      const targetLi = e.target.closest('li');
      if (dragSrcEl !== targetLi && targetLi) {
        const fromIndex = Number(dragSrcEl.dataset.index);
        const toIndex = Number(targetLi.dataset.index);
        const itemMoved = state.selectedFiles[fromIndex];
        state.selectedFiles.splice(fromIndex, 1);
        state.selectedFiles.splice(toIndex, 0, itemMoved);
        updateFileList();
      }
      return false;
    }
    function handleDragEnd() {
      this.classList.remove('dragging');
      dragSrcEl = null;
    }
  
    let touchEl = null;
    function handleTouchStart(e) { if(e.target.closest('.delete-btn')) return; touchEl = this; touchEl.classList.add('dragging'); }
    function handleTouchMove(e) { if (!touchEl) return; e.preventDefault(); }
    function handleTouchEnd(e) {
        if (!touchEl) return;
        touchEl.classList.remove('dragging');
        const changedTouch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
        const targetLi = targetElement ? targetElement.closest('li') : null;
        if (targetLi && targetLi !== touchEl && elements.fileList.contains(targetLi)) {
             const fromIndex = Number(touchEl.dataset.index);
             const toIndex = Number(targetLi.dataset.index);
             const itemMoved = state.selectedFiles[fromIndex];
             state.selectedFiles.splice(fromIndex, 1);
             state.selectedFiles.splice(toIndex, 0, itemMoved);
             updateFileList();
        }
        touchEl = null;
    }
  
    window.removeFile = i => { state.selectedFiles.splice(i, 1); updateFileList(); updateButtonStates(); };
  
    function displayConversionResults(res, keepName, custom) {
      elements.resultArea.innerHTML = '';
      const items = state.conversionType === 'pdf' ? [res] : res;
      
      const previewContainer = document.createElement('div');
      previewContainer.className = 'preview-container mb-3';
      
      const links = items.map((item, i) => {
        const ext = item.extension || 'pdf';
        const name = keepName ? item.originalName.replace(/\.\w+$/, `.${ext}`) : 
                     (items.length > 1 ? `${custom} ${i+1}.${ext}` : `${custom}.${ext}`);
        const url = URL.createObjectURL(item.blob);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-4 border-bottom pb-2';
        wrapper.innerHTML = `<h6 class="small text-muted mb-2">ตัวอย่าง: ${name}</h6>`;
        
        if (item.blob.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'preview-image';
            wrapper.appendChild(img);
        } else if (item.blob.type === 'application/pdf') {
            const embed = document.createElement('embed');
            embed.src = url + '#toolbar=0&navpanes=0&scrollbar=0';
            embed.type = 'application/pdf';
            embed.className = 'preview-pdf';
            wrapper.appendChild(embed);
        }
        previewContainer.appendChild(wrapper);
  
        return { url, name };
      });
  
      elements.resultArea.appendChild(previewContainer);
  
      links.forEach(l => {
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `<a href="${l.url}" download="${l.name}" class="btn btn-success btn-sm w-100">โหลด ${l.name}</a>`;
        elements.resultArea.appendChild(div);
      });
  
      if (links.length > 1) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm w-100 mb-2';
        btn.textContent = 'โหลดทั้งหมด (ZIP)';
        btn.onclick = async () => {
          if (!window.JSZip) {
              // Lazy Load JSZip
              elements.resultArea.innerHTML = '<div class="text-muted mb-3"><div class="spinner-border spinner-border-sm me-2"></div>Loading ZIP library...</div>';
              await loadScript(LIBS.jszip);
              displayConversionResults(res, keepName, custom); // Redraw
              return;
          }
          const zip = new JSZip();
          links.forEach(l => zip.file(l.name, fetch(l.url).then(r => r.blob())));
          const c = await zip.generateAsync({type:'blob'});
          const a = document.createElement('a');
          a.href = URL.createObjectURL(c);
          a.download = `${custom}.zip`;
          a.click();
        };
        elements.resultArea.prepend(btn);
      }
      
      setTimeout(() => elements.resultArea.scrollIntoView({ behavior: 'smooth' }), 300);
      state.conversionResults = null;
    }
  
    function generateDefaultFilename() { return `converted_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`; }
    function handleFilenameConfirmation() {
      bootstrap.Modal.getInstance(elements.filenameModal).hide();
      displayConversionResults(state.conversionResults, elements.useOriginalName.checked, elements.filenameInput.value.trim() || generateDefaultFilename());
    }
    function clearAllFiles() { state.selectedFiles = []; updateFileList(); updateButtonStates(); elements.resultArea.innerHTML = ''; }
    function updateButtonStates() { const has = state.selectedFiles.length > 0; elements.convertBtn.disabled = elements.convertImageBtn.disabled = elements.clearAllBtn.disabled = !has || state.isProcessing; }
    function updateProgress(p, m) { elements.progressBar.style.width = `${p}%`; elements.progressText.textContent = m; elements.progressPercent.textContent = `${p}%`; }
    function showProgress() { elements.progressContainer.style.display = 'block'; state.isProcessing = true; updateButtonStates(); }
    function hideProgress() { elements.progressContainer.style.display = 'none'; state.isProcessing = false; updateButtonStates(); }
    function handleDrop(e) { e.preventDefault(); elements.dropZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); }
    function toggleDarkMode() { document.body.classList.toggle('dark-mode'); localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'); }
    if (localStorage.getItem('darkMode') === 'enabled') toggleDarkMode();
    // Worker source is now set dynamically when pdfjs loads
  
    initEventDelegation();
  });