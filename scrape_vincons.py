import os
import requests
import json
from datetime import datetime
from supabase import create_client, Client

# ENV VARIABLES
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
VINCONS_COOKIE = os.environ.get("VINCONS_COOKIE")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials")

if not VINCONS_COOKIE:
    raise ValueError("Missing VINCONS_COOKIE")

# SUPABASE CLIENT
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# CONFIG
URL = "https://quanlyvattu.vincons.net/api/vwm/v0/repair-orders/search"
HEADERS = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "cookie": VINCONS_COOKIE,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_repair_orders():
    # Fetch last 7 days or more. Adjust payload as needed based on API inspection.
    # Assuming Payload format from context (usually explicit date range or empty filter for recent)
    # Since I don't have the exact payload structure, I'll assume a standard search payload.
    # If the API is "search", it might take a body.
    # From context "Fetch data for the last 7 days".
    
    # We will fetch a broad range to be safe or use pagination if needed.
    # If standard search without filters gives recent, we use that.
    payload = {
        "page": 0,
        "size": 50, # Adjust limit
        "sort": ["createdDate,desc"],
        "filters": [] # Add date filters if known format
    }
    
    try:
        response = requests.post(URL, headers=HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def process_and_upsert(data):
    if not data or 'content' not in data:
        print("No content found in response")
        return

    items = data['content']
    print(f"Found {len(items)} items")

    for item in items:
        # MAP FIELDS (Adjust based on actual API response)
        # Assuming: code (Machine Code), description, totalCost, createdDate, etc.
        # We need to find machine_id from 'machines' table based on code.
        
        machine_code = item.get('asset', {}).get('code') # Adjust path
        if not machine_code:
            continue
            
        # 1. Get Machine ID
        res = supabase.table("machines").select("id").eq("code", machine_code).execute()
        if not res.data:
            print(f"Machine {machine_code} not found in DB. Skipping.")
            continue
        
        machine_id = res.data[0]['id']
        external_id = str(item.get('id'))
        
        # 2. Prepare Data
        record = {
            "machine_id": machine_id,
            "description": item.get('description', 'Repair Order'),
            "date": item.get('createdDate', datetime.now().isoformat()).split('T')[0],
            "cost": item.get('totalCost', 0),
            "source": "vincons_bot",
            "external_id": external_id
        }
        
        # 3. Upsert (ignore duplicate external_id)
        # unique constraint on external_id is needed or handle locally.
        # I added index, but not unique constraint in SQL? 
        # Wait, I should have added unique constraint.
        # But upsert with 'on_conflict' works if there is a constraint.
        # Or I can select first.
        
        # Let's try upsert on `external_id` if I added unique constraint? 
        # In SQL I added: create index idx_repair_history_external_id ...
        # But I didn't add "unique". 
        # I should add unique constraint to external_id to make upsert work properly by that key.
        # Or I check existence first.
        
        existing = supabase.table("repair_history").select("id").eq("external_id", external_id).execute()
        if existing.data:
            print(f"Record {external_id} already exists. Skipping.")
            # Optionally update?
        else:
             data, count = supabase.table("repair_history").insert(record).execute()
             print(f"Inserted repair for {machine_code}")

if __name__ == "__main__":
    print("Starting sync...")
    data = fetch_repair_orders()
    process_and_upsert(data)
    print("Sync complete.")
