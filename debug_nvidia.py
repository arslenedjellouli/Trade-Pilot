import requests
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def diagnostic_check():
    api_key = os.getenv("NVIDIA_API_KEY")
    # Base URL for NVIDIA NIM hosted API
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    
    if not api_key:
        print("❌ Error: NVIDIA_API_KEY not found in .env")
        return

    print(f"📡 Sending diagnostic request to: {url}")
    print(f"🔑 API Key (prefix): {api_key[:10]}...")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Use a basic model that we know should be available
    payload = {
        "model": "nvidia/llama-3.1-405b-instruct",
        "messages": [{"role": "user", "content": "Hello, respond with one word: 'READY'."}],
        "temperature": 0.1,
        "max_tokens": 10
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        print(f"\n✅ Status Code: {response.status_code}")
        print(f"📄 Headers: {dict(response.headers)}")
        
        raw_text = response.text
        print(f"\n📝 Raw Response Body (repr):")
        print(repr(raw_text))
        
        print("\n🔍 JSON Parsing Test:")
        try:
            data = json.loads(raw_text)
            print("✅ JSON is valid.")
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parsing Failed at: {e}")
            
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    diagnostic_check()
