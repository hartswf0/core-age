const fs = require('fs');
const path = require('path');

// Configuration
const MANIFEST_PATH = './file-manifest.json';
const GENOME_DATA_PATH = './courage-trail-data.json';
const OUTPUT_PATH = './courage-trail-data.json'; // Overwrite

// Heuristic Rules for Zone Mapping
const ZONES = {
    'lego-inputs': {
        keywords: ['lego', 'timber', 'line-22', 'ldraw', 'mpd', 'architect', '3d', 'brick'],
        fallback_type: 'artifact'
    },
    'tetrad-engine': {
        keywords: ['tetrad', 'thousand', 'gar', 'grid', 'sort', 'disentangling', 'tao', 'strategy', 'kmeans', 'segmentation'],
        fallback_type: 'artifact'
    },
    'wag-peaks': {
        keywords: ['wag', 'onyx', 'scene', 'speak', 'word', 'brave', 'studio', 'narrative', 'story', 'workshop', 'frank', 'gold'],
        fallback_type: 'artifact'
    },
    'trail-observatory': {
        keywords: ['trail', 'genome', 'olog', 'manifest', 'report', 'sequence', 'map', 'reflection', 'future', 'research'],
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

    // 3. Map Files to Zones & Track Daily Activity
    let assignedCount = 0;
    let unassignedCount = 0;
    const dailyActivity = {}; // YYYY-MM-DD -> [files]

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

        // Track Activity by Date
        const date = new Date(file.created || file.modified).toISOString().split('T')[0];
        if (!dailyActivity[date]) dailyActivity[date] = [];
        dailyActivity[date].push({ file: file.name, zone: bestZoneId });
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

    // 5. Generate Timeline Events from Bursts
    console.log("📅 Generating Timeline Bursts...");
    // Keep original hardcoded milestones if needed, or clear them? 
    // Let's filter out old auto-generated ones if we rerun, but hard to distinguish.
    // Ideally, we keep the curated ones and APPEND the bursts.
    // Let's reset timeline to just the core 5 manually curated ones first?
    // Actually, let's keep the core ones by checking if they have a "desc" that is manual.
    // A simpler approach: Clear timeline and re-add core + bursts. 
    // For now, let's just append bursts that are significant (>2 files).

    const bursts = [];
    Object.keys(dailyActivity).sort().forEach(date => {
        const files = dailyActivity[date];
        if (files.length > 2) {
            // Find dominant zone
            const zoneCounts = {};
            files.forEach(f => zoneCounts[f.zone] = (zoneCounts[f.zone] || 0) + 1);
            const dominantZone = Object.keys(zoneCounts).reduce((a, b) => zoneCounts[a] > zoneCounts[b] ? a : b);

            // Create Label
            const prefixCounts = {};
            files.forEach(f => {
                const prefix = f.file.split('-')[0];
                prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
            });
            const dominantPrefix = Object.keys(prefixCounts).reduce((a, b) => prefixCounts[a] > prefixCounts[b] ? a : b);

            bursts.push({
                date: date,
                label: `${files.length} File Burst (${dominantPrefix.toUpperCase()})`,
                desc: `Significant density detected in ${dominantZone}. Key outputs: ${files.slice(0, 3).map(f => f.file).join(', ')}...`,
                active: [dominantZone]
            });
        }
    });

    // Merge Bursts (avoid duplicates if possible, but simplicity first)
    // We will preserve the manually curated events which have specific hardcoded dates.
    // Filter out previous bursts from timeline if any
    const coreEvents = genome.timeline.filter(e => !e.label.includes('Burst'));
    genome.timeline = [...coreEvents, ...bursts].sort((a, b) => new Date(a.date) - new Date(b.date));


    // 6. Update Metadata
    genome.generated_at = new Date().toISOString();
    genome.total_files_sequenced = manifest.total_files;

    // 7. Save
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(genome, null, 4));
    console.log(`✅ Sequencing Complete.`);
    console.log(`   - Assigned: ${assignedCount}`);
    console.log(`   - Bursts Generated: ${bursts.length}`);
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
