const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const MANIFEST_FILE = path.join(ROOT_DIR, 'file-manifest.json');

// Configuration matches the server exclusion logic
const EXCLUDED_DIRS = [
    'node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'coverage',
    'wag-viewer-prime-integration', // Large asset folder
    'tutorial_assets', 'ldraw'
];

const EXCLUDED_FILES = [
    '.DS_Store', 'package-lock.json', 'yarn.lock', '.env', '.gitignore'
];

// Helper to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function scanDirectory(dir, fileList = []) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        console.warn(`Skipping inaccessible dir: ${dir}`);
        return fileList;
    }

    files.forEach(file => {
        const filePath = path.join(dir, file);
        let stat;
        try {
            stat = fs.lstatSync(filePath); // Use lstat to detect symlinks
        } catch (e) {
            return; // Skip broken links/files
        }

        // Check exclusions
        if (EXCLUDED_FILES.includes(file)) return;
        if (file.startsWith('.')) return; // hidden files
        if (stat.isSymbolicLink()) return; // Skip symlinks to avoid loops/breaks

        if (stat.isDirectory()) {
            if (EXCLUDED_DIRS.some(ex => file.startsWith(ex))) return;
            scanDirectory(filePath, fileList);
        } else {
            // Process file
            // ...
            // Process file
            // Calculate relative path for web usage
            const relativePath = path.relative(ROOT_DIR, filePath);
            const ext = path.extname(file).toLowerCase();

            fileList.push({
                name: file,
                path: filePath, // Absolute path for local use context, but client might need relative?
                // The index.html replaces absolute path anyway. 
                // Let's store absolute to match existing format or relative?
                // Existing format seems to use absolute paths based on user loops.
                // But for a static manifest portable to GH Pages, we should ideally valid paths.
                // However, index.html replacer logic handles the absolute path prefix.
                // We'll stick to full absolute path to minimize friction with existing index.html logic.
                extension: ext,
                size: stat.size,
                size_human: formatBytes(stat.size),
                modified: stat.mtime.toISOString(),
                created: stat.birthtime.toISOString()
            });
        }
    });

    return fileList;
}

console.log('🔍 Scanning repository for static manifest...');

try {
    const allFiles = scanDirectory(ROOT_DIR);

    // Create summary stats
    const extensions = {};
    allFiles.forEach(f => {
        const ext = f.extension || 'other';
        extensions[ext] = (extensions[ext] || 0) + 1;
    });

    const totalSize = allFiles.reduce((acc, f) => acc + f.size, 0);

    const manifest = {
        generated: new Date().toISOString(),
        total_files: allFiles.length,
        total_size: totalSize,
        total_size_human: formatBytes(totalSize),
        summary: {
            extensions: extensions
        },
        files: {
            all: allFiles
        }
    };

    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
    console.log(`✅ Manifest generated! ${allFiles.length} files indexed.`);
    console.log(`📂 Saved to: ${MANIFEST_FILE}`);

} catch (err) {
    console.error('❌ Error generating manifest:', err);
    process.exit(1);
}
