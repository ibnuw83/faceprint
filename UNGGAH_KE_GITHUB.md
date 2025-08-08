# Panduan Cepat untuk Mengunggah Perubahan ke GitHub

Gunakan file ini setiap kali Anda ingin menyimpan dan mengunggah pembaruan terbaru dari proyek Anda ke repositori GitHub yang sudah ada.

Cukup jalankan 3 perintah di bawah ini secara berurutan di dalam terminal proyek Anda.

---

### Langkah 1: Tambahkan Semua Perubahan

Perintah ini akan memberitahu Git untuk melacak semua file yang baru, diubah, atau dihapus di proyek Anda. Tanda titik (`.`) di akhir sangat penting.

```bash
git add .
```

---

### Langkah 2: Buat Catatan Perubahan (Commit)

Perintah ini akan "membungkus" semua perubahan yang sudah Anda lacak di Langkah 1 ke dalam satu paket (commit) dengan sebuah pesan deskriptif.

Ganti `"Deskripsi perubahan Anda"` dengan pesan singkat tentang pembaruan yang Anda buat. Contohnya: `"Memperbaiki bug di halaman login"` atau `"Menambahkan fitur laporan absensi"`.

```bash
git commit -m "Deskripsi perubahan Anda"
```

---

### Langkah 3: Unggah ke GitHub

Perintah ini akan mengambil paket perubahan yang Anda buat di Langkah 2 dan mengirimkannya ke repositori Anda di GitHub.

```bash
git push
```

---

**Selesai!** Setelah menjalankan tiga perintah di atas, semua perubahan terbaru Anda akan langsung terlihat di repositori GitHub Anda.
