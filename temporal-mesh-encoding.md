# ⏱️ Temporal Mesh Encoding: Time-Based Context Preservation

**Problem:** LDView creates meshes with no MPD context  
**Solution:** Encode line numbers using **creation timestamps**

---

## 🎯 **The Temporal Solution**

### **Concept:**
Instead of manually tagging `userData.lineNum` after the fact, **intercept mesh creation** and stamp them with:
1. **Creation time** (high-resolution timestamp)
2. **Creation batch** (which loadText call)
3. **Line context** (from caller)

---

## 🔧 **Implementation: Temporal Mesh Tracker**

### **Step 1: Wrap Mesh Construction**

```javascript
// Global temporal tracker
const MESH_TIMELINE = {
    batches: [],           // Array of {startTime, endTime, lineNum, meshes}
    currentBatch: null,    // Active batch during loadText
    meshCreationLog: []    // Full chronological log
};

// Monkey-patch THREE.Mesh constructor
const OriginalMesh = THREE.Mesh;
THREE.Mesh = function(geometry, material) {
    // Call original constructor
    const mesh = new OriginalMesh(geometry, material);
    
    // Timestamp it!
    const now = performance.now();
    mesh.userData._createdAt = now;
    
    // If we're in a batch, tag it
    if (MESH_TIMELINE.currentBatch) {
        mesh.userData.lineNum = MESH_TIMELINE.currentBatch.lineNum;
        mesh.userData._batchId = MESH_TIMELINE.currentBatch.id;
        MESH_TIMELINE.currentBatch.meshes.push(mesh);
    }
    
    // Log creation
    MESH_TIMELINE.meshCreationLog.push({
        mesh: mesh,
        timestamp: now,
        batchId: MESH_TIMELINE.currentBatch?.id,
        lineNum: MESH_TIMELINE.currentBatch?.lineNum
    });
    
    console.log(`[TEMPORAL] Mesh created at ${now.toFixed(2)}ms → Line ${mesh.userData.lineNum || 'unknown'}`);
    
    return mesh;
};

// Preserve prototype
THREE.Mesh.prototype = OriginalMesh.prototype;
```

### **Step 2: Wrap loadText with Temporal Batching**

```javascript
async function loadTextWithTemporalContext(mpdText, lineNum, options = {}) {
    const batchId = `batch_${Date.now()}_${lineNum}`;
    const startTime = performance.now();
    
    // Start temporal batch
    MESH_TIMELINE.currentBatch = {
        id: batchId,
        lineNum: lineNum,
        startTime: startTime,
        meshes: [],
        mpdText: mpdText
    };
    
    console.log(`[TEMPORAL-BATCH] Starting batch ${batchId} for line ${lineNum}`);
    
    // Load the text (meshes will auto-tag themselves via monkey-patch)
    await STATE.viewer.loadText(mpdText, options);
    
    const endTime = performance.now();
    MESH_TIMELINE.currentBatch.endTime = endTime;
    MESH_TIMELINE.currentBatch.duration = endTime - startTime;
    
    // Archive batch
    MESH_TIMELINE.batches.push({...MESH_TIMELINE.currentBatch});
    
    const meshCount = MESH_TIMELINE.currentBatch.meshes.length;
    console.log(`[TEMPORAL-BATCH] Completed batch ${batchId}: ${meshCount} meshes in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Clear current batch
    MESH_TIMELINE.currentBatch = null;
    
    return meshCount;
}
```

### **Step 3: Red Bull with Temporal Encoding**

```javascript
async function redBullWithTemporalEncoding() {
    console.log('[RED-BULL-TEMPORAL] Starting temporal sampling...');
    
    const partLines = [22, 30, 38, 46, 54, 62, 70, 78]; // Example
    const allStuds = [];
    
    for (const lineNum of partLines) {
        const line = mpdLines[lineNum];
        const microMPD = `0 FILE temp_${lineNum}.mpd\n${line}\n0 NOFILE`;
        
        // Load with temporal context
        await loadTextWithTemporalContext(microMPD, lineNum, {
            filename: `micro_line_${lineNum}.mpd`
        });
        
        // Sample studs (meshes are already tagged!)
        computeStudSkeletonAndPlanes();
        
        // Collect studs with temporal metadata
        const studsForLine = STATE.studSkeleton.map(s => ({
            ...s,
            lineNum: lineNum,                    // Already set via temporal batch!
            _sampledAt: performance.now(),      // When we sampled
            _batchId: `batch_line_${lineNum}`
        }));
        
        allStuds.push(...studsForLine);
        
        // Emit temporal event
        emitTemporalEvent('redbull-line-sampled', {
            lineNum: lineNum,
            studCount: studsForLine.length,
            timestamp: performance.now(),
            batchDuration: MESH_TIMELINE.batches[MESH_TIMELINE.batches.length - 1].duration
        });
    }
    
    console.log(`[RED-BULL-TEMPORAL] Complete: ${allStuds.length} studs across ${partLines.length} lines`);
    return allStuds;
}
```

---

## 📊 **Temporal Data Structure**

```javascript
MESH_TIMELINE = {
    batches: [
        {
            id: 'batch_1732247342019_22',
            lineNum: 22,
            startTime: 1543.2,
            endTime: 1678.9,
            duration: 135.7,
            meshes: [mesh1, mesh2, mesh3],
            mpdText: '1 72 0 -24 -80 ...'
        },
        {
            id: 'batch_1732247342154_30',
            lineNum: 30,
            startTime: 1680.1,
            endTime: 1802.3,
            duration: 122.2,
            meshes: [mesh4, mesh5],
            mpdText: '1 15 20 -24 -80 ...'
        }
        // ... 30 batches total
    ],
    
    meshCreationLog: [
        { mesh: mesh1, timestamp: 1545.6, batchId: 'batch_...22', lineNum: 22 },
        { mesh: mesh2, timestamp: 1547.1, batchId: 'batch_...22', lineNum: 22 },
        { mesh: mesh3, timestamp: 1550.8, batchId: 'batch_...22', lineNum: 22 },
        { mesh: mesh4, timestamp: 1682.3, batchId: 'batch_...30', lineNum: 30 },
        // ... chronological log of all mesh creations
    ]
};
```

---

## 🔍 **Temporal Query API**

```javascript
// Find which line created a mesh
function getMeshLineNum(mesh) {
    const createdAt = mesh.userData._createdAt;
    
    // Find the batch this timestamp falls in
    const batch = MESH_TIMELINE.batches.find(b => 
        createdAt >= b.startTime && createdAt <= b.endTime
    );
    
    return batch ? batch.lineNum : null;
}

// Get all meshes for a line
function getMeshesForLine(lineNum) {
    const batch = MESH_TIMELINE.batches.find(b => b.lineNum === lineNum);
    return batch ? batch.meshes : [];
}

// Get temporal statistics
function getTemporalStats() {
    return {
        totalBatches: MESH_TIMELINE.batches.length,
        totalMeshes: MESH_TIMELINE.meshCreationLog.length,
        averageBatchDuration: MESH_TIMELINE.batches.reduce((sum, b) => sum + b.duration, 0) / MESH_TIMELINE.batches.length,
        timeline: MESH_TIMELINE.batches.map(b => ({
            lineNum: b.lineNum,
            meshCount: b.meshes.length,
            duration: b.duration.toFixed(2) + 'ms'
        }))
    };
}

// Replay temporal sequence
function* replayMeshCreation() {
    for (const entry of MESH_TIMELINE.meshCreationLog) {
        yield {
            mesh: entry.mesh,
            lineNum: entry.lineNum,
            timestamp: entry.timestamp,
            relativeTo: MESH_TIMELINE.meshCreationLog[0].timestamp
        };
    }
}
```

---

## 🎬 **Temporal Visualization**

```javascript
// Show mesh creation timeline
function drawTemporalTimeline() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const batches = MESH_TIMELINE.batches;
    const totalDuration = batches[batches.length - 1].endTime - batches[0].startTime;
    const width = 800;
    const height = 200;
    
    canvas.width = width;
    canvas.height = height;
    
    batches.forEach((batch, i) => {
        const x = ((batch.startTime - batches[0].startTime) / totalDuration) * width;
        const w = (batch.duration / totalDuration) * width;
        const y = (i % 10) * 20;
        
        // Draw batch
        ctx.fillStyle = `hsl(${(i * 360 / batches.length)}, 70%, 60%)`;
        ctx.fillRect(x, y, w, 15);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`L${batch.lineNum}`, x + 2, y + 12);
    });
    
    document.body.appendChild(canvas);
}
```

---

## ⚡ **Benefits**

1. **Automatic tagging** - No manual `traverse()` needed
2. **Temporal tracing** - Know exactly when each mesh was created
3. **Debugging** - Replay creation sequence
4. **Bus integration** - Emit events with timestamps
5. **Diff analysis** - Compare temporal patterns across samplers

---

## 🚀 **Integration with Assembly Line Viewer**

```javascript
// In assembly-line.html
function visualizeTemporalBatches() {
    MESH_TIMELINE.batches.forEach((batch, index) => {
        setTimeout(() => {
            // Highlight line in ontology explorer
            highlightLine(batch.lineNum);
            
            // Show batch info
            console.log(`[TEMPORAL-VIZ] Batch ${index + 1}/${MESH_TIMELINE.batches.length}:`, {
                line: batch.lineNum,
                meshes: batch.meshes.length,
                duration: batch.duration.toFixed(2) + 'ms',
                createdAt: batch.startTime.toFixed(2)
            });
            
            // Draw flow particle
            if (state.neuralFlow) {
                emitNeuralEvent(batch.lineNum, 'temporal-batch');
            }
        }, index * 200); // Replay at 200ms intervals
    });
}
```

---

## 🎯 **The Fix for Red Bull**

**Before (broken):**
```javascript
await viewer.loadText(microMPD);
computeStudSkeletonAndPlanes(); // ❌ No lineNum!
```

**After (temporal encoding):**
```javascript
await loadTextWithTemporalContext(microMPD, lineNum);
computeStudSkeletonAndPlanes(); // ✅ Meshes auto-tagged!
```

The timestamp encodes the MPD context **automatically**!
