import json
import os

MANIFEST_PATH = 'file-manifest.json'
ROOT_DIR = '.'

def find_missing_html():
    # 1. Load Manifest
    try:
        with open(MANIFEST_PATH, 'r') as f:
            manifest = json.load(f)
            manifest_files = set(f['name'] for f in manifest['files']['all'])
    except Exception as e:
        print(f"Error loading manifest: {e}")
        return

    # 2. Scan Directory
    html_files = []
    for root, dirs, files in os.walk(ROOT_DIR):
        if 'node_modules' in dirs:
            dirs.remove('node_modules') # Don't recurse into node_modules
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            if file.endswith('.html'):
                html_files.append(file)

    # 3. Compare
    missing = []
    for html_file in html_files:
        if html_file not in manifest_files:
            missing.append(html_file)

    # 4. Report
    print(f"Total HTML files found: {len(html_files)}")
    print(f"Files in manifest: {len(manifest_files)}")
    print(f"Missing HTML files ({len(missing)}):")
    for m in sorted(missing):
        print(f"- {m}")

if __name__ == "__main__":
    find_missing_html()
