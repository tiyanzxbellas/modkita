# ModKita — Panduan Deploy Vercel

## 1. Cara deploy ke Vercel

**Via Vercel UI (Git):**
1. Push repo ini ke GitHub/GitLab/Bitbucket.
2. Impor proyek di dashboard Vercel.
3. Vercel akan mendeteksi Vite secara otomatis.
4. Pengaturan build default:
   - Framework Preset: `Other` (atau `Vite`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy.

**Via Vercel CLI:**
```bash
npm install -g vercel
vercel
```

## 2. Struktur API di Vercel

Konfigurasi API di Vercel diletakkan di folder `api/`. Berbeda dengan Netlify yang menggunakan folder `netlify/functions`, Vercel secara otomatis mengenali file di dalam `api/` sebagai Serverless Functions.

| Route | File | Runtime |
|---|---|---|
| `GET /api/home` | `api/home.ts` | Node.js |
| `GET /api/search` | `api/search.ts` | Node.js |
| `GET /api/detail` | `api/detail.ts` | Node.js |
| `GET /api/download` | `api/download.ts` | **Edge Runtime** |

`api/download.ts` menggunakan **Edge Runtime** agar bisa melakukan streaming file APK/OBB yang besar tanpa terbentur limit payload Serverless Function biasa (yang biasanya terbatas 4.5MB - 6MB di Vercel).

## 3. Konfigurasi `vercel.json`

File `vercel.json` sudah dikonfigurasi untuk:
- Menangani routing SPA (Single Page Application) agar semua path non-API diarahkan ke `index.html`.
- Mengatur header `Cache-Control: no-cache` untuk `sw.js` dan `manifest.json` agar update PWA berjalan lancar.
