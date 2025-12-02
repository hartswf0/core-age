// LEGO Part Sonification Engine (adapted from radio-lego.html)
// Maps LEGO part properties from all-parts-descriptors.json to audio parameters

const LEGO_AUDIO = {
    ctx: null,
    master: null,
    analyser: null,
    initialized: false,
    partsData: null, // Will hold all-parts-descriptors.json

    async init() {
        if (this.initialized) return;

        // Initialize Audio Context
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.3; // Master volume

        // Analyser for visualization
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.master.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Reverb (simple delay for spatial depth)
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.15;
        const delayGain = this.ctx.createGain();
        delayGain.gain.value = 0.25;
        this.master.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(this.master);

        // Load parts data
        try {
            const response = await fetch('wag-viewer-prime-integration-20251112-055341-copy/all-parts-descriptors.json');
            const data = await response.json();
            this.partsData = data.parts;
            console.log(`[LEGO_AUDIO] Loaded ${Object.keys(this.partsData).length} LEGO parts`);
        } catch (error) {
            console.warn('[LEGO_AUDIO] Could not load parts data:', error);
            this.partsData = {};
        }

        this.initialized = true;
        console.log('[LEGO_AUDIO] Sonification engine initialized');
    },

    // Get part metadata from all-parts-descriptors.json
    getPartMetadata(partId) {
        if (!this.partsData || !this.partsData[partId]) {
            return {
                description: `Part ${partId}`,
                category: 'unknown',
                faceCount: 100,
                studs: 4
            };
        }

        const part = this.partsData[partId];
        return {
            description: part.description || `Part ${partId}`,
            category: part.category || 'unknown',
            faceCount: part.faceCount || 100,
            triCount: part.triCount || 50,
            quadCount: part.quadCount || 50,
            sizeBytes: part.sizeBytes || 1000,
            // Estimate studs from description
            studs: this.estimateStuds(part.description)
        };
    },

    // Estimate stud count from part description
    estimateStuds(description) {
        if (!description) return 4;

        // Try to extract dimensions from description
        const match = description.match(/(\d+)\s*x\s*(\d+)/i);
        if (match) {
            return parseInt(match[1]) * parseInt(match[2]);
        }

        // Default based on keywords
        if (description.includes('Plate')) return 8;
        if (description.includes('Brick')) return 4;
        if (description.includes('Tile')) return 2;
        if (description.includes('Baseplate')) return 256;

        return 4; // Default
    },

    // Sonify a LEGO part based on its real properties from all-parts-descriptors.json
    async sonifyPart(partId, gridX, gridY, partLabel) {
        if (!this.initialized) await this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        // Get real part metadata
        const metadata = this.getPartMetadata(partId);

        // MAPPING 1: Frequency from grid Y + face complexity
        // Grid position provides base, face count adds variation
        const normY = gridY / 9;
        const complexityFactor = Math.min(metadata.faceCount / 1000, 1);
        const freq = 150 + (normY * 400) + (complexityFactor * 250);

        // MAPPING 2: Panning from grid X
        const panVal = Math.max(-1, Math.min(1, (gridX - 4.5) / 4.5));

        // MAPPING 3: Waveform from part category
        let type = 'sine'; // Default (smooth parts)
        if (metadata.category.includes('Plate')) type = 'triangle';
        if (metadata.category.includes('Brick')) type = 'square';
        if (metadata.category.includes('Technic')) type = 'sawtooth';
        if (metadata.category.includes('Slope')) type = 'sine';

        // MAPPING 4: Duration from stud count
        const duration = Math.min(2.0, Math.max(0.2, metadata.studs * 0.03));

        // MAPPING 5: Filter cutoff from file size
        const sizeFactor = Math.min(metadata.sizeBytes / 50000, 1);
        const filterCutoff = 500 + (sizeFactor * 2500);

        // --- SYNTHESIS GRAPH ---
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        // LFO for vibrato (adds organic feel)
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 5 + (complexityFactor * 3);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 8;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t);

        // Filter sweep (scanning effect)
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, t);
        filter.frequency.linearRampToValueAtTime(filterCutoff, t + (duration / 3));
        filter.frequency.exponentialRampToValueAtTime(200, t + duration);
        filter.Q.value = 1 + (complexityFactor * 3);

        // Panning
        panner.pan.value = panVal;

        // Envelope (ADSR)
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.03); // Attack
        gain.gain.linearRampToValueAtTime(0.15, t + (duration * 0.3)); // Decay
        gain.gain.setValueAtTime(0.15, t + (duration * 0.7)); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Release

        // Routing
        osc.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.master);

        // Trigger
        osc.start(t);
        osc.stop(t + duration);
        lfo.stop(t + duration);

        console.log(`[LEGO_AUDIO] ${metadata.description} at (${gridX},${gridY}): ${Math.round(freq)}Hz, ${metadata.studs} studs, ${type} wave`);
    },

    // Sonify entire grid as a chord (staggered)
    async sonifyGrid(cells) {
        if (!this.initialized) await this.init();

        const cellArray = Object.values(cells);
        console.log(`[LEGO_AUDIO] Sonifying grid with ${cellArray.length} parts`);

        cellArray.forEach((cell, index) => {
            // Stagger for chord effect
            setTimeout(() => {
                this.sonifyPart(
                    cell.partId || index,
                    cell.x,
                    cell.y,
                    cell.label
                );
            }, index * 25); // 25ms stagger
        });
    }
};

// Make available globally
window.LEGO_AUDIO = LEGO_AUDIO;

// Auto-initialize on load
window.addEventListener('DOMContentLoaded', () => {
    LEGO_AUDIO.init();
});
