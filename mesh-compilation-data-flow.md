# 🔬 Mesh Compilation Data Flow: Line Context Tracing

**File:** `wag-courage.html`  
**Objective:** Trace where `userData.lineNum` is set and where it's lost during Red Bull sampling

---

## 📊 **The Data Flow Map**

### **1. Full MPD Compilation (✅ Works)**

#### **Step 1: MPD Parse** (Line ~3524)
```javascript
// Parse MPD to track line numbers
const lineMap = [];
editorLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed && trimmed.startsWith('1 ')) {
        lineMap.push({ originalLineIdx: idx, lineContent: line });
    }
});
STATE.currentLineMap = lineMap;
```
**Status:** ✅ Line context tracked

#### **Step 2: Load into Viewer** (Line ~9267)
```javascript
// CRITICAL: Enable separate objects so we get a Group per part
if (STATE.viewer && STATE.viewer.loader) {
    STATE.viewer.loader.separateObjects = true; // ✅ One Group per part
}

const result = await STATE.viewer.loadText(normalizedText, { ...meta });
```
**Status:** ✅ Groups created per part, BUT **no lineNum in metadata**

#### **Step 3: Post-Load Annotation** (Line ~3877)
```javascript
// Called AFTER loadText completes
function annotateModelWithLineNumbers() {
    const partGroups = modelRoot.children.filter(c => c.isGroup || c.isMesh);
    
    partGroups.forEach((group, idx) => {
        if (idx < STATE.currentLineMap.length) {
            const lineNum = STATE.currentLineMap[idx].originalLineIdx;
            
            // ✅ Assign to group
            group.userData.lineNum = lineNum;
            
            // ✅ Assign to all child meshes
            group.traverse(child => {
                if (child.isMesh) {
                    child.userData.lineNum = lineNum; // ✅ THIS IS THE KEY!
                }
            });
        }
    });
}
```
**Status:** ✅ **All meshes get userData.lineNum AFTER load**

#### **Step 4: Stud Skeleton Sampling** (Line ~3946)
```javascript
function computeStudSkeletonAndPlanes() {
    modelRoot.traverse(obj => {
        if (!obj.isMesh) return;
        
        // ✅ Read lineNum from mesh
        const lineNum = obj.userData && typeof obj.userData.lineNum === 'number' 
            ? obj.userData.lineNum 
            : null;
        
        // Sample vertices and bucket by grid
        for (let i = 0; i < position.count; i++) {
            // ...
            layer.lineNums.add(lineNum); // ✅ Preserved!
        }
    });
    
    // Create studs with lineNum
    studs.push({
        kind: 'stud',
        gridX: col.gx,
        gridZ: col.gz,
        layer: layerIndex,
        worldPos: { x: cx, y: cy, z: cz },
        lineNum: partLine // ✅ Stud has correct lineNum!
    });
}
```
**Status:** ✅ **Studs correctly tagged with lineNum**

---

## 🐂 **Red Bull Micro-MPD Compilation (❌ Broken)**

### **The Problem: No Post-Load Annotation**

Red Bull does NOT exist yet in wag-courage.html! The user mentioned `debugRedBullLineSampler` around line 4133, but grep found nothing. This means:

1. **Either Red Bull is in a different file**
2. **Or it's named differently**
3. **Or the user's description is from a DIFFERENT version of Courage**

### **Hypothetical Red Bull Flow (Based on User Description)**

```javascript
// HYPOTHETICAL - NOT FOUND IN CODE
async function debugRedBullLineSampler() {
    for (let idx of partLines) {
        const header = "0 FILE redbull_line_" + idx + ".mpd\n";
        const body = mpdLines[idx]; // One type-1 line
        const text = header + '\n' + body + '\n';
        
        // ❌ Load micro-MPD
        await STATE.viewer.loadText(text, {
            filename: 'redbull_line_' + idx + '.mpd',
            name: 'redbull-line-' + idx,
            origin: 'RedBull(line ' + idx + ')'
            // ❌ NO lineNum passed!
        });
        
        // ❌ computeStudSkeletonAndPlanes() called immediately
        // NO annotateModelWithLineNumbers() step!
        computeStudSkeletonAndPlanes();
        
        // Result: meshes have NO userData.lineNum
        // Falls back to global grid
        // All studs tagged with wrong lineNum
    }
}
```

---

## 🔧 **The Fix**

Red Bull needs to call `annotateModelWithLineNumbers()` after each `loadText()`:

```javascript
async function debugRedBullLineSampler() {
    for (let idx of partLines) {
        const text = createMicroMPD(idx);
        
        await STATE.viewer.loadText(text, { ... });
        
        // ✅ FIX: Annotate meshes with line context!
        const modelRoot = STATE.viewer.modelRoot || STATE.viewer.scene;
        modelRoot.traverse(obj => {
            if (obj.isMesh) {
                obj.userData.lineNum = idx; // ✅ Tag with current line!
            }
        });
        
        // Now sampling will work correctly
        computeStudSkeletonAndPlanes();
        
        const nodesForThisLine = STATE.studSkeleton.map(s => ({
            ...s,
            lineNum: idx // Already correct from mesh
        }));
        
        allNodes.push(...nodesForThisLine);
    }
}
```

---

## 📋 **Critical Questions**

1. **Where IS Red Bull?** 
   - Not found in wag-courage.html
   - Different file? Different name?

2. **Does Red Bull call `annotateModelWithLineNumbers()`?**
   - If NO → **This is the bug**
   - If YES → Different issue

3. **Can `loadText()` accept userData?**
   - Check BetaPrimeEngine source
   - If YES → Pass `{ userData: { lineNum: idx } }`
   - If NO → Must annotate post-load

---

## 🎯 **The Smoking Gun**

**Line 3887:** `child.userData.lineNum = lineNum;`

This is where meshes get their line numbers in **full MPD mode**.  
Red Bull **must** do this same step **per micro-MPD**.

Without this, `computeStudSkeletonAndPlanes()` at line 3946 reads:
```javascript
const lineNum = obj.userData && typeof obj.userData.lineNum === 'number' 
    ? obj.userData.lineNum 
    : null; // ❌ Always null in Red Bull!
```

Result: All studs have `lineNum: null`, fallback picks arbitrary lines.

---

## 🔍 **Next Steps**

1. **Find Red Bull code** - search for:
   - "micro-MPD"
   - "redbull"
   - "line sampler"
   - "fallback sampler"

2. **Verify it calls annotateModelWithLineNumbers()**
   - If not → **add it**

3. **Test fix:**
   - Load Other_563.mpd
   - Run Red Bull
   - Check `STATE.studSkeleton[0].lineNum`
   - Should be actual line number, not null/22

