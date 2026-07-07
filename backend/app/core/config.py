import os
from dotenv import load_dotenv

# Search for .env in current and parent directories
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip().strip('"')
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().strip('"')
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip().strip('"')

# Initialize Supabase client
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        # Clean URL: strip whitespace and trailing slashes
        clean_url = SUPABASE_URL.rstrip("/")
        supabase: Client = create_client(clean_url, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase Init Error: {e}")