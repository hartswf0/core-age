# Pathology Report Verification Guide

## What Gets Reported

When you export a corrected GOLD file, the `_skeleton_pathology_report` contains these diagnostic metrics:

### 1. **MPD Line Counts**
```json
{
  "mpd_lines_count": 259,        // Total lines in mpd_content
  "part_lines_count": 30         // Lines that are type-1 parts (start with "1 ")
}
```

### 2. **Original Distribution (Before Fix)**
```json
{
  "original_distribution": {
    "distinct_lines": 1,          // How many unique lineNum values
    "top_line": 22,               // Which line owns the most studs
    "top_count": 2420,            // How many studs that line owns
    "top_percentage": 100.0,      // Percentage of all studs
    "histogram": {                // Full distribution
      "22": 2420                  // lineNum: count
    }
  }
}
```

### 3. **Corrected Distribution (After Fix)**
```json
{
  "corrected_distribution": {
    "distinct_lines": 30,         // Now spread across 30 lines
    "top_line": 38,               // New dominant line (much lower %)
    "top_count": 127,             // Fewer studs on any single line
    "top_percentage": 5.2,        // Much healthier distribution
    "histogram": {                // Full distribution after fix
      "30": 81,
      "38": 127,
      "46": 77,
      "54": 92,
      ...                         // All 30 lines listed
    }
  }
}
```

### 4. **Severity Classification**
```json
{
  "severity": "CRITICAL"          // or "WARNING" or "HEALTHY"
}
```

**Severity Rules:**
- `CRITICAL`: One line owns ≥90% of studs
- `WARNING`: One line owns ≥70% of studs, or ≤2 distinct lines total
- `HEALTHY`: Studs properly distributed

## Example: Actual Report from Other_110

Based on your exported file name, here's what the report should contain:

```json
{
  "_skeleton_pathology_report": {
    "detected_at": "2025-11-22T05:18:01.511Z",
    "corrected_by": "MPD Data Explorer Synthetic Redistributor v1.0",
    "severity": "CRITICAL",
    
    "original_distribution": {
      "distinct_lines": 1,
      "top_line": 22,
      "top_count": 2420,
      "top_percentage": 100.0,
      "histogram": {
        "22": 2420
      }
    },
    
    "corrected_distribution": {
      "distinct_lines": 30,
      "top_line": 38,
      "top_count": 127,
      "top_percentage": 5.2,
      "histogram": {
        "30": 81,
        "38": 127,
        "46": 77,
        "54": 92,
        "62": 68,
        ...
      }
    },
    
    "mpd_lines_count": 259,
    "part_lines_count": 30,
    
    "correction_method": "spatial_proximity_3d_euclidean",
    "recommendation": "Regenerate from source using per-line stud sampler (Courage v9+) for canonical skeleton"
  }
}
```

## How to Verify

1. **Open the corrected JSON file** in a text editor
2. **Search for** `"_skeleton_pathology_report"`
3. **Check these key metrics**:
   - `mpd_lines_count` should match total lines in `mpd_content`
   - `part_lines_count` should match number of type-1 lines
   - `original_distribution.histogram` shows studs per line BEFORE fix
   - `corrected_distribution.histogram` shows studs per line AFTER fix
   - Sum of all histogram values = total stud count

## Quick Console Check

If you load the corrected GOLD in MPD Data Explorer again:

```javascript
// In browser console:
const report = state.originalGold._skeleton_pathology_report;
console.log('MPD Lines:', report.mpd_lines_count);
console.log('Part Lines:', report.part_lines_count);
console.log('Original distinct:', report.original_distribution.distinct_lines);
console.log('Corrected distinct:', report.corrected_distribution.distinct_lines);
console.log('Full histogram:', report.corrected_distribution.histogram);
```
