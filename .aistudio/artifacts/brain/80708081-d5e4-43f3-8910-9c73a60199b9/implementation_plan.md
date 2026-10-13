# Nexora → Installable Android App: Complete Architecture & Delivery Plan

Nexora will be delivered as a true, installable Android application using a production-grade **PWA + TWA (Trusted Web Activity)** architecture. Users will be able to install Nexora directly from Chrome as a native WebAPK, download a signed `.apk` file from a dedicated `/download` page, or install it from the Google Play Store (as an AAB), all powered by the single Next.js codebase.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan replaces the earlier streaming model with the industry-standard TWA pipeline. Review the key confirmed decisions:

- **Confirmed Decision 1: PWA + TWA Wrapper (No Rewrite)**:
  Nexora remains a live web application. The Android application is packaged as a Trusted Web Activity (TWA) using PWABuilder / Bubblewrap. Google OAuth, Supabase sessions, Web Push notifications, and Service Worker offline caching work natively inside Chrome's engine without URL bars or Webview limitations. The resulting APK size is only ~1–3 MB.
- **Confirmed Decision 2: Distinct Delivery Channels**:
  1. **Chrome "Install App" (WebAPK)**: Handled directly in-browser using `beforeinstallprompt`. Chrome automatically creates a signed WebAPK on the user's phone with zero sideloading warnings.
  2. **Direct APK Sideload**: Downloadable signed APK hosted via GitHub Releases (or direct static file in `public/`), with transparent sideloading instructions on a dedicated `/download` page. No dynamic binary streaming routes.
  3. **Google Play Store (AAB)**: Package-signed Android App Bundle (AAB) for Play Store distribution.
- **Confirmed Decision 3: Digital Asset Links Verification**:
  Host `/.well-known/assetlinks.json` on the domain with SHA-256 certificate fingerprints for both the APK signing key and the Play App Signing key. This unlocks true fullscreen immersion and removes the browser URL bar.
- **Confirmed Decision 4: PWA Hardening & Accessibility Standards**:
  Remove `user-scalable=no` and `maximum-scale=1` from viewport configuration; enrich `manifest.webmanifest` with responsive screenshots, shortcuts, and maskable icons; and provide account deletion in Settings to comply with Play Store policies.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  - A dedicated **`/download` page** with 1-click Chrome installation, direct APK download button, SHA-256 verification hash, step-by-step sideloading guide, and Play Store badge.
  - A hardened **Progressive Web App (PWA)** that scores 100% on installability and offline readiness.
  - Verification endpoints (`/.well-known/assetlinks.json`) enabling fullscreen Android execution without browser controls.
  - A fast, resilient first-paint shell so external validators, crawlers, and Play reviewers immediately see the live habitat.
- **Target Audience / Persona**:
  - Android phone and tablet users wanting a distraction-free home-screen app.
  - Power users seeking direct APK sideloading and offline productivity.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Website Visitor → `/download` Page Flow**:
   - Visitor navigates to `/download` (or taps "Download App" in the Header).
   - **On Android Chrome**: The page displays a prominent **"Install Directly via Chrome"** button (triggering `beforeinstallprompt` to create a verified WebAPK with 0 warnings).
   - Directly underneath, an **"Alternative: Download Signed APK"** button provides the `.apk` file for offline sideloading.
   - Sideloading instructions clearly guide the user: *Open file → Enable "Install unknown apps" if prompted → Tap Install.*
   - Verification details: App Version (v1.0.0), Package ID (`com.nexora.app`), and SHA-256 checksum.

2. **In-App Install Prompt Flow**:
   - On mobile browsers, an unobtrusive banner or header pill invites the user to install.
   - Once installed (detected via `display-mode: standalone`), all install prompts are cleanly hidden.

3. **Android Installed Experience**:
   - Seamless splash screen with the gold Nexora emblem and Obsidian `#0C0A09` background.
   - Fullscreen UI with zero browser URL bar or navigation controls.
   - Edge-to-edge layout respecting system status and navigation bar insets.

### Visual Identity & Theme

- **Aesthetic Direction**: Obsidian luxury (`#0C0A09` background, `#D4A853` / `amber-400` metallic accents, clean typography).
- **Download Hub Design**:
  - Twin action cards: **Recommended: Instant Chrome WebAPK** (glowing gold border) and **Direct APK Package** (clean obsidian card with download metrics).
  - Clear icon badges for Google Play, Android, and Desktop PWA.

---

## 3. Technical Architecture & Phased Roadmap

### System Component Diagram

```
                 ┌──────────────────────────────┐
                 │    Nexora Web Application    │
                 │ Next.js + Supabase + SW + PWA│
                 └───────────────┬──────────────┘
                                 │ Single Source of Truth
        ┌────────────────────────┼─────────────────────────┐
        ▼                        ▼                         ▼
┌───────────────┐      ┌──────────────────┐      ┌───────────────────┐
│  Chrome PWA   │      │ Signed APK (TWA) │      │ Play Store (AAB)  │
│ "Install app" │      │ GitHub Releases/ │      │ Same TWA, signed  │
│ WebAPK by OS  │      │ Direct Sideload  │      │ by Google Play    │
└───────┬───────┘      └────────┬─────────┘      └─────────┬─────────┘
        │                       │                          │
        └───────────────────────┴──────────────────────────┘
             All load the same live app with offline cache
             Verified via /.well-known/assetlinks.json
```

### Roadmap & Phases

#### Phase 1: PWA Hardening & Web Cleanup
1. **Viewport Meta Fix**: Remove restrictive `user-scalable=no` and `maximum-scale=1` in `src/app/layout.tsx`.
2. **Web Manifest Upgrade (`public/manifest.webmanifest`)**:
   - Set `id: "/"`, `start_url: "/dashboard?source=pwa"`, `display: "standalone"`, `orientation: "portrait"`.
   - Add app shortcuts ("Focus Chamber", "Task Matrix", "Habit Momentum").
   - Add narrow and wide screenshot definitions for Play/install prompt cards.
3. **Service Worker Enhancement (`public/sw.js`)**:
   - Cache-first strategy for static assets, fonts, icons, and shell.
   - Network-first strategy for Supabase and dynamic API calls.
   - Offline fallback page when network is unavailable.
4. **Fast App Shell**:
   - Optimize root page (`src/app/page.tsx`) so validators and first-time users immediately see the brand shell rather than an indefinite loading state.

#### Phase 2: Digital Asset Links & Verification
1. **Asset Links Endpoint (`public/.well-known/assetlinks.json`)**:
   - Serve valid JSON configuration matching package `com.nexora.app`.
   - Include SHA-256 fingerprint placeholders for both local APK keystore and Play App Signing key.

#### Phase 3: Dedicated `/download` Hub & In-App UI
1. **`/download` Page (`src/app/download/page.tsx`)**:
   - Dual actions: Chrome WebAPK Install button (`beforeinstallprompt`) + Direct APK download link.
   - Sideload step-by-step guidance, SHA-256 checksum card, and Play Store placeholder.
2. **Header & Navigation Updates**:
   - Update "Download App" in `Header.tsx` and `MobileDrawer.tsx` to route smoothly to `/download` while offering instant install if prompt is ready.
   - Keep install banner unobtrusive and hide when in standalone mode.

#### Phase 4: Policy & Settings Compliance
1. **Account Deletion UI (`src/app/(dashboard)/settings/page.tsx`)**:
   - Implement an explicit "Delete Account & Purge Data" action in Settings to satisfy Google Play Store data safety and account management requirements.

#### Phase 5: APK / AAB Packaging & External Build Instructions
1. Document the exact PWABuilder and Bubblewrap CLI build steps for the user to generate `app-release-signed.apk` and `app-release-bundle.aab`.
2. Guide keystore generation and fingerprint extraction to populate `assetlinks.json`.
