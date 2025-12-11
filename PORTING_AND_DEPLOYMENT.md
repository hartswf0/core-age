# COURAGE: Porting & Deployment Guide

## 1. Repository Strategy (.gitignore)
To ensure the repository remains lightweight (~5-10MB) for GitHub and quick cloning, we deliberately exclude large assets.

### What is Excluded (Git Ignored)
*   **Large Media**: `*.mp4`, `*.webm` (Tutorial videos are too large for git).
*   **3D Part Libraries**: `wag-viewer-prime-integration-*/` (The massive LDraw parts database is excluded).
*   **Raw Models**: `*.mpd` (Complex LEGO model files, except for specific examples).
*   **Large JSON**: `*-future-scenarios.json`, `parts-taxonomy.json` (Optimized subsets are used instead).

### What is Included
*   ✅ **Core Application**: All `.html`, `.js`, `.css` files.
*   ✅ **Documentation**: Markdown files (`TRAILS_AND_REFLECTIONS.md`, etc.).
*   ✅ **Manifests**: `file-manifest.json` (Essential for the Index hub).
*   ✅ **Visuals**: Favicons and lightweight SVG assets.

> **Note**: If you clone this repo to a new machine, you may need to manually copy the large `wag-viewer` assets or video files if you intend to host the full media-rich experience locally.

---

## 2. Porting to a New Environment

### Requirements
The system is built as a **Static Web Application** (HTML/JS/CSS), but it **requires a Local HTTP Server** to function correctly.
*   **Why?** Browser security (CORS) blocks loading local JSON/Text files via `file://` protocol.
*   **Solution**: You must serve the folder via `http://localhost`.

### Quick Start (Local)
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/hartswf0/core-age.git
    cd core-age
    ```

2.  **Run a Server**:
    You can use any simple HTTP server.
    
    *   **Option A: Python (Built-in)**
        ```bash
        # Run inside the folder
        python3 -m http.server 8000
        # Open http://localhost:8000
        ```
    
    *   **Option B: Node.js (Recommended for Tools)**
        If you are using the GAR/ONYX studio tools, use the included server script:
        ```bash
        node gar-onyx-server.js
        # Open http://localhost:3399
        ```

3.  **Access**:
    Navigate to `index.html` (the Code Hub) to access all apps.

---

## 3. Web Deployment (GitHub Pages / Vercel)
This system is ready for **GitHub Pages**.

1.  **Push to GitHub**: Ensure your `main` branch is up to date (as you have done).
2.  **Settings**: Go to Repo Settings -> Pages -> Deploy from Branch: `main`.
3.  **Limitations**:
    *   Dynamic file scanning (which updates `index.html` automatically locally) **will not work** on static hosting because it relies on the local Node server.
    *   However, the static `file-manifest.json` will serve as a snapshot. You must run `node generate_manifest.js` (if available) or `gar-onyx-server.js` locally to update this JSON before pushing.

## 4. Troubleshooting
*   **"CORS Error"**: You are likely trying to open `.html` files directly by double-clicking. Use a server (Step 2).
*   **Missing Icons/Parts**: You might be missing the excluded `wag-viewer` assets. Check `.gitignore` to see what was left behind.
