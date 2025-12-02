// Simple localhost server for GAR-ONYX data bridge
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3399;
let latestGarData = null;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // POST: Receive GAR export
    if (req.method === 'POST' && req.url === '/gar-export') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                latestGarData = JSON.parse(body);
                console.log(`✓ GAR export received at ${new Date().toLocaleTimeString()}`);
                console.log(`  Channels: ${latestGarData.channels?.length || 0}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
            } catch (e) {
                console.error('✗ Failed to parse GAR data:', e.message);
                res.writeHead(400);
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // GET: Retrieve latest GAR data
    if (req.method === 'GET' && req.url === '/latest-gar') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(latestGarData || { channels: [] }));
        return;
    }

    // GET: Status
    if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            hasData: !!latestGarData,
            port: PORT,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // GET: Serve ONYX viewer
    if (req.method === 'GET' && req.url === '/onyx-viewer') {
        const htmlPath = path.join(__dirname, 'onyx-scenes.html');
        fs.readFile(htmlPath, 'utf8', (err, html) => {
            if (err) {
                console.error('✗ Failed to load onyx-scenes.html:', err.message);
                res.writeHead(500);
                res.end('Error loading ONYX viewer');
                return;
            }

            // Remove broken script references more safely
            // Gaia: We want to keep these, as the server serves them statically!
            let cleanHtml = html;
            // .replace(/<script[^>]*src=["']onyx-data\.js["'][^>]*><\/script>/g, '')
            // .replace(/<script[^>]*src=["']gar-onyx-bridge\.js["'][^>]*><\/script>/g, '')
            // .replace(/<script[^>]*src=["']lego-sonification\.js["'][^>]*><\/script>/g, '');

            // Find the last </head> tag and inject before it
            const headCloseIndex = cleanHtml.lastIndexOf('</head>');
            if (headCloseIndex === -1) {
                console.error('✗ Could not find </head> tag');
                res.writeHead(500);
                res.end('Invalid HTML structure');
                return;
            }

            const injection = `
<script>
console.log('[ONYX] Viewer loaded via localhost:3399');
window.addEventListener('message', function(e) {
    if (e.data.type === 'IMPORT_GAR' && e.data.data) {
        console.log('[ONYX] Importing GAR data...');
        setTimeout(function() {
            if (typeof restoreFromImport === 'function') {
                restoreFromImport(e.data.data);
            }
        }, 500);
    }
});
setInterval(function() {
    fetch('http://localhost:3399/latest-gar')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.channels && data.channels.length > 0 && !window.GAR_IMPORTED) {
                window.GAR_IMPORTED = true;
                console.log('[ONYX] Auto-importing GAR data');
                if (typeof restoreFromImport === 'function') {
                    restoreFromImport(data);
                }
            }
        })
        .catch(function(e) { console.log('[ONYX] Polling error:', e.message); });
}, 3000);
</script>
`;

            const finalHtml = cleanHtml.substring(0, headCloseIndex) + injection + cleanHtml.substring(headCloseIndex);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(finalHtml);
            console.log('✓ Served ONYX viewer');
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════╗`);
    console.log(`║  GAR ⟺ ONYX Bridge Server            ║`);
    console.log(`╠═══════════════════════════════════════╣`);
    console.log(`║  http://localhost:${PORT}              ║`);
    console.log(`╠═══════════════════════════════════════╣`);
    console.log(`║  POST /gar-export  → Receive GAR      ║`);
    console.log(`║  GET  /latest-gar  → Get latest data  ║`);
    console.log(`║  GET  /onyx-viewer → ONYX interface   ║`);
    console.log(`║  GET  /status      → Server status    ║`);
    console.log(`╚═══════════════════════════════════════╝\n`);
});
