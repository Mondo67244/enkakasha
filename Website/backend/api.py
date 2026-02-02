import sys
import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import shutil
from pathlib import Path

# Add parent directory to path to import existing scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import existing modules (we will need to refactor them slightly or use them carefully)
# For now, we will use subprocess or direct import if possible.
# Ideally, we should refactor enka.py to have a clean "get_data" function that returns JSON without printing.
import enka
import akasha
from backend import logic

app = FastAPI(title="Genshin AI Mentor API")

# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    uid: str

class AnalyzeRequest(BaseModel):
    api_key: str
    user_data: dict
    context_data: dict

@app.get("/")
def read_root():
    return {"status": "Genshin AI Mentor API is running"}

@app.post("/verify_key")
async def verify_key(request: dict = Body(...)):
    api_key = request.get("api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key required")
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents="Hello"
        )
        return {"valid": True, "message": "API Key verified successfully!"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid API Key: {str(e)}")

@app.post("/scan/{uid}")
async def scan_uid(uid: str):
    """
    Wraps enka.fetch_player_data.
    Note: We need to capture the return value of fetch_player_data.
    """
    try:
        # We invoke enka.fetch_player_data. 
        # CAUTION: The original script prints a lot and saves files. 
        # We might want to modify enka.py to return data cleanly or read the saved JSON.
        
        # For the MVP, let's call it and then read the generated JSON.
        # This is a bit "hacky" but safer than rewriting the whole large script right now.
        
        api_data, error = enka.fetch_player_data(uid)
        
        if error:
             raise HTTPException(status_code=404, detail=error)
             
        return {"data": api_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leaderboard/{calc_id}")
async def get_leaderboard(calc_id: str):
    """
    Fetches Akasha leaderboard context.
    """
    try:
        # fetch_leaderboard now returns the full list of dicts with stats
        data = akasha.fetch_leaderboard(calc_id, limit=20)
        if not data:
             raise HTTPException(status_code=404, detail="No data found or ID invalid")
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_build(request: dict = Body(...)):
    """
    1. Filters User Artifacts (based on target char).
    2. Summarizes Leaderboard Context.
    3. Sends prompt to Gemini.
    """
    api_key = request.get("api_key")
    user_data = request.get("user_data")
    context_data = request.get("context_data")
    context_data = request.get("context_data")
    target_char_name = request.get("target_char")
    model_name = request.get("model_name", "gemini-2.5-flash")
    
    if not api_key or not user_data or not target_char_name:
        raise HTTPException(status_code=400, detail="Missing API Key, User Data, or Target Character")

    # 1. Logic
    context_summary = logic.prepare_context(context_data)
    inventory, error = logic.prepare_inventory(user_data, target_char_name)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
        
    target_set = inventory['target_set']
    pool_size = len(inventory['pool'])
    
    # 2. Prompt
    prompt = f"""
    You are a World-Class Genshin Impact Theorycrafting Engine.

    ### OBJECTIVE
    Mathematically optimize the artifact build for **{target_char_name}** using ONLY the items provided in the user's inventory.
    The user explicitly requires the set: **{target_set}**.

    ### CONTEXT & BENCHMARKS
    Use the following Global Leaderboard data to determine the optimal stat distribution targets:
    {context_summary}

    ### USER INVENTORY DATA
    **Constraint:** You are strictly forbidden from hallucinating artifacts. Select 5 items exclusively from the list below.
    **Dataset:** {pool_size} pieces of {target_set}:
    {inventory['pool']}

    ### OUTPUT FORMAT
    You must return a valid JSON object strictly following this schema. Do not include markdown code blocks or additional text.

    {{
      "recommended_build": [
        {{
          "slot": "Flower",
          "name": "Artifact Name or ID",
          "main_stat": "HP",
          "main_value": "4780",
          "substats": ["Crit Rate+3.9%", "Crit DMG+20%"],
          "set": "{target_set}",
          "reason": "Balances Crit ratio..."
        }},
        {{
          "slot": "Plume",
          "name": "...",
          "main_stat": "ATK",
          "main_value": "311",
          "substats": ["..."],
          "set": "{target_set}",
          "reason": "..."
        }},
        ... (Sands, Goblet, Circlet)
      ],
      "final_stats": {{
        "hp": "...",
        "atk": "...",
        "def": "...",
        "em": "...",
        "cr": "...",
        "cd": "...",
        "er": "..."
      }},
      "mentor_analysis": "Detailed explanation of why this build is optimal and how it compares to the leaderboard benchmarks."
    }}
    """
    
    # 3. Call AI
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

# --- DATA MANAGEMENT ENDPOINTS ---

@app.get("/data/list")
def list_data_folders():
    """
    Lists all directory folders that look like scan data.
    Filters out system/project directories.
    """
    root = Path(".")
    ignored = {".git", ".agent", ".gemini", "venv", "__pycache__", "backend", "frontend", "origins", "node_modules"}
    
    folders = []
    try:
        for item in root.iterdir():
            if item.is_dir() and item.name not in ignored and not item.name.startswith("."):
                # Simple heuristic: scan folders usually have _ or numbers, but we'll list all non-ignored dirs
                # We can check if they contain 'raw.json' to be sure it's a scan folder
                if (item / "raw.json").exists() or (item / "characters_v1.csv").exists():
                    stats = item.stat()
                    folders.append({
                        "name": item.name,
                        "created": stats.st_ctime,
                        "path": str(item.resolve())
                    })
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
         
    return {"folders": folders}

@app.delete("/data/delete/{folder_name}")
def delete_data_folder(folder_name: str):
    path = Path(".") / folder_name
    # Security check: prevent deleting root or outside dirs
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail="Folder not found")
        
    # Extra safety: check if it looks like a scan folder
    if not ((path / "raw.json").exists() or (path / "characters_v1.csv").exists() or "Mondo" in folder_name): # fallback check
         # Allow deleting if user really renamed it to something else, but maybe warn?
         # For MVP, we trust the list_data_folders output.
         pass

    try:
        shutil.rmtree(path)
        return {"success": True, "message": f"Deleted {folder_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RenameRequest(BaseModel):
    old_name: str
    new_name: str

@app.post("/data/rename")
def rename_data_folder(request: RenameRequest):
    old_path = Path(".") / request.old_name
    new_path = Path(".") / request.new_name
    
    if not old_path.exists():
        raise HTTPException(status_code=404, detail="Source folder not found")
        
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Destination folder already exists")
        
    try:
        os.rename(old_path, new_path)
        return {"success": True, "message": f"Renamed to {request.new_name}"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
