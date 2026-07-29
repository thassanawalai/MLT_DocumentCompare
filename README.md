# PDF Cross-Checker Web Application (MVP)

เว็บแอปพลิเคชันสำหรับการตรวจสอบและเปรียบเทียบข้อมูล 15 ฟิลด์สำคัญ ระหว่างเอกสาร PDF ต้นฉบับ (Original PDF) และเอกสารที่ออกจากระบบ (Program-generated PDF) เพื่อป้องกันข้อผิดพลาดของข้อมูลด้วยระบบประมวลผลอัตโนมัติ

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