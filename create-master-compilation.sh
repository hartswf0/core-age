#!/bin/bash

# MENTO Master Compilation Creator
# Creates ONE comprehensive 16:9 video from ALL clips
# Includes title cards, proper ordering, and normalization
# Usage: ./create-master-compilation.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

MENTO_DIR="/Users/gaia/COURAGE/MENTO"
CONVERTED_DIR="$MENTO_DIR/converted/2025-11-28_032030"
OUTPUT_DIR="$MENTO_DIR/MASTER_COMPILATION"
TEMP_DIR="$OUTPUT_DIR/temp"

mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   MENTO Master Compilation Creator            ║${NC}"
echo -e "${YELLOW}║   ALL Clips → ONE Professional Video          ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Inventory all videos
echo -e "${MAGENTA}━━━ Step 1: Inventorying All Clips ━━━${NC}"

if [ ! -d "$CONVERTED_DIR" ]; then
    echo -e "${RED}Error: Converted directory not found${NC}"
    exit 1
fi

# Get all MP4 files, sorted
all_videos=()
while IFS= read -r video; do
    all_videos+=("$video")
done < <(find "$CONVERTED_DIR" -name "*.mp4" -type f | sort)

total_count=${#all_videos[@]}
echo -e "${GREEN}Found $total_count video clips${NC}"

if [ $total_count -eq 0 ]; then
    echo -e "${RED}No videos found!${NC}"
    exit 1
fi

echo ""

# Step 2: Categorize videos
echo -e "${MAGENTA}━━━ Step 2: Categorizing Clips ━━━${NC}"

declare -a mento_shots
declare -a scene_videos
declare -a desert_videos  
declare -a simpsons_videos
declare -a gulch_videos
declare -a other_videos

for video in "${all_videos[@]}"; do
    basename=$(basename "$video")
    
    if [[ "$basename" =~ MENTO_SHOT ]]; then
        mento_shots+=("$video")
    elif [[ "$basename" =~ scene ]]; then
        scene_videos+=("$video")
    elif [[ "$basename" =~ desert ]]; then
        if [[ "$basename" =~ SIMPSONS ]]; then
            simpsons_videos+=("$video")
        elif [[ "$basename" =~ GULCH ]]; then
            gulch_videos+=("$video")
        else
            desert_videos+=("$video")
        fi
    else
        other_videos+=("$video")
    fi
done

echo -e "${CYAN}MENTO Shots:     ${#mento_shots[@]} clips${NC}"
echo -e "${CYAN}Scene Videos:    ${#scene_videos[@]} clips${NC}"
echo -e "${CYAN}Desert Scenes:   ${#desert_videos[@]} clips${NC}"
echo -e "${CYAN}Simpsons Scenes: ${#simpsons_videos[@]} clips${NC}"
echo -e "${CYAN}Gulch Scenes:    ${#gulch_videos[@]} clips${NC}"
echo -e "${CYAN}Other:           ${#other_videos[@]} clips${NC}"
echo ""

# Step 3: Create title cards
echo -e "${MAGENTA}━━━ Step 3: Creating Title Cards ━━━${NC}"

create_title_card() {
    local title="$1"
    local output_file="$2"
    local duration="${3:-3}"  # 3 seconds default
    
    ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=$duration \
        -vf "drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:text='$title':fontcolor=white:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2" \
        -c:v libx264 -preset fast -crf 22 \
        -pix_fmt yuv420p \
        "$output_file" \
        -y -loglevel error
    
    echo -e "${GREEN}  ✓ Created: $title${NC}"
}

# Create all title cards
create_title_card "MENTO CHRONICLES" "$TEMP_DIR/title_main.mp4" 4
create_title_card "PART 1: MENTO SHOTS" "$TEMP_DIR/title_shots.mp4" 2
create_title_card "PART 2: DESERT EXPLORATIONS" "$TEMP_DIR/title_desert.mp4" 2
create_title_card "PART 3: SIMPSONS WORLD" "$TEMP_DIR/title_simpsons.mp4" 2
create_title_card "PART 4: GULCH ADVENTURES" "$TEMP_DIR/title_gulch.mp4" 2
create_title_card "PART 5: SCENE STUDIES" "$TEMP_DIR/title_scenes.mp4" 2
create_title_card "PART 6: EXPERIMENTAL" "$TEMP_DIR/title_other.mp4" 2
create_title_card "THE END" "$TEMP_DIR/title_end.mp4" 3

echo ""

# Step 4: Normalize aspect ratios to 16:9
echo -e "${MAGENTA}━━━ Step 4: Normalizing to 16:9 ━━━${NC}"

normalize_to_16_9() {
    local input="$1"
    local output="$2"
    
    # Scale and pad to 1920x1080, maintaining aspect ratio
    ffmpeg -i "$input" \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
        -c:v libx264 -preset medium -crf 20 \
        -c:a copy \
        -movflags +faststart \
        "$output" \
        -y -loglevel error -stats
}

normalize_batch() {
    local category="$1"
    shift
    local videos=("$@")
    
    if [ ${#videos[@]} -eq 0 ]; then
        return
    fi
    
    echo -e "${YELLOW}Normalizing $category (${#videos[@]} clips)...${NC}"
    
    local count=0
    for video in "${videos[@]}"; do
        ((count++))
        basename=$(basename "$video" .mp4)
        normalized="$TEMP_DIR/norm_${category}_$(printf '%03d' $count).mp4"
        
        normalize_to_16_9 "$video" "$normalized"
    done
    
    echo -e "${GREEN}  ✓ Normalized $count clips${NC}"
}

# Normalize all categories
normalize_batch "shots" "${mento_shots[@]}"
normalize_batch "desert" "${desert_videos[@]}"
normalize_batch "simpsons" "${simpsons_videos[@]}"
normalize_batch "gulch" "${gulch_videos[@]}"
normalize_batch "scenes" "${scene_videos[@]}"
normalize_batch "other" "${other_videos[@]}"

echo ""

# Step 5: Create master concat file
echo -e "${MAGENTA}━━━ Step 5: Assembling Master Compilation ━━━${NC}"

CONCAT_FILE="$TEMP_DIR/master_concat.txt"
> "$CONCAT_FILE"

# Build the compilation structure
echo "file '$TEMP_DIR/title_main.mp4'" >> "$CONCAT_FILE"

# Part 1: MENTO Shots
if [ ${#mento_shots[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_shots.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#mento_shots[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_shots_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# Part 2: Desert
if [ ${#desert_videos[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_desert.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#desert_videos[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_desert_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# Part 3: Simpsons
if [ ${#simpsons_videos[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_simpsons.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#simpsons_videos[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_simpsons_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# Part 4: Gulch
if [ ${#gulch_videos[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_gulch.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#gulch_videos[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_gulch_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# Part 5: Scenes
if [ ${#scene_videos[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_scenes.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#scene_videos[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_scenes_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# Part 6: Other
if [ ${#other_videos[@]} -gt 0 ]; then
    echo "file '$TEMP_DIR/title_other.mp4'" >> "$CONCAT_FILE"
    for ((i=1; i<=${#other_videos[@]}; i++)); do
        echo "file '$TEMP_DIR/norm_other_$(printf '%03d' $i).mp4'" >> "$CONCAT_FILE"
    done
fi

# End card
echo "file '$TEMP_DIR/title_end.mp4'" >> "$CONCAT_FILE"

clip_count=$(grep -c "^file" "$CONCAT_FILE")
echo -e "${CYAN}Total segments: $clip_count (includes title cards)${NC}"
echo ""

# Step 6: Compile the master video
echo -e "${MAGENTA}━━━ Step 6: Creating Master Video ━━━${NC}"

OUTPUT_FILE="$OUTPUT_DIR/MENTO_MASTER_COMPILATION_$(date +%Y%m%d).mp4"

echo -e "${YELLOW}Compiling... this may take several minutes${NC}"

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
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   MASTER COMPILATION COMPLETE!                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📹 File:${NC}     $(basename "$OUTPUT_FILE")"
    echo -e "${CYAN}📊 Size:${NC}     $size"
    echo -e "${CYAN}⏱️  Duration:${NC} ${duration_min} minutes"
    echo -e "${CYAN}📁 Location:${NC} $OUTPUT_FILE"
    echo ""
    echo -e "${MAGENTA}Structure:${NC}"
    echo "  • Opening Title: MENTO CHRONICLES"
    echo "  • Part 1: ${#mento_shots[@]} MENTO Shots"
    [ ${#desert_videos[@]} -gt 0 ] && echo "  • Part 2: ${#desert_videos[@]} Desert Explorations"
    [ ${#simpsons_videos[@]} -gt 0 ] && echo "  • Part 3: ${#simpsons_videos[@]} Simpsons World"
    [ ${#gulch_videos[@]} -gt 0 ] && echo "  • Part 4: ${#gulch_videos[@]} Gulch Adventures"
    [ ${#scene_videos[@]} -gt 0 ] && echo "  • Part 5: ${#scene_videos[@]} Scene Studies"
    [ ${#other_videos[@]} -gt 0 ] && echo "  • Part 6: ${#other_videos[@]} Experimental"
    echo "  • Closing: THE END"
    echo ""
    echo -e "${GREEN}✨ Ready for YouTube, Vimeo, or any platform! ✨${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: Keep temp files for re-editing, or delete with:${NC}"
    echo "   rm -rf $TEMP_DIR"
else
    echo -e "${RED}Error: Compilation failed${NC}"
    exit 1
fi
