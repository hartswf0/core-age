#!/bin/bash
# Generated Assembly Script
# Edit this file to customize your video compilation

CATEGORY="${1:-portrait}"  # portrait, landscape, or square
OUTPUT_DIR="./output"
mkdir -p "$OUTPUT_DIR"

echo "Assembling $CATEGORY videos..."

# Create file list for concatenation
FILELIST="$OUTPUT_DIR/${CATEGORY}_filelist.txt"
> "$FILELIST"

for video in ./$CATEGORY/*.mp4; do
    if [ -f "$video" ]; then
        echo "file '$video'" >> "$FILELIST"
    fi
done

# Concatenate videos
ffmpeg -f concat -safe 0 -i "$FILELIST" \
    -c copy \
    -movflags +faststart \
    "$OUTPUT_DIR/${CATEGORY}_compilation_$(date +%Y%m%d_%H%M%S).mp4"

echo "✓ Done! Output: $OUTPUT_DIR/${CATEGORY}_compilation_*.mp4"
