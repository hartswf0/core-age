const fs = require('fs');
const path = require('path');

// Configuration
const MANIFEST_PATH = './file-manifest.json';
const GENOME_DATA_PATH = './courage-trail-data.json';
const OUTPUT_PATH = './courage-trail-data.json'; // Overwrite

// Ontology Definition
const DNA_BASE_PAIRS = {
    "L": "LEGO (Material Input)",
    "T": "TETRAD (Logic Process)",
    "W": "WAG (Language Synthesis)",
    "M": "MAP (Trail Awareness)",
    "G": "GUARDIAN (Ethical Assessment)"
};

// Narrative Archive (Hand-Crafted "Thick" Metadata)
const NARRATIVE_ARCHIVE = {
    'lego-inputs': {
        title: "THE INVARIANT SUBSTRATE",
        subtitle: "Establishing the Material Provenance of the System",
        genome: {
            "C (Creator)": "Watson Hartsoe",
            "T (Trail)": "Raw Material → Standardized Input",
            "A (Artifact)": "LDraw Library, Color Definitions, Primitive Geometry",
            "M (Metadata)": "Standardized .dat/.mpd parsing logs",
            "D (Decision)": "Sacrifice performance for 100% provenance tracking",
            "S (Tool)": "LEGO 3D Architect / WebGL Parser",
            "P (Pattern)": "Mesh-Per-Line Architecture",
            "I (Intent)": "To ensure every atom of the world is addressable"
        },
        readings: [
            "Hui, Yuk. 'On the Existence of Digital Objects'",
            "Fuller, Matthew. 'Media Ecologies: Materialist Energies in Art and Technoculture'"
        ],
        quote: "The brick is not just a shape; it is a unit of logic. By enforcing LDraw standards, we inherit 20 years of community geometry."
    },
    'tetrad-engine': {
        title: "THE LOGIC OF THE THOUSAND",
        subtitle: "High-Dimensional Sorting and Pattern Recognition",
        genome: {
            "C (Creator)": "Watson Hartsoe + GPT-4o",
            "T (Trail)": "Chaos → Organized Vector Space",
            "A (Artifact)": "K-Means Clusters, Tetrad Embeddings, GAR Segments",
            "M (Metadata)": "Cosine Similarity Matrices",
            "D (Decision)": "Use Python for heavy data-lifting, keep UI thin",
            "S (Tool)": "C.B. Box / GAR-01 / Disentangler",
            "P (Pattern)": "McLuhan's Tetrad as Vector Operation",
            "I (Intent)": "To allow the machine to 'dream' new combinations"
        },
        readings: [
            "McLuhan, Marshall. 'Laws of Media: The New Science'",
            "Pasquinelli, Matteo. 'The Eye of the Master'"
        ],
        quote: "We don't build the world; we organize the latent space where the world already exists."
    },
    'wag-peaks': {
        title: "OPERATIVE EKPHRASIS",
        subtitle: "Words Assemble Geometries (W.A.G.) Synthesis",
        genome: {
            "C (Creator)": "Watson Hartsoe + Collaborators",
            "T (Trail)": "Static Models → Narrative Cinema",
            "A (Artifact)": "ONYX Studio, Director-Mode Scripts, Voice Layers",
            "M (Metadata)": "Shot Lists, Camera Frustums, Light Maps",
            "D (Decision)": "LLM manages the 'void' (context), not the pixel",
            "S (Tool)": "WAG Workshop / Frank Terminal",
            "P (Pattern)": "Text-to-Scene Pipeline",
            "I (Intent)": "To enable 'writing' a movie in real-time 3D"
        },
        readings: [
            "Bajohr, Hannes. 'Algorithmic Empathy'",
            "Manovich, Lev. 'The Language of New Media'"
        ],
        quote: "The camera is no longer a physical object; it is a query against a database of potential views."
    },
    'trail-observatory': {
        title: "DEEP TIME OBSERVATORY",
        subtitle: "Meta-Cognition and Systemic Self-Awareness",
        genome: {
            "C (Creator)": "System (Self-Reporting)",
            "T (Trail)": "Action → Reflection → Olog",
            "A (Artifact)": "Genome Viewer, Trail Olog, Pattern Glossary",
            "M (Metadata)": "Git History, File Manifest, Ontology Graph",
            "D (Decision)": "The map must be part of the territory",
            "S (Tool)": "Trail Olog Sequencer 2.0",
            "P (Pattern)": "Thick Description / Geertzian Analysis",
            "I (Intent)": "To make the development process legible as an artwork"
        },
        readings: [
            "Geertz, Clifford. 'The Interpretation of Cultures'",
            "Bateson, Gregory. 'Steps to an Ecology of Mind'"
        ],
        quote: "A project that does not know its own history is doomed to just be 'content'. This genome is the memory of the system."
    }
};



// Specific Narrative Events (Date-Specific Overrides)
const SPECIFIC_NARRATIVES = {
    '2025-11-19': {
        title: "THE BONE WARS",
        subtitle: "Rigging the First Skeleton",
        genome: {
            "C (Creator)": "Watson Hartsoe",
            "T (Trail)": "Static Bricks → Moving Rigs",
            "A (Artifact)": "wag-gold-scene.json, multi-move-bones.html",
            "M (Metadata)": "Bone parenting logs, matrix transformations",
            "D (Decision)": "Use Three.js SkeletonHelper for visualization",
            "S (System)": "WAG Rigging System 1.0",
            "P (Pattern)": "Hierarchical Kinematics",
            "I (Intent)": "To make the bricks dance"
        },
        readings: ["Catmull, Ed. 'A System for Computer Generated Movies'"],
        quote: "The geometry is rigid, but the relationship is fluid."
    },
    '2025-11-22': {
        title: "AUTOPSY OF LINE 22",
        subtitle: "Debugging the Invisible Geometry",
        genome: {
            "C (Creator)": "Watson Hartsoe",
            "T (Trail)": "Bug → Deep Analysis → Tool",
            "A (Artifact)": "line-22-autopsy.html, skeleton-pathology-studio.html",
            "M (Metadata)": "Parsed LDraw line numbers, mesh indices",
            "D (Decision)": "Build a dedicated tool just to fix one bug",
            "S (System)": "Skeleton Pathology Studio",
            "P (Pattern)": "Tool-for-a-Bug (Micro-Tooling)",
            "I (Intent)": "To understand why the mesh was tearing"
        },
        readings: ["Debugger as Detective (General Concept)"],
        quote: "We found the ghost in the machine, and it was a floating decimal point."
    },
    '2025-11-24': {
        title: "INCEPTION ARCHITECTURE",
        subtitle: "The First Recursive Builder",
        genome: {
            "C (Creator)": "Watson Hartsoe",
            "T (Trail)": "Parser → Editor → World Builder",
            "A (Artifact)": "lego-3d-architect.html, inception-horseman.html",
            "M (Metadata)": "Recursion depth logs",
            "D (Decision)": "Allow the tool to edit its own source code (conceptually)",
            "S (System)": "Inception Editor",
            "P (Pattern)": "Recursive Tooling",
            "I (Intent)": "To build the tool that builds the world"
        },
        quote: "WE TURNED THE PARSER INSIDE OUT."
    },
    '2025-11-28': {
        title: "THE CONTEXT SINGULARITY",
        subtitle: "Massive Context Injection via Concat",
        genome: {
            "C (Creator)": "Watson Hartsoe + Script",
            "T (Trail)": "Fragmentation → Unification",
            "A (Artifact)": "concat.txt (Massive), burst_analysis.csv",
            "M (Metadata)": "File size limits, token counts",
            "D (Decision)": "Brute-force the context window with raw text",
            "S (System)": "Bash Concatenation Scripts",
            "P (Pattern)": "Context Stuffing",
            "I (Intent)": "To let the LLM see the 'Whole Elephant'"
        },
        quote: "If we feed it everything, maybe it will understand the shape of the void."
    },
    '2025-12-01': {
        title: "NEURAL EMBEDDINGS",
        subtitle: "Vectorizing the Library",
        genome: {
            "C (Creator)": "Watson Hartsoe",
            "T (Trail)": "Keywords → Semantic Vectors",
            "A (Artifact)": "embeddings.json, neuro-studio.html, onyx.html",
            "M (Metadata)": "Vector dimensions (1536), Cosine similarity",
            "D (Decision)": "Move from keyword search to semantic proximity",
            "S (System)": "Onyx Neuro-System",
            "P (Pattern)": "Latent Space Mapping",
            "I (Intent)": "To find connections we didn't know existed"
        },
        quote: "The library is no longer sorted by alphabet, but by meaning."
    },
    '2025-12-02': {
        title: "WAG WORKSHOP LAUNCH",
        subtitle: "First Public Demo of Operative Ekphrasis",
        genome: {
            "C (Creator)": "Watson Hartsoe + Collaborators",
            "T (Trail)": "Private Tool → Public Workshop",
            "A (Artifact)": "wag-workshop.html, gar-tao.html",
            "M (Metadata)": "Workshop curriculum, demo scripts",
            "D (Decision)": "Simplify the interface for non-technical users",
            "S (System)": "WAG Workshop Edition",
            "P (Pattern)": "Pedagogical Interface",
            "I (Intent)": "To teach the machine to listen"
        },
        quote: "It wasn't real until other people touched it."
    },
    '2025-12-11': {
        title: "PROJECT GENOME",
        subtitle: "The System Becomes Self-Aware",
        genome: {
            "C (Creator)": "Trail Olog Sequencer",
            "T (Trail)": "Files → Manifest → Genome → Narrative",
            "A (Artifact)": "courage-genome.html, sequence_genome.js",
            "M (Metadata)": "The file-manifest.json itself",
            "D (Decision)": "The visualization must be generated from the provenance",
            "S (System)": "Deep Time Observatory",
            "P (Pattern)": "Algorithmic Autobiography",
            "I (Intent)": "To close the loop"
        },
        quote: "This document is watching you reading it."
    }
};

// Heuristic Rules for Zone Mapping
const ZONES = {
    'lego-inputs': {
        keywords: ['lego', 'timber', 'line-22', 'ldraw', 'mpd', 'architect', '3d', 'brick'],
        hashtags: ['#material-provenance', '#ldraw-parsing', '#spatial-input', '#raw-geometry'],
        fallback_type: 'artifact'
    },
    'tetrad-engine': {
        keywords: ['tetrad', 'thousand', 'gar', 'grid', 'sort', 'disentangling', 'tao', 'strategy', 'kmeans', 'segmentation'],
        hashtags: ['#logic-sorting', '#high-dimensional-space', '#vector-embeddings', '#tetrad-analysis'],
        fallback_type: 'artifact'
    },
    'wag-peaks': {
        keywords: ['wag', 'onyx', 'scene', 'speak', 'word', 'brave', 'studio', 'narrative', 'story', 'workshop', 'frank', 'gold'],
        hashtags: ['#narrative-synthesis', '#operative-ekphrasis', '#world-building', '#cinema-generation'],
        fallback_type: 'artifact'
    },
    'trail-observatory': {
        keywords: ['trail', 'genome', 'olog', 'manifest', 'report', 'sequence', 'map', 'reflection', 'future', 'research'],
        hashtags: ['#meta-reflection', '#self-documentation', '#trail-mapping', '#system-awareness'],
        fallback_type: 'artifact'
    }
};

function sequenceGenome() {
    console.log("🧬 Starting Genome Sequencing...");

    // 1. Load Data
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("❌ Manifest not found!");
        return;
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    // Load existing genome template
    let genome = {};
    if (fs.existsSync(GENOME_DATA_PATH)) {
        genome = JSON.parse(fs.readFileSync(GENOME_DATA_PATH, 'utf8'));
    }

    console.log(`📂 Loaded ${manifest.total_files} files from manifest.`);

    // 2. Infuse Ontology
    genome.dna_base_pairs = DNA_BASE_PAIRS;

    // 3. Reset Zones & Map Files
    genome.zones.forEach(z => {
        z.artifacts = [];
        // Add hashtags to zone definition if missing
        if (ZONES[z.id]) z.tags = ZONES[z.id].hashtags;
    });

    let assignedCount = 0;
    const dailyActivity = {}; // YYYY-MM-DD -> [files]

    manifest.files.all.forEach(file => {
        if (file.name.startsWith('.')) return;

        let bestZoneId = null;
        let bestMatchScore = 0;

        // Scoring
        Object.keys(ZONES).forEach(zoneId => {
            let score = 0;
            ZONES[zoneId].keywords.forEach(kw => {
                if (file.name.toLowerCase().includes(kw)) score += 2;
                if (file.path.toLowerCase().includes(kw)) score += 1;
            });
            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestZoneId = zoneId;
            }
        });

        // Fallback Logic
        if (!bestZoneId) {
            if (file.extension === '.md') bestZoneId = 'trail-observatory';
            else bestZoneId = 'lego-inputs';
        } else {
            assignedCount++;
        }

        // Add to Zone
        const zone = genome.zones.find(z => z.id === bestZoneId);
        if (zone) {
            zone.artifacts.push({
                text: file.name,
                type: determineType(file),
                path: file.name,
                size: file.size_human,
                created: file.created,
                modified: file.modified
            });
        }

        // Track Activity
        const date = new Date(file.created || file.modified).toISOString().split('T')[0];
        if (!dailyActivity[date]) dailyActivity[date] = [];
        dailyActivity[date].push({ file: file.name, zone: bestZoneId, ext: file.extension });
    });

    // 4. Sort Artifacts
    genome.zones.forEach(z => {
        z.artifacts.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        z.fileCount = z.artifacts.length;
    });

    // 5. Generate Narrative Timeline
    console.log("📅 Generating Narrative Timeline...");

    const bursts = [];
    Object.keys(dailyActivity).sort().forEach(date => {
        const files = dailyActivity[date];
        if (files.length > 2) {
            const analysis = analyzeBurst(files, date);

            bursts.push({
                date: date,
                label: analysis.title,
                desc: analysis.desc,
                decision: analysis.decision,
                ontology: analysis.ontology,
                rich_genome: analysis.rich_genome,
                readings: analysis.readings,
                quote: analysis.quote,
                active: [analysis.zone]
            });
        }
    });

    // Merge Timeline (Preserve purely manual milestones if needed, but likely we want to overwrite with this richer data)
    // Actually, let's KEEP manual milestones that have a specific "manual: true" flag (if we added one), 
    // or just assume the algorithmic generation is now superior?
    // User asked for "thicker", so let's use the generated bursts as the primary source of truth.
    // If we want to keep specific historical markers, we'd need a separate list.
    // For now, let's REPLACE the timeline with this rich generated history.
    genome.timeline = bursts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 6. Update Metadata
    genome.generated_at = new Date().toISOString();
    genome.total_files_sequenced = manifest.total_files;

    // 7. Save
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(genome, null, 4));
    console.log(`✅ Sequencing Complete.`);
    console.log(`   - Output: ${OUTPUT_PATH}`);
}

function determineType(file) {
    if (file.name.includes('autopsy')) return 'fossil';
    if (file.name.includes('manifest') || file.name.includes('report')) return 'meta';
    if (file.extension === '.html') return 'tool';
    if (file.extension === '.json') return 'data';
    if (file.extension === '.md') return 'doc';
    return 'artifact';
}

function analyzeBurst(files, date) {
    // 1. Determine Dominant Zone
    const zoneCounts = {};
    files.forEach(f => zoneCounts[f.zone] = (zoneCounts[f.zone] || 0) + 1);
    const dominantZone = Object.keys(zoneCounts).reduce((a, b) => zoneCounts[a] > zoneCounts[b] ? a : b);

    // 2. Identify Key Keywords / Prefix
    const prefixCounts = {};
    files.forEach(f => {
        const parts = f.file.split(/[-_.]/);
        if (parts[0]) prefixCounts[parts[0]] = (prefixCounts[parts[0]] || 0) + 1;
    });
    const dominantPrefix = Object.keys(prefixCounts).reduce((a, b) => prefixCounts[a] > prefixCounts[b] ? a : b);

    // 3. Defaults
    let title = `${dominantPrefix.toUpperCase()} System Update`;
    let desc = `Significant development in the ${dominantZone} zone, focusing on ${dominantPrefix}.`;
    let decision = "Iterative improvement of existing infrastructure.";
    let ontology = [];

    // PRIORITY 1: Date-Specific Narrative
    const specificData = SPECIFIC_NARRATIVES[date];
    if (specificData) {
        return {
            title: specificData.title,
            desc: specificData.subtitle,
            decision: specificData.genome['D (Decision)'],
            ontology: Object.keys(specificData.genome).map(k => k.charAt(0)),
            zone: dominantZone,
            rich_genome: specificData.genome,
            readings: specificData.readings,
            quote: specificData.quote
        };
    }

    // PRIORITY 2: Zone-Based Type Narrative
    const richData = NARRATIVE_ARCHIVE[dominantZone];

    // 4. File Type Checks for defaults
    const hasHtml = files.some(f => f.ext === '.html');
    const hasJson = files.some(f => f.ext === '.json');
    const hasMd = files.some(f => f.ext === '.md');
    const hasPy = files.some(f => f.ext === '.py');

    if (richData) {
        title = richData.title;
        desc = richData.subtitle;
        decision = richData.genome['D (Decision)'];
        ontology = Object.keys(richData.genome).map(k => k[0]);

        return {
            title: `${title} (${files.length} Files)`,
            desc: `${desc} · [System Generated Context: ${dominantPrefix}]`,
            decision: decision,
            ontology: ontology,
            zone: dominantZone,
            rich_genome: richData.genome,
            readings: richData.readings,
            quote: richData.quote
        };
    } else {
        // Fallback Algorithmic
        if (dominantZone === 'lego-inputs') {
            ontology.push("L");
            if (hasHtml) {
                title = "Spatial Tooling Interface";
                decision = "Implemented browser-based tooling to visualize raw LDraw geometry.";
            } else if (hasJson) {
                title = "Geometry Data Ingestion";
                decision = "Standardized on JSON for intermediate geometry representation.";
            }
        } else if (dominantZone === 'tetrad-engine') {
            ontology.push("T");
            if (hasPy) {
                title = "Logic Engine Optimization";
                decision = "Utilized Python for heavy-duty graph processing and sorting algorithms.";
            } else {
                title = "Tetrad Pattern Analysis";
                decision = "Refined sorting logic to disentangle complex inputs.";
            }
        } else if (dominantZone === 'wag-peaks') {
            ontology.push("W");
            if (files.some(f => f.file.includes('workshop'))) {
                title = "WAG Workshop Deployment";
                desc = "Deployment of the 'Words Assemble Geometry' workshop materials.";
                decision = "Focused on 'Operative Ekphrasis' as the core interaction model.";
            } else {
                title = "Narrative Synthesis";
                decision = "Integrated MPD-based assets into cohesive narrative scenes.";
            }
        } else if (dominantZone === 'trail-observatory') {
            ontology.push("M");
            if (files.some(f => f.file.includes('genome'))) {
                title = "Genome Sequencing";
                desc = "Deep structural analysis of the repository itself.";
                decision = "Adopted algorithmic introspection to maintain documentation.";
            } else if (hasMd) {
                title = "Research Reflections";
                decision = "Prioritized 'Thick Description' in documentation.";
            }
        }

        // Refine Ontology based on file types
        if (hasJson) ontology.push("S");
        if (hasHtml) ontology.push("A");
        if (hasMd) ontology.push("P");

        return { title, desc, decision, ontology, zone: dominantZone };
    }
}

sequenceGenome();
