"""Push all project files to GitHub via REST API."""
import os, json, base64, urllib.request, urllib.error, ssl

OWNER = "bhargavithentu28"
REPO = "SentinelAI"
BRANCH = "main"
TOKEN = os.environ.get("GH_TOKEN", "")  # Will be passed as env var
BASE = r"c:\Users\bharg\buildathon"

SKIP = {'node_modules', '.next', '__pycache__', 'venv', '.git', '.gemini',
        'package-lock.json', 'sentinelai.db', 'all_files.json', 'batch1.json',
        '_push_to_github.py'}

EXTENSIONS = {'.py', '.ts', '.tsx', '.js', '.json', '.css', '.yml', '.yaml',
              '.conf', '.txt', '.md', '.d.ts', '.example', '.gitignore'}

def api(method, path, data=None):
    url = f"https://api.github.com{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"token {TOKEN}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    if body:
        req.add_header("Content-Type", "application/json")
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"ERROR {e.code}: {e.read().decode()[:200]}")
        raise

def collect_files():
    files = []
    for root, dirs, fnames in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for fname in fnames:
            if fname in SKIP:
                continue
            full = os.path.join(root, fname)
            _, ext = os.path.splitext(fname)
            if fname == '.gitignore' or ext in EXTENSIONS:
                rel = os.path.relpath(full, BASE).replace('\\', '/')
                files.append((rel, full))
    return files

def main():
    if not TOKEN:
        print("Set GH_TOKEN environment variable!")
        return

    files = collect_files()
    print(f"Pushing {len(files)} files to {OWNER}/{REPO}...")

    # Step 1: Create blobs for each file
    tree_items = []
    for i, (rel, full) in enumerate(files):
        with open(full, 'rb') as f:
            content = base64.b64encode(f.read()).decode()
        blob = api("POST", f"/repos/{OWNER}/{REPO}/git/blobs", {
            "content": content, "encoding": "base64"
        })
        tree_items.append({
            "path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]
        })
        print(f"  [{i+1}/{len(files)}] {rel}")

    # Step 2: Create tree
    print("Creating tree...")
    tree = api("POST", f"/repos/{OWNER}/{REPO}/git/trees", {"tree": tree_items})

    # Step 3: Create commit
    print("Creating commit...")
    commit = api("POST", f"/repos/{OWNER}/{REPO}/git/commits", {
        "message": "Initial commit: SentinelAI - AI Cybersecurity Platform\n\nFeatures:\n- FastAPI backend with JWT auth, WebSocket alerts, AI risk scoring\n- Next.js frontend with student & admin dashboards\n- Security Training Center with interactive quizzes\n- Real-time anomaly detection and behavior monitoring\n- Digital wellbeing, permission audit, peer leaderboard\n- Admin analytics: trends, college breakdown, threat feed, user management\n- Docker Compose deployment support",
        "tree": tree["sha"],
        "parents": []
    })

    # Step 4: Create/update branch ref
    print("Updating branch ref...")
    try:
        api("POST", f"/repos/{OWNER}/{REPO}/git/refs", {
            "ref": f"refs/heads/{BRANCH}", "sha": commit["sha"]
        })
    except:
        api("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", {
            "sha": commit["sha"], "force": True
        })

    print(f"\n✅ Done! https://github.com/{OWNER}/{REPO}")

if __name__ == "__main__":
    main()
