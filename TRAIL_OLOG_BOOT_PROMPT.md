# TRAIL OLOG: LLM Boot Prompt

> **Purpose**: Give this entire document to any LLM to enable it to build, customize, or extend a Trail Olog visualization for any repository.

---

## CONTEXT

You are working with the **Trail Olog** system—a visual narrative map that displays a project's evolution as interconnected zones on a spatial canvas. Each zone represents a cluster of work (files, decisions, artifacts), and connections show dependencies and flow.

The system consists of:
1. **`courage-trail-olog.html`** — Self-contained visualization app (HTML/CSS/JS)
2. **`courage-trail-data.json`** — Project data (zones, connections, timeline)
3. **Supporting scripts** — Deployment automation, manifest generation

---

## YOUR TASK

You have been given a repository with files already copied. Your job is to:

1. **Analyze the files** as evidence of the project's structure
2. **Generate or update `courage-trail-data.json`** to map the project
3. **Deploy** via the provided GitHub Action workflow
4. **Customize** the visualization as needed

---

## FILE EVIDENCE FORMAT

When analyzing a repository, categorize files into **zones**. Each zone should represent a logical cluster:

```
ZONE TEMPLATE:
{
  "id": "kebab-case-id",
  "label": "Human Readable Name",
  "col": 0-9,           // X position on 10-column grid
  "row": 0-7,           // Y position on 8-row grid  
  "color": "#hex",      // Zone color
  "level": 0-4,         // Layer depth (0=foreground, 4=background)
  "intent": "One sentence describing this zone's purpose",
  "artifacts": [
    { "text": "filename.ext", "type": "artifact", "size_human": "10 KB" }
  ],
  "decisions": ["Key decision made in this zone"],
  "obstacles": ["Challenge faced"]
}
```

---

## COMMANDS

### Generate Data
Scan the repository and output a `courage-trail-data.json`:

```bash
# List all trackable files
find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.py" \) | head -100

# Use this output to populate zones
```

### Local Development
```bash
python3 -m http.server 8000
# Open http://localhost:8000/courage-trail-olog.html
```

### Deploy to GitHub Pages
```bash
./sync.sh "your commit message"
```

### Regenerate File Manifest (for Index)
```bash
node generate_manifest.js
```

---

## DATA SCHEMA

### Full `courage-trail-data.json` Structure:

```json
{
  "zones": [
    {
      "id": "core-app",
      "label": "Core Application",
      "col": 5,
      "row": 2,
      "color": "#4ade80",
      "level": 0,
      "intent": "Main application logic and entry points",
      "artifacts": [
        { "text": "index.html", "type": "artifact", "size_human": "15 KB" },
        { "text": "app.js", "type": "artifact", "size_human": "8 KB" }
      ],
      "decisions": ["Chose vanilla JS over framework for portability"],
      "obstacles": ["CORS issues with local development"]
    }
  ],
  "connections": [
    { "from": "core-app", "to": "data-layer" }
  ],
  "timeline": [
    {
      "date": "2025-01-15",
      "label": "Project Start",
      "active": ["core-app"]
    },
    {
      "date": "2025-02-01",
      "label": "Added Data Layer",
      "active": ["core-app", "data-layer"]
    }
  ]
}
```

---

## ZONE PLACEMENT STRATEGY

Use this grid philosophy:
- **Top rows (0-2)**: High-level, user-facing components
- **Middle rows (3-5)**: Core logic and data processing
- **Bottom rows (6-7)**: Infrastructure, tooling, documentation
- **Left columns (0-3)**: Earlier in pipeline / inputs
- **Right columns (6-9)**: Later in pipeline / outputs
- **Center (4-5)**: Core/central components

### Color Palette Suggestions:
| Purpose | Color |
|---------|-------|
| UI/Frontend | `#4ade80` (green) |
| Data/Backend | `#3b82f6` (blue) |
| Documentation | `#f59e0b` (amber) |
| Tools/Scripts | `#8b5cf6` (purple) |
| Tests/QA | `#ef4444` (red) |
| Infrastructure | `#06b6d4` (cyan) |

---

## DEPLOYMENT FILES

Ensure these files exist in the repo root:

### `.nojekyll`
```
(empty file - disables Jekyll build)
```

### `.github/workflows/static.yml`
```yaml
name: Deploy static content to Pages
on:
  push:
    branches: ["main"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - name: Prepare
        run: |
          mkdir -p _deploy
          find . -maxdepth 1 -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.md" -o -name "*.svg" -o -name "*.png" -o -name "*.jpg" -o -name "*.ico" \) -exec cp {} _deploy/ \;
          touch _deploy/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '_deploy'
      - uses: actions/deploy-pages@v4
```

### `sync.sh`
```bash
#!/bin/bash
MSG="$1"
if [ -z "$MSG" ]; then
    MSG="wip: auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
fi
echo "🚀 Syncing..."
if [ -f "generate_manifest.js" ]; then
    node generate_manifest.js
fi
git add .
git commit -m "$MSG"
git push origin main
echo "✅ Done."
```

---

## CUSTOMIZATION

### Change Theme Colors
Edit the `:root` block in `courage-trail-olog.html`:
```css
:root {
  --bg: #0d0d12;      /* Background */
  --accent: #f59e0b;  /* Highlight */
  --ink: #fafafa;     /* Text */
}
```

### Add New Zone
1. Add entry to `zones[]` in JSON
2. Assign unique `id`, `col`, `row`
3. Add any `connections`
4. Add to `timeline` if relevant
5. Reload page

---

## EXAMPLE PROMPT FOR NEW REPO

When given a new repository, use this format:

```
I have a repository with these files:
[paste file list]

Create a courage-trail-data.json that:
1. Groups files into 5-8 logical zones
2. Places zones on a 10x8 grid based on their relationships
3. Connects zones that depend on each other
4. Creates a timeline with 3-5 key milestones
5. Includes intent, decisions, and obstacles for each zone

Output valid JSON matching the schema above.
```

---

## EVIDENCE HEURISTICS

When categorizing files as evidence:

| File Pattern | Likely Zone |
|--------------|-------------|
| `*index*.html`, `*app*.js` | Core Application |
| `*data*.json`, `*config*` | Configuration/Data |
| `*.md`, `README*`, `GUIDE*` | Documentation |
| `*test*`, `*spec*` | Testing |
| `*build*`, `*deploy*`, `*.sh` | Infrastructure |
| `*component*`, `*ui*` | UI Components |
| `*api*`, `*server*` | Backend/API |
| `*util*`, `*helper*` | Utilities |

---

## VALIDATION

After generating data, verify:
1. All zone IDs are unique
2. All connection references exist
3. Timeline dates are chronological
4. Grid positions don't overlap excessively
5. JSON is valid (no trailing commas)

Test locally before deploying:
```bash
python3 -m http.server 8000
# Check browser console for errors
```

---

*End of Boot Prompt*
