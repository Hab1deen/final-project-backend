# ข้อมูลตัวอย่างสำหรับทดสอบระบบ

## 📋 ลำดับการเพิ่มข้อมูล

1. **Users** (Admin + User)
2. **Customers** (3 ราย)
3. **Products** (8 รายการ)
4. **Quotations** (3 ใบ)
5. **Invoices** (3 ใบ)

---

## 1️⃣ Users

### Register Admin
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "password123",
  "name": "ผู้ดูแลระบบ",
  "role": "admin"
}
```

### Register User
```
POST http://localhost:3000/api/auth/register
```

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "พนักงานทั่วไป",
  "role": "user"
}
```

### Login (เพื่อรับ Token)
```
POST http://localhost:3000/api/auth/login
```

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**บันทึก `token` ที่ได้จาก response แล้วใส่ใน Headers ของทุก request:**
```
Authorization: Bearer <your-token>
```

---

## 2️⃣ Customers

### Customer 1 - บริษัท
```
POST http://localhost:3000/api/customers
Authorization: Bearer <your-token>
```

```json
{
  "name": "บริษัท สยามอุตสาหกรรม จำกัด",
  "email": "contact@siam-industry.com",
  "phone": "02-123-4567",
  "address": "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  "taxId": "0105558123456"
}
```

### Customer 2 - ห้างหุ้นส่วน
```
POST http://localhost:3000/api/customers
```

```json
{
  "name": "ห้างหุ้นส่วนจำกัด โกลบอลเทรด",
  "email": "info@global-trade.co.th",
  "phone": "081-234-5678",
  "address": "456 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
  "taxId": "0205559234567"
}
```

### Customer 3 - บุคคลธรรมดา
```
POST http://localhost:3000/api/customers
```

```json
{
  "name": "คุณสมชาย ใจดี",
  "email": "somchai@email.com",
  "phone": "089-876-5432",
  "address": "789 หมู่ 5 ตำบลบางพลี อำเภอบางพลี สมุทรปราการ 10540"
}
```

---

## 3️⃣ Products

### Product 1 - คอมพิวเตอร์
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "คอมพิวเตอร์โน้ตบุ๊ค Dell Latitude 3520",
  "description": "Intel Core i5-1135G7, RAM 8GB, SSD 256GB, 15.6\" FHD",
  "price": "25900.00",
  "unit": "เครื่อง"
}
```

### Product 2 - เม้าส์
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "เม้าส์ไร้สาย Logitech M331",
  "description": "เม้าส์ไร้สาย เซ็นเซอร์ออปติคอล 1000 DPI",
  "price": "390.00",
  "unit": "ตัว"
}
```

### Product 3 - คีย์บอร์ด
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "คีย์บอร์ด Mechanical Keychron K2",
  "description": "คีย์บอร์ดเมคานิคอล 84 คีย์ RGB Backlight",
  "price": "3590.00",
  "unit": "ตัว"
}
```

### Product 4 - จอมอนิเตอร์
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "จอมอนิเตอร์ LG 24\" IPS",
  "description": "จอ IPS 24 นิ้ว Full HD 1920x1080 75Hz",
  "price": "3990.00",
  "unit": "เครื่อง"
}
```

### Product 5 - เก้าอี้
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "เก้าอี้สำนักงาน ERGOHUMAN",
  "description": "เก้าอี้เพื่อสุขภาพ ปรับระดับได้ มีพนักพิงหลังตาข่าย",
  "price": "12900.00",
  "unit": "ตัว"
}
```

### Product 6 - กระดาษ
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "กระดาษ A4 Double A 80 แกรม",
  "description": "กระดาษถ่ายเอกสาร A4 500 แผ่น/รีม",
  "price": "125.00",
  "unit": "รีม"
}
```

### Product 7 - ปากกา
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "ปากกาลูกลื่น Pilot G2",
  "description": "ปากกาหมึกเจล 0.7mm สีน้ำเงิน",
  "price": "15.00",
  "unit": "ด้าม"
}
```

### Product 8 - แฟ้ม
```
POST http://localhost:3000/api/products
```

```json
{
  "name": "แฟ้มสันกว้าง 3 นิ้ว",
  "description": "แฟ้มสันกว้าง F4 สีดำ",
  "price": "45.00",
  "unit": "เล่ม"
}
```

---

## 4️⃣ Quotations

> **หมายเหตุ:** ใช้ `customerId` และ `productId` ที่ได้จาก response ข้างต้น

### Quotation 1 - รออนุมัติ
```
POST http://localhost:3000/api/quotations
```

```json
{
  "customerId": 1,
  "validUntil": "2025-01-31",
  "notes": "ใบเสนอราคาสำหรับจัดซื้ออุปกรณ์คอมพิวเตอร์",
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitPrice": "25900.00"
    },
    {
      "productId": 2,
      "quantity": 10,
      "unitPrice": "390.00"
    },
    {
      "productId": 3,
      "quantity": 10,
      "unitPrice": "3590.00"
    }
  ]
}
```

### Quotation 2 - อนุมัติแล้ว
```
POST http://localhost:3000/api/quotations
```

```json
{
  "customerId": 2,
  "validUntil": "2025-02-15",
  "notes": "ใบเสนอราคาสำหรับตกแต่งสำนักงาน",
  "items": [
    {
      "productId": 4,
      "quantity": 5,
      "unitPrice": "3990.00"
    },
    {
      "productId": 5,
      "quantity": 5,
      "unitPrice": "12900.00"
    }
  ]
}
```

**แล้วอนุมัติ:**
```
PATCH http://localhost:3000/api/quotations/2/approve
```

### Quotation 3 - ยกเลิก
```
POST http://localhost:3000/api/quotations
```

```json
{
  "customerId": 3,
  "validUntil": "2024-12-31",
  "notes": "ลูกค้าไม่สะดวกรับสินค้า",
  "items": [
    {
      "productId": 6,
      "quantity": 20,
      "unitPrice": "125.00"
    },
    {
      "productId": 7,
      "quantity": 50,
      "unitPrice": "15.00"
    }
  ]
}
```

**แล้วยกเลิก:**
```
PATCH http://localhost:3000/api/quotations/3/reject
```

---

## 5️⃣ Invoices

### Invoice 1 - จาก Quotation (ชำระบางส่วน)
```
POST http://localhost:3000/api/invoices
```

```json
{
  "quotationId": 2,
  "customerId": 2,
  "dueDate": "2025-01-15",
  "notes": "แปลงจากใบเสนอราคา",
  "items": [
    {
      "productId": 4,
      "quantity": 5,
      "unitPrice": "3990.00"
    },
    {
      "productId": 5,
      "quantity": 5,
      "unitPrice": "12900.00"
    }
  ]
}
```

**รับชำระบางส่วน:**
```
POST http://localhost:3000/api/invoices/1/payments
```

```json
{
  "amount": "50000.00",
  "paymentMethod": "transfer",
  "notes": "โอนเงินงวดแรก"
}
```

### Invoice 2 - ยังไม่ชำระ
```
POST http://localhost:3000/api/invoices
```

```json
{
  "customerId": 1,
  "dueDate": "2025-01-20",
  "notes": "ซื้อเครื่องเขียน",
  "items": [
    {
      "productId": 6,
      "quantity": 10,
      "unitPrice": "125.00"
    },
    {
      "productId": 7,
      "quantity": 30,
      "unitPrice": "15.00"
    },
    {
      "productId": 8,
      "quantity": 20,
      "unitPrice": "45.00"
    }
  ]
}
```

### Invoice 3 - ชำระครบแล้ว
```
POST http://localhost:3000/api/invoices
```

```json
{
  "customerId": 3,
  "dueDate": "2024-12-25",
  "notes": "ซื้อเม้าส์และคีย์บอร์ด",
  "items": [
    {
      "productId": 2,
      "quantity": 2,
      "unitPrice": "390.00"
    },
    {
      "productId": 3,
      "quantity": 2,
      "unitPrice": "3590.00"
    }
  ]
}
```

**รับชำระครบ:**
```
POST http://localhost:3000/api/invoices/3/payments
```

```json
{
  "amount": "7960.00",
  "paymentMethod": "promptpay",
  "notes": "ชำระผ่าน PromptPay QR Code"
}
```

---

## 📝 หมายเหตุสำคัญ

1. **ลำดับการเพิ่ม:** ต้องเพิ่มตามลำดับ (Users → Customers → Products → Quotations → Invoices)

2. **ID Numbers:** ต้องใช้ ID จริงที่ได้จาก response (อาจไม่เริ่มที่ 1 ถ้ามีข้อมูลเก่า)

3. **Authorization:** ทุก request (ยกเว้น register/login) ต้องมี `Authorization: Bearer <token>` ใน Headers

4. **Date Format:** ใช้รูปแบบ `"YYYY-MM-DD"`

5. **Price Format:** ใช้ string เช่น `"1250.00"` ไม่ใช่ number

---

## 🔐 ข้อมูลเข้าสู่ระบบ

- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

---

## 📊 สรุปข้อมูลที่ได้

- 👤 Users: 2 คน
- 👥 Customers: 3 ราย  
- 📦 Products: 8 รายการ
- 📄 Quotations: 3 ใบ (pending, approved, rejected)
- 🧾 Invoices: 3 ใบ (unpaid, partial, paid)
- 💰 Payments: 2 รายการ
