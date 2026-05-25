import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "python", "ai_server", "navigo.sqlite")

def check_password():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT email, password FROM users WHERE email = 'super@navigo.com'")
    row = cursor.fetchone()
    if row:
        email, pwd = row
        print(f"Email: {email}")
        print(f"Password Hash: {pwd}")
        expected = hashlib.sha256("123456".encode()).hexdigest()
        print(f"Expected Hash (for '123456'): {expected}")
        if pwd == expected:
            print("Password matches '123456'!")
        else:
            print("Password DOES NOT match '123456'!")
    else:
        print("User not found.")
    conn.close()

if __name__ == "__main__":
    check_password()
