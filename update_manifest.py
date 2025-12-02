import json
import os
import datetime
import mimetypes

MANIFEST_PATH = '/Users/gaia/COURAGE/file-manifest.json'
ROOT_DIR = '/Users/gaia/COURAGE'

FILES_TO_ADD = [
    'inception-harness.html',
    'inception-horseman.html',
    'inception-editor.html',
    'inception-tetrad-code-editor.html',
    'wag-frank-tetrad-inception.html',
    'wag-frank-studio.html',
    'wag-frank-olog.html',
    'wag-frank-terminal.html',
    'wag-frank-unified.html',
    'wag-frank-tetrad.html',
    'wag-frank-tetrad-olog.html',
    'wag-frank-tetrad-term.html',
    'wag-frank-tetrad-unif.html',
    'wag-frank-tetrad-studio.html'
]

def get_file_metadata(filename):
    path = os.path.join(ROOT_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: File not found: {path}")
        return None
        
    stat = os.stat(path)
    mime_type, _ = mimetypes.guess_type(path)
    
    size_human = f"{stat.st_size / 1024:.2f} KB"
    if stat.st_size > 1024 * 1024:
        size_human = f"{stat.st_size / (1024 * 1024):.2f} MB"
        
    return {
        "name": filename,
        "path": path,
        "extension": os.path.splitext(filename)[1],
        "mime_type": mime_type or "application/octet-stream",
        "size_bytes": stat.st_size,
        "size_human": size_human,
        "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "created": datetime.datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "accessed": datetime.datetime.fromtimestamp(stat.st_atime).isoformat(),
        "permissions": oct(stat.st_mode)[-3:]
    }

def update_manifest():
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    
    existing_names = set(f['name'] for f in manifest['files']['all'])
    added_count = 0
    
    for filename in FILES_TO_ADD:
        if filename in existing_names:
            print(f"Skipping existing file: {filename}")
            continue
            
        metadata = get_file_metadata(filename)
        if metadata:
            manifest['files']['all'].append(metadata)
            manifest['total_size_bytes'] += metadata['size_bytes']
            added_count += 1
            print(f"Added: {filename}")
            
    manifest['total_files'] += added_count
    manifest['generated_at'] = datetime.datetime.now().isoformat()
    
    # Update human readable total size
    total_bytes = manifest['total_size_bytes']
    if total_bytes > 1024 * 1024:
        manifest['total_size_human'] = f"{total_bytes / (1024 * 1024):.2f} MB"
    else:
        manifest['total_size_human'] = f"{total_bytes / 1024:.2f} KB"

    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)
        
    print(f"\nSuccess! Added {added_count} files to manifest.")

if __name__ == "__main__":
    update_manifest()
