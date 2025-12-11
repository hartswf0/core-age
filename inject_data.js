const fs = require('fs');

const JSON_PATH = './courage-trail-data.json';
const HTML_PATH = './courage-genome.html';

try {
    const jsonData = fs.readFileSync(JSON_PATH, 'utf8');
    let htmlContent = fs.readFileSync(HTML_PATH, 'utf8');

    // Regex to find the variable declaration and replace it
    // const FALLBACK_GENOME_DATA = { ... };
    const regex = /(const FALLBACK_GENOME_DATA = )(\{[\s\S]*?\})(;)/;

    // Check if regex matches
    if (!regex.test(htmlContent)) {
        console.error("❌ Could not find FALLBACK_GENOME_DATA variable in HTML.");
        process.exit(1);
    }

    const newContent = htmlContent.replace(regex, `$1${jsonData}$3`);

    fs.writeFileSync(HTML_PATH, newContent, 'utf8');
    console.log(`✅ Successfully injected ${JSON_PATH.length} bytes of JSON into ${HTML_PATH}`);

} catch (err) {
    console.error("Error injecting data:", err);
}
