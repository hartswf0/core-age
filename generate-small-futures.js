#!/usr/bin/env node
// Generate SMALL FUTURE scenarios from all-parts-descriptors.json
// Batches parts into groups of 30 for scenario dropdown

const fs = require('fs');
const path = require('path');

// Load all parts
const allPartsPath = path.join(__dirname, 'wag-viewer-prime-integration-20251112-055341-copy', 'all-parts-descriptors.json');
const allParts = JSON.parse(fs.readFileSync(allPartsPath, 'utf8'));

const parts = allParts.parts;
const partKeys = Object.keys(parts);
const batchSize = 30;
const totalBatches = Math.ceil(partKeys.length / batchSize);

console.log(`Total parts: ${partKeys.length}`);
console.log(`Batch size: ${batchSize}`);
console.log(`Total batches: ${totalBatches}`);

// Generate scenarios object
const scenarios = {};

for (let i = 0; i < totalBatches; i++) {
    const batchNum = i + 1;
    const paddedNum = String(batchNum).padStart(4, '0');
    const scenarioId = `small_future_${paddedNum}`;

    const startIdx = i * batchSize;
    const endIdx = Math.min((i + 1) * batchSize, partKeys.length);
    const batchKeys = partKeys.slice(startIdx, endIdx);

    // Get sample parts for this batch
    const sampleParts = batchKeys.slice(0, 5).map(key => {
        const part = parts[key];
        return part.description || part.name || key;
    });

    scenarios[scenarioId] = {
        id: scenarioId,
        name: `SMALL FUTURE ${paddedNum}`,
        role: 'Speculative Builder',
        goal: `Explore combinatorial futures with parts batch ${paddedNum}`,
        obstacle: 'Imagining novel assemblages from constrained vocabulary',
        intro: `Batch ${paddedNum}/${totalBatches}: ${batchKeys.length} parts from the LEGO vocabulary. Sample: ${sampleParts.slice(0, 3).join(', ')}...`,
        context: [
            `Parts batch ${batchNum} of ${totalBatches}`,
            `Contains ${batchKeys.length} distinct parts`,
            'Each part is a primitive building block',
            'Combinatorial explosion creates novel futures'
        ],
        initialPrompt: `What small futures can we build with this vocabulary?`,
        systemInstruction: `You are exploring speculative futures through constrained LEGO vocabulary. This batch contains ${batchKeys.length} specific parts. Help the user imagine novel assemblages, configurations, and scenarios using these primitives. Think about affordances, constraints, and emergent possibilities. Be concrete and visual.`,
        partsBatch: batchKeys,
        batchNumber: batchNum,
        totalBatches: totalBatches
    };
}

// Write to file
const outputPath = path.join(__dirname, 'small-future-scenarios.json');
fs.writeFileSync(outputPath, JSON.stringify({ scenarios, metadata: { generated: new Date().toISOString(), totalBatches, batchSize, totalParts: partKeys.length } }, null, 2));

console.log(`\nGenerated ${totalBatches} scenarios`);
console.log(`Output: ${outputPath}`);
console.log(`\nSample scenario keys:`);
console.log(Object.keys(scenarios).slice(0, 5));
