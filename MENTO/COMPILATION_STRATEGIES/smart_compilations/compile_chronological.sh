#!/bin/bash
# Compile chronologically - All bursts in order
OUTPUT="../MENTO_Chronological_$(date +%Y%m%d).mp4"
CONCAT_FILE="./chrono_concat.txt"

cd "$(dirname "$0")"
> "$CONCAT_FILE"

# Sort by date
tail -n +2 ../burst_analysis.csv | sort -t',' -k4 | cut -d',' -f1 | while read fname; do
    echo "file '../../compiled/$fname'" >> "$CONCAT_FILE"
done

ffmpeg -f concat -safe 0 -i "$CONCAT_FILE" \
    -c copy \
    -movflags +faststart \
    "$OUTPUT" \
    -y -loglevel warning -stats

echo "✓ Chronological compilation created: $OUTPUT"
