import requests

URL = "http://localhost:7048/BC250/ODataV4/"

try:
    print(f"Checking {URL} ...")
    # Send a request without auth to trigger a 401 and inspect headers
    r = requests.get(URL, timeout=5)
    print(f"Status: {r.status_code}")
    print("Headers:")
    for k, v in r.headers.items():
        if k.lower() == "www-authenticate":
            print(f"  {k}: {v}")
except Exception as e:
    print(f"Error: {e}")
