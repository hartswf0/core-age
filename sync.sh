#!/bin/bash
# COURAGE Sync Script
# -------------------
# Usage: ./sync.sh "Commit message"
# If no message provided, uses timestamp.

MSG="$1"
if [ -z "$MSG" ]; then
    MSG="wip: auto-sync $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "🚀 Syncing logic to origin..."
git add .
git commit -m "$MSG"
git push origin main

echo "✅ Done. All work grounded."
