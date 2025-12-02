#!/bin/bash

# Batch WebM to MP4 Converter
# Usage: ./convert-webm-to-mp4.sh [input_directory] [output_directory] [max_files]
# If no arguments provided, processes /Users/gaia/COURAGE/MENTO
# Set max_files to limit conversion (useful for testing)

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Set input and output directories
INPUT_DIR="${1:-/Users/gaia/COURAGE/MENTO}"
OUTPUT_DIR="${2:-/Users/gaia/COURAGE/MENTO/converted}"
MAX_FILES="${3:-9999}"  # Default to process all files

# Create date-organized subfolder
DATE_FOLDER=$(date +"%Y-%m-%d_%H%M%S")
OUTPUT_DIR="$OUTPUT_DIR/$DATE_FOLDER"

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   WebM to MP4 Batch Converter         ║${NC}"
echo -e "${YELLOW}║   (10-second normalization)            ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed!${NC}"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Find all .webm files and sort by modification time (oldest first)
webm_files=()
while IFS= read -r file; do
    webm_files+=("$file")
done < <(find "$INPUT_DIR" -maxdepth 1 -name "*.webm" -type f -exec ls -t {} + | tail -r)

# Check if any .webm files exist
if [ ${#webm_files[@]} -eq 0 ]; then
    echo -e "${RED}No .webm files found in: $INPUT_DIR${NC}"
    exit 1
fi

# Count files
total_files=${#webm_files[@]}

# Limit to MAX_FILES if specified
if [ $total_files -gt $MAX_FILES ]; then
    echo -e "${CYAN}Test mode: Processing only first $MAX_FILES of $total_files files${NC}"
    total_files=$MAX_FILES
fi

current=0

echo -e "${GREEN}Found ${#webm_files[@]} WebM file(s), will convert $total_files${NC}"
echo -e "${GREEN}Input:  $INPUT_DIR${NC}"
echo -e "${GREEN}Output: $OUTPUT_DIR${NC}"
echo -e "${CYAN}Files will be processed in chronological order (oldest → newest)${NC}"
echo ""

# Process each file
for webm_file in "${webm_files[@]}"; do
    # Stop if we've reached the limit
    if [ $current -ge $MAX_FILES ]; then
        break
    fi
    
    ((current))
    
    # Get filename without path and extension
    filename=$(basename "$webm_file" .webm)
    
    # Add sequential prefix to maintain order (e.g., 001_, 002_)
    seq_prefix=$(printf "%03d" $current)
    output_file="$OUTPUT_DIR/${seq_prefix}_${filename}.mp4"
    
    # Get file metadata for logging
    file_date=$(date -r "$webm_file" "+%Y-%m-%d %H:%M:%S")
    
    # Get duration of input video
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$webm_file")
    duration_int=$(printf "%.0f" "$duration")
    
    # Convert with 10-second normalization
    # If video > 10s: speed it up to fit in 10s
    # If video < 10s: loop to reach 10s
    
    # Base video filter: ensure dimensions are even (required for H.264)
    vf_base="scale='iw-mod(iw,2)':'ih-mod(ih,2)'"
    
    if (( $(echo "$duration > 10" | bc -l) )); then
        # Video is longer than 10s - speed it up
        speed=$(echo "scale=3; $duration / 10" | bc)
        
        # Calculate video PTS (presentation timestamp) multiplier
        video_pts=$(echo "scale=3; 1 / $speed" | bc)
        
        # Combine filters: speed + dimension fix
        vf_combined="setpts=${video_pts}*PTS,${vf_base}"
        
        # Calculate audio tempo (supports up to 2x, chain filters for higher speeds)
        if (( $(echo "$speed > 2" | bc -l) )); then
            atempo1=2.0
            atempo2=$(echo "scale=3; $speed / 2" | bc)
            audio_filter="atempo=$atempo1,atempo=$atempo2"
        else
            audio_filter="atempo=$speed"
        fi
        
        echo -e "${YELLOW}[$current/$total_files] Converting: $filename.webm (${duration_int}s → 10s @ ${speed}x speed)${NC}"
        
        ffmpeg -i "$webm_file" \
            -vf "$vf_combined" \
            -af "$audio_filter" \
            -c:v libx264 \
            -preset medium \
            -crf 20 \
            -c:a aac \
            -b:a 192k \
            -movflags +faststart \
            "$output_file" \
            -y \
            -loglevel error \
            -stats
    else
        # Video is shorter than 10s - loop it
        echo -e "${YELLOW}[$current/$total_files] Converting: $filename.webm (${duration_int}s → 10s, looped)${NC}"
        
        ffmpeg -stream_loop -1 -i "$webm_file" \
            -t 10 \
            -vf "$vf_base" \
            -c:v libx264 \
            -preset medium \
            -crf 20 \
            -c:a aac \
            -b:a 192k \
            -movflags +faststart \
            "$output_file" \
            -y \
            -loglevel error \
            -stats
    fi
    
    if [ $? -eq 0 ]; then
        # Preserve original file modification time
        touch -r "$webm_file" "$output_file"
        
        # Get file sizes
        webm_size=$(du -h "$webm_file" | cut -f1)
        mp4_size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}✓ Success: ${seq_prefix}_${filename}.mp4${NC}"
        echo -e "${CYAN}  Original: $webm_size | Output: $mp4_size | Date: $file_date${NC}"
    else
        echo -e "${RED}✗ Failed: ${filename}.webm${NC}"
    fi
    echo ""
done

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Conversion Complete!                 ║${NC}"
echo -e "${GREEN}║   Processed: $current file(s)                  ║${NC}"
echo -e "${GREEN}║   Location: $OUTPUT_DIR${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Files are numbered sequentially and maintain chronological order${NC}"
