# Panduan Deploy ke Hostinger (GitHub Actions + FTP)

Situs **The Rain Villas** adalah situs statis Astro. Build menghasilkan folder `dist/`
yang di-upload ke `public_html/` di Hostinger via FTP tiap kali push ke GitHub.

## Cara kerja
1. Push ke GitHub (branch `main`).
2. GitHub Actions (`./.github/workflows/deploy.yml`) menjalankan build Astro.
3. Hasil `dist/` di-upload ke Hostinger via FTP ke folder server-dir.

## Langkah set up (sekali saja)

### 1. Buat repo GitHub
- Buka github.com, buat repo baru (misal `the-rain-villas`), **jangan** centang
  "Add README / .gitignore" (agar tidak conflict).
- Salin URL repo-nya.

### 2. Push code lokal ke repo baru
Di terminal dari folder root `web trv 2`:

```bash
git init
git add .
git commit -m "Initial upload - The Rain Villas"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

### 3. Set GitHub Secrets (nama persis)
Di repo GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Contoh nilai |
|--------|--------------|
| `FTP_HOST` | `ftp.yourdomain.com` atau IP. Dari hPanel → Files → FTP Accounts |
| `FTP_USERNAME` | username FTP (contoh `u123456789@yourdomain.com`) |
| `FTP_PASSWORD` | password FTP |
| `FTP_PORT` | `21` (atau `21` default FTP, `990` untuk FTPS explicit) |
| `FTP_SERVER_DIR` | `public_html/` (folder web root di Hostinger) |

### 4. Pipeline FTP aktif
Workflow hanya jalan jika kamu pakai akun FTP standar.
Jika memakai **FTPS (explicit TLS)**, ubah port ke `990` — SamKirkland action
otomatis mendeteksi FTPS dari port/koneksi.

### 5. Trigger deploy
Setiap `git push` ke `main` akan otomatis build & deploy.
Kamu juga bisa trigger manual: **Actions → Deploy ke Hostinger → Run workflow**.

## Tombol "deploy manual"
Buka **Actions** di GitHub, pilih workflow `Deploy ke Hostinger`,
klik **Run workflow** lalu **Run** untuk deploy tanpa push.

## Catatan penting
- Folder **`dist/`** tidak di-commit (ada di `.gitignore`) — dibuat otomatis saat build.
- **`node_modules/`** tidak di-commit.
- Gambar asli di `public/` sudah dikompresi sehingga tidak "ber-giga-giga"
  (total `dist/` ≈ 180MB, turun dari ±2.6GB).
- **`dangerous-clean-slate: true` aktif** di workflow → isi folder server-dir
  **dihapus total** sebelum upload (agar file PNG lama yang sudah diganti JPG
  ikut terhapus, tidak menumpuk). Pastikan `FTP_SERVER_DIR` benar-benar folder
  website utama (`public_html/`) dan **bukan** folder yang berisi file penting
  lain (admin, backup, dll). Jika server kamu berisi hal lain, matikan flag ini.
