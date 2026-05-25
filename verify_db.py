import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "python", "ai_server", "navigo.sqlite")

def verify():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not cursor.fetchone():
            print("Table 'users' does not exist yet. The server needs to run _ensure_app_tables().")
            return

        cursor.execute("SELECT email, role FROM users")
        users = cursor.fetchall()
        print(f"Found {len(users)} users in database:")
        for email, role in users:
            print(f"- {email} ({role})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify()
