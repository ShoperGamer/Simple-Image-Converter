document.addEventListener('DOMContentLoaded', () => {
  // DOM Variables
  const dropZone = document.getElementById('drop-zone');
  const fileList = document.getElementById('file-list');
  const convertBtn = document.getElementById('convert-btn');
  const convertImageBtn = document.getElementById('convert-image-btn');
  const formatSelect = document.getElementById('format-select');
  const resultArea = document.getElementById('result-area');
  const clearAllBtn = document.getElementById('clear-all-btn'); 

  // State Variables
  let selectedFiles = [];
  let draggingItem = null; 

  // Event Listeners
  dropZone.addEventListener('click', handleClick);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  convertBtn.addEventListener('click', convertToPdf);
  convertImageBtn.addEventListener('click', convertImages);
  clearAllBtn.addEventListener('click', clearAllFiles); 

  // Add drag and drop listeners to the file list itself for reordering
  fileList.addEventListener('dragstart', handleDragStart);
  fileList.addEventListener('dragover', handleListDragOver);
  fileList.addEventListener('drop', handleListDrop);
  fileList.addEventListener('dragend', handleDragEnd);

  // Function to handle file input click
  function handleClick() {
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = '.png,.jpg,.jpeg,.webp,.avif,.gif,.pdf';
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 
    'image/avif', 'image/gif' , 'application/pdf'];
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
      fileName.className = 'flex-grow-1 me-2';

      // ปุ่มลบไฟล์
      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn btn-sm btn-outline-danger';
      btnRemove.textContent = 'ลบ';
      btnRemove.title = 'ลบไฟล์นี้';
      btnRemove.addEventListener('click', () => {
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
      btnGroup.appendChild(btnRemove); 

      li.appendChild(fileName);
      li.appendChild(btnGroup);

      fileList.appendChild(li);
    });
    fileList.style.display = selectedFiles.length ? 'block' : 'none';
  }

  // New function: Clear all selected files
 function clearAllFiles() {
    selectedFiles = [];
    updateFileList();
    convertBtn.disabled = true;
    convertImageBtn.disabled = true;
    clearAllBtn.disabled = true;
    resultArea.innerHTML = '';
  }

  // --- Drag and Drop Functions for reordering the list ---
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
        // Dragging over the bottom half
        e.target.classList.remove('drag-over-top');
        e.target.classList.add('drag-over-bottom');
      } else {
        // Dragging over the top half
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

      // Determine the precise drop position based on mouse Y
      const bounding = e.target.getBoundingClientRect();
      const offset = bounding.y + (bounding.height / 2);

      if (e.clientY - offset > 0) {
        // Dropped below the current item
        toIndex++; 
      }

      // Ensure toIndex doesn't exceed array bounds
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
      // Remove any drag-over classes from all list items
      document.querySelectorAll('#file-list li').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      draggingItem = null;
    }
  }

  // ฟังก์ชันแปลงไฟล์ภาพเป็น PDF
  async function convertToPdf() {
    if (selectedFiles.length === 0) return;

    convertBtn.disabled = true;
    resultArea.innerHTML = '<p>กำลังแปลงไฟล์เป็น PDF...</p>';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      resultArea.innerHTML = `<p class="text-danger">ไม่มีไฟล์ภาพที่สามารถแปลงเป็น PDF ได้</p>`;
      convertBtn.disabled = false;
      return;
    }

   try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imgData = await readImage(file); 

        const img = new Image();
        img.src = imgData;
        await new Promise(res => (img.onload = res));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert the canvas content to a JPEG data URL.
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

      const pdfUrl = doc.output('bloburl');

      // สร้าง div ห่อ link และปุ่มลบ
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
      resultArea.innerHTML = '';
      resultArea.appendChild(wrapper);

    } catch (error) {
      console.error('PDF conversion error:', error);
      resultArea.innerHTML = `<p class="text-danger">เกิดข้อผิดพลาดในการสร้าง PDF: ${error.message}</p>`;
    } finally {
      convertBtn.disabled = false;
    }
  }

  // แปลงภาพหรือ PDF เป็นไฟล์ภาพในฟอร์แมตที่เลือก
  async function convertImages() {
    if (selectedFiles.length === 0) return;

    convertImageBtn.disabled = true;
    resultArea.innerHTML = '<p>กำลังแปลงไฟล์...</p>';
    const targetFormat = formatSelect.value;
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    const allLinks = [];

    try {
      // แปลงไฟล์ภาพ
      for (const file of imageFiles) {
        const imageData = await readImage(file);
        const img = new Image();
        img.src = imageData;
        await new Promise(res => img.onload = res);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
        try {
          const test = canvas.toDataURL(mimeType);
          if (!test.startsWith(`data:${mimeType}`)) throw new Error();
        } catch {
          throw new Error(`เบราว์เซอร์ไม่รองรับการแปลงเป็น ${targetFormat.toUpperCase()}`);
        }

        const dataUrl = canvas.toDataURL(mimeType);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = file.name.replace(/\.\w+$/, `.${targetFormat}`);
        link.textContent = `ดาวน์โหลด ${link.download}`;
        link.className = 'btn btn-outline-success d-block mb-2';

        // ปุ่มลบไฟล์ที่แปลงแล้ว
        const wrapper = document.createElement('div');
        wrapper.className = 'd-flex align-items-center mb-2';
        const btnRemove = document.createElement('button');
        btnRemove.textContent = 'ลบ';
        btnRemove.className = 'btn btn-outline-danger btn-sm ms-2';
        btnRemove.addEventListener('click', () => {
          wrapper.remove();
          // เมื่อลบแล้วให้เช็คว่าควรซ่อนปุ่ม Download All หรือไม่
          if (resultArea.querySelectorAll('a.btn-outline-success').length <= 1) {
            const downloadAllBtn = document.getElementById('download-all-btn');
            if(downloadAllBtn) downloadAllBtn.remove();
          }
        });

        wrapper.appendChild(link);
        wrapper.appendChild(btnRemove);

        allLinks.push(wrapper);
      }

      // แปลงไฟล์ PDF เป็นภาพ (ถ้ามี)
      if (pdfFiles.length > 0) {
        if (typeof pdfConverter === 'undefined' || !pdfConverter.convertPdfToImages) {
          throw new Error('ไม่พบตัวแปลง PDF');
        }

        for (const pdfFile of pdfFiles) {
          try {
            const pdfLinks = await pdfConverter.convertPdfToImages(pdfFile, targetFormat);
            pdfLinks.forEach(link => allLinks.push(link));
          } catch (error) {
            console.error('PDF conversion error:', error);
            const errMsg = document.createElement('p');
            errMsg.className = 'text-danger';
            errMsg.textContent = `แปลง ${pdfFile.name} ไม่สำเร็จ: ${error.message}`;
            resultArea.appendChild(errMsg);
          }
        }
      }
      
      resultArea.innerHTML = '';

      // *** เพิ่มปุ่มดาวน์โหลดทั้งหมด ***
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
    } finally {
      convertImageBtn.disabled = false;
    }
  }

  // ฟังก์ชันอ่านไฟล์ภาพ
function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  }
  
  // เริ่มต้นซ่อนปุ่ม convert และ clear all
  convertBtn.disabled = true;
  convertImageBtn.disabled = true;
  clearAllBtn.disabled = true; 
  fileList.style.display = 'none';
});
