import requests

def check_server():
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        print(f"Server status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Could not reach server: {e}")

if __name__ == "__main__":
    check_server()
