import sys
import os
import re
from functools import partial
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import shutil
from pathlib import Path
import anyio

# Add parent directory to path to import existing scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import existing modules (we will need to refactor them slightly or use them carefully)
# For now, we will use subprocess or direct import if possible.
# Ideally, we should refactor enka.py to have a clean "get_data" function that returns JSON without printing.
import enka
import akasha
import leaderboard
from backend import logic

app = FastAPI(title="Genshin AI Mentor API")

DATA_ROOT = Path(__file__).resolve().parent.parent / "data"
DATA_ROOT.mkdir(parents=True, exist_ok=True)
SAFE_FOLDER_RE = re.compile(r"^[A-Za-z0-9._-]+$")

# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerifyKeyRequest(BaseModel):
    api_key: str

class AnalyzeRequest(BaseModel):
    api_key: str
    user_data: List[Dict[str, Any]]
    context_data: Optional[List[Dict[str, Any]]] = None
    target_char: str
    model_name: Optional[str] = "gemini-2.5-flash"
    build_notes: Optional[str] = None

class ChatRequest(BaseModel):
    api_key: str
    user_data: List[Dict[str, Any]]
    context_data: Optional[List[Dict[str, Any]]] = None
    target_char: str
    model_name: Optional[str] = "gemini-2.5-flash"
    message: str
    history: Optional[List[Dict[str, str]]] = None

@app.get("/")
def read_root():
    return {"status": "Genshin AI Mentor API is running"}

@app.post("/verify_key")
async def verify_key(request: VerifyKeyRequest):
    api_key = request.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=400, detail="API Key required")
    
    try:
        client = genai.Client(api_key=api_key)
        client.models.generate_content(
            model="gemini-2.5-flash",
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
        
        api_data, error = await anyio.to_thread.run_sync(
            partial(enka.fetch_player_data, uid, output_root=DATA_ROOT)
        )
        
        if error:
             # Return 400/500 with explicit error message from enka.py (which now includes HTML snippet)
             print(f"Scan failed for {uid}: {error}")
             raise HTTPException(status_code=500, detail=f"Scan failed: {error}")
             
        return {"data": api_data}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/leaderboard/{calc_id}")
async def get_leaderboard(calc_id: str):
    """
    Fetches Akasha leaderboard context.
    """
    try:
        # fetch_leaderboard now returns the full list of dicts with stats
        data = await anyio.to_thread.run_sync(
            partial(akasha.fetch_leaderboard, calc_id, limit=20)
        )
        if not data:
             raise HTTPException(status_code=404, detail="No data found or ID invalid")
        return {"data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leaderboard/deep/{calc_id}")
async def get_leaderboard_deep(calc_id: str, character: str, limit: int = 20):
    """
    Fetches leaderboard entries, then enriches with Enka data and filters to a single character.
    """
    if not character:
        raise HTTPException(status_code=400, detail="Character name required")
    try:
        data = await anyio.to_thread.run_sync(
            partial(
                leaderboard.fetch_leaderboard_character,
                calc_id,
                character,
                limit=limit
            )
        )
        if not data:
            raise HTTPException(status_code=404, detail="No data found or ID invalid")
        return {"data": data}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_build(request: AnalyzeRequest):
    """
    1. Filters User Artifacts (based on target char).
    2. Summarizes Leaderboard Context.
    3. Sends prompt to Gemini.
    """
    api_key = request.api_key
    user_data = request.user_data
    context_data = request.context_data
    target_char_name = request.target_char
    model_name = request.model_name or "gemini-2.5-flash"
    build_notes = (request.build_notes or "").strip()
    
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

    ### USER BUILD PREFERENCES (IMPORTANT)
    The user provided explicit preferences or constraints. Follow them unless they conflict with the inventory.
    {build_notes or "No additional preferences provided."}

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
      "priority_list": [
        "Crit Rate until 80%+",
        "Energy Recharge to meet burst uptime",
        "Crit DMG as the main scaling stat"
      ],
      "swap_plan": [
        {{
          "slot": "Goblet",
          "from": "Current: HP% Goblet (Owner: X)",
          "to": "Recommended: Hydro DMG Goblet (Owner: Y)",
          "reason": "Hydro DMG aligns with optimal damage scaling"
        }}
      ],
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

@app.post("/chat")
async def chat_build(request: ChatRequest):
    api_key = request.api_key
    user_data = request.user_data
    context_data = request.context_data
    target_char_name = request.target_char
    model_name = request.model_name or "gemini-2.5-flash"
    message = request.message.strip()
    history = request.history or []

    if not api_key or not user_data or not target_char_name or not message:
        raise HTTPException(status_code=400, detail="Missing API Key, User Data, Target Character, or message")

    context_summary = logic.prepare_context(context_data)
    inventory, error = logic.prepare_inventory(user_data, target_char_name)
    if error:
        raise HTTPException(status_code=400, detail=error)

    target_set = inventory['target_set']
    pool_size = len(inventory['pool'])

    convo_lines = []
    for item in history:
        role = item.get("role", "user")
        content = item.get("content", "")
        if not content:
            continue
        convo_lines.append(f"{role.upper()}: {content}")

    convo_lines.append(f"USER: {message}")
    convo_text = "\n".join(convo_lines)

    prompt = f"""
    You are a Genshin Impact theorycrafting assistant. You MUST only use the provided data.

    ### HARD CONSTRAINTS
    - You can ONLY reference the leaderboard summary and the user's artifact inventory below.
    - If the user asks for anything outside this data, respond that you cannot answer beyond the provided data.
    - Do NOT invent artifacts, stats, or characters.

    ### LEADERBOARD SUMMARY
    {context_summary}

    ### USER INVENTORY (Only {target_set}, {pool_size} pieces)
    {inventory['pool']}

    ### CONVERSATION
    {convo_text}
    """

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

# --- DATA MANAGEMENT ENDPOINTS ---

@app.get("/data/list")
def list_data_folders():
    """
    Lists all directory folders that look like scan data.
    Filters out system/project directories.
    """
    root = DATA_ROOT
    folders = []
    try:
        for item in root.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                # Simple heuristic: scan folders usually have _ or numbers, but we'll list all non-ignored dirs
                # We can check if they contain 'raw.json' to be sure it's a scan folder
                if (item / "raw.json").exists() or (item / "characters_v1.csv").exists():
                    stats = item.stat()
                    folders.append({
                        "name": item.name,
                        "created": stats.st_ctime,
                    })
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
         
    return {"folders": folders}

@app.delete("/data/delete/{folder_name}")
def delete_data_folder(folder_name: str):
    path = resolve_data_path(folder_name)
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
    old_path = resolve_data_path(request.old_name)
    new_path = resolve_data_path(request.new_name)
    
    if not old_path.exists():
        raise HTTPException(status_code=404, detail="Source folder not found")
        
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Destination folder already exists")
        
    try:
        os.rename(old_path, new_path)
        return {"success": True, "message": f"Renamed to {request.new_name}"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/data/clear")
def clear_data_folders():
    deleted = 0
    try:
        for item in DATA_ROOT.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                shutil.rmtree(item)
                deleted += 1
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, "deleted": deleted}

def resolve_data_path(name: str) -> Path:
    if not SAFE_FOLDER_RE.match(name):
        raise HTTPException(status_code=400, detail="Invalid folder name")
    path = (DATA_ROOT / name).resolve()
    if DATA_ROOT not in path.parents:
        raise HTTPException(status_code=400, detail="Invalid folder path")
    return path

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
