#!/bin/bash

# MENTO Grid Compiler
# Creates 2x2 grid compilations from burst episodes
# Groups similar content and outputs to 16:9 or 4:3 aspect ratio
# Usage: ./create-grid-compilations.sh [target_aspect_ratio]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

BURSTS_DIR="/Users/gaia/COURAGE/MENTO/SERIES_OUTPUT/compiled"
ANALYSIS_FILE="/Users/gaia/COURAGE/MENTO/COMPILATION_STRATEGIES/burst_analysis.csv"
GRID_OUTPUT="/Users/gaia/COURAGE/MENTO/GRID_COMPILATIONS"
TARGET_ASPECT="${1:-16:9}"  # Default to 16:9

mkdir -p "$GRID_OUTPUT"/{portrait_grids,landscape_grids,mixed_grids,final_compilations}

echo -e "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   MENTO 2x2 Grid Compiler                    ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Target Aspect Ratio: ${TARGET_ASPECT}${NC}"
echo ""

# Calculate target dimensions based on aspect ratio
if [ "$TARGET_ASPECT" = "16:9" ]; then
    TARGET_WIDTH=1920
    TARGET_HEIGHT=1080
    echo -e "${GREEN}Output: 1920x1080 (Full HD 16:9)${NC}"
elif [ "$TARGET_ASPECT" = "4:3" ]; then
    TARGET_WIDTH=1440
    TARGET_HEIGHT=1080
    echo -e "${GREEN}Output: 1440x1080 (4:3)${NC}"
else
    TARGET_WIDTH=1920
    TARGET_HEIGHT=1080
    echo -e "${YELLOW}Unknown aspect ratio, defaulting to 1920x1080${NC}"
fi

GRID_WIDTH=$((TARGET_WIDTH / 2))
GRID_HEIGHT=$((TARGET_HEIGHT / 2))

echo ""

# Load burst metadata
if [ ! -f "$ANALYSIS_FILE" ]; then
    echo -e "${RED}Error: Run organize-bursts-for-compilation.sh first${NC}"
    exit 1
fi

# Group bursts by category
echo -e "${MAGENTA}━━━ Step 1: Grouping Bursts by Similarity ━━━${NC}"

# Portrait bursts
portrait_bursts=($(tail -n +2 "$ANALYSIS_FILE" | grep ",portrait$" | cut -d',' -f1))
# Landscape bursts
landscape_bursts=($(tail -n +2 "$ANALYSIS_FILE" | grep ",landscape$" | cut -d',' -f1))
# Square bursts
square_bursts=($(tail -n +2 "$ANALYSIS_FILE" | grep ",square$" | cut -d',' -f1))

echo -e "${CYAN}Portrait bursts: ${#portrait_bursts[@]}${NC}"
echo -e "${CYAN}Landscape bursts: ${#landscape_bursts[@]}${NC}"
echo -e "${CYAN}Square bursts: ${#square_bursts[@]}${NC}"
echo ""

# Function to create 2x2 grid
create_grid() {
    local output_file="$1"
    local v1="$2"
    local v2="$3"
    local v3="$4"
    local v4="$5"
    local grid_name="$6"
    
    echo -e "${YELLOW}Creating grid: $grid_name${NC}"
    
    # Check if videos have audio
    has_audio_1=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=nw=1:nk=1 "$v1" 2>/dev/null | grep -c audio)
    has_audio_2=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=nw=1:nk=1 "$v2" 2>/dev/null | grep -c audio)
    has_audio_3=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=nw=1:nk=1 "$v3" 2>/dev/null | grep -c audio)
    has_audio_4=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of default=nw=1:nk=1 "$v4" 2>/dev/null | grep -c audio)
    
    # Build filter based on audio availability
    if [ "$has_audio_1" -gt 0 ] && [ "$has_audio_2" -gt 0 ] && [ "$has_audio_3" -gt 0 ] && [ "$has_audio_4" -gt 0 ]; then
        # All have audio
        filter_complex="\
        [0:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v0]; \
        [1:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v1]; \
        [2:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v2]; \
        [3:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v3]; \
        [v0][v1]hstack=inputs=2[top]; \
        [v2][v3]hstack=inputs=2[bottom]; \
        [top][bottom]vstack=inputs=2[v]; \
        [0:a][1:a][2:a][3:a]amix=inputs=4:duration=shortest[a]"
        map_args="-map [v] -map [a]"
    else
        # Video only (no audio)
        filter_complex="\
        [0:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v0]; \
        [1:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v1]; \
        [2:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v2]; \
        [3:v]scale=${GRID_WIDTH}:${GRID_HEIGHT}:force_original_aspect_ratio=decrease,pad=${GRID_WIDTH}:${GRID_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black[v3]; \
        [v0][v1]hstack=inputs=2[top]; \
        [v2][v3]hstack=inputs=2[bottom]; \
        [top][bottom]vstack=inputs=2[v]"
        map_args="-map [v]"
    fi
    
    # Create 2x2 grid
    ffmpeg -i "$v1" -i "$v2" -i "$v3" -i "$v4" \
        -filter_complex "$filter_complex" \
        $map_args \
        -c:v libx264 -preset medium -crf 20 \
        -c:a aac -b:a 192k \
        -movflags +faststart \
        "$output_file" \
        -y -loglevel error -stats
    
    if [ $? -eq 0 ]; then
        size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}  ✓ Created: $grid_name ($size)${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed: $grid_name${NC}"
        return 1
    fi
}

# Step 2: Create Portrait Grids
echo -e "${MAGENTA}━━━ Step 2: Creating Portrait Grids (4 portrait videos) ━━━${NC}"

portrait_grid_count=0
for ((i=0; i<${#portrait_bursts[@]}; i+=4)); do
    if [ $((i+3)) -lt ${#portrait_bursts[@]} ]; then
        ((portrait_grid_count++))
        
        v1="$BURSTS_DIR/${portrait_bursts[$i]}"
        v2="$BURSTS_DIR/${portrait_bursts[$((i+1))]}"
        v3="$BURSTS_DIR/${portrait_bursts[$((i+2))]}"
        v4="$BURSTS_DIR/${portrait_bursts[$((i+3))]}"
        
        output="$GRID_OUTPUT/portrait_grids/portrait_grid_$(printf '%02d' $portrait_grid_count).mp4"
        create_grid "$output" "$v1" "$v2" "$v3" "$v4" "Portrait Grid $portrait_grid_count"
    fi
done

echo ""

# Step 3: Create Landscape Grids
echo -e "${MAGENTA}━━━ Step 3: Creating Landscape Grids (4 landscape videos) ━━━${NC}"

landscape_grid_count=0
for ((i=0; i<${#landscape_bursts[@]}; i+=4)); do
    if [ $((i+3)) -lt ${#landscape_bursts[@]} ]; then
        ((landscape_grid_count++))
        
        v1="$BURSTS_DIR/${landscape_bursts[$i]}"
        v2="$BURSTS_DIR/${landscape_bursts[$((i+1))]}"
        v3="$BURSTS_DIR/${landscape_bursts[$((i+2))]}"
        v4="$BURSTS_DIR/${landscape_bursts[$((i+3))]}"
        
        output="$GRID_OUTPUT/landscape_grids/landscape_grid_$(printf '%02d' $landscape_grid_count).mp4"
        create_grid "$output" "$v1" "$v2" "$v3" "$v4" "Landscape Grid $landscape_grid_count"
    fi
done

echo ""

# Step 4: Create Mixed Grids (if we have leftovers or want variety)
echo -e "${MAGENTA}━━━ Step 4: Creating Mixed Grids ━━━${NC}"

# Collect all bursts
all_bursts=($(tail -n +2 "$ANALYSIS_FILE" | cut -d',' -f1))

# Create mixed grids from all bursts
mixed_grid_count=0
for ((i=0; i<${#all_bursts[@]}; i+=4)); do
    if [ $((i+3)) -lt ${#all_bursts[@]} ] && [ $mixed_grid_count -lt 3 ]; then
        ((mixed_grid_count++))
        
        v1="$BURSTS_DIR/${all_bursts[$i]}"
        v2="$BURSTS_DIR/${all_bursts[$((i+1))]}"
        v3="$BURSTS_DIR/${all_bursts[$((i+2))]}"
        v4="$BURSTS_DIR/${all_bursts[$((i+3))]}"
        
        output="$GRID_OUTPUT/mixed_grids/mixed_grid_$(printf '%02d' $mixed_grid_count).mp4"
        create_grid "$output" "$v1" "$v2" "$v3" "$v4" "Mixed Grid $mixed_grid_count"
    fi
done

echo ""

# Step 5: Compile grid collections
echo -e "${MAGENTA}━━━ Step 5: Compiling Grid Collections ━━━${NC}"

compile_grids() {
    local grid_dir="$1"
    local output_name="$2"
    
    if [ ! -d "$grid_dir" ] || [ $(find "$grid_dir" -name "*.mp4" | wc -l) -eq 0 ]; then
        return 1
    fi
    
    concat_file="$grid_dir/concat.txt"
    > "$concat_file"
    
    find "$grid_dir" -name "*.mp4" | sort | while read grid; do
        echo "file '$(basename "$grid")'" >> "$concat_file"
    done
    
    output="$GRID_OUTPUT/final_compilations/${output_name}.mp4"
    
    cd "$grid_dir"
    ffmpeg -f concat -safe 0 -i concat.txt \
        -c copy \
        -movflags +faststart \
        "$output" \
        -y -loglevel error -stats
    cd - > /dev/null
    
    if [ -f "$output" ]; then
        size=$(du -h "$output" | cut -f1)
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output" 2>/dev/null)
        duration_min=$(echo "scale=1; $duration / 60" | bc)
        echo -e "${GREEN}  ✓ $output_name: $size, ${duration_min}min${NC}"
    fi
}

compile_grids "$GRID_OUTPUT/portrait_grids" "MENTO_PortraitGrids_Collection"
compile_grids "$GRID_OUTPUT/landscape_grids" "MENTO_LandscapeGrids_Collection"
compile_grids "$GRID_OUTPUT/mixed_grids" "MENTO_MixedGrids_Collection"

echo ""

# Generate summary
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   GRID COMPILATION COMPLETE!                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📊 Grid Statistics:${NC}"
echo "  Portrait Grids: $portrait_grid_count"
echo "  Landscape Grids: $landscape_grid_count"
echo "  Mixed Grids: $mixed_grid_count"
echo "  Total Grids: $((portrait_grid_count + landscape_grid_count + mixed_grid_count))"
echo ""

echo -e "${CYAN}📁 Output Location:${NC}"
echo "  $GRID_OUTPUT/"
echo "    ├── portrait_grids/          (Individual 2x2 portrait grids)"
echo "    ├── landscape_grids/         (Individual 2x2 landscape grids)"
echo "    ├── mixed_grids/             (Individual 2x2 mixed grids)"
echo "    └── final_compilations/      (Full compiled grid videos)"
echo ""

echo -e "${CYAN}📹 Final Grid Compilations:${NC}"
find "$GRID_OUTPUT/final_compilations" -name "*.mp4" 2>/dev/null | while read f; do
    basename "$f"
done | while read fname; do
    fpath="$GRID_OUTPUT/final_compilations/$fname"
    if [ -f "$fpath" ]; then
        size=$(du -h "$fpath" | cut -f1)
        echo "  🎬 $fname ($size)"
    fi
done

echo ""
echo -e "${YELLOW}💡 Viewing Experience:${NC}"
echo "  • Each grid shows 4 different perspectives simultaneously"
echo "  • Perfect for showcasing variations and experiments"
echo "  • Optimized for ${TARGET_ASPECT} viewing"
echo ""
echo -e "${GREEN}Ready for viewing! 🎥✨${NC}"
