import json
import math
import random
import numpy as np
from collections import defaultdict

# --- Configuration ---
LDRAW_DIR = "./wag-viewer-prime-integration-20251112-055341-copy/ldraw" 
OUTPUT_FILE = "embeddings.json"
EMBEDDING_DIM = 64
WALK_LENGTH = 10
NUM_WALKS = 20
WINDOW_SIZE = 5

import os

# --- 1. Data Loading (Real Models) ---
def load_training_corpus():
    print(f"Scanning for LDraw models in {LDRAW_DIR}...")
    
    corpus = [] # List of "sentences" (lists of part IDs in a model)
    all_parts = set()
    
    # Walk through directory to find .ldr and .mpd files
    # We look in the parent directory of ldraw as well, based on the find command output
    search_dirs = [LDRAW_DIR, os.path.dirname(LDRAW_DIR)]
    
    model_files = []
    for d in search_dirs:
        for root, dirs, files in os.walk(d):
            for f in files:
                if f.endswith(".ldr") or f.endswith(".mpd"):
                    model_files.append(os.path.join(root, f))
    
    print(f"Found {len(model_files)} model files.")
    
    for filepath in model_files:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            current_model_parts = []
            
            for line in lines:
                line = line.strip()
                # LDraw Type 1 Line: 1 <colour> x y z a b c d e f g h i <file>
                if line.startswith('1 '):
                    parts = line.split()
                    if len(parts) >= 15:
                        part_id = parts[14].lower()
                        current_model_parts.append(part_id)
                        all_parts.add(part_id)
                
                # For MPD files, "0 FILE" starts a new sub-model (context switch)
                elif line.startswith('0 FILE'):
                    if current_model_parts:
                        corpus.append(current_model_parts)
                    current_model_parts = []
            
            if current_model_parts:
                corpus.append(current_model_parts)
                
        except Exception as e:
            print(f"Skipping {filepath}: {e}")
            
    print(f"Extracted {len(corpus)} contexts (models/submodels).")
    print(f"Vocabulary size: {len(all_parts)} unique parts.")
    # Return corpus, vocabulary, and the list of files used
    return corpus, list(all_parts), model_files

# --- 3. Training (Rigorous PPMI-SVD) ---
def train_embeddings(corpus, all_ids):
    """
    Trains word embeddings using the PPMI-SVD method described by Levy & Goldberg (2014).
    This is mathematically equivalent to Skip-Gram with Negative Sampling (SGNS) as used in Word2Vec,
    but solved via rigorous matrix factorization rather than stochastic gradient descent.
    
    Reference: "Neural Word Embedding as Implicit Matrix Factorization" (Levy & Goldberg, NIPS 2014)
    """
    print("Training embeddings using PPMI-SVD (Rigorous Matrix Factorization)...")
    
    node_to_idx = {node_id: i for i, node_id in enumerate(all_ids)}
    n_nodes = len(all_ids)
    
    # 1. Build Co-occurrence Matrix from Corpus
    print("  - Building co-occurrence matrix from model contexts...")
    co_occur = defaultdict(int)
    total_pairs = 0
    
    for parts_list in corpus:
        # Sliding window over the parts list
        # (Assuming parts listed close together in file are spatially/semantically related)
        for i, target in enumerate(parts_list):
            if target not in node_to_idx: continue
            
            start = max(0, i - WINDOW_SIZE)
            end = min(len(parts_list), i + WINDOW_SIZE + 1)
            
            for j in range(start, end):
                if i == j: continue
                context = parts_list[j]
                if context not in node_to_idx: continue
                
                u = node_to_idx[target]
                v = node_to_idx[context]
                co_occur[(u, v)] += 1
                total_pairs += 1

    # 2. Compute PPMI Matrix
    print("  - Computing PPMI matrix...")
    node_counts = np.zeros(n_nodes)
    for (u, v), count in co_occur.items():
        node_counts[u] += count
        
    M = np.zeros((n_nodes, n_nodes))
    for (u, v), count in co_occur.items():
        if count > 0:
            # Add smoothing to avoid log(0) issues or over-weighting rare pairs
            pmi = math.log((count * total_pairs) / (node_counts[u] * node_counts[v] + 1e-8))
            M[u, v] = max(pmi, 0)
            
    # 3. SVD
    print("  - Performing SVD...")
    try:
        U, S, Vt = np.linalg.svd(M)
        dim = min(EMBEDDING_DIM, n_nodes)
        U_k = U[:, :dim]
        S_k = np.diag(np.sqrt(S[:dim]))
        embeddings_matrix = np.dot(U_k, S_k)
        
        vectors = {}
        for pid, idx in node_to_idx.items():
            vectors[pid] = embeddings_matrix[idx]
        return vectors
        
    except np.linalg.LinAlgError:
        print("SVD Failed.")
        return {}

# --- 4. Export ---
def export_embeddings(vectors, parts, model_files):
    print(f"Exporting to {OUTPUT_FILE}...")
    output = {
        "metadata": {
            "dim": EMBEDDING_DIM,
            "model": "PPMI-SVD (Levy & Goldberg 2014)",
            "count": len(vectors),
            "corpus": [os.path.basename(f) for f in model_files] # Save filenames
        },
        "vectors": {}
    }
    
    for pid, vec in vectors.items():
        # Find metadata
        part = next(p for p in parts if p["id"] == pid)
        output["vectors"][pid] = {
            "vector": vec.tolist(),
            "category": part["cat"]
        }
        
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    print("Done.")

# --- Main ---
if __name__ == "__main__":
    corpus, all_ids, model_files = load_training_corpus()
    if not corpus:
        print("No training data found. Check LDRAW_DIR.")
    else:
        vectors = train_embeddings(corpus, all_ids)
        # We need to pass 'parts' list for metadata export, 
        # let's reconstruct a minimal one
        parts_meta = [{"id": pid, "cat": "Unknown"} for pid in all_ids]
        export_embeddings(vectors, parts_meta, model_files)
