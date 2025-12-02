import json
import random

INPUT_FILE = "embeddings.json"
OUTPUT_FILE = "embeddings_data.js"
SAMPLE_SIZE = 2000

def sample_embeddings():
    print(f"Loading {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: embeddings.json not found.")
        return

    all_ids = list(data["vectors"].keys())
    total = len(all_ids)
    print(f"Total embeddings: {total}")

    # Sample
    if total > SAMPLE_SIZE:
        sampled_ids = random.sample(all_ids, SAMPLE_SIZE)
    else:
        sampled_ids = all_ids

    sampled_vectors = {}
    for pid in sampled_ids:
        sampled_vectors[pid] = data["vectors"][pid]

    # Create JS content
    js_content = f"""
// REAL EMBEDDINGS SAMPLED FROM {INPUT_FILE}
// Count: {len(sampled_vectors)}
// Dim: {data['metadata']['dim']}
window.REAL_EMBEDDINGS = {{
    metadata: {{
        count: {len(sampled_vectors)},
        dim: {data['metadata']['dim']},
        model: "{data['metadata']['model']}"
    }},
    vectors: {json.dumps(sampled_vectors, indent=2)}
}};
console.log("Loaded " + window.REAL_EMBEDDINGS.metadata.count + " real embeddings.");
"""

    with open(OUTPUT_FILE, 'w') as f:
        f.write(js_content)
    
    print(f"Wrote {len(sampled_vectors)} embeddings to {OUTPUT_FILE}")

if __name__ == "__main__":
    sample_embeddings()
