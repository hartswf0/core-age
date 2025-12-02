#!/bin/bash
# Assemble Session 01
OUTPUT="../output/session_01_compilation.mp4"
mkdir -p ../output

# Create filelist
FILELIST="./filelist.txt"
> "$FILELIST"

for video in *.mp4; do
    if [ -f "$video" ]; then
        echo "file '$video'" >> "$FILELIST"
    fi
done

# Concatenate
ffmpeg -f concat -safe 0 -i "$FILELIST" \
    -c copy \
    -movflags +faststart \
    "$OUTPUT"

echo "✓ Created: $OUTPUT"
