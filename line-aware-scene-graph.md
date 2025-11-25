# 🏗️ Line-Aware Scene Graph Architecture

**Problem:** Loading entire MPD as blob → no line-level control  
**Solution:** Build scene graph manually, one line at a time, with explicit lineNum structure

---

## 🎯 **The Structural Change**

### **OLD (Blob Approach):**
```javascript
// Load entire MPD at once
await viewer.loadText(entireMPD);

// Result:
scene.children = [
    Mesh(part0 + part1 + part2 + ... all merged),
    // OR
    [Group(part0), Group(part1), ...]  // But no lineNum!
]

// Post-process annotation (brittle!)
annotateModelWithLineNumbers();
```

### **NEW (Line-Aware Approach):**
```javascript
// Build scene line-by-line
const lineGroups = new Map();

for (const line of mpdLines.filter(isType1)) {
    const geometry = await loadPartGeometry(line.partFile);
    const mesh = createMeshFromLine(line, geometry);
    
    const lineGroup = new THREE.Group();
    lineGroup.name = `Line_${line.lineNum}`;
    lineGroup.userData.lineNum = line.lineNum;
    lineGroup.userData.mpdLine = line.text;
    lineGroup.add(mesh);
    
    lineGroups.set(line.lineNum, lineGroup);
    scene.add(lineGroup);
}

// Result:
scene.children = [
    Group(lineNum: 22, name: "Line_22"),
    Group(lineNum: 30, name: "Line_30"),
    Group(lineNum: 38, name: "Line_38"),
    // ... explicit 1:1 mapping!
]
```

---

## 📊 **Scene Graph Structure**

```
THREE.Scene
├── Group (lineNum: 22)
│   ├── userData: { lineNum: 22, partId: "15561.dat", visible: false }
│   └── Mesh (geometry, material)
│       └── userData: { lineNum: 22 } ← inherited
├── Group (lineNum: 30)
│   ├── userData: { lineNum: 30, partId: "5306.dat", visible: false }
│   └── Mesh
├── Group (lineNum: 38)
│   └── Mesh
└── ... (30 groups total)
```

**Benefits:**
- `scene.children[i].userData.lineNum` is ALWAYS correct
- Can show/hide by line: `lineGroups.get(22).visible = true`
- Sample studs per line: `sampleGeometry(lineGroups.get(22))`
- Assembly animation: iterate lineGroups in order

---

## 🔧 **Implementation**

### **Step 1: Part Loader**
```javascript
class PartGeometryCache {
    constructor(ldrawLibraryPath) {
        this.cache = new Map();
        this.loader = new LDrawLoader();
        this.loader.setPath(ldrawLibraryPath);
    }

    async load(partFile) {
        if (this.cache.has(partFile)) {
            return this.cache.get(partFile).clone();
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                partFile,
                (group) => {
                    // Extract geometry from loaded group
                    const geometry = new THREE.BufferGeometry();
                    
                    group.traverse((child) => {
                        if (child.isMesh && child.geometry) {
                            geometry.merge(child.geometry);
                        }
                    });

                    this.cache.set(partFile, geometry);
                    resolve(geometry.clone());
                },
                undefined,
                reject
            );
        });
    }
}
```

### **Step 2: Line Compiler**
```javascript
class LineAwareSceneCompiler {
    constructor(ldrawLibraryPath) {
        this.partCache = new PartGeometryCache(ldrawLibraryPath);
        this.lineGroups = new Map();
    }

    parseLine(line, lineNum) {
        const tokens = line.trim().split(/\s+/);
        if (tokens[0] !== '1') return null;

        return {
            lineNum: lineNum,
            type: 1,
            color: parseInt(tokens[1]),
            x: parseFloat(tokens[2]),
            y: parseFloat(tokens[3]),
            z: parseFloat(tokens[4]),
            matrix: [
                parseFloat(tokens[5]), parseFloat(tokens[6]), parseFloat(tokens[7]),
                parseFloat(tokens[8]), parseFloat(tokens[9]), parseFloat(tokens[10]),
                parseFloat(tokens[11]), parseFloat(tokens[12]), parseFloat(tokens[13])
            ],
            partFile: tokens[14]
        };
    }

    async compileLine(lineData) {
        console.log(`[COMPILE] Line ${lineData.lineNum}: ${lineData.partFile}`);

        // Load part geometry
        const geometry = await this.partCache.load(lineData.partFile);

        // Apply transformation
        const matrix = new THREE.Matrix4();
        matrix.set(
            lineData.matrix[0], lineData.matrix[1], lineData.matrix[2], lineData.x,
            lineData.matrix[3], lineData.matrix[4], lineData.matrix[5], lineData.y,
            lineData.matrix[6], lineData.matrix[7], lineData.matrix[8], lineData.z,
            0, 0, 0, 1
        );
        geometry.applyMatrix4(matrix);

        // Create material
        const material = this.getLDrawMaterial(lineData.color);

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.lineNum = lineData.lineNum;

        // Create line group
        const lineGroup = new THREE.Group();
        lineGroup.name = `Line_${lineData.lineNum}`;
        lineGroup.userData.lineNum = lineData.lineNum;
        lineGroup.userData.partFile = lineData.partFile;
        lineGroup.userData.color = lineData.color;
        lineGroup.userData.position = { x: lineData.x, y: lineData.y, z: lineData.z };
        lineGroup.userData.mpdLine = `1 ${lineData.color} ${lineData.x} ${lineData.y} ${lineData.z} ...`;
        lineGroup.visible = false; // Hidden by default for assembly animation

        lineGroup.add(mesh);

        this.lineGroups.set(lineData.lineNum, lineGroup);
        return lineGroup;
    }

    async compileScene(mpdText, scene) {
        const lines = mpdText.split('\n');
        const compileTasks = [];

        for (let i = 0; i < lines.length; i++) {
            const parsed = this.parseLine(lines[i], i);
            if (parsed) {
                compileTasks.push(this.compileLine(parsed));
            }
        }

        // Compile all lines
        const groups = await Promise.all(compileTasks);

        // Add to scene in order
        groups.forEach(group => {
            scene.add(group);
        });

        console.log(`[COMPILE] ✅ Scene compiled: ${groups.length} lines`);
        return this.lineGroups;
    }

    getLDrawMaterial(colorCode) {
        const ldrawColors = {
            0: 0x000000, 1: 0x0055BF, 4: 0xC91A09, 6: 0x00AA00,
            14: 0x585858, 15: 0xFFFFFF, 72: 0xE6E6E6
        };

        return new THREE.MeshStandardMaterial({
            color: ldrawColors[colorCode] || 0x888888,
            metalness: 0.3,
            roughness: 0.7
        });
    }
}
```

### **Step 3: Assembly Line Controller**
```javascript
class AssemblyLineController {
    constructor(sceneCompiler) {
        this.compiler = sceneCompiler;
        this.currentLine = 0;
        this.lineOrder = [];
    }

    initialize(lineGroups) {
        // Get sorted line numbers
        this.lineOrder = Array.from(lineGroups.keys()).sort((a, b) => a - b);
        this.currentLine = 0;

        // Hide all lines initially
        this.lineOrder.forEach(lineNum => {
            lineGroups.get(lineNum).visible = false;
        });
    }

    revealNextLine() {
        if (this.currentLine >= this.lineOrder.length) {
            console.log('[ASSEMBLY] ✅ Complete!');
            return false;
        }

        const lineNum = this.lineOrder[this.currentLine];
        const group = this.compiler.lineGroups.get(lineNum);

        if (group) {
            group.visible = true;
            console.log(`[ASSEMBLY] Revealed line ${lineNum}: ${group.userData.partFile}`);
            
            // Emit event for overlay updates
            this.dispatchEvent('line-revealed', {
                lineNum: lineNum,
                group: group,
                progress: (this.currentLine + 1) / this.lineOrder.length
            });
        }

        this.currentLine++;
        return true;
    }

    revealUpToLine(targetLineNum) {
        this.lineOrder.forEach(lineNum => {
            const group = this.compiler.lineGroups.get(lineNum);
            group.visible = lineNum <= targetLineNum;
        });
        
        this.currentLine = this.lineOrder.indexOf(targetLineNum) + 1;
    }

    hideFromLine(startLineNum) {
        this.lineOrder.forEach(lineNum => {
            if (lineNum >= startLineNum) {
                this.compiler.lineGroups.get(lineNum).visible = false;
            }
        });
    }

    reset() {
        this.currentLine = 0;
        this.lineOrder.forEach(lineNum => {
            this.compiler.lineGroups.get(lineNum).visible = false;
        });
    }

    dispatchEvent(type, data) {
        window.dispatchEvent(new CustomEvent('assembly-line', {
            detail: { type, ...data }
        }));
    }
}
```

### **Step 4: Per-Line Stud Sampling**
```javascript
class LineAwareStudSampler {
    constructor(sceneCompiler) {
        this.compiler = sceneCompiler;
    }

    sampleLine(lineNum) {
        const group = this.compiler.lineGroups.get(lineNum);
        if (!group) return [];

        const studs = [];
        const gridMap = new Map();
        const pos = new THREE.Vector3();

        // Sample only this line's geometry
        group.traverse((obj) => {
            if (!obj.isMesh || !obj.geometry) return;

            obj.updateWorldMatrix(true, false);
            const position = obj.geometry.attributes.position;

            for (let i = 0; i < position.count; i++) {
                pos.fromBufferAttribute(position, i);
                pos.applyMatrix4(obj.matrixWorld);

                const gx = Math.round(pos.x / 20);
                const gz = Math.round(pos.z / 20);
                const gridKey = `${gx},${gz}`;

                if (!gridMap.has(gridKey)) {
                    gridMap.set(gridKey, { gx, gz, sumX: 0, sumY: 0, sumZ: 0, count: 0 });
                }

                const cell = gridMap.get(gridKey);
                cell.sumX += pos.x;
                cell.sumY += pos.y;
                cell.sumZ += pos.z;
                cell.count++;
            }
        });

        // Create stud nodes
        gridMap.forEach(cell => {
            if (cell.count >= 6) {  // Minimum votes
                studs.push({
                    kind: 'stud',
                    x: cell.sumX / cell.count,
                    y: cell.sumY / cell.count,
                    z: cell.sumZ / cell.count,
                    gridX: cell.gx,
                    gridZ: cell.gz,
                    layer: Math.round((cell.sumY / cell.count) / 8),
                    lineNum: lineNum  // ✅ Correctly bound!
                });
            }
        });

        console.log(`[SAMPLE] Line ${lineNum}: ${studs.length} studs`);
        return studs;
    }

    sampleAllLines() {
        const allStuds = [];

        this.compiler.lineGroups.forEach((group, lineNum) => {
            const lineStuds = this.sampleLine(lineNum);
            allStuds.push(...lineStuds);
        });

        console.log(`[SAMPLE] Total: ${allStuds.length} studs across ${this.compiler.lineGroups.size} lines`);
        return allStuds;
    }
}
```

---

## 🎯 **Usage Example**

```javascript
// Initialize
const compiler = new LineAwareSceneCompiler('/path/to/ldraw/');
const lineGroups = await compiler.compileScene(mpdText, scene);
const assembly = new AssemblyLineController(compiler);
const sampler = new LineAwareStudSampler(compiler);

// Assembly animation
assembly.initialize(lineGroups);
setInterval(() => {
    assembly.revealNextLine();
}, 1000);

// Sample studs per line
const studsLine22 = sampler.sampleLine(22);
const allStuds = sampler.sampleAllLines();

// Jump to specific line
assembly.revealUpToLine(38);

// Query scene
const line30Group = lineGroups.get(30);
console.log(line30Group.userData.partFile); // "5306.dat"
console.log(line30Group.visible); // true/false
```

---

## ✅ **What This Solves**

1. **Red Bull Pathology** → NO MORE! Each line has explicit lineNum from construction
2. **Assembly Animation** → Just toggle `group.visible` per line
3. **Stud Sampling** → Sample each line's geometry independently
4. **Temporal Tracking** → Groups know their line number from birth
5. **Scene Queries** → `lineGroups.get(22)` instant access

**No post-processing annotation needed.** Scene structure IS the line structure.

---

## 🚀 **Next Step**

Integrate this into `assembly-line-single-mesh.html` to enable true line-by-line compilation!
