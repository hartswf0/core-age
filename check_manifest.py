import json
import os
import glob

MANIFEST_PATH = '/Users/gaia/COURAGE/file-manifest.json'
ROOT_DIR = '/Users/gaia/COURAGE'

def check_manifest():
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
    
    existing_paths = set(f['path'] for f in manifest['files']['all'])
    
    patterns = ['*inception*', '*wag-frank*']
    found_files = []
    
    for pattern in patterns:
        found_files.extend(glob.glob(os.path.join(ROOT_DIR, pattern)))
        
    missing_files = []
    for file_path in found_files:
        if file_path not in existing_paths and os.path.isfile(file_path):
            missing_files.append(file_path)
            
    print("Missing Files:")
    for f in missing_files:
        print(f)

if __name__ == "__main__":
    check_manifest()
