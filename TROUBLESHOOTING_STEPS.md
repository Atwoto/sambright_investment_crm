# Troubleshooting Database Connection Issues

## Current Status

✅ Fixed the query syntax issues in the code
❓ Need to verify database structure and data

## Step 1: Check Database Tables

Run this in your Supabase SQL Editor:

```sql
-- Check what tables you actually have
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Step 2: Verify Products Table

If you see a `products` table, run:

```sql
-- Check products table structure
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if you have any products
SELECT COUNT(*) FROM products;
```

## Step 3: Create Missing Tables

If you don't have the required tables, run the `database_schema_corrected.sql` file in your Supabase SQL Editor.

## Step 4: Add Sample Data

If tables exist but are empty, run the sample data inserts from `database_verification.sql`.

## Step 5: Test the Application

After ensuring tables exist with some data:

1. Refresh your browser
2. Check the browser console for any errors
3. The dashboard should load without the database error

## Common Issues & Solutions

### Issue: "relation 'products' does not exist"

**Solution:** Run the `database_schema_corrected.sql` to create the tables.

### Issue: Dashboard loads but shows all zeros

**Solution:** Add sample data using the INSERT statements in `database_verification.sql`.

### Issue: Still getting "min_stock_level" error

**Solution:** Check that the `products` table has both `stock_level` and `min_stock_level` columns:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('stock_level', 'min_stock_level');
```

### Issue: UUID vs Integer conflicts

Your database uses UUID primary keys, which is correct. The application code has been updated to handle this.

## Quick Test Query

Run this to test the exact query the app uses:

```sql
SELECT id, stock_level, min_stock_level,
       (stock_level < min_stock_level) as is_low_stock
FROM products
WHERE stock_level IS NOT NULL
  AND min_stock_level IS NOT NULL;
```

## Next Steps

1. Run the verification queries above
2. Share the results if you're still having issues
3. Check browser console for any JavaScript errors
4. Verify your `.env` file has the correct Supabase credentials (though connection seems to work since you're getting database errors, not connection errors)
