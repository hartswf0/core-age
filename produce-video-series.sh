#!/bin/bash

# MENTO Video Series Production Pipeline
# Compiles burst sequences into finished video series
# Usage: ./produce-video-series.sh [series_name]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

ASSEMBLY_DIR="/Users/gaia/COURAGE/MENTO/converted/ASSEMBLY"
METADATA_FILE="$ASSEMBLY_DIR/video_metadata.csv"
OUTPUT_DIR="/Users/gaia/COURAGE/MENTO/SERIES_OUTPUT"
SERIES_NAME="${1:-MENTO_Series_$(date +%Y%m%d)}"

mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   MENTO Video Series Production               ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Series Name: ${SERIES_NAME}${NC}"
echo ""

# Step 1: Identify burst sequences
echo -e "${MAGENTA}━━━ Step 1: Identifying Burst Sequences ━━━${NC}"

# Find MENTO_SHOT files with consecutive timestamps
TEMP_SHOTS=$(mktemp)
find "$ASSEMBLY_DIR" -name "*MENTO_SHOT_*.mp4" -type f -o -name "*MENTO_SHOT_*.mp4" -type l | \
while read f; do
    ts=$(basename "$f" | grep -oE '[0-9]{13}')
    if [ -n "$ts" ]; then
        echo "$ts:$f"
    fi
done | sort -t':' -k1 -n > "$TEMP_SHOTS"

# Group into bursts (< 2 minutes apart)
MAX_GAP=120000  # 2 minutes in milliseconds
burst_num=0
prev_ts=""
declare -a current_burst

echo "" > "$OUTPUT_DIR/burst_sequences.txt"

while IFS=':' read -r timestamp filepath; do
    if [ -z "$timestamp" ]; then
        continue
    fi
    
    if [ -n "$prev_ts" ]; then
        gap=$((timestamp - prev_ts))
        
        if [ $gap -gt $MAX_GAP ]; then
            # Save burst if it has 2+ clips
            if [ ${#current_burst[@]} -ge 2 ]; then
                ((burst_num++))
                echo "Burst $burst_num: ${#current_burst[@]} clips" >> "$OUTPUT_DIR/burst_sequences.txt"
                
                # Create burst directory
                burst_dir="$OUTPUT_DIR/bursts/burst_$(printf '%02d' $burst_num)"
                mkdir -p "$burst_dir"
                
                # Copy/link files
                seq=1
                for bf in "${current_burst[@]}"; do
                    dest="$burst_dir/$(printf '%03d' $seq)_$(basename "$bf")"
                    cp "$bf" "$dest" 2>/dev/null || ln -sf "$bf" "$dest" 2>/dev/null
                    echo "  - $(basename "$bf")" >> "$OUTPUT_DIR/burst_sequences.txt"
                    ((seq++))
                done
                echo "" >> "$OUTPUT_DIR/burst_sequences.txt"
                
                echo -e "${GREEN}  ✓ Burst $burst_num: ${#current_burst[@]} clips${NC}"
            fi
            current_burst=()
        fi
    fi
    
    current_burst+=("$filepath")
    prev_ts=$timestamp
done < "$TEMP_SHOTS"

# Save last burst
if [ ${#current_burst[@]} -ge 2 ]; then
    ((burst_num++))
    echo "Burst $burst_num: ${#current_burst[@]} clips" >> "$OUTPUT_DIR/burst_sequences.txt"
    
    burst_dir="$OUTPUT_DIR/bursts/burst_$(printf '%02d' $burst_num)"
    mkdir -p "$burst_dir"
    
    seq=1
    for bf in "${current_burst[@]}"; do
        dest="$burst_dir/$(printf '%03d' $seq)_$(basename "$bf")"
        cp "$bf" "$dest" 2>/dev/null || ln -sf "$bf" "$dest" 2>/dev/null
        echo "  - $(basename "$bf")" >> "$OUTPUT_DIR/burst_sequences.txt"
        ((seq++))
    done
    
    echo -e "${GREEN}  ✓ Burst $burst_num: ${#current_burst[@]} clips${NC}"
fi

echo ""
echo -e "${CYAN}Found $burst_num burst sequences${NC}"
echo ""

# Step 2: Compile each burst into a video
echo -e "${MAGENTA}━━━ Step 2: Compiling Burst Videos ━━━${NC}"

mkdir -p "$OUTPUT_DIR/compiled"

for i in $(seq 1 $burst_num); do
    burst_dir="$OUTPUT_DIR/bursts/burst_$(printf '%02d' $i)"
    
    if [ ! -d "$burst_dir" ]; then
        continue
    fi
    
    echo -e "${YELLOW}Compiling Burst $i...${NC}"
    
    # Create concat file
    concat_file="$burst_dir/concat.txt"
    > "$concat_file"
    
    for video in "$burst_dir"/*.mp4; do
        if [ -f "$video" ]; then
            echo "file '$(basename "$video")'" >> "$concat_file"
        fi
    done
    
    # Compile
    output_file="$OUTPUT_DIR/compiled/${SERIES_NAME}_Burst$(printf '%02d' $i).mp4"
    
    cd "$burst_dir"
    ffmpeg -f concat -safe 0 -i concat.txt \
        -c copy \
        -movflags +faststart \
        "$output_file" \
        -y -loglevel error -stats
    cd - > /dev/null
    
    if [ -f "$output_file" ]; then
        size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}  ✓ Created: ${SERIES_NAME}_Burst$(printf '%02d' $i).mp4 ($size)${NC}"
    fi
done

echo ""

# Step 3: Create master compilation by category
echo -e "${MAGENTA}━━━ Step 3: Creating Category Compilations ━━━${NC}"

for category in portrait landscape square; do
    cat_dir="$ASSEMBLY_DIR/$category"
    
    if [ ! -d "$cat_dir" ]; then
        continue
    fi
    
    file_count=$(find "$cat_dir" -name "*.mp4" | wc -l | tr -d ' ')
    
    if [ $file_count -eq 0 ]; then
        continue
    fi
    
    echo -e "${YELLOW}Compiling $category series ($file_count clips)...${NC}"
    
    # Create concat file
    concat_file="$OUTPUT_DIR/${category}_concat.txt"
    > "$concat_file"
    
    find "$cat_dir" -name "*.mp4" | sort | while read video; do
        echo "file '$video'" >> "$concat_file"
    done
    
    # Compile
    output_file="$OUTPUT_DIR/compiled/${SERIES_NAME}_${category}_full.mp4"
    
    ffmpeg -f concat -safe 0 -i "$concat_file" \
        -c copy \
        -movflags +faststart \
        "$output_file" \
        -y -loglevel error -stats 2>&1 | grep -E "(frame=|size=)" | tail -1
    
    if [ -f "$output_file" ]; then
        size=$(du -h "$output_file" | cut -f1)
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output_file" 2>/dev/null)
        duration_min=$(echo "scale=1; $duration / 60" | bc 2>/dev/null)
        echo -e "${GREEN}  ✓ ${category} compilation: $size, ${duration_min}min${NC}"
    fi
done

echo ""

# Step 4: Generate series manifest
echo -e "${MAGENTA}━━━ Step 4: Creating Series Manifest ━━━${NC}"

MANIFEST="$OUTPUT_DIR/${SERIES_NAME}_MANIFEST.txt"

cat > "$MANIFEST" << EOF
════════════════════════════════════════
MENTO VIDEO SERIES PRODUCTION REPORT
Series: $SERIES_NAME
Generated: $(date)
════════════════════════════════════════

BURST SEQUENCES
───────────────
$(cat "$OUTPUT_DIR/burst_sequences.txt" 2>/dev/null)

COMPILED VIDEOS
───────────────
$(ls -lh "$OUTPUT_DIR/compiled" 2>/dev/null | grep -v "^total" | awk '{print $9, "  ("$5")"}')

PRODUCTION STATS
────────────────
Total Bursts: $burst_num
Total Output Videos: $(find "$OUTPUT_DIR/compiled" -name "*.mp4" | wc -l | tr -d ' ')
Output Directory: $OUTPUT_DIR

NEXT STEPS
──────────
1. Review compiled videos in: $OUTPUT_DIR/compiled/
2. Upload to YouTube/social media
3. Share series manifest with collaborators
4. Archive source clips

════════════════════════════════════════
EOF

rm "$TEMP_SHOTS" 2>/dev/null

echo -e "${GREEN}✓ Manifest created${NC}"
echo ""

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   SERIES PRODUCTION COMPLETE!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📁 Output Location:${NC}"
echo "   $OUTPUT_DIR/compiled/"
echo ""
echo -e "${CYAN}📊 Series Contents:${NC}"
find "$OUTPUT_DIR/compiled" -name "*.mp4" -exec basename {} \; | while read fname; do
    fpath="$OUTPUT_DIR/compiled/$fname"
    size=$(du -h "$fpath" | cut -f1)
    echo "   📹 $fname ($size)"
done
echo ""
echo -e "${CYAN}📄 Full Report:${NC}"
echo "   cat $MANIFEST"
echo ""
echo -e "${YELLOW}🚀 Ready for Publishing!${NC}"
