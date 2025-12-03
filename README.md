# CORE-AGE: Words Become Worlds

**Operative Ekphrasis & Spatial Computing Research**

This repository contains the tools, artifacts, and research for the **CORE-AGE** project, focusing on "Words Become Worlds" (WAG) — a framework for translating natural language into 3D spatial geometries and narrative ontologies.

## 🚀 Quick Start

To run the tools and view the workshop presentation, you must start the local server (to handle CORS and data bridging).

1.  **Start the Server:**
    ```bash
    ./start_server.sh
    ```
    *Or manually:* `node gar-onyx-server.js`

2.  **Open the Dashboard:**
    Visit **[http://localhost:3399](http://localhost:3399)** in your browser.

## 🛠️ Key Tools

*   **[WAG Workshop](wag-workshop.html)**: The main presentation and interactive manifesto.
*   **[GAR-TAO Grid](gar-tao.html)**: The primary workspace for "Grid-Aware Recursion" and "Text-As-Ontology".
*   **[Onyx Studio](gar-onyx-studio.html)**: A narrative ontology editor and visualizer.
*   **[Core-Age Index](index.html)**: The central hub for all files and tools.

## 📂 Repository Structure

*   **GAR (Grid-Aware Recursion)**: Tools for spatial grid manipulation (`gar-*.html`).
*   **ONYX**: Narrative ontology and storytelling tools (`onyx-*.html`).
*   **WAG (Words Assemble Geometry)**: Experimental text-to-3D interfaces (`wag-*.html`).
*   **MENTO**: Cinematography and camera control tools (`mento-*.html`).
*   **LEGO**: LDraw-compatible building tools (`lego-*.html`).

## 🔧 Development

*   **Manifest**: The `file-manifest.json` tracks all files. Run `python3 update_manifest.py` to update it if you add new files.
*   **Server**: `gar-onyx-server.js` is a simple Node.js server that bridges data between tools and serves static files.

---
*Built with WAG Heuristics // 2025*
