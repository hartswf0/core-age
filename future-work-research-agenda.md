# COURAGE Future Work: Research Implementation Agenda

## Purpose

Transform the *aspirational* academic connections in the original report into *actual* implementations. Each section provides:
1. **The Gap**: What's missing from current COURAGE
2. **The Implementation Prompt**: Concrete system design
3. **Critical Theory Connection**: Deeper theoretical grounding

---

## 1. Spatial Hypertext (Shipman & Marshall)

### The Gap

COURAGE uses a **fixed 9×9 grid**. True spatial hypertext (VKB/VIKI) supports:
- Implicit structure from spatial proximity
- User-created piles, lists, composites
- No predetermined schema—structure emerges from arrangement

### Implementation Prompt

> **SPATIAL-LEGOS**: Extend the LEGOS grid to support *freeform spatial placement* with emergent structure detection.
>
> **Requirements:**
> 1. Remove the 9×9 constraint—allow arbitrary (x,y) placement on a continuous canvas
> 2. Implement **clustering detection** that recognizes when entities form:
>    - Piles (overlapping items → implicit category)
>    - Lists (vertically aligned items → sequence)
>    - Composites (containment → part-of relation)
> 3. Add **spatial parsing** that runs continuously, updating a side-panel showing detected structures
> 4. Support **zooming** to allow both macro (overview) and micro (detail) views
> 5. Persist spatial arrangement as the primary data—ontology types are derived, not specified
>
> **Key Insight**: Structure is *discovered*, not *declared*. The user thinks spatially; the system infers semantically.

### Critical Theory Connection

**Pierre Bourdieu's "Habitus"**: Spatial arrangement reflects internalized cultural schemas. The way a user arranges narrative elements reveals their embodied understanding of story structure—not through explicit declaration, but through habitual practice.

**Design Implication**: Track *how* users arrange elements over time to understand their implicit narrative models.

---

## 2. Instrumental Interaction (Beaudouin-Lafon)

### The Gap

COURAGE uses standard HTML buttons and menus. True instrumental interaction requires:
- **Reification**: Commands become manipulable objects
- **Polymorphism**: Same instrument works on multiple object types
- **Reuse**: Output of one action becomes input to another

### Implementation Prompt

> **INSTRUMENT-WAG**: Redesign the WAG interface using reified instruments.
>
> **Requirements:**
> 1. **Reification**: Create draggable "instrument objects":
>    - `MagneticGrid` (snap objects to grid when dragged near)
>    - `RelationWand` (draw between two entities to create morphism)
>    - `TypeLens` (hover over entity → reveals its GAR visual origin)
>    - `ClipboardBuffer` (persistent object that stores copied entities)
> 2. **Polymorphism**: The `RelationWand` should work on:
>    - Two ONYX entities → creates narrative relation
>    - Two GAR segments → creates visual adjacency
>    - One ONYX + one GAR → creates cross-domain mapping
> 3. **Reuse**: Instrument outputs become inputs:
>    - `RelationWand` output (a morphism) can be dragged to `ClipboardBuffer`
>    - `TypeLens` output (type info) can be dropped on another entity to copy type
> 4. **Instrument Persistence**: Instruments stay on screen until dismissed—they're not menu commands
>
> **Key Insight**: Instruments are *citizens* of the workspace, not hidden in menus. They occupy the same space as content.

### Critical Theory Connection

**Heidegger's Tool Analysis**: When interaction is seamless (ready-to-hand), the tool disappears. But reification makes tools *visible objects*—they become present-at-hand. This tension is productive: by making instruments explicit, we invite reflection on *how* we manipulate narrative.

**Bernard Stiegler's "Technics"**: Tools externalize memory and cognition. Reified instruments make this externalization visible, offering a window into how we think-through-tools.

---

## 3. Visual Narrative Grammar (Cohn)

### The Gap

GAR does K-means clustering on color/position. True VNG parsing recognizes:
- Narrative phases: Establisher → Initial → Peak → Release
- Hierarchical structure (panels within panels)
- Boundary types (action-to-action, subject-to-subject, scene-to-scene)

### Implementation Prompt

> **VNG-GAR**: Extend GAR to parse visual sequences using Cohn's Visual Narrative Grammar.
>
> **Requirements:**
> 1. Accept **image sequences** (not just single images)—e.g., comic panels, storyboard frames
> 2. For each frame, compute:
>    - `tension_score` (based on composition, color contrast, action lines)
>    - `action_density` (number of moving elements, blur detection)
>    - `scene_context` (background stability across frames)
> 3. Apply **VNG phase detection**:
>    ```
>    if tension_score < 0.3 → Establisher (E)
>    if action_density spikes → Initial (I)
>    if tension_score peaks → Peak (P)
>    if tension_score drops after peak → Release (R)
>    ```
> 4. Output a **parse tree** showing hierarchical grouping:
>    ```
>    Narrative Arc
>    ├── Scene 1 [E, I, I, P, R]
>    └── Scene 2 [E, I, P, P, R]
>    ```
> 5. Validate against human annotation using ERP signatures (N400 for semantic, P600 for syntactic violations)
>
> **Key Insight**: Images in sequence have *grammar*. GAR currently treats each image independently—VNG adds temporal/sequential parsing.

### Critical Theory Connection

**Gérard Genette's Narratology**: Distinguish *fabula* (what happened) from *syuzhet* (how it's told). VNG parses the syuzhet—the *presentation* of events. This allows analysis of *how* visual media manipulates narrative disclosure.

**Walter Benjamin's "Aura"**: Mechanical reproduction (photography, film) strips the aura from art. But VNG reveals that *even mechanical images* have grammar—a structured way of making meaning that transcends the individual frame.

---

## 4. Event Calculus (Kowalski & Sergot)

### The Gap

ONYX stores spatial relations on a 9×9 grid. True Event Calculus supports:
- Fluents (time-varying properties)
- Events that initiate/terminate fluents
- Temporal reasoning (what holds at time T?)

### Implementation Prompt

> **TEMPORAL-ONYX**: Extend ONYX with Event Calculus for temporal narrative reasoning.
>
> **Requirements:**
> 1. Add **Fluents** to entity properties:
>    ```javascript
>    entity.fluents = {
>      location: { value: 'forest', since: T0 },
>      alive: { value: true, since: T0 },
>      hasArtifact: { value: false, since: T0 }
>    };
>    ```
> 2. Define **Events** that initiate/terminate fluents:
>    ```javascript
>    event('Move', {
>      initiates: ['location'],
>      terminates: [],
>      preconditions: entity => entity.fluents.alive.value
>    });
>    event('Death', {
>      terminates: ['alive', 'location'],
>      preconditions: entity => entity.fluents.alive.value
>    });
>    ```
> 3. Implement **HoldsAt** query:
>    ```javascript
>    holdsAt(entity, 'location', T) // Returns fluent value at time T
>    ```
> 4. Support **Abduction**: Given final state, infer missing events
>    ```javascript
>    // If Hero at Castle at T5, but was at Forest at T0
>    // Abduce: Move(Hero, Forest→Castle) occurred between T0 and T5
>    ```
> 5. Add **Timeline View** showing fluent evolution across narrative
>
> **Key Insight**: Narrative is *temporal*. Current ONYX is a snapshot; Event Calculus adds *history* and *causation*.

### Critical Theory Connection

**Paul Ricœur's "Time and Narrative"**: Narrative temporality differs from clock time. The threefold mimesis (prefiguration → configuration → refiguration) maps to Event Calculus: preconditions are prefiguration, event execution is configuration, fluent updates are refiguration.

**Hayden White's "Metahistory"**: Historical narratives impose *emplotment* on events. Event Calculus makes emplotment explicit—we can see which events were chosen to initiate/terminate which fluents, revealing the narrative's ideological structure.

---

## 5. Spatial Parsing (Lakin)

### The Gap

COURAGE has a fixed grid. True spatial parsing uses Picture Layout Grammars to:
- Recognize visual phrases from primitive arrangements
- Build derivation trees from spatial composition
- Support user-defined grammar rules

### Implementation Prompt

> **GRAMMAR-LEGOS**: Implement Picture Layout Grammar (PLG) parsing for LEGOS arrangements.
>
> **Requirements:**
> 1. Define **Terminals**: The 8 ONYX types (Entity, Goal, Obstacle, etc.)
> 2. Define **Spatial Operators**:
>    ```
>    ABOVE(A, B)      // A is in row above B
>    LEFTOF(A, B)     // A is in column left of B
>    CONTAINS(A, B)   // A occupies cells surrounding B
>    ALIGNED(A, B)    // A and B share row or column
>    ```
> 3. Define **Production Rules**:
>    ```
>    Conflict → ALIGNED(Goal, Obstacle)
>    Journey → Entity ABOVE Location
>    Hierarchy → Entity CONTAINS [Entity+]
>    Arc → Journey, Conflict, Shift
>    ```
> 4. Implement **Parser** that:
>    - Scans current grid arrangement
>    - Attempts to match production rules
>    - Builds derivation tree
>    - Reports recognized narrative structures
> 5. Allow **User-Defined Rules**: Users can add new productions for their narrative domain
>
> **Key Insight**: Spatial arrangement *is* syntax. The grid is a 2D sentence; the parser reveals its grammatical structure.

### Critical Theory Connection

**Wittgenstein's "Language Games"**: Meaning arises from use within a form of life. Spatial grammars are *literally* language games—rules for how to combine visual tokens to produce meaning. Users can define their own grammars, creating domain-specific "languages."

**Derrida's "différance"**: Meaning in a grammar is *differential*—each symbol means what it does because of its difference from others. Spatial parsing makes this explicit: Entity means "actor" partly because it's *not* Obstacle or Goal. The grid is a field of differences.

---

## 6. L-Systems Ontology (Lindenmayer)

### The Gap

The `l-system-ontology-weaver.html` exists but doesn't fully implement L-System generative logic for knowledge structures.

### Implementation Prompt

> **L-ONYX**: Use L-Systems to *grow* narrative ontologies from axioms.
>
> **Requirements:**
> 1. Define **Ontology Axiom**: A minimal seed narrative
>    ```
>    Axiom: E → G   // Entity wants Goal
>    ```
> 2. Define **Production Rules**:
>    ```
>    E → E + O    // Entity facing Obstacle
>    G → G * L    // Goal in Location
>    O → O → E    // Obstacle spawns new Entity (antagonist)
>    ```
> 3. **Iterate**: Apply rules N times to grow complexity
>    ```
>    Generation 0: E → G
>    Generation 1: E + O → G * L
>    Generation 2: (E + O) + O → (G * L) * L
>    ```
> 4. **Visualize** on LEGOS grid: Each generation expands spatially outward
> 5. **Constraint**: Growth respects 9×9 boundary; rules that would exceed are pruned
>
> **Key Insight**: Narrative complexity *grows* from simple axioms. This models how stories elaborate from core conflicts.

### Critical Theory Connection

**Deleuze & Guattari's "Rhizome"**: L-Systems are *rhizomatic*—they grow without center or hierarchy. Unlike tree-structured ontologies, L-ONYX narratives can branch, loop, and reconnect. The axiom doesn't determine the final form; it *enables* it.

**Donna Haraway's "Situated Knowledges"**: L-System growth depends on *where* you start. Different axioms produce different ontologies. This models how knowledge is always partial, always situated.

---

## Critical Theory Master Connections

| COURAGE System | Academic Framework | Critical Theory |
|----------------|-------------------|-----------------|
| LEGOS grid | Spatial Hypertext | Bourdieu (Habitus), Wittgenstein (Language Games) |
| WAG interaction | Instrumental Interaction | Heidegger (Tool Analysis), Stiegler (Technics) |
| GAR segmentation | Visual Narrative Grammar | Benjamin (Aura), Genette (Narratology) |
| ONYX ontology | Event Calculus | Ricœur (Time/Narrative), White (Metahistory) |
| INCEPTION meta | Second-Order Cybernetics | Haraway (Cyborg), Latour (ANT) |

---

## The Meta-Prompt

For an AI assistant to help implement these:

```markdown
You are building COURAGE-v2, an experimental creative computing system.

The current system has:
- GAR: K-means visual segmentation (20×20 grid)
- ONYX: 8-type narrative ontology (9×9 grid)
- LEGOS: Shared spatial grid infrastructure
- WAG: Text-to-3D coordinate mapping
- INCEPTION: Self-modifying code harness

Your task is to extend COURAGE with genuine implementations of:

1. **Spatial Hypertext** (Shipman/Marshall): Replace fixed grid with freeform canvas + emergent structure detection
2. **Instrumental Interaction** (Beaudouin-Lafon): Reify commands as draggable instrument objects
3. **Visual Narrative Grammar** (Cohn): Parse image sequences for E-I-P-R narrative phases
4. **Event Calculus** (Kowalski): Add fluents and temporal reasoning to ONYX
5. **Spatial Parsing** (Lakin): Implement Picture Layout Grammar for grid arrangements

For each extension:
- Cite the original academic paper
- Show how it modifies existing COURAGE components
- Provide working JavaScript implementation
- Include critical theory implications (Bourdieu, Heidegger, Genette, Ricœur, Derrida)

The goal is genuine scholarly depth, not cosmetic references.
```

---

## Recommended Reading Order

1. **Start Here**: Shipman & Marshall (1999) "Spatial Hypertext" — foundational for understanding non-linear knowledge structures
2. **Then**: Cohn (2013) "Visual Language of Comics" — VNG is the gateway to visual narratology
3. **Deep Dive**: Ricœur (1984) "Time and Narrative Vol. 1" — essential for temporal logic grounding
4. **Critical**: Stiegler (1998) "Technics and Time" — links tool design to philosophy of technology
5. **Meta**: Haraway (1991) "Cyborg Manifesto" — frames the entire project as human-machine becoming

---

*Document created: 2025-12-11*
*For: COURAGE Research Agenda*
