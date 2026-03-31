import os
import requests
from requests.auth import HTTPBasicAuth
from requests_ntlm import HttpNtlmAuth

BASE_URL = "http://localhost:7048/BC250/ODataV4/Company('smart%20travel%20agency')/TravelServiceAPI"
USERNAME_FULL = r"YOSRA-GHANMI\YOSRA"
USERNAME_SHORT = "yosra"
PASSWORD_WIN = "2022"
AUTH_KEY = "ezRFNTJCMzhDLTQ3QzUtNDk4NC04NUFFLTg3MkI1M0MxMjZBRn0="

def test(user, password, auth_type, desc):
    print(f"\n--- Testing {desc} ---")
    print(f"User: {user}")
    print(f"Auth Type: {auth_type}")
    
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

# 1. Try NTLM with provided credentials
test(USERNAME_FULL, PASSWORD_WIN, "NTLM", "NTLM with Windows Creds")

# 2. Try Basic with provided credentials (if BC supports UserPassword)
test(USERNAME_FULL, PASSWORD_WIN, "BASIC", "Basic with Windows Creds")

# 3. Try Basic with OLD Key (Full User)
test(USERNAME_FULL, AUTH_KEY, "BASIC", "Basic with Old Key (Full User)")

# 4. Try Basic with OLD Key (Short User)
test(USERNAME_SHORT, AUTH_KEY, "BASIC", "Basic with Old Key (Short User)")

# 5. Try Basic with Windows Password (Short User)
test(USERNAME_SHORT, PASSWORD_WIN, "BASIC", "Basic with Windows Password (Short User)")
