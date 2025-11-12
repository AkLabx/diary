import { createClient } from '@supabase/supabase-js';

// =================================================================================
// IMPORTANT: Supabase Database Setup
// =================================================================================
// To enable end-to-end encryption, you need to set up your Supabase project.
// Go to the SQL Editor in your Supabase dashboard and run the following queries
// in order.
//
// 1. Create the 'profiles' table to store encryption materials for each user:
/*
  CREATE TABLE public.profiles (
    id uuid NOT NULL,
    salt text NOT NULL,
    key_check_value text NOT NULL,
    key_check_iv text NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT id FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
*/
//
// 2. Create the 'diaries' table for encrypted entries.
//    NOTE: We are using the 'created_at' column for filtering and sorting.
//    The actual title and content will be inside 'encrypted_entry'.
/*
  CREATE TABLE public.diaries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    encrypted_entry text NOT NULL,
    iv text NOT NULL,
    tags text[] NULL,
    mood text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT diaries_pkey PRIMARY KEY (id),
    CONSTRAINT owner_id FOREIGN KEY (owner_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
*/
//
// 3. Set up Row Level Security (RLS) to protect user data.
//    These policies are CRITICAL for security and fix the sign-up error.
//    They ensure that users can only access their own data.
//    This script is idempotent, meaning it can be run multiple times without error.
/*
  -- Enable RLS for the tables
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

  -- Create policies for the 'profiles' table
  DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
  CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
  CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
  
  -- Add UPDATE policy for profiles for first-time login
  DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
  CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

  -- Create policies for the 'diaries' table
  DROP POLICY IF EXISTS "Users can create their own diary entries." ON public.diaries;
  CREATE POLICY "Users can create their own diary entries."
  ON public.diaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can view their own diary entries." ON public.diaries;
  CREATE POLICY "Users can view their own diary entries."
  ON public.diaries FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can update their own diary entries." ON public.diaries;
  CREATE POLICY "Users can update their own diary entries."
  ON public.diaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can delete their own diary entries." ON public.diaries;
  CREATE POLICY "Users can delete their own diary entries."
  ON public.diaries FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
*/
//
// 4. Create a trigger to automatically create a profile when a new user signs up.
//    This makes the application more robust.
/*
  -- Create a function to be called by the trigger
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, salt, key_check_value, key_check_iv)
    VALUES (
      new.id,
      'INITIAL_SALT', -- Placeholder salt
      'INITIAL_VALUE', -- Placeholder check value
      'INITIAL_IV' -- Placeholder IV
    );
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Create the trigger on the auth.users table
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
*/
// =================================================================================


// IMPORTANT: Replace with your own Supabase project's URL and Anon Key
// You can find these in your Supabase project's dashboard under Project Settings > API.
// Fix: Explicitly type as string to allow comparison with placeholder values in Auth.tsx.
export const supabaseUrl: string = 'https://ccgiozknvlknbrkzfcdx.supabase.co';
export const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZ2lvemtudmxrbmJya3pmY2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3NTMsImV4cCI6MjA3ODQzMjc1M30.lmmuGnynbY_n_4UlsrGw5ofRd6p9QLKCcrfHf7itEg8';

export const supabase = createClient(supabaseUrl, supabaseKey);