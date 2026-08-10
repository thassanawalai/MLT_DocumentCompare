# Deploy MLT แบบง่าย (Ubuntu + Docker + Nginx + HTTPS)

> ถ้าต้องการ deploy แบบไม่ดูแล server เอง ใช้ Render ได้ ดู
> `deploy/RENDER.md`
>
> ถ้าต้องการเปิด demo จากคอมบริษัทผ่าน Cloudflare Tunnel ดู
> `deploy/CLOUDFLARE_TUNNEL.md`
>
> ถ้าต้องการ URL สวยแบบ `https://mlt-demo.company.com` ผ่าน Cloudflare Tunnel ดู
> `deploy/CLOUDFLARE_NAMED_TUNNEL.md`

เป้าหมายคือให้ลูกค้าเปิดผ่าน `https://your-domain.com` ได้ โดยเปิด public แค่
Nginx ports `80/443` ส่วน frontend `8080` และ backend `10000` จะ bind เฉพาะ
`127.0.0.1` บน server เท่านั้น

## 1. สิ่งที่ต้องเตรียม

1. Ubuntu VPS/server 1 เครื่อง
2. Domain เช่น `mlt.company.com`
3. DNS `A record` ชี้ domain ไปที่ public IP ของ server
4. Firewall หรือ Cloud Security Group เปิดเฉพาะ `22`, `80`, `443`
5. ห้ามเปิด public ports `8080`, `10000`

## 2. ติดตั้ง Docker บน server

ติดตั้ง Docker Engine พร้อม Compose plugin ตามเอกสาร official ของ Docker สำหรับ
Ubuntu ก่อน แล้วเช็กให้ได้ผลลัพธ์:

```bash
docker --version
docker compose version
```

## 3. เอาโปรเจกต์ขึ้น server

```bash
git clone <YOUR-REPOSITORY-URL> /opt/mlt
cd /opt/mlt
sudo docker compose up -d --build
sudo docker compose ps
```

ลองเช็กใน server:

```bash
curl -I http://127.0.0.1:8080
curl -I http://127.0.0.1:10000/api/v1/templates
```

## 4. เปิด HTTPS ให้ลูกค้าเข้าได้

รันสคริปต์นี้โดยเปลี่ยน domain/email เป็นของจริง:

```bash
sudo bash deploy/scripts/setup-nginx-ssl.sh mlt.company.com admin@company.com
```

เสร็จแล้วลูกค้าเข้าได้ที่:

```bash
https://mlt.company.com
```

## 5. เวลาอัปเดตโปรแกรมรอบถัดไป

บน server รัน:

```bash
sudo bash /opt/mlt/deploy/scripts/update-app.sh
```

## ตรวจสอบหลัง deploy

```bash
curl -I https://mlt.company.com
curl -I https://mlt.company.com/api/v1/templates
sudo ss -ltnp | grep -E ':(80|443|8080|10000)'
```

ผลที่ควรเห็น:

- `https://mlt.company.com` เปิดหน้าเว็บได้
- `/api/v1/templates` ตอบกลับได้
- ports `8080` และ `10000` ต้องอยู่ที่ `127.0.0.1` เท่านั้น
