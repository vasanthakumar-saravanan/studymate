from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(__file__), ".env")
print("ENV FILE =", env_path)
load_dotenv(env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
print("SUPABASE_URL =", SUPABASE_URL)
print("SUPABASE_KEY =", SUPABASE_KEY[:20] if SUPABASE_KEY else "EMPTY")

# We import the client if you need to use it in the python backend (for database queries)
# usage: from app.config import supabase
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        pass
