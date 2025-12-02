#!/bin/bash

# Video Pre-Assembly Organizer
# Analyzes converted MP4 videos and sorts them into batches for assembly
# Usage: ./organize-videos-for-assembly.sh [converted_directory]

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Input directory with converted videos
CONVERTED_DIR="${1:-/Users/gaia/COURAGE/MENTO/converted}"
ASSEMBLY_DIR="${CONVERTED_DIR}/ASSEMBLY"

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Video Pre-Assembly Organizer         ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if ffprobe is available
if ! command -v ffprobe &> /dev/null; then
    echo -e "${RED}Error: ffprobe not found (part of ffmpeg)${NC}"
    exit 1
fi

# Find the most recent conversion folder
LATEST_CONVERSION=$(find "$CONVERTED_DIR" -maxdepth 1 -type d -name "20*" | sort -r | head -1)

if [ -z "$LATEST_CONVERSION" ]; then
    echo -e "${RED}No conversion folders found in $CONVERTED_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Analyzing videos from: $(basename $LATEST_CONVERSION)${NC}"
echo ""

# Create assembly directory structure
mkdir -p "$ASSEMBLY_DIR"/{portrait,landscape,square,clips_by_time}

# Create metadata file
METADATA_FILE="$ASSEMBLY_DIR/video_metadata.csv"
echo "filename,width,height,aspect_ratio,duration,timestamp,category" > "$METADATA_FILE"

# Arrays to store videos by aspect ratio
declare -a portrait_videos
declare -a landscape_videos
declare -a square_videos

# Analyze each video
echo -e "${CYAN}Analyzing videos...${NC}"
total=0
portrait_count=0
landscape_count=0
square_count=0

for video in "$LATEST_CONVERSION"/*.mp4; do
    if [ ! -f "$video" ]; then
        continue
    fi
    
    ((total++))
    filename=$(basename "$video")
    
    # Extract metadata using ffprobe
    width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$video")
    height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$video")
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video")
    
    # Calculate aspect ratio
    if [ -n "$width" ] && [ -n "$height" ] && [ "$width" -gt 0 ] && [ "$height" -gt 0 ]; then
        aspect_ratio=$(echo "scale=2; $width / $height" | bc)
        
        # Categorize by aspect ratio
        if (( $(echo "$aspect_ratio < 0.9" | bc -l) )); then
            category="portrait"
            portrait_videos+=("$video")
            ((portrait_count++))
        elif (( $(echo "$aspect_ratio > 1.1" | bc -l) )); then
            category="landscape"
            landscape_videos+=("$video")
            ((landscape_count++))
        else
            category="square"
            square_videos+=("$video")
            ((square_count++))
        fi
        
        # Extract timestamp from filename if present
        timestamp=$(echo "$filename" | grep -oE '[0-9]{13}' | head -1)
        if [ -z "$timestamp" ]; then
            timestamp=$(echo "$filename" | grep -oE '[0-9]{8}_[0-9]{6}' | head -1)
        fi
        
        # Save to metadata CSV
        echo "$filename,$width,$height,$aspect_ratio,$duration,$timestamp,$category" >> "$METADATA_FILE"
        
        # Create symlink in category folder
        ln -sf "$video" "$ASSEMBLY_DIR/$category/$filename" 2>/dev/null
    fi
done

echo -e "${GREEN}✓ Analyzed $total videos${NC}"
echo ""

# Display categorization results
echo -e "${MAGENTA}═══ Categorization Results ═══${NC}"
echo -e "${CYAN}Portrait (9:16, vertical):   $portrait_count videos${NC}"
echo -e "${CYAN}Landscape (16:9, horizontal): $landscape_count videos${NC}"
echo -e "${CYAN}Square (1:1):                 $square_count videos${NC}"
echo ""

# Group by timestamp ranges (batches)
echo -e "${YELLOW}Creating time-series batches...${NC}"

# Sort videos by timestamp and create batches
awk -F',' 'NR>1 {print $6","$1","$7}' "$METADATA_FILE" | sort -t',' -k1 -n | \
while IFS=',' read -r timestamp filename category; do
    if [ -n "$timestamp" ]; then
        # Extract date from timestamp (first 8 digits YYYYMMDD or from filename)
        if [ ${#timestamp} -ge 8 ]; then
            date_key="${timestamp:0:8}"
        else
            date_key="unknown"
        fi
        
        # Create date-based batch folder
        batch_dir="$ASSEMBLY_DIR/clips_by_time/batch_$date_key"
        mkdir -p "$batch_dir"
        
        # Symlink to time batch
        video_path="$LATEST_CONVERSION/$filename"
        if [ -f "$video_path" ]; then
            ln -sf "$video_path" "$batch_dir/$filename" 2>/dev/null
        fi
    fi
done

# Count batch folders
batch_count=$(find "$ASSEMBLY_DIR/clips_by_time" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Created $batch_count time-series batches${NC}"
echo ""

# Generate assembly recommendations
echo -e "${MAGENTA}═══ Assembly Recommendations ═══${NC}"

if [ $portrait_count -gt 0 ]; then
    echo -e "${CYAN}Portrait Videos:${NC}"
    echo "  - Best for: Instagram Stories, TikTok, Reels"
    echo "  - Location: $ASSEMBLY_DIR/portrait/"
    echo "  - Count: $portrait_count videos"
    echo ""
fi

if [ $landscape_count -gt 0 ]; then
    echo -e "${CYAN}Landscape Videos:${NC}"
    echo "  - Best for: YouTube, traditional video"
    echo "  - Location: $ASSEMBLY_DIR/landscape/"
    echo "  - Count: $landscape_count videos"
    echo ""
fi

if [ $square_count -gt 0 ]; then
    echo -e "${CYAN}Square Videos:${NC}"
    echo "  - Best for: Instagram Feed, social media"
    echo "  - Location: $ASSEMBLY_DIR/square/"
    echo "  - Count: $square_count videos"
    echo ""
fi

# Create assembly script template
ASSEMBLY_SCRIPT="$ASSEMBLY_DIR/assemble_videos.sh"
cat > "$ASSEMBLY_SCRIPT" << 'EOF'
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
EOF

chmod +x "$ASSEMBLY_SCRIPT"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Pre-Assembly Complete!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Organization Structure:${NC}"
echo "  📁 $ASSEMBLY_DIR/"
echo "     ├── portrait/          ($portrait_count videos)"
echo "     ├── landscape/         ($landscape_count videos)"
echo "     ├── square/            ($square_count videos)"
echo "     ├── clips_by_time/     ($batch_count batches)"
echo "     ├── video_metadata.csv (detailed info)"
echo "     └── assemble_videos.sh (assembly script)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review sorted videos in each category"
echo "  2. Run: cd $ASSEMBLY_DIR && ./assemble_videos.sh portrait"
echo "  3. Or manually select clips for custom assembly"
