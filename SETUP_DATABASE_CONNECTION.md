# Database Connection Setup - URGENT

## Why Orders Are Not Saving

Your orders are not saving because the `.env` file is missing. The application needs your Supabase credentials to connect to the database.

## Steps to Fix

### Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Open your project (sambright_investment_crm or similar)
3. Click on **Settings** (gear icon in the left sidebar)
4. Click on **API** in the settings menu
5. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys** section with:
     - `anon` `public` key (this is safe to use in your app)

### Step 2: Create the .env File

1. In your project root folder (`sambright_investment_crm`), create a new file called `.env` (exactly that name, starting with a dot)

2. Copy this content into the file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the values:
   - Replace `https://your-project-id.supabase.co` with your actual Project URL
   - Replace `your-anon-key-here` with your actual anon/public key

### Step 3: Run the Database Migration

Before the app can save orders, you need to add the `payment_status` column:

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste this SQL:

```sql
-- Add payment_status column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

-- Add payment_method column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update existing orders to have 'pending' status if null
UPDATE orders
SET payment_status = 'pending'
WHERE payment_status IS NULL;
```

5. Click **Run** (or press Ctrl+Enter)

### Step 4: Restart Your Development Server

1. Stop your dev server (Ctrl+C in the terminal)
2. Start it again: `npm run dev`
3. The app will now load the `.env` file

### Step 5: Test

1. Try creating a new order
2. You should see "Order created" (green success message)
3. Refresh the page - the order should still be there!

## Example .env File

Here's what your `.env` file should look like (with your actual values):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjc1NjQwMCwiZXhwIjoxOTQ4MzMyNDAwfQ.example-key-here
```

## Security Note

- The `.env` file is already in `.gitignore`, so it won't be committed to Git
- The `anon` key is safe to use in client-side code
- Never share your `service_role` key (if you see one) - that's for server-side only

## Troubleshooting

### If you still see "Saved locally" error:

1. Open the browser console (F12)
2. Try creating an order
3. Look for the error message - it will now show the actual database error
4. Share that error message with me and I can help fix it

### Common Issues:

- **"relation 'orders' does not exist"** - You need to create the orders table first
- **"column 'payment_status' does not exist"** - Run the SQL migration above
- **"Invalid API key"** - Check that you copied the anon key correctly
- **"Failed to fetch"** - Check that the VITE_SUPABASE_URL is correct

## Need Help?

If you're stuck, let me know:

1. What error message you see in the browser console
2. Whether you've created the `.env` file
3. Whether you've run the SQL migration

I'll help you get it working!
