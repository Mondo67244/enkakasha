import google.generativeai as genai
import os

api_key = "AIzaSyBh8aIENOLTFWjdqrB-MLOhO097IDZ2OUc"
genai.configure(api_key=api_key)

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
