#!/bin/bash

# Video Sequence Analyzer
# Analyzes numeric patterns in filenames to identify recording sessions
# Usage: ./analyze-video-sequences.sh [assembly_directory]

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

ASSEMBLY_DIR="${1:-/Users/gaia/COURAGE/MENTO/converted/ASSEMBLY}"
METADATA_FILE="$ASSEMBLY_DIR/video_metadata.csv"
SEQUENCES_DIR="$ASSEMBLY_DIR/sequences"

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Video Sequence Analyzer             ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "$METADATA_FILE" ]; then
    echo -e "${RED}Error: metadata file not found${NC}"
    echo "Run organize-videos-for-assembly.sh first"
    exit 1
fi

mkdir -p "$SEQUENCES_DIR"

# Extract all timestamps and sort them
echo -e "${CYAN}Analyzing timestamp patterns...${NC}"

# Create a temporary file with timestamps and filenames
TEMP_FILE=$(mktemp)
awk -F',' 'NR>1 {if ($6 != "") print $6","$1","$7}' "$METADATA_FILE" | sort -t',' -k1 -n > "$TEMP_FILE"

# Analyze timestamp gaps to identify sessions
# Timestamps are in milliseconds, so 60000ms = 1 minute
SESSION_GAP=300000  # 5 minutes in milliseconds

session_num=0
prev_timestamp=0
current_session_files=()
declare -A session_info

echo -e "${MAGENTA}Identifying recording sessions...${NC}"
echo ""

while IFS=',' read -r timestamp filename category; do
    if [ -z "$timestamp" ] || [ "$timestamp" = "timestamp" ]; then
        continue
    fi
    
    # Calculate gap from previous timestamp
    if [ $prev_timestamp -eq 0 ]; then
        gap=0
    else
        gap=$((timestamp - prev_timestamp))
    fi
    
    # If gap is > 5 minutes, start new session
    if [ $gap -gt $SESSION_GAP ] || [ $prev_timestamp -eq 0 ]; then
        # Save previous session if it exists
        if [ ${#current_session_files[@]} -gt 0 ]; then
            session_count=${#current_session_files[@]}
            session_info[$session_num]="$session_count:$category"
            
            # Create session directory
            session_dir="$SEQUENCES_DIR/session_$(printf '%02d' $session_num)"
            mkdir -p "$session_dir"
            
            # Link files to session
            for sf in "${current_session_files[@]}"; do
                video_path=$(find "$ASSEMBLY_DIR" -name "$sf" -type f -o -name "$sf" -type l | head -1)
                if [ -f "$video_path" ] || [ -L "$video_path" ]; then
                    ln -sf "$video_path" "$session_dir/$sf" 2>/dev/null
                fi
            done
            
            echo -e "${GREEN}Session $(printf '%02d' $session_num): $session_count clips [$category]${NC}"
        fi
        
        # Start new session
        ((session_num++))
        current_session_files=()
    fi
    
    current_session_files+=("$filename")
    prev_timestamp=$timestamp
    
done < "$TEMP_FILE"

# Save last session
if [ ${#current_session_files[@]} -gt 0 ]; then
    session_count=${#current_session_files[@]}
    session_info[$session_num]="$session_count:$category"
    
    session_dir="$SEQUENCES_DIR/session_$(printf '%02d' $session_num)"
    mkdir -p "$session_dir"
    
    for sf in "${current_session_files[@]}"; do
        video_path=$(find "$ASSEMBLY_DIR" -name "$sf" -type f -o -name "$sf" -type l | head -1)
        if [ -f "$video_path" ] || [ -L "$video_path" ]; then
            ln -sf "$video_path" "$session_dir/$sf" 2>/dev/null
        fi
    done
    
    echo -e "${GREEN}Session $(printf '%02d' $session_num): $session_count clips [$category]${NC}"
fi

echo ""
echo -e "${MAGENTA}═══ Session Analysis ═══${NC}"
echo -e "${CYAN}Total recording sessions identified: $session_num${NC}"
echo ""

# Analyze numeric sequences in filenames
echo -e "${CYAN}Looking for sequential patterns...${NC}"

# Extract numbers from MENTO_SHOT files
awk -F',' 'NR>1 && $1 ~ /MENTO_SHOT/ {print $6","$1}' "$METADATA_FILE" | sort -t',' -k1 -n | \
awk -F',' '{
    ts = $1
    if (prev_ts != "") {
        diff = ts - prev_ts
        if (diff < 100000) {  # Less than 100 seconds
            print "  " $2 " (+" diff/1000 "s after previous)"
        }
    }
    prev_ts = ts
}' > "$SEQUENCES_DIR/shot_sequences.txt"

if [ -s "$SEQUENCES_DIR/shot_sequences.txt" ]; then
    echo -e "${GREEN}Found rapid-fire sequences (< 100s apart):${NC}"
    head -10 "$SEQUENCES_DIR/shot_sequences.txt"
    echo ""
fi

# Create session manifest
MANIFEST="$SEQUENCES_DIR/session_manifest.txt"
echo "Video Sequence Manifest" > "$MANIFEST"
echo "Generated: $(date)" >> "$MANIFEST"
echo "=====================================" >> "$MANIFEST"
echo "" >> "$MANIFEST"

for i in $(seq 1 $session_num); do
    session_dir="$SEQUENCES_DIR/session_$(printf '%02d' $i)"
    if [ -d "$session_dir" ]; then
        count=$(find "$session_dir" -type f -o -type l | wc -l | tr -d ' ')
        echo "Session $(printf '%02d' $i): $count clips" >> "$MANIFEST"
        ls -1 "$session_dir" >> "$MANIFEST"
        echo "" >> "$MANIFEST"
    fi
done

# Generate assembly script for each session
for i in $(seq 1 $session_num); do
    session_dir="$SEQUENCES_DIR/session_$(printf '%02d' $i)"
    if [ -d "$session_dir" ]; then
        script="$session_dir/assemble_session.sh"
        cat > "$script" << EOF
#!/bin/bash
# Assemble Session $(printf '%02d' $i)
OUTPUT="../output/session_$(printf '%02d' $i)_compilation.mp4"
mkdir -p ../output

# Create filelist
FILELIST="./filelist.txt"
> "\$FILELIST"

for video in *.mp4; do
    if [ -f "\$video" ]; then
        echo "file '\$video'" >> "\$FILELIST"
    fi
done

# Concatenate
ffmpeg -f concat -safe 0 -i "\$FILELIST" \\
    -c copy \\
    -movflags +faststart \\
    "\$OUTPUT"

echo "✓ Created: \$OUTPUT"
EOF
        chmod +x "$script"
    fi
done

rm "$TEMP_FILE"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Sequence Analysis Complete!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Output Structure:${NC}"
echo "  📁 $SEQUENCES_DIR/"
echo "     ├── session_01/        (clips + assembly script)"
echo "     ├── session_02/"
echo "     ├── ..."
echo "     ├── session_manifest.txt"
echo "     └── shot_sequences.txt"
echo ""
echo -e "${YELLOW}Assembly Options:${NC}"
echo "  1. Compile individual session:"
echo "     cd $SEQUENCES_DIR/session_01 && ./assemble_session.sh"
echo ""
echo "  2. Review rapid sequences:"
echo "     cat $SEQUENCES_DIR/shot_sequences.txt"
echo ""
echo "  3. Check full manifest:"
echo "     cat $SEQUENCES_DIR/session_manifest.txt"
