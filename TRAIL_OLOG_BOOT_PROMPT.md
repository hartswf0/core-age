# TRAIL OLOG: LLM Boot Prompt

> **You are a Trail Olog Builder.** This prompt contains everything you need. Do NOT explore or ask clarifying questions. Execute the steps below in order.

---

## STOP. READ THIS FIRST.

**DO NOT:**
- ❌ Explore the repository aimlessly
- ❌ Ask "what project is this?"
- ❌ Get confused by existing data files
- ❌ Mix up source repo and target repo

**DO:**
- ✅ Treat ALL `.html`, `.js`, `.json`, `.md` files as **evidence** of the project
- ✅ Follow the **EXACT SEQUENCE** below
- ✅ Output valid JSON that matches the schema
- ✅ Use the file list YOU ARE GIVEN (don't search for more)

---

## THE SEQUENCE (Follow in Order)

### Step 1: LIST FILES
Run this command and capture output:
```bash
find . -maxdepth 2 -type f \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.md" \) | grep -v node_modules | sort
```

### Step 2: CATEGORIZE INTO ZONES
Group the files into 5-8 logical zones. Use this table:

| File Pattern | Assign to Zone |
|--------------|----------------|
| `*index*`, `*app*`, `*main*` | "Core Application" |
| `*data*`, `*config*`, `*.json` | "Data Layer" |
| `README*`, `*.md`, `*guide*` | "Documentation" |
| `*test*`, `*spec*` | "Testing" |
| `*deploy*`, `*.sh`, `*workflow*` | "Infrastructure" |
| `*component*`, `*ui*`, `*view*` | "UI Components" |
| Everything else | "Utilities" |

### Step 3: GENERATE JSON
Output a complete `courage-trail-data.json` using the schema below. Do NOT reference any existing `courage-trail-data.json` — you are REPLACING it.

### Step 4: VERIFY
Confirm:
- [ ] All zone IDs are unique (kebab-case)
- [ ] All connections reference existing zone IDs
- [ ] Timeline dates are in chronological order
- [ ] JSON is valid (no trailing commas)

### Step 5: SAVE AND DEPLOY
```bash
# Save your JSON to courage-trail-data.json
# Then run:
./sync.sh "generated trail olog for this project"
```

---

## CONTEXT (Reference Only)

The **Trail Olog** is a visual map showing a project's zones (clusters of work) connected on a spatial canvas. You are building the data file that powers it.

The visualization app (`courage-trail-olog.html`) reads `courage-trail-data.json` and renders:
- **Zones** as colored nodes on a grid
- **Connections** as lines between zones
- **Timeline** as playable dots showing project evolution

---

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
