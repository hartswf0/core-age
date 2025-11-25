# ⏱️ Temporal Mesh Creation Instrumentation

**Question:** Can we encode time in mesh geometry and watch when parts are made?

**Answer:** YES - through instrumentation, vertex attributes, and creation events!

---

## 🔍 **Three Ways to Encode Time**

### **1. userData Timestamps (CPU-side)**
```javascript
// Simplest: tag mesh with creation time
const mesh = new THREE.Mesh(geometry, material);
mesh.userData._createdAt = performance.now();
mesh.userData._createdBy = 'compiler';
mesh.userData._batchId = 'line_22';
```

### **2. Vertex Attributes (GPU-side)**
```javascript
// Encode creation time PER VERTEX
const positions = geometry.attributes.position;
const timestamps = new Float32Array(positions.count);

const creationTime = performance.now();
for (let i = 0; i < timestamps.length; i++) {
    timestamps[i] = creationTime;
}

geometry.setAttribute('timestamp', new THREE.BufferAttribute(timestamps, 1));

// Now each vertex knows when it was born!
```

### **3. Creation Event Stream**
```javascript
// Watch mesh creation in real-time
const MESH_CREATION_LOG = [];

THREE.Mesh = new Proxy(OriginalMesh, {
    construct(target, args) {
        const mesh = new target(...args);
        const now = performance.now();
        
        // Log creation event
        MESH_CREATION_LOG.push({
            mesh: mesh,
            timestamp: now,
            geometry: args[0],
            material: args[1],
            vertexCount: args[0]?.attributes.position?.count || 0
        });
        
        console.log(`[MESH-BORN] ${now.toFixed(2)}ms: ${mesh.geometry.attributes.position.count} vertices`);
        
        return mesh;
    }
});
```

---

## 🎬 **Watching Mesh Creation (Real-Time)**

### **Approach 1: BufferGeometry Proxy**
```javascript
// Intercept geometry creation
const GeometryCreationWatcher = {
    log: [],
    
    watch() {
        const OriginalBufferGeometry = THREE.BufferGeometry;
        
        THREE.BufferGeometry = function() {
            const geometry = new OriginalBufferGeometry();
            const now = performance.now();
            
            geometry.userData._createdAt = now;
            geometry.userData._id = `geom_${Date.now()}_${Math.random()}`;
            
            GeometryCreationWatcher.log.push({
                id: geometry.userData._id,
                timestamp: now,
                geometry: geometry
            });
            
            console.log(`[GEOMETRY-CREATED] ${now.toFixed(2)}ms`);
            
            return geometry;
        };
        
        THREE.BufferGeometry.prototype = OriginalBufferGeometry.prototype;
        
        // Watch setAttribute calls
        const originalSetAttribute = THREE.BufferGeometry.prototype.setAttribute;
        THREE.BufferGeometry.prototype.setAttribute = function(name, attribute) {
            console.log(`[ATTRIBUTE-SET] ${name}: ${attribute.count} items at ${performance.now().toFixed(2)}ms`);
            return originalSetAttribute.call(this, name, attribute);
        };
    }
};

GeometryCreationWatcher.watch();
```

### **Approach 2: Compile-Time Instrumentation**
```javascript
async function compileLineWithTiming(lineData, lineNum) {
    const events = [];
    const t0 = performance.now();
    
    events.push({ event: 'compile-start', t: t0, lineNum });
    
    // Load part geometry
    const t1 = performance.now();
    const geometry = await partCache.load(lineData.partFile);
    events.push({ event: 'geometry-loaded', t: t1, dt: t1 - t0, vertices: geometry.attributes.position.count });
    
    // Apply transformation
    const t2 = performance.now();
    geometry.applyMatrix4(transformMatrix);
    events.push({ event: 'transform-applied', t: t2, dt: t2 - t1 });
    
    // Create material
    const t3 = performance.now();
    const material = getLDrawMaterial(lineData.color);
    events.push({ event: 'material-created', t: t3, dt: t3 - t2 });
    
    // Create mesh
    const t4 = performance.now();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData._compilationEvents = events;
    events.push({ event: 'mesh-created', t: t4, dt: t4 - t3 });
    
    const total = t4 - t0;
    console.log(`[COMPILE-TIMING] Line ${lineNum}: ${total.toFixed(2)}ms`, events);
    
    return mesh;
}
```

### **Approach 3: Vertex Birth Tracking**
```javascript
// Tag EACH VERTEX with its creation time
function createTemporalGeometry(positions, normals) {
    const geometry = new THREE.BufferGeometry();
    const now = performance.now();
    
    // Standard attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    // TEMPORAL ATTRIBUTE: birth time per vertex
    const vertexBirthTimes = new Float32Array(positions.length / 3);
    vertexBirthTimes.fill(now);
    geometry.setAttribute('birthTime', new THREE.BufferAttribute(vertexBirthTimes, 1));
    
    // TEMPORAL ATTRIBUTE: line number per vertex
    const lineNums = new Float32Array(positions.length / 3);
    lineNums.fill(currentLineNum);
    geometry.setAttribute('lineNum', new THREE.BufferAttribute(lineNums, 1));
    
    return geometry;
}

// Shader can now USE birth time!
const shader = `
    attribute float birthTime;
    attribute float lineNum;
    uniform float currentTime;
    
    void main() {
        float age = currentTime - birthTime;
        
        // Fade in based on age
        float opacity = clamp(age / 1000.0, 0.0, 1.0);
        
        // Color based on line number
        vec3 color = vec3(
            mod(lineNum / 10.0, 1.0),
            mod(lineNum / 20.0, 1.0),
            mod(lineNum / 30.0, 1.0)
        );
        
        gl_FragColor = vec4(color, opacity);
    }
`;
```

---

## 🎯 **Real-Time Mesh Birth Visualizer**

```javascript
class MeshBirthVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.birthLog = [];
        this.startTime = performance.now();
    }

    // Watch all mesh additions to scene
    watchScene() {
        const originalAdd = this.scene.add.bind(this.scene);
        
        this.scene.add = (...objects) => {
            objects.forEach(obj => {
                if (obj.isMesh) {
                    this.onMeshBorn(obj);
                } else if (obj.isGroup) {
                    obj.traverse(child => {
                        if (child.isMesh) this.onMeshBorn(child);
                    });
                }
            });
            return originalAdd(...objects);
        };
    }

    onMeshBorn(mesh) {
        const now = performance.now();
        const age = now - this.startTime;
        
        mesh.userData._bornAt = now;
        mesh.userData._ageAtBirth = age;
        
        this.birthLog.push({
            mesh: mesh,
            timestamp: now,
            age: age,
            lineNum: mesh.userData.lineNum,
            vertexCount: mesh.geometry.attributes.position.count
        });
        
        console.log(`[MESH-BIRTH] Line ${mesh.userData.lineNum || '?'} born at ${age.toFixed(0)}ms (${mesh.geometry.attributes.position.count} vertices)`);
        
        // Visual feedback: pulse the mesh
        this.birthAnimation(mesh);
        
        // Emit event
        window.dispatchEvent(new CustomEvent('mesh-born', {
            detail: {
                mesh: mesh,
                lineNum: mesh.userData.lineNum,
                timestamp: now
            }
        }));
    }

    birthAnimation(mesh) {
        const originalScale = mesh.scale.clone();
        mesh.scale.set(0.1, 0.1, 0.1);
        
        const duration = 500;
        const startTime = performance.now();
        
        function animate() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out
            const t = 1 - Math.pow(1 - progress, 3);
            mesh.scale.lerpVectors(new THREE.Vector3(0.1, 0.1, 0.1), originalScale, t);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    }

    getTimeline() {
        return this.birthLog.map(entry => ({
            lineNum: entry.lineNum,
            timestampMs: entry.timestamp.toFixed(2),
            ageMs: entry.age.toFixed(2),
            vertices: entry.vertexCount
        }));
    }

    replay(speed = 1.0) {
        console.log('[REPLAY] Starting mesh birth replay...');
        
        this.birthLog.forEach((entry, index) => {
            setTimeout(() => {
                console.log(`[REPLAY] ${index + 1}/${this.birthLog.length}: Line ${entry.lineNum} (${entry.age.toFixed(0)}ms)`);
                this.birthAnimation(entry.mesh);
            }, entry.age / speed);
        });
    }
}

// Usage
const visualizer = new MeshBirthVisualizer(scene);
visualizer.watchScene();

// Compile scene...
// Each mesh birth is logged and animated!

// Replay creation sequence
visualizer.replay(2.0); // 2x speed
```

---

## 📊 **Temporal Query API**

```javascript
// Find all meshes created in a time range
function getMeshesCreatedBetween(startTime, endTime) {
    const meshes = [];
    scene.traverse(obj => {
        if (obj.isMesh && obj.userData._createdAt) {
            const t = obj.userData._createdAt;
            if (t >= startTime && t <= endTime) {
                meshes.push(obj);
            }
        }
    });
    return meshes;
}

// Get mesh creation rate
function getMeshCreationRate() {
    const timestamps = [];
    scene.traverse(obj => {
        if (obj.isMesh && obj.userData._createdAt) {
            timestamps.push(obj.userData._createdAt);
        }
    });
    
    timestamps.sort((a, b) => a - b);
    
    if (timestamps.length < 2) return 0;
    
    const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
    return timestamps.length / (totalTime / 1000); // meshes per second
}

// Find slowest mesh to compile
function getSlowestMesh() {
    let slowest = null;
    let maxTime = 0;
    
    scene.traverse(obj => {
        if (obj.isMesh && obj.userData._compilationEvents) {
            const events = obj.userData._compilationEvents;
            const total = events[events.length - 1].t - events[0].t;
            
            if (total > maxTime) {
                maxTime = total;
                slowest = { mesh: obj, time: total, events };
            }
        }
    });
    
    return slowest;
}
```

---

## 🎨 **Visualization: Mesh Birth Waterfall**

```javascript
function drawMeshBirthWaterfall() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;
    
    const birthLog = visualizer.birthLog;
    if (birthLog.length === 0) return;
    
    const maxTime = birthLog[birthLog.length - 1].age;
    const barHeight = canvas.height / birthLog.length;
    
    birthLog.forEach((entry, i) => {
        const x = 0;
        const y = i * barHeight;
        const w = (entry.age / maxTime) * canvas.width;
        
        // Color by line number
        const hue = ((entry.lineNum || 0) * 137.5) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fillRect(x, y, w, barHeight - 1);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`L${entry.lineNum} (${entry.age.toFixed(0)}ms)`, x + 4, y + barHeight / 2 + 3);
    });
    
    document.body.appendChild(canvas);
}
```

---

## 🚀 **Integration Example**

```javascript
// Watch compilation
const visualizer = new MeshBirthVisualizer(scene);
visualizer.watchScene();

GeometryCreationWatcher.watch();

// Compile scene
const compiler = new LineAwareSceneCompiler('/ldraw/');
await compiler.compileScene(mpdText, scene);

// View timeline
console.table(visualizer.getTimeline());

// Check performance
console.log('Mesh creation rate:', getMeshCreationRate(), 'meshes/sec');
console.log('Slowest mesh:', getSlowestMesh());

// Draw waterfall
drawMeshBirthWaterfall();

// Replay creation
visualizer.replay(0.5); // Half speed replay
```

---

## ✅ **What You Get**

1. **userData timestamps** - Every mesh knows when it was created
2. **Vertex attributes** - Each vertex knows its birth time
3. **Real-time watching** - Console logs mesh creation as it happens
4. **Event stream** - Listen to `mesh-born` events
5. **Timeline replay** - Re-animate creation sequence
6. **Performance analysis** - Find slow compilations
7. **Waterfall charts** - Visualize temporal flow

**Mesh geometry CAN encode time** - through custom attributes, userData, and instrumentation!
