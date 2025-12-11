const fs = require('fs');

const JSON_PATH = './courage-trail-data.json';
const HTML_PATH = './courage-genome.html';

try {
    const jsonData = fs.readFileSync(JSON_PATH, 'utf8');
    let htmlContent = fs.readFileSync(HTML_PATH, 'utf8');

    // Robust Splicing
    const startMarker = 'const FALLBACK_GENOME_DATA = ';
    const endMarker = '    </script>'; // Heuristic for end of script block if we rely on indentation? 
    // Actually, looking at the file, the variable ends with `};` then a newline, then `async function...` OR just finding the variable block.
    // The previous regex was `(const FALLBACK_GENOME_DATA = )(\{[\s\S]*?\})(;)`
    // Let's find the indices manually.

    const startIndex = htmlContent.indexOf(startMarker);
    if (startIndex === -1) throw new Error("Start marker not found");

    // Find the NEXT semicolon after the start + some offset to ensure we aren't finding a semicolon inside the string?
    // Actually, we know the regex `\{[\s\S]*?\};` works better if we can execute it.
    // But let's just use the regex to find the *indices* not replace.
    const regex = /(const FALLBACK_GENOME_DATA = )(\{[\s\S]*?\})(;)/;
    const match = regex.exec(htmlContent);

    if (!match) {
        // If regex failed, it might be because the previous injection corrupted the file.
        // Let's try to restore from a template if needed, but first let's try to find the insertion point.
        console.error("Regex match failed. File might be corrupted.");
        // Fallback: If we can't find the variable, we assume it's missing or broken.
        // Let's look for `<script>` and `async function loadGenome`.
        const scriptTag = '<script>';
        const loadFn = 'async function loadGenome';

        const scriptIdx = htmlContent.lastIndexOf(scriptTag);
        const loadIdx = htmlContent.indexOf(loadFn);

        if (scriptIdx !== -1 && loadIdx !== -1) {
            // Reconstruct: Pre-script + script + VAR + Code
            const pre = htmlContent.substring(0, scriptIdx + scriptTag.length);
            const post = htmlContent.substring(loadIdx);
            const newFile = pre + '\n        const FALLBACK_GENOME_DATA = ' + jsonData + ';\n\n        ' + post;
            fs.writeFileSync(HTML_PATH, newFile);
            console.log("✅ Reconstructed file from structural markers.");
            return;
        }
        process.exit(1);
    }

    // If regex matched, we replace using string slicing to avoid replacement-string limitations
    const fullMatch = match[0];
    const matchIndex = match.index;

    const pre = htmlContent.substring(0, matchIndex);
    const post = htmlContent.substring(matchIndex + fullMatch.length);

    // Construct new content
    // pattern: const FALLBACK_GENOME_DATA = <JSON>;
    const newContent = pre + 'const FALLBACK_GENOME_DATA = ' + jsonData + ';' + post;

    fs.writeFileSync(HTML_PATH, newContent);
    console.log(`✅ Successfully assembled file. New size: ${newContent.length} bytes.`);

} catch (err) {
    console.error("Assembly failed:", err);
}
