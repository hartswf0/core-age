const fs = require('fs');
const path = require('path');

// Configuration
const MANIFEST_PATH = './file-manifest.json';
const GENOME_DATA_PATH = './courage-trail-data.json';
const OUTPUT_PATH = './courage-trail-data.json'; // Overwrite

// Heuristic Rules for Zone Mapping
const ZONES = {
    'lego-inputs': {
        keywords: ['lego', 'timber', 'line-22', 'ldraw', 'mpd', 'architect', '3d'],
        fallback_type: 'artifact'
    },
    'tetrad-engine': {
        keywords: ['tetrad', 'thousand', 'gar', 'grid', 'sort', 'disentangling', 'tao', 'strategy'],
        fallback_type: 'artifact'
    },
    'wag-peaks': {
        keywords: ['wag', 'onyx', 'scene', 'speak', 'word', 'brave', 'studio', 'narrative', 'story'],
        fallback_type: 'artifact'
    },
    'trail-observatory': {
        keywords: ['trail', 'genome', 'olog', 'manifest', 'report', 'sequence', 'map', 'reflection'],
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

    // Load existing genome (template) or use default
    let genome = {};
    if (fs.existsSync(GENOME_DATA_PATH)) {
        genome = JSON.parse(fs.readFileSync(GENOME_DATA_PATH, 'utf8'));
    }

    console.log(`📂 Loaded ${manifest.total_files} files from manifest.`);

    // 2. Clear current artifacts in zones to prepare for infusion
    if (genome.zones) {
        genome.zones.forEach(z => z.artifacts = []);
    }

    // 3. Map Files to Zones
    let assignedCount = 0;
    let unassignedCount = 0;

    manifest.files.all.forEach(file => {
        // Skip system files or hidden files if needed
        if (file.name.startsWith('.')) return;

        let bestZoneId = null;
        let bestMatchScore = 0;

        // Scoring: +1 for each keyword match
        Object.keys(ZONES).forEach(zoneId => {
            let score = 0;
            ZONES[zoneId].keywords.forEach(kw => {
                if (file.name.toLowerCase().includes(kw)) score += 2; // Strong match on name
                if (file.path.toLowerCase().includes(kw)) score += 1; // Weak match on path
            });

            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestZoneId = zoneId;
            }
        });

        // Default to "lego-inputs" (Input Era) if no match, or a generic "fossil" bin if we had one.
        // For now, let's put unassigned items in 'lego-inputs' as "Raw Material" or 'trail-observatory' as "Meta".
        // Let's use 'lego-inputs' as the catch-all for "Raw Files" unless it looks like a document.
        if (!bestZoneId) {
            unassignedCount++;
            // Simple heuristic for unassigned:
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
                path: file.name, // Relative path for web viewer
                size: file.size_human,
                created: file.created,
                modified: file.modified
            });
        }
    });

    // 4. Sort Artifacts inside Zones (Newest First)
    genome.zones.forEach(z => {
        z.artifacts.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        // Update stats
        z.fileCount = z.artifacts.length;
        if (z.artifacts.length > 0) {
            const newest = new Date(z.artifacts[0].modified);
            const oldest = new Date(z.artifacts[z.artifacts.length - 1].modified);
            z.dateRange = `${oldest.toLocaleDateString()} - ${newest.toLocaleDateString()}`;
        }
    });

    // 5. Update Metadata
    genome.generated_at = new Date().toISOString();
    genome.total_files_sequenced = manifest.total_files;

    // 6. Save
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(genome, null, 4));
    console.log(`✅ Sequencing Complete.`);
    console.log(`   - Assigned: ${assignedCount}`);
    console.log(`   - Unassigned (Defaulted): ${unassignedCount}`);
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

sequenceGenome();
