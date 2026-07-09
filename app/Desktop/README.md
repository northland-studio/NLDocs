# NLDocs Desktop Application

Electron desktop wrapper for the NLDocs Vue 3 + Vite frontend. Packages the web build (`frontend/dist`) into a native desktop application for Windows, macOS, and Linux.

## Prerequisites

- Node.js 18+
- The NLDocs frontend at `../../frontend` (must be installable and buildable)

## Install

```bash
npm install
```

## Development Mode

Run the Electron app pointed at the live Vite dev server. The frontend dev server must be running first on port 5173.

```bash
# In one terminal, start the frontend dev server:
cd ../../frontend
npm run dev

# In another terminal, launch Electron:
cd app/Desktop
npm run dev
```

## Build

### Build the web bundle only

Compiles the Vue 3 frontend into `../../frontend/dist`.

```bash
npm run build:web
```

### Build platform installers

Each platform script first rebuilds the web bundle, then runs `electron-builder` for that target.

```bash
# Windows (NSIS installer)
npm run build:win

# macOS (DMG)
npm run build:mac

# Linux (AppImage)
npm run build:linux

# All platforms
npm run build:all
```

## Output

Build artifacts are written to the `dist/` directory inside `app/Desktop`. The directory contains the generated installer files (`.exe`, `.dmg`, `.AppImage`, etc., depending on the target platform).

## Notes

- The Electron main process loads `../../frontend/dist/index.html` in production mode. Always run `npm run build:web` before packaging.
- The application icon is referenced from `../../icon.png` (relative to the `app/Desktop` project root). Ensure this file exists before building.
- On non-macOS platforms the native menu bar is hidden; on macOS the standard system menu is retained.
