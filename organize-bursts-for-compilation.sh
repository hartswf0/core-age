#!/bin/bash

# Burst Episode Compilation Strategist
# Analyzes burst episodes by size, date, duration to create compilation strategies
# Usage: ./organize-bursts-for-compilation.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

BURSTS_DIR="/Users/gaia/COURAGE/MENTO/SERIES_OUTPUT/compiled"
STRATEGY_DIR="/Users/gaia/COURAGE/MENTO/COMPILATION_STRATEGIES"

mkdir -p "$STRATEGY_DIR"/{by_size,by_date,by_duration,smart_compilations}

echo -e "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Burst Episode Compilation Strategist       ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Analyze all bursts
ANALYSIS_FILE="$STRATEGY_DIR/burst_analysis.csv"
echo "filename,size_mb,duration_sec,date_created,aspect_category" > "$ANALYSIS_FILE"

echo -e "${CYAN}Analyzing burst episodes...${NC}"

for burst in "$BURSTS_DIR"/MENTO_Chronicles_Burst*.mp4; do
    if [ ! -f "$burst" ]; then
        continue
    fi
    
    filename=$(basename "$burst")
    
    # Get file size in MB
    size_bytes=$(stat -f%z "$burst" 2>/dev/null || stat -c%s "$burst" 2>/dev/null)
    size_mb=$(echo "scale=1; $size_bytes / 1048576" | bc)
    
    # Get duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$burst" 2>/dev/null)
    duration_sec=$(printf "%.0f" "$duration")
    
    # Get creation date
    date_created=$(stat -f%SB -t%Y%m%d_%H%M%S "$burst" 2>/dev/null || date -r "$burst" +%Y%m%d_%H%M%S 2>/dev/null)
    
    # Get aspect ratio from first frame
    width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$burst" 2>/dev/null)
    height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$burst" 2>/dev/null)
    
    if [ -n "$width" ] && [ -n "$height" ] && [ "$width" -gt 0 ] && [ "$height" -gt 0 ]; then
        aspect=$(echo "scale=2; $width / $height" | bc)
        if (( $(echo "$aspect < 0.9" | bc -l) )); then
            category="portrait"
        elif (( $(echo "$aspect > 1.1" | bc -l) )); then
            category="landscape"
        else
            category="square"
        fi
    else
        category="unknown"
    fi
    
    echo "$filename,$size_mb,$duration_sec,$date_created,$category" >> "$ANALYSIS_FILE"
done

total_bursts=$(tail -n +2 "$ANALYSIS_FILE" | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Analyzed $total_bursts burst episodes${NC}"
echo ""

# Strategy 1: Sort by Size
echo -e "${MAGENTA}━━━ Strategy 1: Organization by SIZE ━━━${NC}"
echo ""

SIZE_SORTED="$STRATEGY_DIR/by_size/sorted_by_size.txt"
echo "BURSTS SORTED BY SIZE (Largest to Smallest)" > "$SIZE_SORTED"
echo "=============================================" >> "$SIZE_SORTED"
echo "" >> "$SIZE_SORTED"

tail -n +2 "$ANALYSIS_FILE" | sort -t',' -k2 -rn | while IFS=',' read -r fname size dur date cat; do
    printf "%-45s %6s MB  %3s sec  [%s]\n" "$fname" "$size" "$dur" "$cat" >> "$SIZE_SORTED"
done

# Create size-based compilations
echo -e "${CYAN}Size-Based Groupings:${NC}"

# Large episodes (>50MB)
large_count=$(tail -n +2 "$ANALYSIS_FILE" | awk -F',' '$2 > 50' | wc -l | tr -d ' ')
# Medium episodes (20-50MB)
medium_count=$(tail -n +2 "$ANALYSIS_FILE" | awk -F',' '$2 > 20 && $2 <= 50' | wc -l | tr -d ' ')
# Small episodes (<20MB)
small_count=$(tail -n +2 "$ANALYSIS_FILE" | awk -F',' '$2 <= 20' | wc -l | tr -d ' ')

echo -e "  ${GREEN}Large (>50MB):${NC}  $large_count episodes → High-quality showcase"
echo -e "  ${YELLOW}Medium (20-50MB):${NC} $medium_count episodes → Standard episodes"
echo -e "  ${CYAN}Small (<20MB):${NC}  $small_count episodes → Quick clips/teasers"

# Create symlinks by size
tail -n +2 "$ANALYSIS_FILE" | while IFS=',' read -r fname size dur date cat; do
    size_int=$(printf "%.0f" "$size")
    if [ "$size_int" -gt 50 ]; then
        ln -sf "$BURSTS_DIR/$fname" "$STRATEGY_DIR/by_size/large_$fname" 2>/dev/null
    elif [ "$size_int" -gt 20 ]; then
        ln -sf "$BURSTS_DIR/$fname" "$STRATEGY_DIR/by_size/medium_$fname" 2>/dev/null
    else
        ln -sf "$BURSTS_DIR/$fname" "$STRATEGY_DIR/by_size/small_$fname" 2>/dev/null
    fi
done

echo ""

# Strategy 2: Sort by Date
echo -e "${MAGENTA}━━━ Strategy 2: Organization by DATE ━━━${NC}"
echo ""

DATE_SORTED="$STRATEGY_DIR/by_date/sorted_by_date.txt"
echo "BURSTS SORTED BY DATE (Newest to Oldest)" > "$DATE_SORTED"
echo "==========================================" >> "$DATE_SORTED"
echo "" >> "$DATE_SORTED"

tail -n +2 "$ANALYSIS_FILE" | sort -t',' -k4 -r | while IFS=',' read -r fname size dur date cat; do
    date_display=$(echo "$date" | sed 's/_/ /' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')
    printf "%-45s  %s  %6s MB  [%s]\n" "$fname" "$date_display" "$size" "$cat" >> "$DATE_SORTED"
done

# Group by date batches
echo -e "${CYAN}Date-Based Groupings:${NC}"

# Extract unique dates
tail -n +2 "$ANALYSIS_FILE" | cut -d',' -f4 | cut -d'_' -f1 | sort -u | while read date_key; do
    count=$(tail -n +2 "$ANALYSIS_FILE" | grep "^[^,]*,[^,]*,[^,]*,$date_key" | wc -l | tr -d ' ')
    date_display=$(echo "$date_key" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')
    echo -e "  ${GREEN}$date_display:${NC} $count episodes"
    
    # Create date folder
    mkdir -p "$STRATEGY_DIR/by_date/batch_$date_key"
    tail -n +2 "$ANALYSIS_FILE" | grep "^[^,]*,[^,]*,[^,]*,$date_key" | cut -d',' -f1 | while read fname; do
        ln -sf "$BURSTS_DIR/$fname" "$STRATEGY_DIR/by_date/batch_$date_key/$fname" 2>/dev/null
    done
done

echo ""

# Strategy 3: Smart Compilations
echo -e "${MAGENTA}━━━ Strategy 3: SMART COMPILATION IDEAS ━━━${NC}"
echo ""

SMART_PLAN="$STRATEGY_DIR/smart_compilations/compilation_plan.txt"
cat > "$SMART_PLAN" << 'EOF'
SMART COMPILATION STRATEGIES
=============================

1. "BEST OF" COMPILATION (30-45 min)
   - Take the 15-20 largest bursts
   - Theme: Showcase of your best cinematography
   - Target: YouTube feature-length

2. "DAILY CHRONICLES" SERIES
   - One compilation per recording date
   - Theme: Day-in-the-life style episodes
   - Target: Episodic series

3. "HIGHLIGHT REEL" (5-10 min)
   - Top 5-8 medium-sized bursts
   - Theme: Quick showcase/trailer
   - Target: Social media shares

4. "PORTRAIT SERIES" vs "LANDSCAPE SERIES"
   - Separate by aspect ratio
   - Theme: Format-optimized content
   - Target: Platform-specific (TikTok vs YouTube)

5. "CHRONOLOGICAL CUT"
   - All bursts in timestamp order
   - Theme: Complete documentation
   - Target: Archive/full story

6. "SIZE-BALANCED MIX"
   - Alternate large/medium/small
   - Theme: Variety pack
   - Target: Engagement optimization

EOF

cat "$SMART_PLAN"

# Generate ready-to-use compilation scripts
echo ""
echo -e "${YELLOW}Generating compilation scripts...${NC}"

# Best Of compilation
cat > "$STRATEGY_DIR/smart_compilations/compile_best_of.sh" << 'EOFSCRIPT'
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
EOFSCRIPT

chmod +x "$STRATEGY_DIR/smart_compilations/compile_best_of.sh"

# Chronological compilation
cat > "$STRATEGY_DIR/smart_compilations/compile_chronological.sh" << 'EOFSCRIPT'
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
EOFSCRIPT

chmod +x "$STRATEGY_DIR/smart_compilations/compile_chronological.sh"

echo -e "${GREEN}✓ Created compilation scripts${NC}"
echo ""

# Final summary
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   COMPILATION STRATEGY ANALYSIS COMPLETE!     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📊 Statistics:${NC}"
total_size=$(tail -n +2 "$ANALYSIS_FILE" | cut -d',' -f2 | awk '{sum+=$1} END {print sum}')
total_duration=$(tail -n +2 "$ANALYSIS_FILE" | cut -d',' -f3 | awk '{sum+=$1} END {print sum}')
total_minutes=$(echo "scale=1; $total_duration / 60" | bc)

echo "  Total Bursts: $total_bursts"
echo "  Total Size: ${total_size} MB"
echo "  Total Duration: ${total_minutes} minutes"
echo ""

echo -e "${CYAN}📁 Output Structure:${NC}"
echo "  $STRATEGY_DIR/"
echo "    ├── by_size/              (Large/Medium/Small groups)"
echo "    ├── by_date/              (Grouped by recording date)"
echo "    ├── by_duration/          (Short/Medium/Long)"
echo "    ├── smart_compilations/   (Ready-to-compile scripts)"
echo "    └── burst_analysis.csv    (Complete metadata)"
echo ""

echo -e "${YELLOW}🎬 Quick Compilation Examples:${NC}"
echo ""
echo -e "  ${BOLD}1. Best Of (Top 15):${NC}"
echo "     cd $STRATEGY_DIR/smart_compilations"
echo "     ./compile_best_of.sh"
echo ""
echo -e "  ${BOLD}2. Chronological Story:${NC}"
echo "     cd $STRATEGY_DIR/smart_compilations"
echo "     ./compile_chronological.sh"
echo ""
echo -e "  ${BOLD}3. Date-Specific:${NC}"
echo "     cd $STRATEGY_DIR/by_date/batch_YYYYMMDD"
echo "     ffmpeg -f concat -safe 0 -i <(ls *.mp4 | sed 's/^/file /') -c copy output.mp4"
echo ""

echo -e "${GREEN}Ready to create professional compilations! 🚀${NC}"
