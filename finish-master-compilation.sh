#!/bin/bash
# Quick finish of master compilation
# Assumes temp files are already created

TEMP_DIR="/Users/gaia/COURAGE/MENTO/MASTER_COMPILATION/temp"
OUTPUT_DIR="/Users/gaia/COURAGE/MENTO/MASTER_COMPILATION"
CONCAT_FILE="$TEMP_DIR/master_final.txt"

cd "$TEMP_DIR"

# Create concat list in order
> "$CONCAT_FILE"

# Title cards and clips in order
echo "file 'title_main.mp4'" >> "$CONCAT_FILE"

# Add all normalized shots
for f in norm_shots_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

# Add other categories if they exist
for f in norm_desert_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

for f in norm_simpsons_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

for f in norm_gulch_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

for f in norm_scenes_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

for f in norm_other_*.mp4; do
    [ -f "$f" ] && echo "file '$f'" >> "$CONCAT_FILE"
done

echo "file 'title_end.mp4'" >> "$CONCAT_FILE"

# Compile
OUTPUT_FILE="$OUTPUT_DIR/MENTO_MASTER_COMPILATION_20251128.mp4"

echo "Compiling master video..."
ffmpeg -f concat -safe 0 -i "$CONCAT_FILE" \
    -c copy \
    -movflags +faststart \
    "$OUTPUT_FILE" \
    -y -loglevel warning -stats

if [ -f "$OUTPUT_FILE" ]; then
    size=$(du -h "$OUTPUT_FILE" | cut -f1)
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE" 2>/dev/null)
    duration_min=$(echo "scale=1; $duration / 60" | bc)
    echo ""
    echo "✓ MASTER COMPILATION COMPLETE!"
    echo "  File: $OUTPUT_FILE"
    echo "  Size: $size"
    echo "  Duration: ${duration_min} minutes"
else
    echo "Error: Compilation failed"
    exit 1
fi
