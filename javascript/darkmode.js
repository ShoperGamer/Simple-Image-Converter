// เพิ่มโหมดกลางคืน
  const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
  toggleDarkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if(document.body.classList.contains('dark-mode')) {
      toggleDarkModeBtn.textContent = 'โหมดปกติ';
    } else {
      toggleDarkModeBtn.textContent = 'โหมดกลางคืน';
    }
  });