# Pathology Report Schema

## Purpose
When the MPD Data Explorer redistributes studs, it embeds a comprehensive pathology report in the exported GOLD file. This tells the upstream generator (Courage) exactly what was broken and how it was fixed.

## Report Structure

```json
{
  "_skeleton_pathology_report": {
    "detected_at": "2025-11-22T00:11:00.000Z",
    "corrected_by": "MPD Data Explorer Synthetic Redistributor v1.0",
    "severity": "CRITICAL | WARNING | HEALTHY",
    
    "original_distribution": {
      "distinct_lines": 1,
      "top_line": 11,
      "top_count": 2420,
      "top_percentage": 100.0,
      "histogram": {"11": 2420}
    },
    
    "corrected_distribution": {
      "distinct_lines": 30,
      "top_line": 38,
      "top_count": 127,
      "top_percentage": 5.2,
      "histogram": {"30": 81, "38": 127, "46": 77, ...}
    },
    
    "correction_method": "spatial_proximity_3d_euclidean",
    "correction_parameters": {
      "algorithm": "nearest_neighbor_by_world_position",
      "distance_metric": "euclidean_3d"
    },
    
    "mpd_lines_count": 259,
    "part_lines_count": 30,
    
    "recommendation": "Regenerate from source using per-line stud sampler (Courage v9+) for canonical skeleton"
  }
}
```

## Severity Levels

- **CRITICAL**: One line owns ≥90% of all studs
- **WARNING**: One line owns ≥70% of studs, or ≤2 distinct lines total
- **HEALTHY**: Studs properly distributed

## Usage for Generators

When Courage (or another tool) exports GOLD, it should:

1. **Check for existing report**: `if (gold._skeleton_pathology_report)`
2. **Display warning**: Alert user that skeleton was synthetically corrected
3. **Show alternatives**:
   - Use the corrected skeleton (good enough for viz)
   - Regenerate from scratch using proper per-line sampler
4. **Log the report**: Save to console for debugging

## Template: Before vs. After

**BROKEN GOLD (from old generator):**
```json
{
  "filename": "scene.png",
  "mpd_content": "1 16 0 0 0 1 0 0 0 1 0 0 0 1 3003.dat\n1 4 40 0 0 1 0 0 0 1 0 0 0 1 3003.dat\n...",
  "stud_skeleton": [
    {"x": 0, "y": 0, "z": 0, "lineNum": 11, "layer": 0},
    {"x": 40, "y": 0, "z": 0, "lineNum": 11, "layer": 0},
    ...all 2420 studs have lineNum: 11
  ]
}
```

**CORRECTED GOLD (after redistribution with report):**
```json
{
  "filename": "scene.png",
  "mpd_content": "1 16 0 0 0 1 0 0 0 1 0 0 0 1 3003.dat\n1 4 40 0 0 1 0 0 0 1 0 0 0 1 3003.dat\n...",
  "stud_skeleton": [
    {"x": 0, "y": 0, "z": 0, "lineNum": 1, "layer": 0},
    {"x": 40, "y": 0, "z": 0, "lineNum": 2, "layer": 0},
    ...studs redistributed to correct lines by proximity
  ],
  "_skeleton_pathology_report": {
    "detected_at": "2025-11-22T00:11:00.000Z",
    "corrected_by": "MPD Data Explorer Synthetic Redistributor v1.0",
    "severity": "CRITICAL",
    "original_distribution": {
      "distinct_lines": 1,
      "top_line": 11,
      "top_count": 2420,
      "top_percentage": 100.0
    },
    "corrected_distribution": {
      "distinct_lines": 30,
      "top_line": 38,
      "top_count": 127,
      "top_percentage": 5.2
    },
    "recommendation": "Regenerate from source using per-line stud sampler (Courage v9+) for canonical skeleton"
  }
