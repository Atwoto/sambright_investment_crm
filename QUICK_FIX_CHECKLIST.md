# Quick Fix Checklist - Orders Not Saving

## The Problem

Orders show "Saved locally (offline or server error)" and disappear when you refresh because the app can't connect to your Supabase database.

## The Solution (3 Steps)

### ✅ Step 1: Create .env File

1. Create a new file in your project root called `.env`
2. Add these two lines (with YOUR actual values from Supabase):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to get these values:**

- Go to https://app.supabase.com
- Open your project
- Click Settings → API
- Copy the "Project URL" and "anon public" key

### ✅ Step 2: Run Database Migration

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Paste this:

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

UPDATE orders
SET payment_status = 'pending'
WHERE payment_status IS NULL;
```

4. Click **Run**

### ✅ Step 3: Restart Dev Server

1. Stop your dev server (Ctrl+C)
2. Run `npm run dev` again
3. Try creating an order

## What Changed

I've updated the error messages so now you'll see the **actual database error** instead of just "Saved locally". This will help us debug if there are any other issues.

## Expected Result

After completing these steps:

- ✅ Orders save to database
- ✅ Orders persist after page refresh
- ✅ You see "Order created" success message (green)
- ✅ Payment status can be changed
- ✅ "Mark Paid" button works

## If It Still Doesn't Work

1. Open browser console (F12)
2. Try creating an order
3. Look for the red error message - it will now show the specific problem
4. Share that error with me and I'll help fix it

## Example .env File

Your `.env` file should look like this (with your real values):

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjc1NjQwMCwiZXhwIjoxOTQ4MzMyNDAwfQ.example-key-here
```

**Note:** The anon key is very long (starts with `eyJ...`)

## Need Help?

Let me know:

1. Did you create the `.env` file?
2. Did you run the SQL migration?
3. What error message do you see now when creating an order?
