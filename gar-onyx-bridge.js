/**
 * GAR-ONYX Bridge
 * Bidirectional translator between GAR (Grid Assembles Reality) and ONYX narrative systems
 */

window.GAR_ONYX_BRIDGE = {
    /**
     * Convert GAR 20×20 segmentation to ONYX 9×9 ontology grid
     * @param {Object} garState - GAR state with labels, centroids, colors
     * @returns {Object} ONYX channel-compatible data
     */
    garToOnyx(garState) {
        const { labels, centroids, colors, areas, k } = garState;
        const GAR_SIZE = 20;
        const ONYX_SIZE = 9;

        // Downsample 20×20 → 9×9 using spatial averaging
        const onyxGrid = Array.from({ length: ONYX_SIZE }, () => Array(ONYX_SIZE).fill(null));
        const onyxCells = {};

        // Map each ONYX cell to its corresponding GAR region
        for (let oy = 0; oy < ONYX_SIZE; oy++) {
            for (let ox = 0; ox < ONYX_SIZE; ox++) {
                // Calculate GAR region bounds for this ONYX cell
                const garX0 = Math.floor((ox / ONYX_SIZE) * GAR_SIZE);
                const garX1 = Math.floor(((ox + 1) / ONYX_SIZE) * GAR_SIZE);
                const garY0 = Math.floor((oy / ONYX_SIZE) * GAR_SIZE);
                const garY1 = Math.floor(((oy + 1) / ONYX_SIZE) * GAR_SIZE);

                // Find dominant segment in this region
                const segmentCounts = {};
                for (let gy = garY0; gy < garY1; gy++) {
                    for (let gx = garX0; gx < garX1; gx++) {
                        const garIdx = gy * GAR_SIZE + gx;
                        const segment = labels[garIdx];
                        segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
                    }
                }

                // Get dominant segment
                let dominantSegment = 0;
                let maxCount = 0;
                for (const [seg, count] of Object.entries(segmentCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantSegment = parseInt(seg);
                    }
                }

                // Map segment to ONYX entity type
                const segmentData = {
                    avgColor: colors[dominantSegment],
                    area: areas[dominantSegment] / (GAR_SIZE * GAR_SIZE),
                    centroid: centroids[dominantSegment],
                    segment: dominantSegment
                };

                const entityType = this.mapSegmentToType(segmentData);
                const entityId = `gar_${dominantSegment}_${ox}_${oy}`;

                // Create ONYX cell
                onyxGrid[oy][ox] = {
                    id: entityId,
                    type: entityType,
                    symbol: this.getSymbolForType(entityType),
                    label: `GAR Segment ${dominantSegment}`,
                    entity: {
                        id: entityId,
                        type: entityType,
                        name: `Segment ${dominantSegment}`,
                        location: 'imported',
                        relations: [],
                        garMeta: segmentData
                    }
                };

                onyxCells[`${ox},${oy}`] = [{
                    text: `GAR segment ${dominantSegment} → ${entityType}`,
                    timestamp: new Date().toISOString()
                }];
            }
        }

        return {
            grid: onyxGrid,
            cells: onyxCells,
            metadata: {
                source: 'GAR',
                garSegments: k,
                timestamp: new Date().toISOString()
            }
        };
    },

    /**
     * Map GAR segment properties to ONYX entity type
     * @param {Object} segmentData - { avgColor, area, centroid, segment }
     * @returns {string} ONYX entity type
     */
    mapSegmentToType(segmentData) {
        const { avgColor, area } = segmentData;

        if (!avgColor) return 'Entity';

        const [r, g, b] = avgColor;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        const saturation = max === 0 ? 0 : (max - min) / max;

        // Hue calculation (0-360)
        let hue = 0;
        if (max !== min) {
            if (max === r) hue = ((g - b) / (max - min)) * 60;
            else if (max === g) hue = (2 + (b - r) / (max - min)) * 60;
            else hue = (4 + (r - g) / (max - min)) * 60;
            if (hue < 0) hue += 360;
        }

        // Mapping rules based on visual properties
        if (area > 0.25) return 'Location';           // Large regions
        if (luminance < 0.3) return 'Obstacle';       // Dark areas
        if (saturation < 0.2) return 'Core';          // Desaturated = essential
        if (hue >= 0 && hue < 60) return 'Goal';      // Red-yellow: goals
        if (hue >= 60 && hue < 180) return 'Entity';  // Green-cyan: entities
        if (hue >= 180 && hue < 300) return 'Shift';  // Blue-purple: shifts
        if (hue >= 300) return 'Morphism';            // Magenta: transformations

        return 'Entity'; // Default
    },

    /**
     * Get ONYX symbol for entity type
     */
    getSymbolForType(type) {
        const symbols = {
            'Entity': 'E',
            'Core': 'C',
            'Goal': 'G',
            'Obstacle': 'O',
            'Morphism': 'M',
            'Shift': 'S',
            'Location': 'L',
            'Timepoint': 'T'
        };
        return symbols[type] || '?';
    },

    /**
     * Convert ONYX narrative grid to GAR visual parameters
     * @param {Object} onyxChannel - ONYX channel with grid
     * @returns {Object} GAR-compatible visual weights
     */
    onyxToGar(onyxChannel) {
        const { grid } = onyxChannel;
        const GAR_SIZE = 20;
        const ONYX_SIZE = grid.length;

        // Create 20×20 edge weight and color arrays
        const edgeWeights = new Array(GAR_SIZE * GAR_SIZE).fill(0.5);
        const colorHints = new Array(GAR_SIZE * GAR_SIZE);

        for (let oy = 0; oy < ONYX_SIZE; oy++) {
            for (let ox = 0; ox < ONYX_SIZE; ox++) {
                const cell = grid[oy][ox];
                if (!cell) continue;

                const weights = this.typeToVisualWeight(cell.type);

                // Map to GAR region
                const garX0 = Math.floor((ox / ONYX_SIZE) * GAR_SIZE);
                const garX1 = Math.floor(((ox + 1) / ONYX_SIZE) * GAR_SIZE);
                const garY0 = Math.floor((oy / ONYX_SIZE) * GAR_SIZE);
                const garY1 = Math.floor(((oy + 1) / ONYX_SIZE) * GAR_SIZE);

                for (let gy = garY0; gy < garY1; gy++) {
                    for (let gx = garX0; gx < garX1; gx++) {
                        const idx = gy * GAR_SIZE + gx;
                        edgeWeights[idx] = weights.edge;
                        colorHints[idx] = weights.color;
                    }
                }
            }
        }

        return {
            edgeWeights,
            colorHints,
            metadata: {
                source: 'ONYX',
                channelId: onyxChannel.id,
                channelName: onyxChannel.name
            }
        };
    },

    /**
     * Map ONYX entity type to GAR visual properties
     * @param {string} entityType - ONYX entity type
     * @returns {Object} { edge, color } weights
     */
    typeToVisualWeight(entityType) {
        const weights = {
            'Entity': { edge: 0.5, color: [100, 180, 200] },   // Cyan
            'Core': { edge: 0.3, color: [200, 200, 180] },     // Warm gray
            'Goal': { edge: 0.6, color: [100, 200, 100] },     // Green
            'Obstacle': { edge: 0.9, color: [200, 80, 80] },   // Red
            'Morphism': { edge: 0.7, color: [180, 100, 200] }, // Purple
            'Shift': { edge: 0.65, color: [100, 150, 220] },   // Blue
            'Location': { edge: 0.2, color: [220, 180, 240] }, // Light purple
            'Timepoint': { edge: 0.4, color: [100, 200, 220] } // Light cyan
        };
        return weights[entityType] || weights['Entity'];
    }
};
