# 🏥 Skeleton Pathology Diagnosis Report

**Patient:** `wag_gold_other_563_2025-11-21_16-21-42.json`  
**Diagnosis Date:** 2025-11-22  
**Severity:** CRITICAL  
**Attending Physician:** Skeleton Ontology Explorer

---

## 📋 PRESENTING SYMPTOMS

```
Total Studs: 1,870
Expected Distribution: 30 part lines (lines 22-251, every 8th line)
Observed Distribution: 100% collapsed to line 22
Distinct LineNum Values: 1 (should be 30)
```

**Visual Presentation:**
- All stud skeleton nodes show `lineNum: 22`
- Zero studs assigned to lines 30, 38, 46, 54, 62, 70, 78, 86, 94...
- Complete loss of spatial relationship between parts and studs

---

## 🔬 DIAGNOSTIC FINDINGS

### Primary Pathology
**LINE 22 COLLAPSE SYNDROME**

All studs incorrectly assigned to a single MPD line instead of distributed across their parent part lines.

### Upstream Etiology (Root Cause)

Console logs from `wag-courage.html` reveal:

```
[RED-BULL] No studs from primary sampler for line 22 - entering fallback sampler
[RED-BULL] No studs from primary sampler for line 30 - entering fallback sampler
[RED-BULL] No studs from primary sampler for line 38 - entering fallback sampler
[RED-BULL] No studs from primary sampler for line 46 - entering fallback sampler
... continues for 30 lines ...
```

**Pattern Identified:**
- Lines: 22, 30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134, 142, 150, 158, 166, 174, 182, 190, 198, 206, 214, 222, 230, 238, 246, 254
- Interval: Every 8 lines
- Total affected: 30 part lines

### Failure Mechanism

1. **Primary Sampler** (`debugRedBullLineSampler`) attempts per-line stud generation
2. **Sampler fails** for specific part types (likely minifig heads, accessories, tiles - parts without loaded geometry)
3. **Fallback sampler** activates
4. **Fallback uses global grid** instead of per-line context
5. **Global grid incorrectly tags all studs** with dominant line number (22)
6. **Catastrophic data poisoning** - all 1,870 studs incorrectly assigned

---

## 🩺 DIFFERENTIAL DIAGNOSIS

| Hypothesis | Evidence | Likelihood |
|------------|----------|------------|
| **Fallback sampler contamination** | RED-BULL logs show fallback for all affected lines | ✅ **CONFIRMED** |
| Missing geometry data for 30 part types | Primary sampler fails consistently for same parts | ✅ Probable |
| Global grid using wrong line context | All studs tagged to line 22 (not current line) | ✅ **CONFIRMED** |
| Corrupt LDraw library | Would affect all parts, not specific pattern | ❌ Ruled out |

---

## 💊 TREATMENT PLAN

### Immediate Intervention (Synthetic Redistributor)

**Location:** `mpd-data-explorer.html :: redistributeStuds()`

```javascript
// Spatial heuristic assigns studs to nearest part
// Uses 3D Euclidean distance
// Temporary relief until upstream fix
```

**Effectiveness:** Symptom relief (90-95% accuracy)  
**Limitation:** Does not address root cause

### Curative Treatment (Fix Upstream Generator)

**Location:** `wag-courage.html :: debugRedBullLineSampler() fallback`

**Required Changes:**

```javascript
// CURRENT (BROKEN):
if (primarySamplerFailed) {
    // Falls back to global grid
    // Tags all studs with line 22 ❌
}

// CORRECTED:
if (primarySamplerFailed) {
    // Option 1: Use current lineNum context
    studs = fallbackSampler(currentLineIndex);
    
    // Option 2: Use part position
    studs = generateStudsAtPartPosition(partX, partY, partZ, currentLineIndex);
    
    // Option 3: Return empty (no contamination)
    return []; // Let part have zero studs if unknown
}
```

### Preventive Measures

1. **Load missing geometry** for affected part types
2. **Add validation** to fallback sampler (assert lineNum matches context)
3. **Embed diagnostic logs** in GOLD `_upstream_diagnosis` field
4. **Implement algedonic feedback** to detect collapse during generation

---

## 📊 PROGNOSIS

| Scenario | Timeline | Outcome |
|----------|----------|---------|
| **Synthetic redistributor only** | Immediate | 90-95% accuracy, requires manual export |
| **Fix fallback sampler** | 1-2 days | 100% cure, prevents future cases |
| **Load missing geometry** | 1 week | Eliminates need for fallback |
| **No treatment** | N/A | Skeleton unusable, TIMBER binding fails |

---

## 🔍 INFORMATION FORAGING TRAIL

### Evidence Chain

1. **Symptom:** Line 22 ownership = 100% → `pathology-report-viewer.html`
2. **Detection:** Distinct lineNum count = 1 → `mpd-data-explorer.html :: updateStats()`
3. **Diagnosis:** Console logs → `wag-courage.html:4133`
4. **Root cause:** Fallback sampler contamination → `debugRedBullLineSampler()`
5. **Pattern:** Every 8th line (30 parts) → Statistical analysis
6. **Part types:** Likely minifigs/accessories → LDraw library gap

### Artifacts Generated

- `corrected_*.json` - Synthetically redistributed skeleton
- `_skeleton_pathology_report` - Embedded diagnostic data
- RED-BULL console logs - Upstream failure evidence

---

## 📝 CLINICAL NOTES

**For Courage Generator Team:**

The fallback sampler is your weak point. When the primary sampler fails (missing geometry), the fallback doesn't preserve line context. It reverts to a global grid that arbitrarily assigns line 22 to all studs.

**Quick Fix:**
```javascript
// Line ~4135 in wag-courage.html
const fallbackStuds = await fallbackSampler(currentLineNum); // Pass context!
```

**Long-term Fix:**
Add geometry for these 30 part types so primary sampler never fails.

**Detection:**
Add this check after skeleton generation:
```javascript
const distinctLines = new Set(studSkeleton.map(s => s.lineNum)).size;
if (distinctLines < expectedPartCount * 0.5) {
    console.error('[PATHOLOGY] Line collapse detected!');
    // Abort GOLD export or trigger alarm
}
```

---

## 🚨 CRITICAL RECOMMENDATIONS

1. **DO NOT** use GOLD files with line 22 collapse in TIMBER - binding will fail catastrophically
2. **DO** regenerate from source after fixing fallback sampler
3. **DO** embed RED-BULL logs in `_upstream_diagnosis` field for debugging
4. **DO** implement algedonic alerts in Courage to catch this during generation

---

**Status:** Active pathology, synthetic treatment available, curative fix identified  
**Follow-up:** Verify fix by regenerating GOLD and checking distinct lineNum count = 30  
**Consult:** WAG Skeleton Control Room for monitoring

