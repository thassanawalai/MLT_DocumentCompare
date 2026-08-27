# PDF Cross-Checker Web Application (MVP)

เว็บแอปพลิเคชันสำหรับการตรวจสอบและเปรียบเทียบข้อมูล 15 ฟิลด์สำคัญ ระหว่างเอกสาร PDF ต้นฉบับ (Original PDF) และเอกสารที่ออกจากระบบ (Program-generated PDF) เพื่อป้องกันข้อผิดพลาดของข้อมูลด้วยระบบประมวลผลอัตโนมัติ
# MLT Document Comparison System

ระบบเปรียบเทียบและตรวจสอบความถูกต้องของเอกสารสำหรับการขนส่งทางเรือ (Maritime Alliances) โดยใช้เทคโนโลยี OCR และ AI ในการสกัดข้อมูลและเปรียบเทียบความแตกต่าง

## ฟีเจอร์หลัก

- **Multi-Mode Verification:** รองรับการตรวจสอบเอกสาร 3 รูปแบบหลักผ่านแถบเมนูด้านข้าง:
  1. **Main Comparison:** เปรียบเทียบ Shipping Instruction (SI) กับ Bill of Lading (B/L) ทั่วไป
  2. **Set 1 (HBL):** เปรียบเทียบ SI จาก Shipper กับ HBL ของ Maritime
  3. **Set 2 (MBL):** เปรียบเทียบ SI จาก Maritime กับ MBL ของสายเรือ (ONE)
- **Visual Comparison:** แสดงผลไฟล์ PDF สองฝั่งพร้อมไฮไลต์จุดที่ข้อมูลไม่ตรงกัน
- **Field Extraction:** ดึงข้อมูลสำคัญตามเทมเพลตที่กำหนด (OOCL, YANGMING, ONE, ฯลฯ)
- **Real-time Diff:** วิเคราะห์ความแตกต่างของข้อความแบบละเอียด (Insert/Delete)

## โครงสร้างโปรเจกต์

- `backend/`: API Server พัฒนาด้วย Python (FastAPI) ทำหน้าที่ประมวลผล PDF และ OCR
  - `app/templates/`: ไฟล์กำหนดตำแหน่ง Anchor Point สำหรับแต่ละบริษัท
- `frontend/`: เว็บแอปพลิเคชันพัฒนาด้วย React
  - `App.jsx`: ส่วนควบคุมตรรกะหลักและการจัดการสถานะของแต่ละ Set
  - `DocumentPane.jsx`: ส่วนแสดงผล PDF และการไฮไลต์ Bounding Box

## วิธีการใช้งาน

1. เลือกโหมดที่ต้องการตรวจสอบจากแถบเมนูด้านข้าง (Main, HBL, หรือ MBL)
2. อัปโหลดเอกสารต้นทาง (ซ้าย) และเอกสารปลายทาง (ขวา) ตามที่โหมดนั้นระบุ
3. เลือก Template ของบริษัทที่ตรงกับเอกสาร
4. กดปุ่ม **"เปรียบเทียบข้อมูล"** เพื่อดูผลลัพธ์
5. ตรวจสอบรายการที่ไม่ตรงกันในตารางด้านล่าง หรือคลิกที่แถวเพื่อดูตำแหน่งใน PDF

## เทคโนโลยีที่ใช้

- **Frontend:** React, Vite, PDF.js
- **Backend:** Python, FastAPI, PyMuPDF
- **Comparison logic:** SequenceMatcher / AI-based normalization

---
*Developed for Maritime Alliances Verification*

---

## 📌 Objectives 
* ตรวจสอบความถูกต้องของข้อมูลดิจิทัลบนเอกสาร PDF ทั้ง 2 ฝั่ง แบบ 100% Accuracy
* เปรียบเทียบและไฮไลต์จุดที่ไม่ตรงกันให้เห็นชัดเจนบนหน้าเว็บ UI
* ประมวลผลแบบ In-memory (Stateless) โดยไม่บันทึกข้อมูลลงฐานข้อมูลในเวอร์ชันเริ่มต้น (MVP)

---

## 🎯 Target Fields 
1. **BOOKING NO.**
2. **SHIPPER**
3. **CONSIGNEE**
4. **NOTIFY PARTY**
5. **PRE-CARRIAGE BY**
6. **PLACE OF RECEIPT**
7. **PORT OF LOADING**
8. **VESSEL**
9. **PORT OF DISCHARGE**
10. **PLACE OF DELIVERY**
11. **MARK & NUMBERS**
12. **QUANTITY**
13. **DESCRIPTION OF GOODS**
14. **GROSS WEIGHT**
15. **MEASUREMENT**

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS
* **Backend:** Python 3.11+, FastAPI, Uvicorn
* **PDF Processing:** PyMuPDF (`fitz`)
* **DevOps / Deployment:** Docker, Docker Compose

---

## 📁 Project Structure 

```text
pdf-cross-checker/
│
├── backend/                       # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI Application Entrypoint
│   │   ├── api/                   # API Endpoints (Upload & Process)
│   │   │   └── validation.py
│   │   ├── core/                  # Core Business Logic
│   │   │   ├── pdf_parser.py      # Text Extraction via PyMuPDF
│   │   │   ├── normalizer.py      # Data Cleaning & Formatting
│   │   │   └── comparator.py      # 15-Field Comparison Logic
│   │   └── schemas/               # Pydantic Response Data Models
│   ├── Requirements.txt
│   └── Dockerfile
│
├── frontend/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/            # UI Components (FileUploader, SplitViewer, ResultTable)
│   │   ├── services/              # API Integration (Axios/Fetch)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml             # Orchestration for Local Setup
└── README.md