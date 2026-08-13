from pdf2image import convert_from_path

pdf_file = "temp_test_doc.pdf.pdf" # เปลี่ยนเป็นชื่อไฟล์ PDF ที่แกมีในเครื่อง

print("กำลังทดสอบเรียกใช้งาน Poppler...")
try:
    # ลองดึงแค่หน้าแรกมาแปลงดู
    images = convert_from_path(pdf_file, first_page=1, last_page=1)
    
    # เซฟออกมาเป็นรูปภาพ
    images[0].save('test_output.jpg', 'JPEG')
    print("✅  Poppler ใช้งานได้สมบูรณ์ แปลงไฟล์เป็นภาพ test_output.jpg สำเร็จแล้ว")
    
except Exception as e:
    print(f" ยังมี error : {e}")