# Manual RLS Policy Fix Guide

If you're getting "new row violates row-level security policy" errors, follow these steps:

## Step 1: Remove Old Policies

Go to your Supabase Dashboard → **SQL Editor** and run this:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert users (for registration)" ON users;
```

## Step 2: Create New Policies

Run this immediately after:

```sql
-- RLS Policies for companies - Allow authenticated users full access
CREATE POLICY "Enable insert for authenticated users"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable select for company members"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "Enable update for company members"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND is_deleted = false
    )
  );

-- RLS Policies for users - Allow users to view and update their own profile
CREATE POLICY "Enable select own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Enable update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Enable insert for signup"
  ON users FOR INSERT
  WITH CHECK (true);
```

## Step 3: Verify Policies Were Created

1. Go to **Table Editor** in Supabase
2. Select the **companies** table
3. Click on the **RLS Policies** tab
4. You should see 3 policies:
   - "Enable insert for authenticated users"
   - "Enable select for company members"
   - "Enable update for company members"

5. Select the **users** table
6. Click on the **RLS Policies** tab
7. You should see 3 policies:
   - "Enable select own profile"
   - "Enable update own profile"
   - "Enable insert for signup"

## Step 4: Test Again

Try the following:
1. Register a new account with email/password
2. Try logging in
3. Use Google OAuth to sign in
4. Fill in company information on onboarding page
5. Click "Continue to Dashboard"
6. You should now be able to create a company without RLS errors!

## Troubleshooting

If you still get RLS errors:
1. Check that all 6 policies are created correctly
2. Make sure you ran the DROP POLICY statements first
3. Try disabling RLS temporarily to test (not for production):
   - Table Editor → companies → RLS toggle OFF
   - Try creating a company
   - If it works, RLS policies need fixing
   - Re-enable RLS and re-run the CREATE POLICY statements

4. Check Supabase logs for more details:
   - Dashboard → Logs → Database
