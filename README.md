# Stream Pilot

Stream Pilot is a mobile control deck for livestream operators. It keeps YouTube live chat, OBS controls, and selected Trakteer overlay actions together on one phone or tablet.

## Features

- Clean YouTube live chat monitoring without a YouTube API key or account sign-in.
- Direct OBS Studio scene switching and source visibility control over the local network.
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

Pushing a semantic version tag such as `v1.2.0`, or entering that version when manually running the Android release workflow, builds the APK and publishes a GitHub Release. The workflow applies the version to the app and APK automatically. Release notes are generated from commits since the previous tag and grouped into **Features**, **Fixes**, and **Other Changes**.
