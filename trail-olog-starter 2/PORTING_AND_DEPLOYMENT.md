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

## 3. Web Deployment (GitHub Pages via Actions)

This system uses a **Custom GitHub Action** for robust, transparent deployments.

### Initial Setup (One-Time)
1.  Go to **Repo Settings → Pages** (`/settings/pages`).
2.  Under **"Build and deployment" → "Source"**, change from "Deploy from a branch" to **"GitHub Actions"**.
3.  Done! The workflow file (`.github/workflows/static.yml`) handles the rest.

### How the Workflow Works
The `static.yml` file:
1.  **Triggers** on every push to `main`.
2.  **Creates a clean `_deploy` folder** containing only web-ready files (`.html`, `.js`, `.css`, `.json`, `.md`, images).
3.  **Uploads** this filtered folder as an artifact.
4.  **Deploys** it to GitHub Pages.

This avoids errors from uploading large/hidden files (like `.git` or video assets).

### Monitoring Deployments
*   Go to the **Actions** tab (`/actions`) to see deployment status.
*   Green ✅ = Success. Red ❌ = Failed (click to see logs).

### Troubleshooting
| Issue | Solution |
|-------|----------|
| **"Nothing to commit"** | Your files are already synced. This is fine. |
| **404 on a specific file** | Check casing (GitHub is case-sensitive). Wait 5 mins for cache. |
| **Workflow fails (Artifact too large)** | The `static.yml` should be filtering. Check that it's updated. |
| **"Last deployed X weeks ago"** | Your Source is set to "Branch", not "GitHub Actions". Fix in Settings. |

## 4. The `sync.sh` Command
Run this from your repo root to push changes:
```bash
./sync.sh "Your commit message"
```
This script:
1.  Regenerates `file-manifest.json` (so the Index is up to date).
2.  Adds, commits, and pushes all changes.
3.  Triggers the deployment action on GitHub.

## 5. Files Explained
| File | Purpose |
|------|---------|
| `.github/workflows/static.yml` | Deployment automation script |
| `.nojekyll` | Disables Jekyll (legacy fix, still useful) |
| `sync.sh` | One-command sync tool |
| `generate_manifest.js` | Scans repo and builds `file-manifest.json` |
| `.gitignore` | Excludes large media/parts libraries |
