import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import Client, create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_KEY en las variables de entorno.")
supabase: Client = create_client(supabase_url, supabase_key)
