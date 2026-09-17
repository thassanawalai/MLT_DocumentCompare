# MLT Document Compare & SI Extraction System

ระบบอัปโหลด อ่าน และเปรียบเทียบข้อมูลจากเอกสาร Shipping Instruction (SI) และ Bill of Lading (B/L) อัตโนมัติ โดยใช้สถาปัตยกรรม **Hybrid Spatial-NLP** ที่ออกแบบมาเพื่อแก้ปัญหากล่องข้อความยืดหด (Layout Shift) และป้องกันอาการ AI หลอน (Zero-Hallucination) อย่างเด็ดขาด

ระบบทำงานบน CPU ได้อย่างเต็มประสิทธิภาพ โดยใช้ AI ขนาดเล็ก (Extractive QA) เป็นเพียง "ไม้บรรทัดชี้เป้า" เพื่อระบุ Index ของข้อความ และใช้การหั่นข้อความ (Slicing) จาก String ต้นฉบับโดยตรงเพื่อความถูกต้อง 100%

---

## 🏗️ Project Architecture (โครงสร้างโปรเจกต์)

```text
MLT_DocumentCompare/
│
├── backend/                           # API Server (FastAPI)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # จุดเริ่มต้นของ FastAPI Application
│   │   │
│   │   ├── api/                       
│   │   │   └── routers.py             # Endpoint รับไฟล์ (รองรับ .pdf, .xlsx, .csv)
│   │   │
│   │   ├── core/                      # 🧠 Core Processing Pipeline (5 Stages)
│   │   │   ├── stage1_parser.py       # แกะ Text+พิกัด (pdfplumber) หรืออ่าน DataFrame (pandas)
│   │   │   ├── stage2_anchoring.py    # หา Anchor ด้วย Fuzzy Match & ตีกรอบ Context Window
│   │   │   ├── stage3_qa_engine.py    # ชี้เป้าตำแหน่งข้อความด้วย XLM-RoBERTa (Extractive QA)
│   │   │   ├── stage4_restitching.py  # ตัดข้อความจาก String ต้นฉบับ และเชื่อมต่อบรรทัด (Alignment)
│   │   │   └── stage5_tables.py       # จัดการดึงข้อมูลที่มีโครงสร้างตาราง (Table Extraction)
│   │   │
│   │   ├── models/                    # 📦 Data Contracts (Pydantic Models)
│   │   │   ├── document.py            # โครงสร้างข้อมูลเอกสารตั้งต้น
│   │   │   ├── field.py               # โครงสร้างของแต่ละฟิลด์ (เช่น ค่า, พิกัด BBox)
│   │   │   └── extraction.py          # โครงสร้างข้อมูลที่ไหลระหว่าง 5 Stages ป้องกันปัญหา Dict ซ้อนทับ
│   │   │
│   │   ├── utils/                     # 🛠️ Utility Functions
│   │   │   ├── validation.py          # Anti-Hallucination ลอจิกตรวจสอบความถูกต้องของผลลัพธ์
│   │   │   └── text_utils.py          # ฟังก์ชันช่วยเหลือด้านข้อความ (เช่น Regex, การทำความสะอาดคำ)
│   │   │
│   │   └── templates/                 # 📋 Template Configuration
│   │       ├── registry.py            # ตัวจัดการลงทะเบียนเทมเพลต
│   │       ├── BETAGRO.py             # คอนฟิก Anchor และ Keyword ของบริษัท BETAGRO
│   │       ├── MCKEY.py               # คอนฟิก Anchor และ Keyword ของบริษัท MCKEY
│   │       └── ...
│   │
│   ├── tests/                         # 🧪 Unit Tests (Pytest)
│   │   ├── test_parser.py             # ทดสอบการแกะพิกัดและการอ่าน Excel
│   │   ├── test_anchoring.py          # ทดสอบความแม่นยำของ Fuzzy Matching และกรอบ Context
│   │   ├── test_qa.py                 # ทดสอบการชี้เป้า Index ของโมเดล
│   │   └── test_extraction.py         # ทดสอบการเชื่อมต่อข้อความ (Re-stitching)
│   │
│   ├── requirements.txt               # Dependencies (fastapi, pdfplumber, transformers, pandas, etc.)
│   └── Dockerfile                     
│
├── frontend/                          # Web Application (React + Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/                # UI Components
│   │   │   ├── SIUpload.jsx           # หน้าจอหลักสำหรับอัปโหลดไฟล์ (PDF/Excel) และเลือกเทมเพลต
│   │   │   ├── DocumentViewer.jsx     # ส่วนพรีวิวเอกสารแบบ Responsive Height พร้อมวาด BBox
│   │   │   ├── ComparisonFields.jsx   # คอมโพเนนต์เปรียบเทียบข้อมูลพร้อม DiffViewer (ไฮไลต์คำผิด)
│   │   │   └── DiscrepancyTable.jsx   # ตารางสรุปจุดที่ไม่ตรงกัน (Fixed Layout)
│   │   ├── utils/
│   │   │   └── exportCSV.js           # ลอจิกการส่งออกข้อมูลเป็นไฟล์ .csv ตามโครงสร้าง DB มาตรฐาน
│   │   ├── App.jsx                    # State Management หลัก
│   │   └── main.jsx                   
│   ├── package.json                   
│   └── Dockerfile                     
│
├── docker-compose.yml                 # คอนฟิกสำหรับรัน Backend และ Frontend ร่วมกัน
└── README.md

⚙️ The Extraction Pipeline (กระบวนการทำงานฝั่ง Backend)
ข้อมูลจะไหลผ่าน Pipeline 5 ขั้นตอน โดยถูกควบคุมโครงสร้างด้วย Pydantic Models (models/) เพื่อความรัดกุม:

Stage 1: Parser

แปลง PDF เป็น List ของ Dictionary ที่มีทั้งคำ (Text) และพิกัด (Bounding Box) โดยใช้ pdfplumber

รองรับการอ่านไฟล์ Spreadsheet (.xlsx, .csv) ด้วย pandas

Stage 2: Anchoring & Context

ค้นหาจุดอ้างอิง (Anchor) ของแต่ละฟิลด์ด้วย Fuzzy Matching

สร้าง Context Window โดยตัดพิกัดเฉพาะพื้นที่บริเวณ Anchor เพื่อจำกัดการมองเห็นของ AI

Stage 3: QA Engine (AI Extraction)

ใช้โมเดล Extractive QA (เช่น xlm-roberta-base-squad2)

ส่งคำถาม (Prompt) เข้าไป เพื่อให้ AI คืนค่ากลับมาเป็นแค่พิกัดตำแหน่ง start_index และ end_index เท่านั้น

Stage 4: Exact Text Re-stitching

นำ Index ที่ได้จาก AI ไปตัด (Slice) ข้อความออกจาก String ต้นฉบับ

หากจำเป็น จะทำการดึงข้อความในบรรทัดถัดไปตามแนวพิกัดแกน Y มาต่อประกอบกันให้สมบูรณ์

Stage 5: Table Extraction

จัดการกับข้อมูลโครงสร้างตาราง (เช่น Description of Goods, Weights, M3) แยกต่างหากจากการใช้ AI โดยใช้ฟังก์ชันวิเคราะห์ตารางเพื่อความแม่นยำ

🛡️ Validation Layer (utils/validation.py)
ด่านสุดท้ายก่อนส่งข้อมูลกลับไปที่หน้าบ้าน ระบบจะทำการประเมิน (Validate) เพื่อให้แน่ใจว่าข้อความที่สกัดออกมานั้น "มีอยู่จริง" ในเอกสารต้นฉบับ หากตรวจพบอาการ Hallucination (สร้างคำขึ้นมาใหม่) ระบบจะ Reject ข้อมูลนั้นทันที

💻 Frontend Features
Upload Flexibility: รองรับการอัปโหลดไฟล์ได้ทั้งนามสกุล .pdf, .xlsx และ .csv

Adaptive Document UI: ช่องแสดงพิกัดและพรีวิวเอกสารสามารถปรับขนาดตาม Viewport ได้อัตโนมัติ เพื่อรองรับการแสดงผลฟอร์มขนาดยาว

Visual Diffing: แสดงส่วนต่าง (Discrepancy) ไฮไลต์ให้เห็นชัดเจนว่าตัวอักษรใดหรือคำใดมีความแตกต่างระหว่างเอกสาร 2 ฉบับ

Seamless Database Integration: ส่งออกผลลัพธ์เป็นไฟล์ CSV ในรูปแบบที่เข้ากันได้กับฐานข้อมูลหลักของสายเรือ

🚀 Getting Started
ติดตั้ง Dependencies ฝั่ง Backend: pip install -r backend/requirements.txt

รัน FastAPI: uvicorn app.main:app --reload

ติดตั้ง Dependencies ฝั่ง Frontend: cd frontend && npm install

รัน React: npm run dev
(หรือใช้คำสั่ง docker-compose up -d เพื่อรันทั้งระบบพร้อมกัน)