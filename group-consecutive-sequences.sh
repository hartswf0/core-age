#!/bin/bash

# Intelligent Sequence Grouper
# Groups videos by consecutive timestamp patterns
# Usage: ./group-consecutive-sequences.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

ASSEMBLY_DIR="/Users/gaia/COURAGE/MENTO/converted/ASSEMBLY"
SEQUENCES_DIR="$ASSEMBLY_DIR/intelligent_sequences"

mkdir -p "$SEQUENCES_DIR"

echo -e "${YELLOW}╔═══════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Intelligent Sequence Grouper        ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════╝${NC}"
echo ""

# Extract MENTO_SHOT videos with timestamps
echo -e "${CYAN}Analyzing MENTO_SHOT sequences...${NC}"

# Get all MENTO_SHOT files sorted by timestamp
SHOT_FILES=$(find "$ASSEMBLY_DIR" -name "*MENTO_SHOT_*.mp4" | while read f; do
    ts=$(basename "$f" | grep -oE '[0-9]{13}')
    echo "$ts:$f"
done | sort -t':' -k1 -n)

# Group into sequences (max 60s gap)
MAX_GAP=60000  # 60 seconds in milliseconds
sequence_num=1
prev_ts=""
current_group=()

echo "$SHOT_FILES" | while IFS=':' read -r timestamp filepath; do
    if [ -z "$timestamp" ]; then
        continue
    fi
    
    if [ -n "$prev_ts" ]; then
        gap=$((timestamp - prev_ts))
        gap_sec=$((gap / 1000))
        
        if [ $gap -gt $MAX_GAP ]; then
            # Save previous sequence
            if [ ${#current_group[@]} -gt 1 ]; then
                seq_dir="$SEQUENCES_DIR/rapid_sequence_$(printf '%02d' $sequence_num)"
                mkdir -p "$seq_dir"
                
                echo -e "${GREEN}Sequence $sequence_num: ${#current_group[@]} clips${NC}"
                for cgfile in "${current_group[@]}"; do
                    ln -sf "$cgfile" "$seq_dir/$(basename "$cgfile")" 2>/dev/null
                done
                
                ((sequence_num++))
            fi
            current_group=()
        fi
    fi
    
    current_group+=("$filepath")
    prev_ts=$timestamp
done

echo ""
echo -e "${MAGENTA}Pattern Discovery:${NC}"
echo -e "${CYAN}• Found recording bursts (shots < 60s apart)${NC}"
echo -e "${CYAN}• Grouped into ${sequence_num} rapid sequences${NC}"
echo ""
echo -e "${GREEN}Output: $SEQUENCES_DIR/${NC}"
