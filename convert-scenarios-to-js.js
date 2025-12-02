#!/usr/bin/env node
// Convert small-future-scenarios.json to JavaScript for injection into HTML

const fs = require('fs');
const path = require('path');

const scenariosPath = path.join(__dirname, 'small-future-scenarios.json');
const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

const scenarios = scenariosData.scenarios;
const scenarioKeys = Object.keys(scenarios);

console.log(`Converting ${scenarioKeys.length} scenarios to JavaScript...`);

// Create JavaScript code that can be injected
const jsCode = `
// === SMALL FUTURE SCENARIOS (Auto-generated from all-parts-descriptors.json) ===
// ${scenarioKeys.length} scenarios, each with 30 parts from the LEGO vocabulary

const SMALL_FUTURE_SCENARIOS = ${JSON.stringify(scenarios, null, 4)};

// Merge into scenarios object
Object.assign(scenarios, SMALL_FUTURE_SCENARIOS);
`;

// Write output
const outputPath = path.join(__dirname, 'small-future-scenarios-inject.js');
fs.writeFileSync(outputPath, jsCode);

console.log(`Output written to: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\nTo use: Copy this code and paste it after the 'const scenarios = {' definition in wag-frank-tetrad.html`);
