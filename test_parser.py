import json
from app.core.stage1_parser import parse_document

def run_test(filepath: str):
    print(f"Testing file: {filepath}")
    filename = filepath.split("/")[-1]
    
    # 1. Read file as bytes
    with open(filepath, "rb") as f:
        file_bytes = f.read()
        
    # 2. Run the parser
    parsed_doc = parse_document(file_bytes, filename)
    
    # 3. Print the results
    print(f"\n--- Output for {filename} ---")
    print(f"Is Excel: {parsed_doc.is_excel}")
    
    if parsed_doc.is_excel:
        print("\n[Excel Data Extracted]")
        # Print dictionary nicely
        print(json.dumps(parsed_doc.excel_data, indent=2, ensure_ascii=False))
    else:
        print("\n[PDF Data Extracted]")
        print(f"Total Text Length: {len(parsed_doc.raw_text)} characters")
        print(f"Total Words Extracted (with BBox): {len(parsed_doc.words)}")
        
        # Show sample of the first 5 words parsed with their Bounding Boxes
        print("\nSample Words (First 5):")
        for i, word in enumerate(parsed_doc.words[:5]):
            print(f"Word {i+1}: '{word.text}' at x0:{word.bbox.x0:.2f}, top:{word.bbox.top:.2f}")

if __name__ == "__main__":
    # ระบุพาธไฟล์ PDF หรือ Excel ที่คุณต้องการทดสอบตรงนี้
    run_test("")
    # run_test("path/to/your/test_file.xlsx")