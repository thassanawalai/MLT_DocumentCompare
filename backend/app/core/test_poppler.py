import os
from pdf2image import convert_from_path

pdf_file = "test_doc.pdf"
poppler_dir = r"C:\poppler-26.02.0\Library\bin"

print("--- Initiating System Diagnostics ---")

# 1. Verify the existence of the target PDF file
if not os.path.exists(pdf_file):
    print(f"[ERROR] PDF file not found: {pdf_file} in the current directory.")
else:
    print(f"[SUCCESS] PDF file located: {pdf_file}")

# 2. Verify the validity of the Poppler directory path
if not os.path.exists(poppler_dir):
    print(f"[ERROR] Poppler directory not found: {poppler_dir}")
else:
    print(f"[SUCCESS] Poppler directory located: {poppler_dir}")

print("\nExtracting image from PDF...")

try:
    # Attempt to convert the first page of the PDF to an image
    images = convert_from_path(
        pdf_file, 
        first_page=1, 
        last_page=1, 
        poppler_path=poppler_dir
    )
    
    # Save the extracted image to the local directory
    images[0].save('test_output.jpg', 'JPEG')
    print("[SUCCESS] Poppler is functioning correctly. File converted successfully.")
    
except Exception as e:
    print("\n[ERROR] An exception occurred during processing:")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Details: {e}")