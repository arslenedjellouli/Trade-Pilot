import requests
import os
from dotenv import load_dotenv

load_dotenv()

def list_models():
    api_key = os.getenv("NVIDIA_API_KEY")
    url = "https://integrate.api.nvidia.com/v1/models"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
    }

    try:
        print(f"Querying available models from: {url}...")
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            models = [m['id'] for m in data.get('data', [])]
            
            print(f"Found {len(models)} models.")
            print("\n--- RECOMMENDED REASONING MODELS ---")
            
            # Keywords to find high-performance reasoning models
            keywords = ["llama-3.1", "llama-3.3", "nemotron", "405b", "70b"]
            found_any = False
            
            for m in models:
                if any(k in m.lower() for k in keywords):
                    print(f" - {m}")
                    found_any = True
            
            if not found_any:
                print("No Llama/Nemotron models found. Here are the first 50 models:")
                for m in models[:50]:
                    print(f" - {m}")
        else:
            print(f"Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"Connection Failed: {str(e)}")

if __name__ == "__main__":
    list_models()
