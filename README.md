# CORE‑AGE

**CORE‑AGE** (Core‑Age Rebranding & Exploration) is a web‑based, LEGO‑style code hub that blends digital‑humanities scholarship, dynamic UI navigation, and AI‑ready architecture.  It showcases the **WAG** (Words Assemble Geometry/Grids/Generations) paradigm, where textual concepts become interchangeable “bricks” that can be previewed, filtered, and remixed.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Folder Overview](#folder-overview)
- [Development & Deployment](#development--deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Full rebranding** – All references to *COURAGE NEXUS* replaced with **CORE‑AGE**; new SVG favicon `core-age-favicon.svg`.
- **WAG Grid UI** – 9×9 interactive grid that displays HTML “bricks” with theme‑based colors and hover previews.
- **Etymology page** – `etymology.html` narrates the PIE root *kerd‑* (heart) and the project’s naming story.
- **GitHub‑Pages ready** – All file paths are relative (`./`) for seamless static‑site hosting.
- **Metadata manifest** – `file-manifest.json` stores file‑type, size, and thematic tags for fast lookup.
- **AI‑friendly** – Manifest + theme map can be queried by LLMs for retrieval‑augmented generation (RAG) and code synthesis.
- **Responsive design** – Works on desktop and mobile; includes drag‑to‑resize panels.

---

## Quick Start

```bash
# Clone the repo (or navigate to the existing folder)
cd /Users/gaia/COURAGE

# Serve locally (Python 3 built‑in HTTP server)
python3 -m http.server 8000
```

Open your browser at `http://localhost:8000` and explore:
- **Home** – `index.html` shows the grid UI.
- **Etymology** – `etymology.html` explains the CORE‑AGE name.
- **WAG Studios** – Various `wag‑*.html` files demonstrate the WAG concept.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **WAG** | *Words Assemble Geometry/Grids/Generations* – a grammar that treats words, code snippets, and UI bricks as interchangeable building blocks. |
| **Brick** | Any HTML file in the repo; metadata is auto‑generated in `file-manifest.json`. |
| **Theme Colors** | `themeColors` map assigns a CSS color to each semantic tag (e.g., `inception`, `wag‑frank`). |
| **Icon Map** | `iconMap` provides emoji‑style icons for common extensions. |
| **Bus Protocol** | A lightweight broadcast channel used by the UI to propagate state changes (filtering, resizing, preview). |

---

## Folder Overview

```
COURAGE/                # Repository root (now CORE‑AGE)
├─ index.html           # Main UI with grid, filters, preview overlay
├─ core-age-favicon.svg# New SVG favicon
├─ etymology.html      # Etymology narrative for the project name
├─ file-manifest.json   # Auto‑generated metadata for all files
├─ wag‑*.html           # Example WAG‑based studios & demos
├─ *.md                 # Documentation (this README, walkthrough, etc.)
└─ assets/              # Optional images, fonts, etc.
```

---

## Development & Deployment

1. **Local Development** – Edit any HTML/JS/CSS file; the changes are reflected instantly on refresh.
2. **Testing** – Use the built‑in server (`python3 -m http.server`) or any static‑site host.
3. **GitHub Pages** – Push the repository to GitHub and enable *Pages* on the `main` branch. Because all URLs are relative, the site works without additional configuration.
4. **Future Extensions** – The manifest makes it easy to plug in LLM‑backed code generation or diffusion‑model‑driven theme suggestions.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome‑brick`).
3. Make your changes, ensuring that any new HTML files are added to `file-manifest.json` (run the existing `loadManifest` script or update manually).
4. Run the local server and verify that the UI displays the new brick correctly.
5. Submit a Pull Request with a clear description of the addition.

---

## License

This project is released under the **MIT License** – feel free to use, modify, and distribute it.

---

*Enjoy building with CORE‑AGE – where language, code, and visual imagination converge!*
