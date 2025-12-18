# ROLE
Act as a Senior Full Stack Developer & Data Engineer. We are building an "Asset Management System" for 10,000 construction machines without using a VPS.

# TECH STACK (Serverless Architecture)
1. Frontend & App: Next.js 14 (App Router), Tailwind CSS, Shadcn/UI (for rapid UI components).
2. Database & Auth: Supabase (PostgreSQL).
3. Automation/Scraping: Python script (running on GitHub Actions).
4. Deployment: Vercel.

# CONTEXT & GOAL
I manage 10,000 heavy machines. I need an app where:
1. Drivers can input daily working hours (mobile-friendly).
2. The system automatically calculates total hours and alerts when maintenance is due.
3. A Python script automatically scrapes repair history from an external API (Vincons) daily and updates Supabase.

# DATABASE SCHEMA (PostgreSQL in Supabase)
Based on the attached CSV files, please design the database schema. It must include:
- `machines`: id, code (Mã Tài sản - Unique), name, model, current_hours, status, project_name.
- `maintenance_standards`: model_ref, interval_hours (e.g., 500h), part_name (e.g., Oil Filter).
- `daily_logs`: machine_id, date, hours_added, fuel_consumed.
- `repair_history`: machine_id, description, date, cost, source ('manual' or 'vincons_bot').

# CORE FEATURES TO CODE

## 1. Database Setup (SQL)
Write the SQL to create tables in Supabase.
- IMPORTANT: Create a Trigger function so that when a new `daily_log` is inserted, it AUTOMATICALLY updates the `current_hours` in the `machines` table.

## 2. Frontend (Next.js)
- Create a `MachineList` component with Search & Filter (use Supabase URL params).
- Create a `DailyEntryForm` optimized for Mobile:
  - Input: Machine Code (Autocomplete), Hours Worked.
  - Submit -> Calls Supabase API.

## 3. Automation Script (Python)
Write a robust Python script (`scrape_vincons.py`) to run on GitHub Actions.
- Target URL: `https://quanlyvattu.vincons.net/api/vwm/v0/repair-orders/search`
- Method: POST
- Headers: Needs to accept a `COOKIE` from environment variables.
- Logic:
  1. Fetch data for the last 7 days.
  2. Connect to Supabase using `supabase-py`.
  3. Upsert data into `repair_history` table (prevent duplicates using external ID).

## 4. GitHub Actions Workflow
Write the `.github/workflows/daily_sync.yml` file to schedule the Python script every day at 01:00 AM UTC.

# INSTRUCTIONS
- Start by providing the SQL Schema first.
- Then provide the Next.js page structure.
- Finally, give the Python script and YAML configuration.
- Code must be production-ready, handling errors (e.g., if API fails).
