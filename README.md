# VisageID - Sistem Absensi Berbasis Wajah

Ini adalah proyek aplikasi absensi berbasis pengenalan wajah yang dibuat dengan Next.js dan Firebase Studio.

## Fitur Utama

- **Pendaftaran Wajah**: Karyawan dapat mendaftarkan wajah mereka untuk absensi.
- **Absensi Wajah**: Sistem menggunakan kamera untuk mengenali wajah dan mencatat kehadiran.
- **Dasbor Admin**: Admin dapat mengelola karyawan, departemen, dan melihat laporan absensi.
- **Kustomisasi Tampilan**: Admin dapat mengubah nama aplikasi, logo, warna tema, serta konten halaman utama (judul, deskripsi, gambar slideshow, dan footer) melalui halaman pengaturan.

---

## Menuju Produksi & Komersialisasi (Model SaaS)

Untuk mengubah aplikasi ini menjadi produk komersial yang dapat dijual kepada banyak perusahaan (Software as a Service - SaaS), beberapa perubahan arsitektur dan penambahan fitur yang signifikan diperlukan. Berikut adalah panduan dan langkah-langkah utamanya:

### 1. Implementasi Arsitektur Multi-Tenant

Ini adalah perubahan paling krusial. "Multi-tenancy" berarti satu instansi aplikasi dapat melayani banyak perusahaan (tenant) di mana data setiap perusahaan terisolasi dan aman.

-   **Struktur Data Firestore:** Ubah struktur database untuk memisahkan data per perusahaan. Struktur yang disarankan adalah:
    -   `companies/{companyId}/users/{userId}`
    -   `companies/{companyId}/attendance/{attendanceId}`
    -   `companies/{companyId}/departments/{departmentId}`
    -   `companies/{companyId}/settings/...`
-   **Kaitkan Pengguna dengan Perusahaan:** Setiap pengguna di koleksi `users` harus memiliki field `companyId`.
-   **Perbarui Aturan Keamanan (`firestore.rules`):** Tulis ulang aturan keamanan untuk memastikan pengguna hanya dapat mengakses data di dalam `companyId` mereka. Admin perusahaan hanya dapat mengelola data di dalam perusahaannya sendiri.

### 2. Buat Super Admin Dashboard

Anda memerlukan dasbor terpisah (hanya bisa diakses oleh Anda) untuk:
- Mengelola pendaftaran perusahaan baru.
- Melihat daftar semua perusahaan pelanggan.
- Mengelola status langganan dan billing setiap perusahaan.
- Menonaktifkan atau mengaktifkan akun perusahaan.

### 3. Integrasi Sistem Billing & Langganan

-   **Pilih Payment Gateway:** Integrasikan dengan layanan pembayaran seperti **Stripe**, **Midtrans**, atau **Xendit** untuk menangani pembayaran berulang.
-   **Buat Halaman Harga:** Rancang halaman yang menampilkan paket-paket langganan yang Anda tawarkan (misalnya, paket Basic, Pro, Enterprise berdasarkan jumlah karyawan).
-   **Kelola Status Langganan:** Simpan status langganan setiap perusahaan di Firestore (misal, `companies/{companyId}` memiliki field `subscriptionStatus: 'active'` atau `'inactive'`).

### 4. Proses Onboarding untuk Pelanggan Baru

-   Buat alur pendaftaran di mana seorang pemilik bisnis dapat:
    1.  Membuat akun untuk perusahaannya.
    2.  Memilih paket langganan dan melakukan pembayaran pertama.
    3.  Mendapatkan akses ke dasbor admin khusus untuk perusahaannya, di mana ia dapat mulai menambahkan karyawan.

### 5. Hosting dan Domain

-   **Hosting:** Deploy aplikasi Anda ke platform yang andal dan scalable seperti **Firebase Hosting** atau **Vercel**.
-   **Domain Kustom:** Siapkan domain utama untuk produk Anda (misalnya, `visageid.com`). Anda juga bisa menawarkan fitur subdomain kustom untuk setiap perusahaan (misalnya, `nama-perusahaan.visageid.com`).

---

## Cara Mengelola Proyek di GitHub

Anda dapat menyimpan dan mengelola kode proyek ini di repositori GitHub Anda sendiri.

### A. Unggahan Pertama Kali (ke Repositori Baru)

Jika Anda ingin mengunggah proyek ini ke **repositori baru yang masih kosong** di GitHub, ikuti langkah-langkah di bawah ini.

#### 1. Buat Repositori Baru di GitHub

- Buka [GitHub](https://github.com) dan masuk ke akun Anda.
- Klik tombol **"New"** untuk membuat repositori baru.
- Beri nama repositori Anda (misalnya, `visage-id-app`).
- **Penting**: Jangan centang opsi untuk menambahkan `README`, `.gitignore`, atau `license` karena file-file tersebut sudah ada di proyek ini.
- Klik **"Create repository"**.

#### 2. Hubungkan Proyek dengan Repositori GitHub

Setelah membuat repositori, GitHub akan menampilkan halaman dengan beberapa perintah. Gunakan perintah untuk **"push an existing repository from the command line"**.

Buka terminal di direktori proyek Anda dan jalankan perintah berikut secara berurutan:

```bash
# Inisialisasi Git di proyek Anda (jika belum ada)
git init -b main

# Tambahkan semua file ke Git
git add .

# Buat commit pertama Anda (catatan perubahan)
git commit -m "Initial commit: VisageID project setup"

# Tambahkan remote origin (ganti URL dengan URL repositori BARU Anda)
git remote add origin https://github.com/NAMA_ANDA/NAMA_REPOSITORI_BARU_ANDA.git

# Push kode Anda ke GitHub
git push -u origin main
```

Setelah perintah-perintah di atas berhasil dijalankan, semua file proyek Anda akan terunggah ke repositori GitHub baru Anda.

---

### B. Mengunggah Perubahan Susulan (ke Repositori yang Sudah Ada)

Setelah proyek Anda terhubung dengan GitHub, setiap kali Anda ingin menyimpan pembaruan atau perubahan baru, ikuti 3 langkah sederhana dari file `UNGGAH_KE_GITHUB.md`.

Buka terminal di direktori proyek Anda dan jalankan perintah:

1.  **Tambahkan semua file yang berubah:**
    ```bash
    git add .
    ```

2.  **Buat catatan perubahan (commit):**
    ```bash
    git commit -m "Deskripsi singkat tentang perubahan yang dibuat"
    ```
    *Ganti "Deskripsi singkat..." dengan penjelasan Anda sendiri, contohnya "Memperbaiki tampilan mobile" atau "Menambah fitur pengumuman".*

3.  **Unggah perubahan ke GitHub:**
    ```bash
    git push
    ```

Setelah perintah `push` berhasil, semua pembaruan Anda akan langsung terlihat di repositori GitHub.# face
