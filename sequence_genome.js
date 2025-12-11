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

    // Narrative Rules
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
    if (hasJson) ontology.push("S"); // Data/Structure
    if (hasHtml) ontology.push("A"); // Artifact/App
    if (hasMd) ontology.push("P"); // Pattern/Doc

    return { title, desc, decision, ontology, zone: dominantZone };
}

sequenceGenome();
