import requests
from requests_negotiate_sspi import HttpNegotiateAuth

URL = "http://localhost:7048/BC250/ODataV4/Company('smart%20travel%20agency')/TravelServiceAPI"

print(f"Testing SSPI (Auto Windows Auth) to: {URL}")

try:
    auth = HttpNegotiateAuth()
    response = requests.get(URL, auth=auth, timeout=10)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ SUCCESS with SSPI!")
        print(response.json())
    else:
        print("❌ FAILED with SSPI")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
