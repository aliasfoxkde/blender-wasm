# Phase 6: Login & Identity

**Status**: Completed

## Objectives

- [x] Guest mode (default)
- [x] Local Profile creation and management
- [x] Cloud Account support (placeholder for future)
- [x] Profile switching
- [x] Auth dialog UI
- [x] Profile menu

## Auth Modes

| Mode | Description | Features |
|------|-------------|----------|
| Guest | No account needed | Projects stored locally in memory/IndexedDB |
| Local | Device profile | Full storage, settings, offline-first |
| Cloud | Synced profile | Cloud sync, cross-device (future) |

## Components Implemented

### Auth Components

| Component | Purpose |
|-----------|---------|
| AuthManager | Central auth state management |
| AuthDialog | Modal for auth flow |
| ProfileMenu | Header dropdown for profile access |

### Auth Flow

```
Guest Mode → Continue → Dashboard (no persistence)
Guest Mode → Create Profile → Local Profile → Full features
Guest Mode → Switch Profile → Select existing or create new
Local Profile → Enable Cloud Sync → Cloud Account (future)
Cloud Account → Sign Out → Guest Mode
```

## Files Created

```
src/auth/
├── AuthManager.ts      # Auth state and operations
└── index.ts

src/components/
├── AuthDialog.tsx     # Auth modal UI
├── ProfileMenu.tsx    # Header profile dropdown
└── SettingsPanel.tsx  # Settings (Phase 5)
```

## Next Steps

Proceed to Phase 7: Plugin Platform
