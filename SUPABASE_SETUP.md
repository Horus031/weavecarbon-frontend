# Supabase Setup Guide

## 1. Environment Variables Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### How to get your Supabase credentials:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**

---

## 2. Database Schema Setup

**IMPORTANT: Disable Email Confirmation First**

Before running the SQL, you need to disable email confirmation in Supabase:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. **Disable** "Confirm email" toggle
5. Click **Save**

This allows users to sign up and immediately use the app without email verification.

**IMPORTANT: If you already have the tables created**

If you already ran the SQL before and have existing tables:
1. Go to your Supabase Dashboard → **SQL Editor**
2. Run the DROP POLICY statements first to remove old policies
3. Then run the new CREATE POLICY statements

This ensures the new RLS policies (which have been fixed) are properly applied.

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create enums
CREATE TYPE user_role AS ENUM ('b2b', 'b2c', 'admin');
CREATE TYPE business_type AS ENUM ('shop_online', 'brand', 'factory');
CREATE TYPE pricing_plan AS ENUM ('starter', 'standard', 'export');

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  business_type business_type,
  current_plan pricing_plan NOT NULL DEFAULT 'starter',
  target_markets TEXT[],
  deleted_by INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  user_type user_role DEFAULT 'b2b',
  company_id UUID DEFAULT NULL REFERENCES companies(id) ON DELETE SET NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  is_demo_user BOOLEAN DEFAULT FALSE,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  deleted_by INT NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

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

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_companies_name ON companies(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Google OAuth Setup

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add these **Authorized redirect URIs**:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback (for local development)
     ```
   - Click **Create** and save your **Client ID** and **Client Secret**

### Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Enable **Google enabled**
6. Paste your Google **Client ID** and **Client Secret**
7. Click **Save**

### Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

For production, update these to your actual domain:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: `https://yourdomain.com/auth/callback`

---

## 4. Testing the Setup

### Test Email/Password Authentication:
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth`
3. Try signing up with email and password
4. Check if user is created in Supabase **Authentication** → **Users**
5. Check if profile is created in **Table Editor** → **users** table

### Test Google OAuth:
1. Navigate to `http://localhost:3000/auth`
2. Click "Continue with Google"
3. Complete the Google sign-in flow
4. You should be redirected back to your app
5. Check if user is created in both:
   - Supabase **Authentication** → **Users**
   - **Table Editor** → **users** table

### Test Onboarding Flow:
1. Sign in as a new user
2. You should be redirected to `/onboarding`
3. Fill in company information
4. Submit the form
5. Check if company is created in **Table Editor** → **companies** table
6. Check if user's `company_id` is updated in **users** table
7. You should be redirected to `/overview`

### Test Returning User Flow:
1. Sign out and sign in again
2. If you have a company, you should go directly to `/overview`
3. If you don't have a company, you should be redirected to `/onboarding`

---

## 5. Common Issues & Troubleshooting

### Issue: "new row violates row-level security policy" when creating company
- **Solution**: You need to update your RLS policies
- Go to Supabase Dashboard → **SQL Editor**
- Drop the old policies using the DROP POLICY statements in the schema
- Create the new policies using the CREATE POLICY statements
- Make sure all policies have been created successfully
- The new policies properly check user authentication

### Issue: "Email not confirmed" error on login
- **Solution**: Go to Supabase Dashboard → **Authentication** → **Providers** → **Email**
- Disable the "Confirm email" toggle
- Click **Save**
- Try signing up again with a new email

### Issue: Google OAuth keeps loading on onboarding page
- **Solution**: 
  - Make sure RLS policies are properly updated (see above)
  - Check browser console (F12) for any error messages
  - Try a hard refresh (Ctrl+F5) to clear cached assets
  - Verify your Google OAuth credentials are correct in Supabase
  - Check Supabase logs: Dashboard → **Logs** → **Database** and **Auth**

### Issue: Google OAuth redirect doesn't work
- **Solution**: Ensure redirect URIs in Google Cloud Console match exactly:
  - `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback`
  - Check browser console for any errors

### Issue: "Invalid API key"
- **Solution**: Double-check your `.env.local` file has correct credentials
- Restart your development server after updating `.env.local`

### Issue: Google OAuth redirect doesn't work
- **Solution**: Ensure redirect URIs in Google Cloud Console match exactly:
  - `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
  - Check browser console for any errors
  - Verify the callback route at `/auth/callback` exists

### Issue: Google OAuth redirects but gets stuck loading
- **Solution**: Check browser console for errors
- Verify RLS policies allow INSERT on users table
- Check Supabase logs in Dashboard → **Logs** → **Database**

### Issue: RLS Policy errors
- **Solution**: Make sure RLS policies are created correctly
- Test by temporarily disabling RLS to isolate the issue

### Issue: User created in auth.users but not in public.users
- **Solution**: Check the auth callback route is working
- Verify the insert query in `app/auth/callback/route.ts`
- Check RLS policy allows INSERT for authenticated users

---

## 6. Production Deployment

Before deploying to production:

1. Update environment variables in your hosting platform:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-production-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

2. Update Google OAuth redirect URIs:
   - Add `https://yourdomain.com/auth/callback`
   - Add `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

3. Update Supabase URL Configuration:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

4. Test all authentication flows in production environment

---

## 7. Security Best Practices

1. **Never commit** `.env.local` to version control
2. Use **Row Level Security (RLS)** for all tables
3. Validate all user inputs on the server side
4. Use **Supabase service role key** only in server-side code
5. Implement **rate limiting** for authentication endpoints
6. Enable **email confirmation** in Supabase Auth settings for production

---

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
