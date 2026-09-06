# Stream Pilot

English (default) · [Bahasa Indonesia](#bahasa-indonesia)

Stream Pilot is a mobile control deck for livestream operators. It keeps YouTube live chat, OBS controls, and selected Trakteer overlay actions together on one phone or tablet.

## Features

- Clean YouTube live chat monitoring without a YouTube API key or account sign-in.
- Direct OBS Studio scene switching and source visibility control over the local network.
- An OBS audio mixer for the active Program scene with OBS-style volume faders and one-tap mute controls.
- Collapsible OBS control banks with drag-and-drop Source and mixer ordering saved locally per Program scene.
- OBS setup by scanning **Show Connect Info** or entering connection details manually.
- Trakteer controls for Alert + Mediashare, Gacha, and overlay tests through private Action URLs.
- Adaptive layouts: bottom navigation on phones and a three-panel console on tablets.
- Light, dark, and system themes with configurable live chat text size.
- Automatic update checks against the latest published GitHub Release.
- Local-only settings with OBS passwords and Trakteer Action URLs stored securely on the device.

## Requirements

- Android 7 or newer, or iOS 16.4 or newer.
- OBS Studio 28+ with obs-websocket 5 enabled.
- The mobile device and OBS computer must be on the same local network.
- Trakteer Stream Overlay Control Action URLs for the controls you want to use.

## Install on Android

Download the latest APK from [GitHub Releases](../../releases), install it, then allow installation from the browser or file manager if Android asks.

## Configure

1. Open **Settings** in Stream Pilot.
2. Add a YouTube video, livestream, or popout chat link.
3. In OBS, open **Tools → WebSocket Server Settings → Show Connect Info**, then scan the QR code from Stream Pilot.
4. Create or copy the required Action URLs from [Trakteer Stream Overlay settings](https://trakteer.id/v2/manage/stream-settings), then paste them into their matching fields. This is also where Stream Deck API URLs are configured.
5. Test the OBS connection and any Trakteer test actions before going live.

## Current limitations

- YouTube chat is read-only. Sending messages, deleting messages, and timing out users are not supported.
- YouTube's popout chat DOM is cleaned inside a WebView and may require maintenance when YouTube changes its page structure.
- The OBS audio mixer does not include VU meters, balance, monitoring, sync offset, master volume, or gain above 0 dB.
- OBS is controlled only over the local network; cloud relay is not included.
- Android releases are distributed through GitHub Releases. iOS remains buildable but is not publicly distributed yet.

## Development

The project uses Expo SDK 57, React Native 0.86, and Node.js 22.13 or newer.

```bash
npm install
npm run android
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm test
```

## Releases

Pushing a semantic version tag such as `v1.2.0`, or entering `1.2.0` (with or without the leading `v`) when manually running the Android release workflow, builds the APK and publishes a GitHub Release. The workflow applies the version to the app and APK automatically. Release notes are generated from commits since the previous tag and grouped into **Features**, **Fixes**, and **Other Changes**.

---

## Bahasa Indonesia

Stream Pilot adalah dek kontrol mobile untuk operator livestream. Aplikasi ini menyatukan live chat YouTube, kontrol OBS, dan aksi overlay Trakteer pilihan dalam satu ponsel atau tablet.

### Fitur

- Pemantauan live chat YouTube yang bersih tanpa API key atau login akun.
- Pergantian scene dan kontrol visibilitas Source OBS Studio secara langsung melalui jaringan lokal.
- Mixer audio OBS untuk Scene Program aktif dengan fader volume bergaya OBS dan kontrol mute sekali ketuk.
- Bank kontrol OBS yang dapat dilipat, dengan urutan Source dan mixer yang dapat diubah lewat drag-and-drop dan disimpan lokal per Scene Program.
- Pengaturan OBS dengan memindai **Show Connect Info** atau mengisi detail koneksi secara manual.
- Kontrol Trakteer untuk Alert + Mediashare, Gacha, dan pengujian overlay melalui Action URL privat.
- Layout adaptif: navigasi bawah pada ponsel dan konsol tiga panel pada tablet.
- Tema terang, gelap, dan sistem dengan ukuran teks live chat yang dapat diatur.
- Pemeriksaan pembaruan otomatis dari GitHub Release terbaru.
- Pengaturan lokal dengan password OBS dan Action URL Trakteer yang disimpan aman di perangkat.

### Persyaratan

- Android 7 atau lebih baru, atau iOS 16.4 atau lebih baru.
- OBS Studio 28+ dengan obs-websocket 5 aktif.
- Perangkat mobile dan komputer OBS harus berada pada jaringan lokal yang sama.
- Action URL dari Trakteer Stream Overlay Control untuk kontrol yang ingin digunakan.

### Instalasi di Android

Unduh APK terbaru dari [GitHub Releases](../../releases), instal, lalu izinkan instalasi dari browser atau pengelola file jika diminta Android.

### Konfigurasi

1. Buka **Pengaturan** di Stream Pilot.
2. Tambahkan link video, livestream, atau popout chat YouTube.
3. Di OBS, buka **Tools → WebSocket Server Settings → Show Connect Info**, lalu pindai kode QR dari Stream Pilot.
4. Buat atau salin Action URL yang diperlukan dari [pengaturan Stream Overlay Trakteer](https://trakteer.id/v2/manage/stream-settings), lalu tempel pada kolom yang sesuai. Di halaman ini juga tersedia konfigurasi URL API Stream Deck.
5. Uji koneksi OBS dan aksi pengujian Trakteer sebelum mulai siaran.

### Batasan saat ini

- Chat YouTube hanya dapat dibaca. Mengirim atau menghapus pesan dan memberi timeout belum didukung.
- DOM popout chat YouTube dibersihkan di dalam WebView dan mungkin perlu dirawat saat YouTube mengubah struktur halamannya.
- Mixer audio OBS belum mencakup VU meter, balance, monitoring, sync offset, master volume, atau gain di atas 0 dB.
- OBS hanya dikontrol melalui jaringan lokal; cloud relay tidak tersedia.
- Rilis Android didistribusikan melalui GitHub Releases. Versi iOS tetap dapat dibangun, tetapi belum didistribusikan secara publik.

### Pengembangan

Proyek ini menggunakan Expo SDK 57, React Native 0.86, dan Node.js 22.13 atau lebih baru.

```bash
npm install
npm run android
```

Pemeriksaan yang tersedia:

```bash
npm run typecheck
npm run lint
npm test
```

### Rilis

Push tag versi semantik seperti `v1.2.0`, atau masukkan `1.2.0` dengan atau tanpa awalan `v` saat menjalankan workflow rilis Android secara manual, untuk membangun APK dan menerbitkan GitHub Release. Workflow menerapkan versi ke aplikasi dan APK secara otomatis. Catatan rilis dibuat dari commit sejak tag sebelumnya dan dikelompokkan menjadi **Features**, **Fixes**, dan **Other Changes**.
