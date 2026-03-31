import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "ai_server", ".env"))

# --- CONFIGURATION ---
BASE_URL = os.getenv("BC_BASE_URL", "http://localhost:7048/BC250") + f"/ODataV4/Company('{os.getenv('BC_COMPANY_NAME', 'smart travel agency')}')/TravelServiceAPI"
USERNAME = os.getenv("BC_USERNAME", "")
PASSWORD = os.getenv("BC_PASSWORD", "")

def test_connection():
    print(f"Testing connection to: {BASE_URL}")
    print(f"User: {USERNAME}")
    print(f"Auth Mode: BASIC (Forced)")

    try:
        response = requests.get(
            BASE_URL,
            auth=HTTPBasicAuth(USERNAME, PASSWORD),
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print("✅ Success! Connection established with BASIC Auth.")
            data = response.json()
            items = data.get('value', [])
            print(f"Found {len(items)} items.")
        elif response.status_code == 401:
            print("❌ Authentication failed with BASIC Auth.")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_connection()