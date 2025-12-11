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
            const analysis = analyzeBurst(files);

            bursts.push({
                date: date,
                label: analysis.title,
                desc: analysis.desc,
                decision: analysis.decision,
                ontology: analysis.ontology,
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

function analyzeBurst(files) {
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

    // 3. Check for specific file types to infer "Decision" and "Title"
    const hasHtml = files.some(f => f.ext === '.html');
    const hasJson = files.some(f => f.ext === '.json');
    const hasMd = files.some(f => f.ext === '.md');
    const hasPy = files.some(f => f.ext === '.py');
    const hasSh = files.some(f => f.ext === '.sh');

    let title = `${dominantPrefix.toUpperCase()} System Update`;
    let desc = `Significant development in the ${dominantZone} zone, focusing on ${dominantPrefix}.`;
    let decision = "Iterative improvement of existing infrastructure.";
    let ontology = [];

    // Check Narrative Archive for "Thick" Metadata
    const richData = NARRATIVE_ARCHIVE[dominantZone];

    if (richData) {
        // Use Hand-Crafted Narrative Overlay
        title = richData.title;
        desc = richData.subtitle; // Use subtitle as description

        // If the burst is truly massive or significant, we use the rich genome.
        // We can just ALWAYS attach the rich genome to every burst of this zone?
        // No, that repeats it too much.
        // Let's only attach it if it's a "Top Tier" burst (e.g. > 10 files) or if it's the specific "Key" burst.
        // For simplicity, let's attach it to ALL bursts of that zone, but maybe vary the 'trail' or 'metadata' slightly?
        // Actually, the user wants "better explanations for EACH burst".
        // So let's use the rich data as a base.

        decision = richData.genome['D (Decision)'];
        ontology = Object.keys(richData.genome).map(k => k[0]); // C, T, A...
    } else {
        // Fallback ALgorithmic Logic
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
            // ... (rest of existing logic)
            ontology.push("T");
            if (hasPy) {
                title = "Logic Engine Optimization";
                decision = "Utilized Python for heavy-duty graph processing and sorting algorithms.";
            } else {
                title = "Tetrad Pattern Analysis";
                decision = "Refined sorting logic to disentangle complex inputs.";
            }
        }
        // ... (etc)
    }

    // NARRATIVE OVERRIDE: If richData exists, we return the FULL rich object + stats
    if (richData) {
        return {
            title: `${title} (${files.length} Files)`, // Append stats to title for context
            desc: `${desc} · [System Generated Context: ${dominantPrefix}]`,
            decision: decision,
            ontology: ontology,
            zone: dominantZone,
            rich_genome: richData.genome, // Pass the full grid object
            readings: richData.readings,
            quote: richData.quote
        };
    }

    return { title, desc, decision, ontology, zone: dominantZone };


}

sequenceGenome();
