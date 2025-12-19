# วิธีเข้าถึงเว็บแอปจากมือถือ

## วิธีที่ 1: ใช้ Network URL (แนะนำ)

### ขั้นตอนที่ 1: รีสตาร์ท Development Server

หยุด server ที่รันอยู่ (กด `Ctrl+C`) แล้วรันใหม่:

```bash
npm run dev
```

### ขั้นตอนที่ 2: ดู Network URL

หลังจากรัน server จะเห็น:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**Network URL** คือ URL ที่ใช้เข้าถึงจากมือถือ

### ขั้นตอนที่ 3: เชื่อมต่อมือถือกับ WiFi เดียวกัน

1. ตรวจสอบว่า **มือถือและคอมพิวเตอร์เชื่อมต่อ WiFi เดียวกัน**
2. เปิด Chrome บนมือถือ
3. ใส่ Network URL ที่ได้จากขั้นตอนที่ 2
4. เพิ่ม token parameter:
   ```
   http://192.168.x.x:5173/superwork?token=YOUR_TOKEN
   ```

## วิธีที่ 2: ใช้ IP Address โดยตรง

### ขั้นตอนที่ 1: หา IP Address ของคอมพิวเตอร์

**macOS:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**

```bash
ipconfig
```

ดูที่ "IPv4 Address" (มักจะเป็น `192.168.x.x`)

### ขั้นตอนที่ 2: ใช้ IP Address ใน URL

```
http://YOUR_IP_ADDRESS:5173/superwork?token=YOUR_TOKEN
```

**ตัวอย่าง:**

```
http://192.168.1.100:5173/superwork?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## วิธีที่ 3: ใช้ ngrok (สำหรับทดสอบจากภายนอก)

### ขั้นตอนที่ 1: ติดตั้ง ngrok

```bash
# macOS
brew install ngrok

# หรือดาวน์โหลดจาก https://ngrok.com/
```

### ขั้นตอนที่ 2: รัน ngrok

```bash
ngrok http 5173
```

### ขั้นตอนที่ 3: ใช้ URL ที่ได้

ngrok จะให้ URL แบบนี้:

```
https://xxxx-xxxx-xxxx.ngrok-free.app
```

ใช้ URL นี้ในมือถือ:

```
https://xxxx-xxxx-xxxx.ngrok-free.app/superwork?token=YOUR_TOKEN
```

## ตรวจสอบว่าเข้าถึงได้

1. เปิด browser บนมือถือ
2. ใส่ URL ที่ได้
3. ควรเห็นหน้าเว็บแอป

## ปัญหาที่พบบ่อย

### ปัญหา: ไม่สามารถเข้าถึงได้

**วิธีแก้:**

1. ตรวจสอบว่า firewall ไม่ได้บล็อก port 5173
2. ตรวจสอบว่า WiFi เดียวกัน
3. ลองใช้ IP address โดยตรง

### ปัญหา: QR Code Scanner ไม่ทำงานบนมือถือ

**วิธีแก้:**

1. ตรวจสอบว่าใช้ HTTPS หรือ localhost (HTTP ทำงานได้บน localhost)
2. อนุญาตการเข้าถึงกล้อง
3. ใช้ Chrome บน Android หรือ Safari บน iOS

### ปัญหา: CORS Error

**วิธีแก้:**

- ตรวจสอบว่า Google Apps Script URL ถูกต้อง
- Deploy Apps Script ใหม่

## หมายเหตุ

- **Network URL จะเปลี่ยน** เมื่อ IP address เปลี่ยน
- **ต้องเชื่อมต่อ WiFi เดียวกัน** ระหว่างคอมพิวเตอร์และมือถือ
- **QR Code Scanner ต้องใช้ HTTPS** หรือ localhost (HTTP) เท่านั้น
