FROM python:3.11-slim

WORKDIR /app

# อัปเดต OS และติดตั้ง poppler-utils ที่จำเป็นสำหรับ pdf2image
RUN apt-get update && \
    apt-get install -y --no-install-recommends poppler-utils && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt

# ติดตั้ง Python Dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY frontend/public /import-data

ENV MASTER_DATA_DIR=/import-data

EXPOSE 10000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
