# 🏗️ CORE-AGE

> **Where Etymology Meets Code, Narrative Becomes Architecture**

CORE-AGE is a living documentation hub that fuses **etymology**, **narrative frameworks**, and **LEGO-style modularity** into an interactive web ecosystem. It's simultaneously a knowledge garden, a semantic playground, and a proof-of-concept for treating code as composable "bricks."

**🌐 Live Site**: [hartswf0.github.io/core-age](https://hartswf0.github.io/core-age)

---

## ✨ What is CORE-AGE?

At its core (pun intended), CORE-AGE asks: **What if documentation could be _explored_ like physical space?**

- **Etymology as Foundation**: The name traces back to Proto-Indo-European *kerd-* (heart), grounding every design decision in linguistic roots
- **LEGOS Narrative Framework**: Structure stories using **L**ocation, **E**ntity, **G**oal, **O**bstacle, **S**hift components—applicable to both fiction and code architecture
- **WAG Paradigm**: "Words Assemble Geometry/Grids/Generations"—textual concepts become interchangeable UI bricks
- **Bidirectional Translation**: Convert between LEGOS narrative YAML and physical LDraw/MPD brick scenes

---

## 🎯 Key Features

### 📚 **Master Builder's Library**
Navigate 8 comprehensive guides through a LEGO-brick-styled interface:
- 🧱 **TIMBER & COURAGE** – Precision alignment tutorial
- 🩺 **AUTOPSY: LINE 22** – Forensic code pathology
- 🏛️ **DECISION MATRIX** – Architecture trade-off analysis
- 🧩 **DISENTANGLING** – Sub-part segmentation strategies
- ⚡ **LEGO QUICKSTART** – Swiss/Frank/Grace workflow
- 🏙️ **BRICK HAVEN CITY** – Complex scene architecture deep-dive
- 📖 **LEGOS-GPT MANUAL** – Complete narrative framework guide
- 🌉 **LEGOS ↔ LDraw BRIDGE** – Translation layer documentation

### 🔍 **Interactive Grid UI**
- 9×9 grid displaying HTML "bricks" with theme-based color coding
- Hover previews, full-screen mode, keyboard navigation
- Filter by file type, theme, or semantic tags
- Copy-to-clipboard file paths for instant access

### 🤖 **AI-Ready Architecture**
- `file-manifest.json` enables LLM-powered RAG (Retrieval-Augmented Generation)
- Color symbolism maps (Red=Hacker, Green=Designer, Blue=Programmer)
- Structured YAML for machine-parsable narratives
- Semantic annotations in LDraw MPD files

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/hartswf0/core-age.git
cd core-age

# Serve locally
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

**Key Entry Points:**
- **`/`** → Main grid hub
- **`/knowledge-hub.html`** → Master Builder's Library
- **`/etymology.html`** → Etymology narrative (the "why" behind CORE-AGE)
- **`/legos-gpt-manual.html`** → Learn the LEGOS framework
- **`/legos-to-ldraw-bridge.html`** → Translate narratives ↔ bricks

---

## 🧩 Core Concepts

### WAG (Words Assemble Geometry/Grids/Generations)
A **polysemic grammar** treating words, code, and UI elements as interchangeable building blocks:
- **Words** → Semantic anchors (like `kerd-` → `CORE-AGE`)
- **Geometry** → Spatial layouts (9×9 grid, coordinate systems)
- **Grids** → Structured organization (file manifest, theme maps)
- **Generations** → Iterative creation (version control, AI synthesis)

### LEGOS (Location • Entity • Goal • Obstacle • Shift)
A **narrative architecture framework** for structuring _anything_:

```yaml
scene: "The Developer's Journey"
location: "Code Repository"
entities:
  - id: developer
    type: Character
    color: "Blue"  # Programmer archetype
goals:
  - id: ship_v1
    owner: developer
    name: "Deploy CORE-AGE to GitHub Pages"
obstacles:
  - id: repo_bloat
    affects: ship_v1
    description: "971 MB directory blocking git push"
shifts:
  - id: gitignore_fix
    resolves: repo_bloat
    result: "28 KB lean repository ✅"
```

### LEGOS ↔ LDraw Bridge
**Bidirectional translation** between narrative and physical representations:

| LEGOS Component | LDraw Equivalent |
|----------------|------------------|
| `<Location>` | Environment geometry (baseplates, walls) |
| `<Entity>` | Minifigures (HEAD → TORSO → ARMS → HIPS → LEGS) |
| `<Goal>` | Body language & facing direction |
| `<Obstacle>` | Architecture barriers (stairs, doors, gaps) |
| `[Morphism]` | Spatial vectors (proximity = relationship) |
| `<Shift>` | 0 STEP command (scene breaks) |

**Example**: A "corporate uprising" narrative becomes a literal LEGO scene with:
- Grey plaza (oppressive system) vs. colorful minifigs (rebellion)
- Steps as "rising action" (literally ascending Y-coordinates)
- Closed door as "threshold moment" (rotated part blocking Z-axis)

---

## 📁 Project Structure

```
core-age/
├── 📄 README.md                     # You are here
├── 📄 index.html                     # Main grid hub
├── 📄 knowledge-hub.html             # Master Builder's Library
│
├── 🎨 LEGOS Framework/
│   ├── legos-gpt-manual.html        # Complete narrative framework guide
│   └── legos-to-ldraw-bridge.html   # YAML ↔ MPD translation manual
│
├── 📚 Tutorials/
│   ├── etymology.html                # PIE *kerd-* → CORE-AGE story
│   ├── TIMBER-tutorial.html          # Precision alignment loop
│   ├── LEGOS-tutorial-primal.html    # Swiss/Frank/Grace workflow
│   └── brick_haven_tutorial.html     # Complex LEGO city architecture
│
├── 🔬 Technical Docs/
│   ├── line-22-autopsy.html          # Pathology: "Line 22 Collapse"
│   ├── architecture-decision-matrix.html
│   └── disentangling-strategy.html
│
├── 🎨 Assets/
│   ├── core-age-favicon.svg          # Heart-shaped CORE icon
│   └── file-manifest.json            # Metadata for 82+ files
│
└── 🧪 Lab Tools/
    ├── lab-hub.html                  # Experimental diagnostic tools
    ├── temporal-mesh-lab.html
    └── skeleton-pathology-studio.html
```

---

## 🎨 Design Philosophy

### 1. **Etymology as Anchor**
Every name has a story. `CORE-AGE` derives from:
- **PIE *kerd-*** → Latin *cor* → English "heart"
- **AGE** → Era of transformation, coming-of-age
- **COURAGE** → Original project codename (anagram preserved)

### 2. **Color as Semantics**
- **Violet** → Narrative (LEGOS framework)
- **Pink** → Translation layer (bridge concepts)
- **Yellow** → Tutorials & guides
- **Red** → Technical reports & pathologies
- **Green** → Architecture & decisions
- **Cyan** → Experimental tools

### 3. **Modularity First**
Everything is a **brick**:
- HTML files are bricks
- LEGOS components are bricks
- LDraw parts are bricks
- Ideas are bricks

Bricks can be **composed**, **remixed**, and **reused**.

---

## 🤝 Contributing

We welcome contributions that expand the **knowledge garden**! Here's how:

### Adding Documentation
1. Create an HTML file following the dark LEGO manual aesthetic
2. Update `file-manifest.json` (or run `update_manifest.py`)
3. Add a card to `knowledge-hub.html` if appropriate
4. Use semantic color coding (see design philosophy)

### Adding LEGOS Models
1. Write a YAML file following the LEGOS framework
2. Optionally create a corresponding LDraw MPD file
3. Document the translation in `legos-to-ldraw-bridge.html`

### Improving UI
- Grid layout improvements
- New filter/search features
- Enhanced preview functionality
- Accessibility enhancements

**Process:**
```bash
git checkout -b feature/your-addition
# Make changes
git commit -m "Add: Brief description"
git push origin feature/your-addition
# Open Pull Request
```

---

## 🧠 Use Cases

### For **Storytellers**
- Structure complex narratives using LEGOS framework
- Generate 3D visualizations of story scenes
- Track character relationships through spatial proximity

### For **Developers**
- Document codebases as navigable brick systems
- Use color-coded themes for semantic organization
- Enable LLM-powered code exploration via manifest

### For **Educators**
- Teach narrative structure with tactile LEGO metaphors
- Bridge abstract concepts (goals, obstacles) to physical space
- Create interactive tutorials with embedded examples

### For **Researchers**
- Digital humanities projects with etymological grounding
- AI/LLM integration experiments (RAG, code synthesis)
- Multi-modal knowledge representation studies

---

## 📜 License

MIT License – feel free to **fork**, **remix**, and **rebuild**.

---

## 🙏 Acknowledgments

Built on the shoulders of:
- **LDraw.org** – Open-source LEGO CAD standards
- **LEGO** – For inspiring modular thinking
- **Proto-Indo-European linguists** – For *kerd-*
- **Every brick builder** who sees structure in chaos

---

## 🔗 Links

- **Live Site**: [hartswf0.github.io/core-age](https://hartswf0.github.io/core-age)
- **Repository**: [github.com/hartswf0/core-age](https://github.com/hartswf0/core-age)
- **Knowledge Hub**: [Master Builder's Library](https://hartswf0.github.io/core-age/knowledge-hub.html)
- **Etymology Page**: [The Story of CORE-AGE](https://hartswf0.github.io/core-age/etymology.html)

---

<div align="center">

**🏗️ Built with CORE • Powered by Etymology • Structured by LEGOS 🧱**

*"Where language becomes code, and code becomes bricks."*

</div>
