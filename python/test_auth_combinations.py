import os
import requests
from requests.auth import HTTPBasicAuth
from requests_ntlm import HttpNtlmAuth

BASE_URL = "http://localhost:7048/BC250/ODataV4/Company('smart%20travel%20agency')/TravelServiceAPI"
# Test cases
users = [
    "YOSRA",
    "yosra",
    r"YOSRA-GHANMI\YOSRA",
    r"YOSRA-GHANMI\yosra",
    "ADMIN"
]
key = "GnoUe4zsfqqwUQwHGYQsXp"

def test(user, password, auth_type, desc):
    print(f"\n--- Testing {desc} ---")
    print(f"User: {user}")
    
    if auth_type == "NTLM":
        auth = HttpNtlmAuth(user, password)
    else:
        auth = HTTPBasicAuth(user, password)
        
    try:
        response = requests.get(
            BASE_URL,
            auth=auth,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS!")
            return True
        else:
            print("❌ FAILED")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

# Run through all combinations
for u in users:
    test(u, key, "BASIC", f"Basic Auth with user '{u}'")

