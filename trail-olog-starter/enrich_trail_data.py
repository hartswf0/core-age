import json
import os

def enrich_data():
    # Load Trail Data
    with open('courage-trail-data.json', 'r') as f:
        trail_data = json.load(f)

    # Load Manifest
    with open('file-manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Create lookup map for manifest files
    manifest_map = {f['name']: f for f in manifest['files']['all']}

    print(f"Loaded {len(manifest_map)} files from manifest.")

    enrichment_count = 0

    # 1. ENRICH EXISTING ZONES
    # We need to be careful not to re-nest objects if running multiple times.
    # The current data has objects now.
    
    # Collect all currently tracked files to find orphans later
    all_trailed_files = set()

    for zone in trail_data['zones']:
        if zone['id'] == 'unsorted': continue 
        
        new_artifacts_list = []
        for art in zone['artifacts']:
            # Handle if it's string or object
            art_name = art if isinstance(art, str) else art['text']
            all_trailed_files.add(art_name)

            meta = manifest_map.get(art_name)
            
            move_obj = {
                "text": art_name,
                "actor": 1,
                "type": "artifact"
            }
            
            if meta:
                # Use CREATED time for "birth"
                move_obj['timestamp'] = meta.get('created')
                move_obj['size_human'] = meta.get('size_human')
                move_obj['path'] = meta.get('path')
                enrichment_count += 1
            else:
                move_obj['timestamp'] = "2025-11-01T00:00:00Z"
                move_obj['size_human'] = "Unknown"
            
            new_artifacts_list.append(move_obj)
        
        zone['artifacts'] = new_artifacts_list

    # 2. FIND MISSING FILES (ORPHANS)
    missing_files = []
    for fname, fmeta in manifest_map.items():
        if fname not in all_trailed_files and not fname.startswith('.'):
            # Filter for relevant types
            ext = os.path.splitext(fname)[1].lower()
            if ext in ['.html', '.json', '.md']:
                missing_files.append({
                    "text": fname,
                    "actor": 1,
                    "type": "artifact",
                    "timestamp": fmeta.get('created'),
                    "size_human": fmeta.get('size_human'),
                    "path": fmeta.get('path')
                })
    
    print(f"Found {len(missing_files)} missing files.")
    
    # 3. ADD TO UNSORTED ZONE
    if missing_files:
        unsorted_zone = next((z for z in trail_data['zones'] if z['id'] == 'unsorted'), None)
        if not unsorted_zone:
            unsorted_zone = {
                "id": "unsorted",
                "label": "UNCHARTED BACKLOG",
                "type": "plains",
                "color": "#94a3b8",
                "position": { "x": 0.05, "y": 0.9 },
                "trailLevel": 0,
                "fileCount": 0,
                "dateRange": "Various",
                "artifacts": [],
                "decisions": ["Pending classification"],
                "patterns": ["entropy"],
                "intent": "Unsorted discoveries"
            }
            trail_data['zones'].append(unsorted_zone)
        
        # Sort by creation time
        missing_files.sort(key=lambda x: x.get('timestamp', ''))
        unsorted_zone['artifacts'] = missing_files
        unsorted_zone['fileCount'] = len(missing_files)

    print(f"Enriched {enrichment_count} artifacts.")
    
    # Save back
    with open('courage-trail-data.json', 'w') as f:
        json.dump(trail_data, f, indent=4)
        print("Saved courage-trail-data.json")

if __name__ == "__main__":
    enrich_data()
