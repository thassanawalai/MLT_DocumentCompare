import json
import requests

def build_bl_cleaning_prompt(raw_data: dict) -> str:
    prompt = f"""
You are an expert Data Extraction Assistant for Bill of Lading (B/L) documents.
Below is the raw OCR data extracted from a document. The text contains noise and formatting errors. 
Your task is to identify and extract the correct information for each specific field and output it as a valid JSON object.
CRITICAL RULE:
You MUST extract values EXACTLY as they appear in the provided Raw Data.
DO NOT use external knowledge. DO NOT invent, assume, or hallucinate addresses, cities, or company names (e.g., Do not output "Hong Kong" if it is not in the text).
If the address is incomplete in the Raw Data, output the incomplete address exactly as it is.
Raw Data:
{json.dumps(raw_data, ensure_ascii=False, indent=2)}
STRICT INSTRUCTION: You MUST extract the information EXACTLY as it appears in the provided 'Raw Data'. DO NOT use any external knowledge. DO NOT invent, hallucinate, or assume any addresses or names. If the text is incomplete, output the incomplete text exactly as found.
Extraction Guidelines:
1. "booking_no": Find the primary booking reference number (e.g., 2333224930).
2. "shipper": Extract the company name and address of the shipper/exporter (e.g., MCKEY FOOD SERVICES...).
3. "consignee": Extract the company name and address of the consignee (e.g., LACTO JAPAN CO.,LTD...).
4. "notify_party": Extract the company name and address of the notify party. Ignore terms like "Clause 13".
5. "vessel": Extract only the vessel name and voyage number (e.g., GSL MAREN 030N).
6. "port_of_loading" / "port_of_discharge": Extract the city and country (e.g., LAEM CHABANG, THAILAND or TOKYO, JAPAN).
7. "quantity": Look for the package count and unit (e.g., 1449 CASES). Do not use weight numbers here.
8. "gross_weight": Look for the total weight with its unit (e.g., 18808.020KGS).
9. "measurement": Look for the volume measurement (e.g., 5.000CBM).

Respond ONLY with a valid JSON object containing the exact keys listed above. If a field has absolutely no relevant information, use null. Do not include any markdown formatting like ```json or any conversational text.
"""
    return prompt


def verify_and_clean_with_llm(raw_data: dict) -> dict:
    prompt = build_bl_cleaning_prompt(raw_data)
    
    # URL ของ Ollama ที่รันอยู่บนเครื่องเราเอง (พอร์ตมาตรฐานคือ 11434)
    url = "http://localhost:11434/api/generate"
    
    payload = {
        "model": "qwen2.5:7b",  
        "prompt": prompt,         
        "stream": False,
        "format": "json",         
        "options": {
            "num_ctx": 1024,     
            "num_predict": 512,
            "temperature": 0.0
        }
    }    
    try:
        # ยิง API เข้าเครื่องตัวเอง
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        # ดึงข้อความตอบกลับ
        result_text = response.json().get("response", "{}")
        
        # แปลงกลับเป็น Python Dictionary
        cleaned_data = json.loads(result_text)
        return cleaned_data
        
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการเชื่อมต่อ Ollama: {e}")
        print("💡 เช็คให้ชัวร์ว่าเปิดโปรแกรม Ollama ทิ้งไว้ในเครื่องแล้ว!")
        return raw_data # ถ้าพังก็คืนข้อมูลดิบกลับไปก่อน ระบบจะได้ไม่แครช