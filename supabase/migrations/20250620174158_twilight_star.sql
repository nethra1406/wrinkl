/*
  # Fix customers table RLS policy

  1. Security Updates
    - Update the INSERT policy for customers table to properly allow anonymous users to create customer records
    - Ensure the policy condition is correctly set to allow insertions from both anonymous and authenticated users
    
  2. Changes
    - Drop the existing INSERT policy that may have incorrect conditions
    - Create a new INSERT policy that explicitly allows anonymous customer creation
    - Maintain existing SELECT and UPDATE policies for authenticated users
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow anonymous customer creation" ON customers;

-- Create a new INSERT policy that properly allows anonymous customer creation
CREATE POLICY "Allow anonymous customer creation"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing policies are correctly configured
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);