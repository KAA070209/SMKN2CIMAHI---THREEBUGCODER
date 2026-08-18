# 🛍️ Bumi Kriya - ThreeBugCoder

**Bumi Kriya** adalah platform e-commerce yang menyediakan berbagai produk kerajinan dan bahan kriya dari Indonesia. Platform ini dibuat untuk mempertemukan penjual dan pembeli dalam satu marketplace yang mudah digunakan.

## 👥 Tim Pengembang

Project e-commerce ini dibuat oleh:

* **Muhammad Azka Sa'adi Nabhan** — SMK NEGERI 2 CIMAHI
* **Rahma Khairul Hawa** — SMK NEGERI 2 CIMAHI
* **REVITA GADIS AMIJAYA** — SMK NEGERI 2 CIMAHI

---

## ✨ Fitur

### 👤 User

* Registrasi dan login
* Verifikasi OTP melalui email
* Melihat dan mencari produk
* Melihat detail produk
* Melihat toko/penjual
* Menambahkan produk ke keranjang
* Checkout produk
* Pemilihan alamat pengiriman
* Simulasi pembayaran
* Melihat status pembayaran
* Melacak pesanan
* Melihat riwayat pesanan
* Memberikan ulasan produk

### 🏪 Seller

* Membuat dan mengelola toko
* Menambahkan produk
* Mengedit produk
* Menghapus produk
* Mengatur stok dan harga
* Melihat pesanan masuk
* Mengelola status pesanan

### 🔐 Admin

* Dashboard admin
* Mengelola user
* Mengelola seller
* Mengelola kategori
* Mengelola toko
* Mengelola pesanan
* Monitoring transaksi

---

## 🧩 Teknologi

### Backend

* Python
* FastAPI
* SQLAlchemy
* Alembic
* Pydantic
* PostgreSQL
* JWT Authentication

### Frontend

* React
* Vite
* JavaScript
* CSS

### Payment

* Midtrans Sandbox

### Deployment

* Railway — Backend
* Vercel — Frontend

---

## 📁 Struktur Project

```text
Bumi-Kriya/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── core/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Instalasi Backend

Clone repository terlebih dahulu:

```bash
git clone <URL_REPOSITORY>
cd Bumi-Kriya
```

Masuk ke folder backend:

```bash
cd backend
```

Buat Database:

```bash
python scripts/init_db.py
```


Install dependencies:

```bash
python -m pip install -r requirements.txt
```

---

## 🔑 Environment Variable

Buat file `env` pada folder backend dan sesuaikan konfigurasi berikut:

```env
PROJECT_NAME=Bumi Kriya

DATABASE_URL=postgresql://username:password@localhost:5432/bumikriya

SECRET_KEY=your-secret-key
ALGORITHM=HS256

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=false
```

> Jangan commit file `env` yang berisi password, secret key, API key, atau credentials ke repository publik.

---

## 🗄️ Database & Alembic

Setelah database dikonfigurasi, jalankan migration:

```bash
alembic upgrade head
```

Untuk membuat migration baru:

```bash
alembic revision --autogenerate -m "nama migration"
```

Kemudian jalankan:

```bash
alembic upgrade head
```

### 🌱 Seed Database

Jika project memiliki seed data, jalankan file seed sesuai struktur project.

Contoh:

```bash
python seed.py
```

Seed digunakan untuk memasukkan data awal seperti:

* User
* Role
* Category
* Product
* Store
* Data lainnya

---

## 🚀 Menjalankan Backend

Jalankan FastAPI menggunakan:

```bash
uvicorn app.main:app --reload
```

Backend dapat diakses melalui:

```text
http://127.0.0.1:8000
```

Dokumentasi API tersedia di:

```text
http://127.0.0.1:8000/docs
```

atau:

```text
http://127.0.0.1:8000/redoc
```

---

## 💻 Menjalankan Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Frontend akan tersedia pada alamat yang diberikan oleh Vite, biasanya:

```text
http://localhost:5173
```

---

## 💳 Pembayaran

Bumi Kriya menggunakan **Midtrans Sandbox** untuk simulasi pembayaran.

Alur pembayaran:

```text
User
 │
 ▼
Checkout
 │
 ▼
Create Payment
 │
 ▼
Midtrans Sandbox
 │
 ▼
Payment Result
 │
 ▼
Update Order Status
```

Mode Sandbox digunakan untuk pengembangan dan pengujian sehingga transaksi yang dilakukan tidak menggunakan pembayaran nyata.

---

## 📦 Alur Pemesanan

```text
Login
  │
  ▼
Pilih Produk
  │
  ▼
Tambah ke Keranjang
  │
  ▼
Checkout
  │
  ▼
Pilih Alamat
  │
  ▼
Buat Pesanan
  │
  ▼
Pembayaran
  │
  ▼
Pembayaran Berhasil
  │
  ▼
Seller Memproses Pesanan
  │
  ▼
Pesanan Dikirim
  │
  ▼
Pesanan Diterima
```

---

## 📍 Status Pesanan

Pesanan dapat memiliki beberapa status:

```text
PENDING
PAID
PROCESSING
SHIPPED
DELIVERED
CANCELLED
```

Status tersebut digunakan untuk membantu user mengetahui perkembangan pesanannya.

---

## 🚚 Pengiriman

Fitur tracking pengiriman pada project dapat menggunakan **simulasi ekspedisi** untuk kebutuhan development dan demonstrasi.

Contoh alur:

```text
Pesanan Dibuat
      ↓
Diproses Seller
      ↓
Diserahkan ke Kurir
      ↓
Dalam Perjalanan
      ↓
Sampai di Tujuan
      ↓
Pesanan Diterima
```

---

## 🔒 Authentication

Sistem authentication menggunakan:

* JWT
* Password hashing
* Role-based authorization
* Email OTP verification

Role yang tersedia:

```text
USER
SELLER
ADMIN
```

Setiap role memiliki hak akses yang berbeda sesuai dengan kebutuhan aplikasi.

---

## 🌐 Deployment

### Backend

Backend dapat di-deploy menggunakan:

```text
Railway
```

### Frontend

Frontend dapat di-deploy menggunakan:

```text
Vercel
```

Pastikan environment variable pada production sudah dikonfigurasi dengan benar.

---

## ⚠️ Catatan Development

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan aplikasi e-commerce.

Beberapa fitur seperti:

* Pembayaran
* Tracking pengiriman
* Email OTP

dapat menggunakan mode **sandbox/simulasi** selama tahap development.

Untuk production, pastikan seluruh API key, secret key, database credentials, dan konfigurasi keamanan menggunakan environment variable.

---

## 📄 License

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan oleh tim:

**Bumi Kriya — SMK NEGERI 2 CIMAHI**
