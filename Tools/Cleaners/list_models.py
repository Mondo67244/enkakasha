import google.generativeai as genai
import os
import sys

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY environment variable is not set.")
    print("Please set it before running this script: export GEMINI_API_KEY='your_key'")
    sys.exit(1)

genai.configure(api_key=api_key)

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
