# COURAGE Trail Olog: Starter Kit

## Quick Start
To build a Trail Olog visualization for any project, you need **3 files**:

| File | Purpose |
|------|---------|
| `courage-trail-olog.html` | The visualization app (self-contained) |
| `courage-trail-data.json` | Your project's zone/connection data |
| `enrich_trail_data.py` | Script to generate/enrich the JSON |

---

## 1. Core Files

### `courage-trail-olog.html`
This is the **single-file web app**. No dependencies — it contains all HTML, CSS, and JavaScript inline.
- Copy it to your new repo's root.
- It fetches `courage-trail-data.json` on load.

### `courage-trail-data.json`
The data file describing your project's "zones" (clusters of work) and "connections" (relationships).

**Structure:**
```json
{
  "zones": [
    {
      "id": "zone-1",
      "label": "My Zone",
      "col": 5,          // Grid position (0-9)
      "row": 3,          // Grid position (0-7)
      "color": "#4ade80",
      "intent": "High-level purpose of this zone",
      "artifacts": [
        { "text": "file.html", "type": "artifact" },
        { "text": "readme.md", "type": "artifact" }
      ],
      "decisions": ["Key decision made here"],
      "obstacles": ["Challenge faced here"]
    }
  ],
  "connections": [
    { "from": "zone-1", "to": "zone-2" }
  ],
  "timeline": [
    { "date": "2025-01-15", "label": "Milestone", "active": ["zone-1"] }
  ]
}
```

### `enrich_trail_data.py` (Optional)
Python script to scan your repo and auto-generate/enrich the JSON.

---

## 2. Generating Data

### Option A: Manual Curation
Edit `courage-trail-data.json` by hand. Best for small projects.

### Option B: AI Prompt (Recommended)
Use this prompt to generate the JSON for a new project:

```
I need you to create a "Trail Olog" data file for my project.

The project is: [DESCRIBE YOUR PROJECT]

Analyze the structure and create a JSON file with:
1. **Zones**: Logical clusters of related work (e.g., "UI Components", "Backend API", "Documentation"). Each zone needs:
   - A unique `id` (kebab-case)
   - A short `label` (display name)
   - Grid position (`col`: 0-9, `row`: 0-7)
   - A `color` (hex)
   - An `intent` (1-sentence purpose)
   - `artifacts[]`: List of files belonging to this zone
   - `decisions[]`: Key decisions made
   - `obstacles[]`: Challenges faced

2. **Connections**: Which zones depend on or flow into each other.

3. **Timeline**: Key dates/milestones and which zones were active.

Format as JSON matching the courage-trail-data.json schema.
```

### Option C: Auto-Scan Script
```python
# enrich_trail_data.py
import os, json

def scan_for_files(root, extensions=['.html', '.js', '.py', '.md']):
    files = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if any(f.endswith(ext) for ext in extensions):
                files.append(os.path.relpath(os.path.join(dirpath, f), root))
    return files

# Run: python enrich_trail_data.py
if __name__ == "__main__":
    files = scan_for_files('.')
    print(json.dumps({"scanned_files": files}, indent=2))
    # You then manually assign these to zones
```

---

## 3. Deployment Package

### Files to Include
```
your-repo/
├── courage-trail-olog.html   # The app
├── courage-trail-data.json   # Your data
├── .nojekyll                 # Disables Jekyll (for GitHub Pages)
├── .github/
│   └── workflows/
│       └── static.yml        # GitHub Actions deployment
├── sync.sh                   # One-command push script
└── generate_manifest.js      # (Optional) For index.html file list
```

### GitHub Actions Workflow (`static.yml`)
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
          cp *.html *.json *.md *.svg *.css *.js _deploy/ 2>/dev/null || true
          touch _deploy/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '_deploy'
      - uses: actions/deploy-pages@v4
```

---

## 4. Full Download

To package everything for offline use:
```bash
cd your-repo
zip -r trail-olog-starter.zip \
  courage-trail-olog.html \
  courage-trail-data.json \
  .github/workflows/static.yml \
  .nojekyll \
  sync.sh \
  enrich_trail_data.py \
  PORTING_AND_DEPLOYMENT.md
```

---

## 5. Customization

### Changing Colors
Edit the `:root` CSS variables in `courage-trail-olog.html`:
```css
:root {
  --bg: #0d0d12;      /* Background */
  --accent: #f59e0b;  /* Highlight color */
  --ink: #fafafa;     /* Text color */
}
```

### Adding New Zones
1. Add entry to `zones[]` in JSON.
2. Assign a unique `id`, `col`, `row`.
3. Add connections to `connections[]`.
4. Reload the page.

---

*Generated for portable Trail Olog creation.*
