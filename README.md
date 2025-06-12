# Simple Image Converter 📸➡️📄
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML](https://img.shields.io/badge/Language-HTML-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/Language-CSS-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Bootstrap](https://img.shields.io/badge/Framework-Bootstrap-purple.svg)](https://getbootstrap.com/)

---

## ภาษาไทย 🇹🇭

ยินดีต้อนรับสู่ **Simple Image Converter**! 👋 โปรเจกต์นี้คือเว็บแอปพลิเคชันที่สร้างขึ้นเพื่อแก้ปัญหาความยุ่งยาก, ข้อจำกัด, และการสิ้นเปลืองทรัพยากรและเวลาในการแปลงไฟล์รูปภาพและ PDF 🚀 ด้วย Simple Image Converter คุณสามารถแปลงรูปภาพเป็นนามสกุลต่างๆ หรือรวมรูปภาพและ PDF หลายไฟล์ให้เป็น PDF เดียวได้อย่างง่ายดายและรวดเร็ว

### แรงบันดาลใจ ✨

ในยุคดิจิทัล การจัดการไฟล์รูปภาพและเอกสาร PDF เป็นสิ่งที่เราทำกันอยู่บ่อยครั้ง อย่างไรก็ตาม เครื่องมือแปลงไฟล์ที่มีอยู่อาจมีข้อจำกัด เช่น ต้องอัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์ภายนอก (ซึ่งอาจก่อให้เกิดความกังวลเรื่องความเป็นส่วนตัว), มีโฆษณา, หรือต้องเสียค่าใช้จ่าย นอกจากนี้ การแปลงไฟล์ทีละหลายๆ รูปแบบ หรือการรวมไฟล์จำนวนมาก มักจะใช้เวลานานและสิ้นเปลืองทรัพยากรคอมพิวเตอร์อย่างมาก

**Simple Image Converter** เกิดขึ้นจากความต้องการที่จะสร้างโซลูชันที่:
* **ใช้งานง่ายและรวดเร็ว**: ลดขั้นตอนที่ซับซ้อนให้เหลือน้อยที่สุด.
* **เป็นส่วนตัวและปลอดภัย**: ทำงานบนเบราว์เซอร์โดยไม่ต้องอัปโหลดไฟล์ไปยังเซิร์ฟเวอร์.
* **มีประสิทธิภาพ**: จัดการการแปลงและรวมไฟล์ได้หลากหลายนามสกุล.
* **เข้าถึงได้ฟรี**: ไม่ต้องติดตั้งซอฟต์แวร์เพิ่มเติม ไม่จำกัดการใช้งาน.

โปรเจกต์นี้จึงเป็นคำตอบสำหรับการแปลงไฟล์ที่สะดวกสบาย และควบคุมได้เองทั้งหมด!

### คุณสมบัติเด่น 🚀

* **ลากและวาง (Drag & Drop)**: อัปโหลดไฟล์รูปภาพ (PNG, JPG, JPEG, WEBP, AVIF) และ PDF ได้อย่างง่ายดาย.
* **รองรับไฟล์หลากหลาย**: สามารถเลือกไฟล์รูปภาพและ PDF ได้พร้อมกัน.
* **แปลงรูปภาพเป็นนามสกุลอื่น**: แปลงรูปภาพที่เลือกให้เป็น JPG, PNG, WEBP, หรือ AVIF.
* **รวมรูปภาพและ PDF เป็น PDF เดียว**: ผสานไฟล์รูปภาพและ PDF หลายไฟล์ให้เป็นเอกสาร PDF ฉบับเดียว.
* **แสดงตัวอย่างไฟล์**: แสดงตัวอย่างรูปภาพและ PDF ที่อัปโหลด.
* **โหมดกลางวัน/กลางคืน (Light/Dark Mode)**: สลับธีมการแสดงผลเพื่อความสบายตาในการใช้งาน.
* **การออกแบบที่ตอบสนอง (Responsive Design)**: แสดงผลได้สวยงามบนทุกอุปกรณ์.

### โครงสร้างของ Repository 📁

Repository นี้ประกอบด้วยไฟล์หลักและโฟลเดอร์สำหรับจัดเก็บสไตล์และสคริปต์:


```

Simple-Image-Converter/

├── index.html # โครงสร้างหน้าเว็บหลัก (HTML)

├── JS/

│ ├── index.js # สคริปต์หลักสำหรับการจัดการไฟล์และการแปลง

│ ├── pdf-converter.js # สคริปต์สำหรับจัดการการแปลง PDF

│ └── darkmode.js # สคริปต์สำหรับฟังก์ชัน Dark Mode

└── CSS/

├── style.css # สไตล์ชีทหลัก

└── darkmode.css # สไตล์ชีทสำหรับ Dark Mode

└── ...

```

### การตั้งค่าและการใช้งาน 🛠️

คุณไม่จำเป็นต้องติดตั้งซอฟต์แวร์พิเศษใดๆ นอกเหนือจากเว็บเบราว์เซอร์เพื่อดูโปรเจกต์นี้!

1.  **โคลน Repository**:
    * เปิด Terminal หรือ Command Prompt และใช้คำสั่ง Git:
        ```bash
        git clone [https://github.com/YourUsername/Simple-Image-Converter.git](https://github.com/YourUsername/Simple-Image-Converter.git)
        cd Simple-Image-Converter
        ```
2.  **เปิดในเบราว์เซอร์**:
    * เปิดไฟล์ `index.html` ด้วยเว็บเบราว์เซอร์ที่คุณชื่นชอบ (เช่น Chrome, Firefox, Edge).

### วิธีการใช้งาน 🚀

1.  **ลากและวางหรือคลิก**: ลากไฟล์รูปภาพ (.png, .jpg, .jpeg, .webp, .avif) หรือไฟล์ PDF (.pdf) ลงในพื้นที่ "ลากและวางไฟล์ของคุณที่นี่" หรือคลิกเพื่อเลือกไฟล์.
2.  **เลือกรูปแบบการแปลง**:
    * **"แปลงภาพเป็นนามสกุลที่เลือก"**: เลือกนามสกุลที่ต้องการจาก Dropdown (JPG, PNG, WEBP, AVIF) แล้วคลิกปุ่มนี้.
    * **"แปลงและรวมเป็น PDF"**: คลิกปุ่มนี้เพื่อรวมไฟล์รูปภาพและ PDF ทั้งหมดเป็นเอกสาร PDF เดียว.
3.  **ดาวน์โหลดผลลัพธ์**: ไฟล์ที่แปลงแล้วจะปรากฏขึ้นเป็นลิงก์ให้ดาวน์โหลด.
4.  **สลับธีม**: คลิกที่ปุ่ม "โหมดกลางคืน" / "โหมดปกติ" เพื่อเปลี่ยนธีม.

### คำอธิบายโค้ดโดยย่อ 🧑‍💻

* **`index.html`**: ไฟล์ HTML หลักที่กำหนดโครงสร้างของหน้าเว็บ, ส่วนหัว, พื้นที่สำหรับลากและวางไฟล์, ส่วนแสดงรายการไฟล์, ปุ่มแปลง, และลิงก์ไปยัง Bootstrap CSS, Google Fonts, Bootstrap Icons, และไฟล์ CSS/JavaScript ของโปรเจกต์.
* **`JS/index.js`**: ไฟล์ JavaScript หลักที่ควบคุมการทำงานของเว็บไซต์:
    * จัดการเหตุการณ์ Drag & Drop และการเลือกไฟล์.
    * แสดงรายการไฟล์ที่เลือกพร้อมตัวอย่าง.
    * เปิด/ปิดการใช้งานปุ่มแปลงตามจำนวนไฟล์ที่เลือก.
    * จัดการการแปลงรูปภาพเป็นนามสกุลต่างๆ.
    * จัดการการสร้าง PDF จากรูปภาพและ PDF ที่อัปโหลด (ใช้ `jsPDF`).
    * จัดการการแปลง PDF เป็นรูปภาพ (ใช้ `pdf-converter.js`).
* **`JS/pdf-converter.js`**: ไฟล์ JavaScript ที่ใช้ไลบรารี `pdf.js` เพื่อแปลงหน้าต่างๆ ของไฟล์ PDF ให้เป็นรูปภาพ (Canvas element) และสร้างลิงก์ดาวน์โหลดสำหรับแต่ละรูปภาพ.
* **`JS/darkmode.js`**: ไฟล์ JavaScript ที่จัดการการสลับโหมด Light/Dark โดยการเพิ่ม/ลบคลาส `dark-mode` จาก `body` และเปลี่ยนข้อความบนปุ่ม.
* **`CSS/style.css`**: ไฟล์ CSS หลักที่กำหนดสไตล์พื้นฐาน, การจัดวางองค์ประกอบ, และการตอบสนองของหน้าเว็บ.
* **`CSS/darkmode.css`**: ไฟล์ CSS แยกต่างหากที่กำหนดสไตล์เฉพาะสำหรับโหมดมืด โดย Overwrite สไตล์ใน `style.css` เมื่อเปิดใช้งาน Dark Mode.

### การมีส่วนร่วม 🤝

เรายินดีต้อนรับการมีส่วนร่วมจากทุกคน! 🎉 หากคุณมีแนวคิดในการปรับปรุงโปรเจกต์นี้ (เช่น การเพิ่มคุณสมบัติการบีบอัดรูปภาพ, การแก้ไขรูปภาพเบื้องต้น, หรือการรองรับรูปแบบไฟล์เพิ่มเติม) โปรดอ่าน [CONTRIBUTING.md](CONTRIBUTING.md) (ถ้ามี) สำหรับแนวทางในการมีส่วนร่วม.

### สิทธิ์การใช้งาน 📜

โปรเจกต์นี้อยู่ภายใต้ [MIT License](LICENSE)

---

## English 🇬🇧

Welcome to **Simple Image Converter**! 👋 This project is a web application created to solve the complexities, limitations, and significant resource and time consumption often associated with converting image and PDF files 🚀. With Simple Image Converter, you can effortlessly and quickly convert images to various formats or combine multiple image and PDF files into a single PDF.

### Inspiration ✨

In the digital age, managing image files and PDF documents is a frequent task. However, existing file conversion tools can have limitations, such as requiring file uploads to external servers (which may raise privacy concerns), being riddled with advertisements, or coming with a cost. Furthermore, converting multiple files of different types or merging numerous files often takes considerable time and consumes significant computer resources.

**Simple Image Converter** was born out of the need to create a solution that is:
* **Easy and Fast to Use**: Minimizing complex steps.
* **Private and Secure**: Operates directly in the browser without uploading files to external servers.
* **Efficient**: Handles conversions and merges across various file formats.
* **Freely Accessible**: No additional software installation required, no usage limits.

This project is the answer for convenient and entirely self-contained file conversion!

### Key Features 🚀

* **Drag & Drop**: Easily upload image files (PNG, JPG, JPEG, WEBP, AVIF) and PDF files.
* **Multi-file Support**: Select both image and PDF files simultaneously.
* **Image Format Conversion**: Convert selected images to JPG, PNG, WEBP, or AVIF.
* **Merge Images and PDFs to a Single PDF**: Combine multiple image and PDF files into one comprehensive PDF document.
* **File Preview**: Displays a preview of uploaded images and PDFs.
* **Light/Dark Mode**: Toggle the display theme for comfortable viewing.
* **Responsive Design**: Renders beautifully on all devices.

### Repository Structure 📁

This repository consists of the main files and folders for organizing styles and scripts:


```

Simple-Image-Converter/

├── index.html # Main web page structure (HTML)

├── JS/

│ ├── index.js # Main script for file handling and conversion

│ ├── pdf-converter.js # Script for PDF conversion handling

│ └── darkmode.js # Script for Dark Mode functionality

└── CSS/

├── style.css # Main stylesheet

└── darkmode.css # Stylesheet for Dark Mode

└── ...

```

### Setup and Usage 🛠️

You don't need to install any special software beyond a web browser to view this project!

1.  **Clone the Repository**:
    * Open your Terminal or Command Prompt and use the Git command:
        ```bash
        git clone [https://github.com/YourUsername/Simple-Image-Converter.git](https://github.com/YourUsername/Simple-Image-Converter.git)
        cd Simple-Image-Converter
        ```
2.  **Open in Browser**:
    * Open the `index.html` file with your preferred web browser (e.g., Chrome, Firefox, Edge).

### How to Use 🚀

1.  **Drag & Drop or Click**: Drag and drop your image files (.png, .jpg, .jpeg, .webp, .avif) or PDF files (.pdf) into the designated "Drag & Drop your files here" area, or click to select files.
2.  **Choose Conversion Type**:
    * **"แปลงภาพเป็นนามสกุลที่เลือก" (Convert Image to Selected Format)**: Choose the desired output format from the dropdown (JPG, PNG, WEBP, AVIF), then click this button.
    * **"แปลงและรวมเป็น PDF" (Convert and Merge to PDF)**: Click this button to combine all selected image and PDF files into a single PDF document.
3.  **Download Results**: The converted files will appear as downloadable links.
4.  **Toggle Theme**: Click the "โหมดกลางคืน" (Dark Mode) / "โหมดปกติ" (Normal Mode) button to switch themes.

### Brief Code Explanation 🧑‍💻

* **`index.html`**: The main HTML file defines the web page structure, including the header, file drag-and-drop area, file list display, conversion buttons, and links to Bootstrap CSS, Google Fonts, Bootstrap Icons, and the project's CSS/JavaScript files.
* **`JS/index.js`**: The main JavaScript file that controls the website's functionality:
    * Handles drag & drop events and file selection.
    * Displays selected files with previews.
    * Enables/disables conversion buttons based on selected files.
    * Manages converting images to different formats.
    * Manages creating PDFs from uploaded images and PDFs (using `jsPDF`).
    * Manages converting PDFs to images (using `pdf-converter.js`).
* **`JS/pdf-converter.js`**: A JavaScript file that utilizes the `pdf.js` library to render PDF pages as images (Canvas elements) and create download links for each image.
* **`JS/darkmode.js`**: A JavaScript file that manages the Light/Dark mode toggle by adding/removing the `dark-mode` class from the `body` and changing the button text.
* **`CSS/style.css`**: The main CSS file that defines basic styles, element positioning, and responsiveness for the webpage.
* **`CSS/darkmode.css`**: A separate CSS file that defines specific styles for dark mode, overriding styles in `style.css` when dark mode is active.

### Contribution 🤝

We welcome contributions from everyone! 🎉 If you have ideas for improving this project (e.g., adding image compression features, basic image editing, or support for more file formats), please refer to [CONTRIBUTING.md](CONTRIBUTING.md) (if available) for contribution guidelines.

### License 📜

This project is licensed under the [MIT License](LICENSE)

```