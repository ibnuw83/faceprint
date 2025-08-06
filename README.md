# VisageID - Sistem Absensi Berbasis Wajah

Ini adalah proyek aplikasi absensi berbasis pengenalan wajah yang dibuat dengan Next.js dan Firebase Studio.

## Fitur Utama

- **Pendaftaran Wajah**: Karyawan dapat mendaftarkan wajah mereka untuk absensi.
- **Absensi Wajah**: Sistem menggunakan kamera untuk mengenali wajah dan mencatat kehadiran.
- **Dasbor Admin**: Admin dapat mengelola karyawan, departemen, dan melihat laporan absensi.
- **Kustomisasi Tampilan**: Admin dapat mengubah nama aplikasi, logo, warna tema, serta konten halaman utama (judul, deskripsi, gambar slideshow, dan footer) melalui halaman pengaturan.

---

## Cara Mengelola Proyek di GitHub

Anda dapat menyimpan dan mengelola kode proyek ini di repositori GitHub Anda sendiri.

### A. Unggahan Pertama Kali

Jika Anda belum pernah menghubungkan proyek ini ke GitHub, ikuti langkah-langkah di bawah ini.

#### 1. Buat Repositori Baru di GitHub

- Buka [GitHub](https://github.com) dan masuk ke akun Anda.
- Klik tombol **"New"** untuk membuat repositori baru.
- Beri nama repositori Anda (misalnya, `visage-id-app`).
- **Penting**: Jangan centang opsi untuk menambahkan `README`, `.gitignore`, atau `license` karena file-file tersebut sudah ada di proyek ini.
- Klik **"Create repository"**.

#### 2. Hubungkan Proyek Lokal dengan Repositori GitHub

Setelah membuat repositori, GitHub akan menampilkan halaman dengan beberapa perintah. Gunakan perintah untuk "push an existing repository from the command line".

Buka terminal di direktori proyek Anda dan jalankan perintah berikut secara berurutan:

```bash
# Inisialisasi Git di proyek Anda (jika belum ada)
git init -b main

# Tambahkan semua file ke Git
git add .

# Buat commit pertama Anda (catatan perubahan)
git commit -m "Initial commit: VisageID project setup"

# Tambahkan remote origin (ganti URL dengan URL repositori Anda)
git remote add origin https://github.com/NAMA_ANDA/NAMA_REPOSITORI_ANDA.git

# Push kode Anda ke GitHub
git push -u origin main
```

Setelah perintah-perintah di atas berhasil dijalankan, semua file proyek Anda akan terunggah ke repositori GitHub Anda.

---

### B. Mengunggah Perubahan Susulan

Setelah proyek Anda terhubung dengan GitHub, setiap kali Anda ingin menyimpan pembaruan atau perubahan baru, ikuti 3 langkah sederhana ini.

Buka terminal di direktori proyek Anda dan jalankan perintah berikut:

1.  **Tambahkan semua file yang berubah:**
    ```bash
    git add .
    ```

2.  **Buat catatan perubahan (commit):**
    ```bash
    git commit -m "Memperbaiki tampilan menu Cuti & Izin untuk semua pengguna"
    ```
    *Ganti "Deskripsi singkat..." dengan penjelasan Anda sendiri, contohnya "Memperbaiki tampilan mobile" atau "Menambah fitur pengumuman".*

3.  **Unggah perubahan ke GitHub:**
    ```bash
    git push
    ```

Setelah perintah `push` berhasil, semua pembaruan Anda akan langsung terlihat di repositori GitHub.
