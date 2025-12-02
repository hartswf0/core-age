#!/bin/bash
# Compile "Best Of" - Top 15 largest bursts
OUTPUT="../MENTO_BestOf_$(date +%Y%m%d).mp4"
CONCAT_FILE="./best_of_concat.txt"

cd "$(dirname "$0")"
> "$CONCAT_FILE"

# Get top 15 by size
tail -n +2 ../burst_analysis.csv | sort -t',' -k2 -rn | head -15 | cut -d',' -f1 | while read fname; do
    echo "file '../../compiled/$fname'" >> "$CONCAT_FILE"
done

ffmpeg -f concat -safe 0 -i "$CONCAT_FILE" \
    -c copy \
    -movflags +faststart \
    "$OUTPUT" \
    -y -loglevel warning -stats

echo "✓ Best Of compilation created: $OUTPUT"
