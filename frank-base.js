/**
 * WAG FRANK BASE LIBRARY
 * Shared foundation for all FRANK variants
 * Version: 1.0.0
 */

// ==================== SCENE MANAGER ====================

class SceneManager {
    constructor(variant) {
        this.variant = variant;
        this.storageKey = `frank-${variant}-scenes`;
        this.activeKey = `frank-${variant}-active-scene`;
        this.scenes = this.loadScenes();
        this.activeSceneId = this.loadActiveSceneId();
    }

    // Load all scenes from localStorage
    loadScenes() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('[SceneManager] Load error:', e);
            return {};
        }
    }

    // Load active scene ID
    loadActiveSceneId() {
        return localStorage.getItem(this.activeKey) || null;
    }

    // Save scenes to localStorage
    saveScenes() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scenes));
        } catch (e) {
            console.error('[SceneManager] Save error:', e);
        }
    }

    // Create new scene
    createScene(name, description = '') {
        const id = `scene-${Date.now()}`;
        const scene = {
            id,
            name: name || `Scene ${Object.keys(this.scenes).length + 1}`,
            description,
            grid: Array(81).fill(null).map((_, i) => ({ id: i, occupantId: null })),
            inbox: [],
            timestamp: Date.now(),
            variant: this.variant
        };
        this.scenes[id] = scene;
        this.saveScenes();
        return scene;
    }

    // Get scene by ID
    getScene(sceneId) {
        return this.scenes[sceneId] || null;
    }

    // Get active scene
    getActiveScene() {
        return this.activeSceneId ? this.getScene(this.activeSceneId) : null;
    }

    // Set active scene
    setActiveScene(sceneId) {
        if (this.scenes[sceneId]) {
            this.activeSceneId = sceneId;
            localStorage.setItem(this.activeKey, sceneId);
            return true;
        }
        return false;
    }

    // Update scene
    updateScene(sceneId, updates) {
        if (this.scenes[sceneId]) {
            Object.assign(this.scenes[sceneId], updates);
            this.scenes[sceneId].timestamp = Date.now();
            this.saveScenes();
            return true;
        }
        return false;
    }

    // Delete scene
    deleteScene(sceneId) {
        if (this.scenes[sceneId]) {
            delete this.scenes[sceneId];
            if (this.activeSceneId === sceneId) {
                this.activeSceneId = null;
                localStorage.removeItem(this.activeKey);
            }
            this.saveScenes();
            return true;
        }
        return false;
    }

    // List all scenes
    listScenes() {
        return Object.values(this.scenes);
    }

    // Get scene count
    getSceneCount() {
        return Object.keys(this.scenes).length;
    }

    // Load scenes from another variant
    loadScenesFromVariant(variantName) {
        try {
            const key = `frank-${variantName}-scenes`;
            const data = localStorage.getItem(key);
            if (!data) return [];

            const scenes = JSON.parse(data);
            return Object.values(scenes);
        } catch (e) {
            console.error(`[SceneManager] Error loading from ${variantName}:`, e);
            return [];
        }
    }

    // Get all scenes from all variants
    getAllScenesAcrossVariants() {
        const variants = ['terminal', 'unified', 'olog', 'tetrad'];
        const allScenes = [];

        variants.forEach(variant => {
            const scenes = this.loadScenesFromVariant(variant);
            scenes.forEach(scene => {
                allScenes.push({
                    ...scene,
                    sourceVariant: variant,
                    isFromOtherVariant: variant !== this.variant
                });
            });
        });

        return allScenes;
    }

    // Import scene from another variant
    importSceneFromVariant(sceneId, sourceVariant) {
        try {
            const key = `frank-${sourceVariant}-scenes`;
            const data = localStorage.getItem(key);
            if (!data) return null;

            const scenes = JSON.parse(data);
            const scene = scenes[sceneId];

            if (!scene) return null;

            // Create a copy in this variant
            const importedScene = {
                ...scene,
                id: `scene-${Date.now()}`, // New ID
                variant: this.variant,
                importedFrom: sourceVariant,
                originalName: scene.name,
                name: `${scene.name} (from ${sourceVariant})`
            };

            this.scenes[importedScene.id] = importedScene;
            this.saveScenes();

            console.log(`[SceneManager] Imported scene from ${sourceVariant}: ${scene.name}`);
            return importedScene;
        } catch (e) {
            console.error(`[SceneManager] Import error:`, e);
            return null;
        }
    }
}

// ==================== MESSAGE HANDLER ====================

class MessageHandler {
    constructor(variant, onMessage) {
        this.variant = variant;
        this.onMessage = onMessage;
        this.bus = null;
        this.setupBus();
    }

    // Setup BroadcastChannel
    setupBus() {
        if (typeof BroadcastChannel !== 'undefined') {
            this.bus = new BroadcastChannel('wag-frank');
            this.bus.onmessage = (event) => this.handleMessage(event.data);
            console.log(`[${this.variant}] Bus connected`);

            // Send heartbeat every 5s
            setInterval(() => this.sendHeartbeat(), 5000);
        } else {
            console.warn(`[${this.variant}] BroadcastChannel not supported`);
        }
    }

    // Handle incoming message
    handleMessage(packet) {
        if (!packet || !packet.kind) return;

        console.log(`[${this.variant}] Received:`, packet.kind, packet);

        // Add metadata
        packet.receivedAt = Date.now();
        packet.receivedBy = this.variant;

        // Call user handler
        if (this.onMessage) {
            this.onMessage(packet);
        }
    }

    // Send message
    send(kind, payload, sceneId = null) {
        if (!this.bus) {
            console.warn('[MessageHandler] Bus not available');
            return false;
        }

        const packet = {
            kind,
            source: this.variant,
            sceneId,
            payload,
            timestamp: Date.now()
        };

        this.bus.postMessage(packet);
        console.log(`[${this.variant}] Sent:`, packet);
        return true;
    }

    // Send heartbeat
    sendHeartbeat() {
        if (this.bus) {
            this.bus.postMessage({
                kind: 'frank-heartbeat',
                source: this.variant,
                timestamp: Date.now()
            });
        }
    }

    // Close bus
    close() {
        if (this.bus) {
            this.bus.close();
            this.bus = null;
        }
    }
}

// ==================== FRANK BASE ====================

class FrankBase {
    constructor(variant, options = {}) {
        this.variant = variant;
        this.options = options;

        // Initialize managers
        this.sceneManager = new SceneManager(variant);
        this.messageHandler = new MessageHandler(variant, (packet) => this.onMessage(packet));

        // State
        this.grid = this.createGrid();
        this.inbox = [];
        this.selectedInboxId = null;

        // Initialize default scene if none exist
        if (this.sceneManager.getSceneCount() === 0) {
            const defaultScene = this.sceneManager.createScene('Default Scene', 'Initial workspace');
            this.sceneManager.setActiveScene(defaultScene.id);
        }

        // Load active scene
        this.loadActiveScene();

        console.log(`[FrankBase] Initialized variant: ${variant}`);
    }

    // Create grid (9x9 = 81 cells)
    createGrid() {
        const grid = [];
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            grid.push({
                id: i,
                label: `${String.fromCharCode(65 + row)}${col + 1}`,
                row,
                col,
                occupantId: null
            });
        }
        return grid;
    }

    // Handle incoming message
    onMessage(packet) {
        // Filter by scene if sceneId specified
        const activeScene = this.sceneManager.getActiveScene();
        if (packet.sceneId && activeScene && packet.sceneId !== activeScene.id) {
            console.log(`[FrankBase] Message filtered (scene mismatch): ${packet.sceneId} !== ${activeScene.id}`);
            return;
        }

        // Add to inbox
        this.inbox.push(packet);

        // Update scene inbox
        if (activeScene) {
            activeScene.inbox.push(packet);
            this.sceneManager.updateScene(activeScene.id, { inbox: activeScene.inbox });
        }

        // Notify subclass
        this.onInboxUpdate(packet);
    }

    // Load active scene into grid
    loadActiveScene() {
        const scene = this.sceneManager.getActiveScene();
        if (!scene) return;

        // Restore grid state
        scene.grid.forEach((cell, i) => {
            this.grid[i].occupantId = cell.occupantId;
        });

        // Restore inbox
        this.inbox = [...scene.inbox];

        console.log(`[FrankBase] Loaded scene: ${scene.name}`);
        this.onSceneLoad(scene);
    }

    // Save current state to active scene
    saveActiveScene() {
        const scene = this.sceneManager.getActiveScene();
        if (!scene) return false;

        // Save grid state
        const gridState = this.grid.map(cell => ({
            id: cell.id,
            occupantId: cell.occupantId
        }));

        // Update scene
        this.sceneManager.updateScene(scene.id, {
            grid: gridState,
            inbox: this.inbox
        });

        console.log(`[FrankBase] Saved scene: ${scene.name}`);
        return true;
    }

    // Switch to different scene
    switchScene(sceneId) {
        // Save current scene first
        this.saveActiveScene();

        // Switch
        if (this.sceneManager.setActiveScene(sceneId)) {
            this.loadActiveScene();
            this.onSceneSwitch(sceneId);
            return true;
        }
        return false;
    }

    // Assign packet to grid cell
    assignToCell(cellIndex, packetId) {
        const packet = this.inbox.find(p => p.id === packetId);
        if (!packet) return false;

        this.grid[cellIndex].occupantId = packetId;
        this.saveActiveScene();
        return true;
    }

    // Clear grid cell
    clearCell(cellIndex) {
        this.grid[cellIndex].occupantId = null;
        this.saveActiveScene();
    }

    // Generate unique color from string
    getColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${Math.abs(hash % 360)}, 85%, 60%)`;
    }

    // Hooks for subclasses to override
    onSceneLoad(scene) { }
    onSceneSwitch(sceneId) { }
    onInboxUpdate(packet) { }
}

// ==================== UTILITY ====================

// Generate scene selector HTML
function createSceneSelectorHTML() {
    return `
        <div id="scene-bar" style="display: flex; gap: 8px; align-items: center; padding: 8px; background: var(--bg-surface, #0a0a0a); border-bottom: 1px solid var(--border, #222);">
            <label style="font-size: 10px; color: var(--text-muted, #666); text-transform: uppercase; letter-spacing: 1px;">SCENE:</label>
            <select id="scene-select" style="flex: 1; background: var(--bg-panel, #0f0f0f); border: 1px solid var(--border, #222); color: var(--text, #e0e0e0); padding: 6px; font-family: inherit; font-size: 11px; cursor: pointer;">
                <option value="">Select scene...</option>
            </select>
            <button id="btn-new-scene" style="background: var(--bg-panel, #0f0f0f); border: 1px solid var(--border, #222); color: var(--text, #e0e0e0); padding: 6px 12px; font-family: inherit; font-size: 10px; cursor: pointer;">+ NEW</button>
            <button id="btn-save-scene" style="background: var(--bg-panel, #0f0f0f); border: 1px solid var(--border, #222); color: var(--accent, #0f0); padding: 6px 12px; font-family: inherit; font-size: 10px; cursor: pointer;">💾 SAVE</button>
        </div>
    `;
}

// Populate scene selector
function populateSceneSelector(sceneManager, selectElement) {
    const scenes = sceneManager.listScenes();
    const activeSceneId = sceneManager.activeSceneId;

    selectElement.innerHTML = '<option value="">Select scene...</option>';

    scenes.forEach(scene => {
        const option = document.createElement('option');
        option.value = scene.id;
        option.textContent = scene.name;
        if (scene.id === activeSceneId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

// Export for use in variants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrankBase, SceneManager, MessageHandler, createSceneSelectorHTML, populateSceneSelector };
}
