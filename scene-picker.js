/**
 * MOBILE-FRIENDLY SCENE PICKER
 * Visual modal for selecting and importing scenes
 */

// Add to your HTML (or inject via JS)
const scenePickerHTML = `
<div id="scene-picker-modal" class="modal" style="display: none;">
    <div class="modal-overlay" onclick="closeScenePicker()"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Select Scene</h3>
            <button class="close-btn" onclick="closeScenePicker()">✕</button>
        </div>
        
        <div class="scene-tabs">
            <button class="tab-btn active" data-filter="all">All Scenes</button>
            <button class="tab-btn" data-filter="mine">My Scenes</button>
            <button class="tab-btn" data-filter="others">From Others</button>
        </div>
        
        <div class="scene-list" id="scene-list"></div>
    </div>
</div>
`;

// Styles
const scenePickerStyles = `
<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
}

.modal-content {
    position: relative;
    background: var(--bg-panel, #0f0f0f);
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border, #333);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: var(--accent, #0f0);
    font-size: 16px;
    letter-spacing: 1px;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text, #ddd);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: var(--accent, #0f0);
}

.scene-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border, #333);
}

.tab-btn {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: none;
    color: var(--text-muted, #666);
    font-family: inherit;
    font-size: 11px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
}

.tab-btn.active {
    color: var(--accent, #0f0);
    border-bottom-color: var(--accent, #0f0);
}

.tab-btn:hover {
    color: var(--text, #ddd);
}

.scene-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.scene-card {
    background: var(--bg-surface, #0a0a0a);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 60px; /* Touch-friendly */
}

.scene-card:hover {
    border-color: var(--accent, #0f0);
    background: rgba(0, 255, 0, 0.05);
}

.scene-card:active {
    transform: scale(0.98);
}

.scene-icon {
    width: 40px;
    height: 40px;
    background: var(--bg-panel, #0f0f0f);
    border: 1px solid var(--border, #333);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.scene-info {
    flex: 1;
    min-width: 0;
}

.scene-name {
    font-size: 14px;
    color: var(--text, #ddd);
    margin-bottom: 4px;
    font-weight: bold;
}

.scene-meta {
    font-size: 10px;
    color: var(--text-muted, #666);
}

.scene-badge {
    background: var(--accent, #0f0);
    color: #000;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 0.5px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .modal-content {
        max-width: 95vw;
        max-height: 90vh;
    }
    
    .scene-card {
        min-height: 70px; /* Larger on mobile */
        padding: 18px;
    }
    
    .scene-icon {
        width: 50px;
        height: 50px;
        font-size: 24px;
    }
    
    .scene-name {
        font-size: 15px;
    }
}
</style>
`;

// JavaScript functions
function openScenePicker(filter = 'all') {
    const modal = document.getElementById('scene-picker-modal');
    if (!modal) {
        // Inject HTML if not present
        document.body.insertAdjacentHTML('beforeend', scenePickerHTML);
        document.head.insertAdjacentHTML('beforeend', scenePickerStyles);
    }

    renderSceneList(filter);
    document.getElementById('scene-picker-modal').style.display = 'flex';

    // Setup tab listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderSceneList(e.target.dataset.filter);
        });
    });
}

function closeScenePicker() {
    document.getElementById('scene-picker-modal').style.display = 'none';
}

function renderSceneList(filter) {
    const list = document.getElementById('scene-list');
    const allScenes = frank.sceneManager.getAllScenesAcrossVariants();

    let scenes = allScenes;
    if (filter === 'mine') {
        scenes = allScenes.filter(s => !s.isFromOtherVariant);
    } else if (filter === 'others') {
        scenes = allScenes.filter(s => s.isFromOtherVariant);
    }

    if (scenes.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No scenes found</div>';
        return;
    }

    list.innerHTML = scenes.map(scene => `
        <div class="scene-card" onclick="selectSceneFromPicker('${scene.id}', '${scene.sourceVariant}', ${scene.isFromOtherVariant})">
            <div class="scene-icon">${getSceneIcon(scene)}</div>
            <div class="scene-info">
                <div class="scene-name">${scene.name}</div>
                <div class="scene-meta">
                    ${scene.grid.filter(c => c.occupantId).length} items • 
                    ${scene.sourceVariant.toUpperCase()} • 
                    ${new Date(scene.timestamp).toLocaleDateString()}
                </div>
            </div>
            ${scene.isFromOtherVariant ? '<span class="scene-badge">IMPORT</span>' : ''}
        </div>
    `).join('');
}

function getSceneIcon(scene) {
    const icons = {
        terminal: '◻',
        unified: '◼',
        olog: '▪',
        tetrad: '▫'
    };
    return icons[scene.sourceVariant] || '◻';
}

function selectSceneFromPicker(sceneId, sourceVariant, isImport) {
    if (isImport) {
        const imported = frank.sceneManager.importSceneFromVariant(sceneId, sourceVariant);
        if (imported) {
            frank.switchScene(imported.id);
            if (typeof renderSceneSelector === 'function') {
                renderSceneSelector();
            }
            if (typeof addSystemMsg === 'function') {
                addSystemMsg(`IMPORTED: ${imported.name}`);
            }
            alert(`Imported: ${imported.name}`);
        }
    } else {
        frank.switchScene(sceneId);
        if (typeof renderSceneSelector === 'function') {
            renderSceneSelector();
        }
    }
    closeScenePicker();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { openScenePicker, closeScenePicker };
}
