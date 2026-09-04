# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Livestream operators using a phone or tablet beside an OBS workstation. They need to monitor YouTube chat and trigger production controls quickly without switching between several apps.

## Product Purpose

Stream Pilot is a single live-production console for reading YouTube live chat, switching OBS scenes and source visibility, and triggering selected Trakteer overlay actions. Success means the operator can see current state and act with one tap during a livestream.

## Positioning

The product combines three otherwise separate control surfaces in one adaptive Live Console while keeping configuration local to the operator's device.

## Operating Context

- The mobile device and OBS computer share one local network.
- The operator commonly uses landscape phones, Android tablets, or iPad, while portrait remains supported.
- OBS controls are needed during a live broadcast, so connection state, large targets, haptics, and accidental-action prevention matter.
- Trakteer supplies a private Action URL for each selected overlay action.

## Capabilities and Constraints

- Native Android and iOS only; no web target.
- One local Stream Setup, no account, backend, analytics, or cloud sync.
- Clean Live Chat accepts a YouTube video/live URL or popout URL, uses no YouTube API or authenticated session, allows scrolling, blocks navigation away, and extracts no messages.
- Clean Live Chat deliberately applies brittle visual cleanup to YouTube's popout DOM; policy and maintenance risk are accepted and documented in ADR 0004.
- Clean Live Chat follows the app theme and offers a 10–30 px text-size dropdown.
- OBS Studio 28+ through obs-websocket v5, configured manually or by scanning its official Connect Info QR code.
- OBS connects and reconnects automatically, mirrors real-time Program scene and source visibility, shows sources for the active scene, and includes nested groups.
- Scene changes target Program directly; Preview and Transition controls are out of scope.
- Trakteer provides fixed Alert + Mediashare and Gacha control banks backed by private Action URLs, plus notification and platform-specific media tests in Settings.
- Trakteer URLs save automatically in secure device storage; an unconfigured panel shows a setup prompt, while partially configured controls remain visible but disabled.
- Compact windows use a Chat, OBS, and Trakteer bottom navigation bar while keeping inactive content mounted. Windows at least 600 dp on their shortest side show all three sections at 40/30/30.
- The app follows device rotation, keeps the screen awake by default while the Live Console is active, and uses light haptics without sound.
- Settings provide System, Light, and Dark themes. Interface language is Bahasa Indonesia.
- Android ships publicly through GitHub Releases. iOS remains buildable and is published later through the App Store.
- Configuration can be incomplete; each Console Section remains independently usable.

## Brand Commitments

- Product name: Stream Pilot.
- Minimal, utilitarian control-deck character.
- Cool neutral palette without a bright brand accent; semantic colors are reserved for state.
- Clear system typography and large, legible controls.

## Evidence on Hand

- The repository contains an Expo 57 starter and platform icon assets.
- `CONTEXT.md` defines the domain language.
- `docs/adr/` records the accepted architecture and compliance trade-offs.
- No final logo, screenshots, testimonials, or commercial claims are available and none should be invented.

## Product Principles

- Keep all three production surfaces visible on tablets and one tap apart on phones.
- Reflect real external state; never let stale controls imply success.
- Preserve active connections while the operator reshapes the console.
- Keep secrets on-device and out of logs, analytics, and exports.
- Prefer direct, reversible controls over setup automation that scrapes third-party pages.

## Accessibility & Inclusion

Controls must meet native touch-target guidance, support system text scaling, expose accessibility labels and state, preserve platform back behavior, honor reduced motion, and maintain readable contrast in light and dark themes.
