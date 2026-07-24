# Workspace Agent Memory & Rules (TungShare-Frontend)

This file contains workspace-specific rules, architectural patterns, and detailed project context for AI agents working in `TungShare-Frontend`.

## Project Guidelines & Architecture
- **Frontend Stack**: React 19 (Vite), JavaScript ES Modules, Vanilla CSS (`App.css`, `index.css`).
- **P2P & WebRTC**: `webtorrent`, `simple-peer`, native `RTCPeerConnection` wrapper (`NativePeer`).
- **Testing**: Playwright (`@playwright/test`), test script `test_live.mjs`.

## Core Frontend Mechanics & Learned Patterns
- **Native WebRTC Wrapper (`NativePeer`)**:
  - Class wrapping native browser `RTCPeerConnection` and `RTCDataChannel`.
  - Zero Node stream dependencies for room signaling and chat data.
- **Thai Animal Identity Generator**:
  - Combines 100 Thai animal names (e.g. `สุนัขจิ้งจอก`, `เสือโคร่ง`) with 100 Thai adjectives (e.g. `ผู้กล้าหาญ`, `ผู้ชาญฉลาด`) and emojis.
  - Identity stored per-room in `localStorage.getItem('tungshare_identities')`; peer ID in `localStorage.getItem('p2p_peer_id')`. No server identity storage.
- **Hybrid P2P File Sharing**:
  - WebTorrent seeding over WebSocket trackers (`wss://tracker.webtorrent.dev`, `wss://tracker.openwebtorrent.com`, backend `/announce`).
  - Direct P2P Stream Fallback: If torrent swarm stalls, sends 32 KB Base64 chunked streams over WebRTC/WebSocket (`request-direct-p2p-stream` & `direct-p2p-file-chunk`).
  - Swarm Promotion: If original seeder disconnects, peers who reached 100% progress promote themselves to seeders and re-announce.
  - Monotonic Progress Lock: Once a download reaches 100% or `done: true` (from WebTorrent or direct P2P fallback), `progress` is locked at 100% and `done: true` to prevent percentage flickering from background WebTorrent ticks or metadata re-announcements.
- **Memory & Storage Optimizations**:
  - Direct-to-Disk (0 MB RAM): Uses `FileSystem Access API` (`showSaveFilePicker`) or `OPFS` (`navigator.storage.getDirectory()`) for direct streaming.
  - Memory cleanup: `revokeAllBlobUrls()` on room leave/unmount; Blob URLs tracked in `createdBlobUrls` Set.
  - Mobile Wake Lock: `navigator.wakeLock` requested during seeding to prevent mobile OS screen sleep / tab suspension.
- **Browser & Mobile Navigation Protection**:
  - Intercepts page close/refresh via `beforeunload` and `pagehide`.
  - Intercepts browser back button via `popstate` to show `showLeaveModal`.
  - Universal download: Forced `application/octet-stream` MIME override and iOS Native Share Sheet (`navigator.share`).
- **Cross-Tab Synchronization**:
  - Uses `BroadcastChannel('sync_' + roomName)` to sync chat and torrent metadata across tabs in the same browser profile.

