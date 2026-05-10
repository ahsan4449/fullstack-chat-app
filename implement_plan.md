# SyncTalk — Implementation Plan
## Phase 1: Capacitor Android APK + Phase 2: Cross-Device Clipboard Sync

---

> [!IMPORTANT]
> **Phase 1 must be fully completed before starting Phase 2.**
> Phase 2's Android clipboard features depend on the Capacitor runtime being present.

---

## Phase 1 — Capacitor Android APK Conversion

### Overview
Convert the existing React + Vite frontend into a real Android APK using Capacitor.js.
The APK will be installable directly on any Android device (sideloading — no Play Store needed, free).

### Prerequisites to Install (One-Time)

| Tool | Version | Download | Cost |
|------|---------|----------|------|
| Android Studio | Latest (Meerkat) | https://developer.android.com/studio | Free |
| Java JDK 17 | 17 LTS | https://adoptium.net | Free |
| Android SDK | Auto-installed via Android Studio | — | Free |

> [!NOTE]
> During Android Studio first launch, let it auto-install the Android SDK (~2 GB download).
> Accept all license agreements when prompted.

---

### Step 1.1 — Install Capacitor packages into the frontend

**Working directory:** `c:\Users\91981\fullstack-chat-app\frontend`

```bash
pnpm add @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/clipboard
```

**Packages explained:**
| Package | Purpose |
|---------|---------|
| `@capacitor/core` | Core Capacitor runtime |
| `@capacitor/cli` | CLI for building/syncing |
| `@capacitor/android` | Android platform adapter |
| `@capacitor/app` | App lifecycle events (foreground/background detection) |
| `@capacitor/clipboard` | Native clipboard read/write (needed for Phase 2) |

---

### Step 1.2 — Initialize Capacitor

Run in `frontend/` directory:

```bash
npx cap init
```

When prompted, enter:
- **App name:** `SyncTalk`
- **App ID:** `com.synctalk.app`
- **Web assets directory:** `dist`

This creates `capacitor.config.ts` in the frontend root.

**Expected output — `frontend/capacitor.config.ts`:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.synctalk.app',
  appName: 'SyncTalk',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

---

### Step 1.3 — Fix Vite config for Capacitor

**File to modify:** `frontend/vite.config.js`

**Problem:** Capacitor loads your app from a local file system inside the APK.
Without `base: './'`, all asset paths will be absolute and break.

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',   // ← ADD THIS LINE
})
```

---

### Step 1.4 — Fix Backend URL for the APK

**File to modify:** `frontend/src/lib/axios.js`

**Problem:** Inside the APK, `localhost` means the Android device itself — not your PC.
The APK must point to your deployed Render backend.

```js
// frontend/src/lib/axios.js
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://your-app.onrender.com";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : `${BACKEND_URL}/api`,
  withCredentials: true,
});
```

**File to modify:** `frontend/src/store/useAuthStore.js`

```js
// Change line 6 from:
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

// To:
const BASE_URL = import.meta.env.MODE === "development"
  ? "http://localhost:5001"
  : (import.meta.env.VITE_BACKEND_URL || "https://your-app.onrender.com");
```

**New file to create:** `frontend/.env.production`
```env
VITE_BACKEND_URL=https://your-actual-render-url.onrender.com
```

> [!WARNING]
> Replace `your-actual-render-url.onrender.com` with your real Render deployment URL.

---

### Step 1.5 — Build the frontend production bundle

```bash
cd frontend
pnpm run build
# Creates frontend/dist/
```

---

### Step 1.6 — Add Android platform

```bash
npx cap add android
# Creates frontend/android/ — a full Android Studio Gradle project
```

---

### Step 1.7 — Sync the build into Android

```bash
npx cap sync android
# Copies frontend/dist/ into the Android project
```

> [!NOTE]
> **Every time you change frontend code:** run `pnpm run build` then `npx cap sync android`.

---

### Step 1.8 — Open in Android Studio

```bash
npx cap open android
```

Android Studio opens. First time may take 5-10 minutes to index and download Gradle.

---

### Step 1.9 — Configure Android permissions

**File to edit:** `frontend/android/app/src/main/AndroidManifest.xml`

Add inside `<manifest>` tag (before `<application>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_CLIPBOARD" />
```

---

### Step 1.10 — Build the APK

In Android Studio:
```
Top menu → Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**APK output location:**
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Step 1.11 — Install APK on Android phone

**Method A — Via Android Studio (USB debugging):**
1. Enable USB Debugging: Settings → Developer Options → USB Debugging
2. Plug in phone → click ▶ Run in Android Studio

**Method B — Sideload (no USB debugging):**
1. Copy `app-debug.apk` to phone via WhatsApp / Google Drive / USB
2. Tap the APK file on phone
3. Allow "Install from unknown sources"
4. Done ✅

---

### Phase 1 Checklist

- [ ] Android Studio installed
- [ ] JDK 17 installed, `JAVA_HOME` environment variable set
- [ ] Capacitor packages installed (`pnpm add`)
- [ ] `capacitor.config.ts` created (`npx cap init`)
- [ ] `vite.config.js` updated with `base: './'`
- [ ] `axios.js` updated with production backend URL
- [ ] `useAuthStore.js` updated with production socket URL
- [ ] `.env.production` created with real Render URL
- [ ] `pnpm run build` succeeds — `dist/` created
- [ ] `npx cap add android` succeeds — `android/` folder created
- [ ] `npx cap sync android` succeeds
- [ ] `AndroidManifest.xml` updated with permissions
- [ ] APK built in Android Studio
- [ ] APK installed on phone — app opens correctly ✅

---
---

## Phase 2 — Cross-Device Clipboard Sync

### Overview

Copy text on your PC → instantly available on your Android phone's clipboard.
Copy anything on your phone → open SyncTalk → instantly available on your PC clipboard.

### How It Works

```
PC (Browser)                 Backend (Socket.io)          Android (Capacitor APK)
────────────                 ───────────────────          ──────────────────────

[Ctrl+C inside SyncTalk]
  │
  ▼
document "copy" event
  │
  ▼
useClipboardSync hook
emit "clipboardSync" ──────► relay to same-user
                             other sessions only
                             emit "clipboardIncoming" ──► receive event
                                                          Clipboard.write(text)
                                                          Android clipboard = text ✅
                                                          Toast: "📋 Clipboard synced"

                                                     [User copies anything on phone]
                                                          │
                                                     [Opens SyncTalk app]
                                                          │
                                                     appStateChange → active
                                                          │
                                                     Clipboard.read() → text
                                                          │
                                                     emit "clipboardSync" ──────►
                             relay to same-user ◄──
                             PC sessions
PC receives ◄───────────────
navigator.clipboard.writeText(text)
PC clipboard = text ✅
Toast: "📋 Clipboard synced from phone"
```

---

### Step 2.1 — Backend: Add clipboard socket events

**File to modify:** `backend/src/lib/socket.js`

**Change 1 — Update `userSocketMap` to support multiple sessions per user:**

```js
// Current (single socket per user):
if (userId) userSocketMap[userId] = socket.id;

// Updated (array of sockets per user):
if (userId) {
  if (!userSocketMap[userId]) userSocketMap[userId] = [];
  userSocketMap[userId].push(socket.id);
}
```

**Update the disconnect handler too:**
```js
socket.on("disconnect", () => {
  if (userId && userSocketMap[userId]) {
    userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
    if (userSocketMap[userId].length === 0) delete userSocketMap[userId];
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
});
```

**Update `getReceiverSocketId` helper** (used by message controller):
```js
// Returns first active socket for a user (for DM notifications)
export function getReceiverSocketId(userId) {
  const sockets = userSocketMap[userId];
  return sockets && sockets.length > 0 ? sockets[0] : null;
}
```

**Change 2 — Add clipboard relay inside `io.on("connection", ...)`:**

```js
// ── Cross-Device Clipboard Sync ─────────────────────────────────────────
socket.on("clipboardSync", ({ text, fromUserId }) => {
  // Security: only allow if the authenticated socket's userId matches
  if (!fromUserId || fromUserId !== userId || !text) return;

  const sessionSockets = userSocketMap[fromUserId] || [];

  // Relay ONLY to other sessions of the same user (not back to sender)
  sessionSockets.forEach((sid) => {
    if (sid !== socket.id) {
      io.to(sid).emit("clipboardIncoming", { text });
    }
  });
});
```

---

### Step 2.2 — Frontend: Create `useClipboardSync` hook

**New file:** `frontend/src/hooks/useClipboardSync.js`

```js
import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

// Detect if running inside Capacitor native Android/iOS app
const isCapacitor = () =>
  typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

export const useClipboardSync = (enabled = true) => {
  const { authUser, socket } = useAuthStore();
  const lastSyncedText = useRef("");

  useEffect(() => {
    if (!enabled || !authUser || !socket) return;

    // ── RECEIVE: incoming clipboard from other device ─────────────────────
    const handleIncoming = async ({ text }) => {
      if (!text || text === lastSyncedText.current) return;
      lastSyncedText.current = text;

      try {
        if (isCapacitor()) {
          const { Clipboard } = await import("@capacitor/clipboard");
          await Clipboard.write({ string: text });
        } else {
          await navigator.clipboard.writeText(text);
        }
        toast.success("📋 Clipboard synced!", {
          duration: 2500,
          style: { background: "#1e1b4b", color: "#c7d2fe", border: "1px solid #6366f1" },
        });
      } catch (err) {
        console.warn("Clipboard write failed:", err);
      }
    };

    socket.on("clipboardIncoming", handleIncoming);

    // ── SEND: push local clipboard to other device ────────────────────────
    let cleanupSend = () => {};

    if (isCapacitor()) {
      // Android: read clipboard when app comes to foreground
      let appListener = null;

      const setupAndroid = async () => {
        const { App } = await import("@capacitor/app");
        const { Clipboard } = await import("@capacitor/clipboard");

        appListener = await App.addListener("appStateChange", async ({ isActive }) => {
          if (!isActive) return;
          try {
            const result = await Clipboard.read();
            const text = result.value;
            if (!text || text === lastSyncedText.current) return;
            lastSyncedText.current = text;
            socket.emit("clipboardSync", { text, fromUserId: authUser._id });
          } catch (_) { /* silently ignore */ }
        });
      };

      setupAndroid();
      cleanupSend = () => { if (appListener) appListener.remove(); };

    } else {
      // Desktop: listen for copy events (Ctrl+C, right-click copy, etc.)
      const handleCopy = () => {
        setTimeout(async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (!text || text === lastSyncedText.current) return;
            lastSyncedText.current = text;
            socket.emit("clipboardSync", { text, fromUserId: authUser._id });
          } catch (_) { /* browser may deny without permission */ }
        }, 100);
      };

      document.addEventListener("copy", handleCopy);
      cleanupSend = () => document.removeEventListener("copy", handleCopy);
    }

    return () => {
      socket.off("clipboardIncoming", handleIncoming);
      cleanupSend();
    };
  }, [enabled, authUser, socket]);
};
```

---

### Step 2.3 — Frontend: Create `ClipboardSyncBanner` component

**New file:** `frontend/src/components/ClipboardSyncBanner.jsx`

```jsx
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Clipboard } from "lucide-react";

const ClipboardSyncBanner = () => {
  const { socket } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const show = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };

    socket.on("clipboardIncoming", show);
    return () => socket.off("clipboardIncoming", show);
  }, [socket]);

  if (!visible) return null;

  return (
    <div className="clipboard-sync-banner">
      <Clipboard className="size-4" />
      <span>Clipboard synced from other device</span>
    </div>
  );
};

export default ClipboardSyncBanner;
```

**CSS to add to `frontend/src/index.css`:**
```css
/* ── Clipboard Sync Banner ──────────────────────────────────────── */
.clipboard-sync-banner {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 27, 75, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #c7d2fe;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
  animation: banner-slide-in 0.2s ease both;
}

@keyframes banner-slide-in {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
```

---

### Step 2.4 — Wire everything up in `App.jsx`

**File to modify:** `frontend/src/App.jsx`

```jsx
// Add new imports:
import { useClipboardSync } from "./hooks/useClipboardSync";
import ClipboardSyncBanner from "./components/ClipboardSyncBanner";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useClipboardSync(!!authUser); // ← enable only when logged in

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ... loading state ...

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        {/* ... existing routes unchanged ... */}
      </Routes>
      <Toaster />
      <ClipboardSyncBanner />  {/* ← add this */}
    </div>
  );
};
```

---

### Step 2.5 — Rebuild and Resync for Android

After all Phase 2 code changes:

```bash
cd frontend
pnpm run build
npx cap sync android
```

Then in Android Studio:
```
Build → Build APK(s) → reinstall on phone
```

---

### Phase 2 Checklist

- [ ] `backend/src/lib/socket.js` updated — `userSocketMap` supports multiple sessions
- [ ] `backend/src/lib/socket.js` updated — `clipboardSync` / `clipboardIncoming` events added
- [ ] `getReceiverSocketId` helper updated for array-based map
- [ ] `frontend/src/hooks/useClipboardSync.js` created
- [ ] `frontend/src/components/ClipboardSyncBanner.jsx` created
- [ ] Banner CSS added to `index.css`
- [ ] `App.jsx` updated — hook + banner mounted
- [ ] `pnpm run build` → `npx cap sync android` → APK rebuilt
- [ ] APK reinstalled on phone
- [ ] **Test PC → Phone:** Copy text in SyncTalk on PC → appears on phone clipboard ✅
- [ ] **Test Phone → PC:** Copy text on phone → open SyncTalk → appears on PC clipboard ✅

---

## Known Gotchas & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Blank white screen in APK | `base` not set in vite config | Add `base: './'` to `vite.config.js` |
| APK can't reach backend | `localhost` used in production build | Set `VITE_BACKEND_URL` in `.env.production` |
| Clipboard read denied on desktop | HTTPS required for Clipboard API | Deploy app to HTTPS (Render) |
| Phone clipboard not auto-syncing | Android 10+ blocks background reads | Expected — user must open SyncTalk first |
| `npx cap sync` fails | No `dist/` folder | Run `pnpm run build` first |
| Android Studio can't find JDK | `JAVA_HOME` not set | Set: `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x` |
| Gradle sync fails in Android Studio | Old Android SDK build tools | SDK Manager → Install latest build tools |
| Socket relay not working | `userSocketMap` still single-value | Ensure map was updated to array-based in Step 2.1 |

---

## Complete File Change Summary

### Phase 1

| File | Type | Change |
|------|------|--------|
| `frontend/package.json` | Modified | Add Capacitor dependencies |
| `frontend/capacitor.config.ts` | **New** | Capacitor app configuration |
| `frontend/vite.config.js` | Modified | Add `base: './'` |
| `frontend/src/lib/axios.js` | Modified | Production URL via env var |
| `frontend/src/store/useAuthStore.js` | Modified | Production socket URL via env var |
| `frontend/.env.production` | **New** | `VITE_BACKEND_URL=<render-url>` |
| `frontend/android/` | **New directory** | Full Android Studio project |

### Phase 2

| File | Type | Change |
|------|------|--------|
| `backend/src/lib/socket.js` | Modified | Multi-session map + clipboard relay events |
| `frontend/src/hooks/useClipboardSync.js` | **New** | Clipboard sync hook (web + Capacitor) |
| `frontend/src/components/ClipboardSyncBanner.jsx` | **New** | Visual sync indicator banner |
| `frontend/src/index.css` | Modified | Banner CSS styles |
| `frontend/src/App.jsx` | Modified | Mount hook + banner |

---

## Estimated Time

| Phase | Task | Estimated Time |
|-------|------|---------------|
| Phase 1 | Android Studio + JDK install (first time) | 30–60 min |
| Phase 1 | Capacitor setup + code changes | 20 min |
| Phase 1 | First APK build + phone install | 15–20 min |
| Phase 2 | Backend socket changes | 15 min |
| Phase 2 | Frontend hook + banner component | 25 min |
| Phase 2 | Rebuild APK + test end-to-end | 30 min |
| **Total** | | **~2 – 2.5 hours** |
