import requests
import json
import os

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server runs on a different port
ENDPOINT = "/api/admin/payroll/trigger-manual"

def test_payroll_trigger():
    print("--- Starting Payroll Manual Trigger Test ---")
    
    # We add query parameters to bypass the default "agent" role which requires an Agency_ID
    params = {
        "user_role": "superadmin"
    }
    
    try:
        print(f"Sending POST request to {BASE_URL}{ENDPOINT} with user_role=superadmin...")
        response = requests.post(f"{BASE_URL}{ENDPOINT}", params=params)
        
        if response.status_code == 200:
            print("SUCCESS: Payroll generation triggered.")
            print("Response details:")
            print(json.dumps(response.json(), indent=2))
            
            # Verify local files
            check_local_files()
        elif response.status_code == 403:
            print("FORBIDDEN: You might need to provide auth headers or the default role isn't authorized.")
            print("Hint: The endpoint depends on get_secure_bc_client. Ensure your local environment/token is set.")
        else:
            print(f"FAILED: Status Code {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the server. Is FastAPI running?")
        print("Run it with: uvicorn app:app --reload")

def check_local_files():
    print("\n--- Checking Local Persistence ---")
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    files_to_check = ["salaries.json", "expenses.json"]
    
    for filename in files_to_check:
        file_path = os.path.join(script_dir, filename)
        if os.path.exists(file_path):
            print(f"File {filename} exists at {file_path}")
            with open(file_path, "r") as f:
                try:
                    data = json.load(f)
                    print(f"   Found {len(data)} entries in {filename}.")
                except json.JSONDecodeError:
                    print(f"   Warning: {filename} is empty or invalid JSON.")
        else:
            print(f"File {filename} NOT found. Payroll might have skipped (no active staff) or failed.")

if __name__ == "__main__":
    test_payroll_trigger()
