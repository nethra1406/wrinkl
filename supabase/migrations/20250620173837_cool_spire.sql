/*
  # Fix customers table RLS policy

  1. Security Updates
    - Update RLS policy for customers table to properly allow anonymous inserts
    - Ensure authenticated users can read all customers
    - Add proper policy for customer data access

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow:
      - Anonymous users to insert new customers
      - Authenticated users to read all customer data
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can read all customers" ON customers;

-- Create policy to allow anonymous users to insert customers
CREATE POLICY "Allow anonymous customer creation"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to read all customers
CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update customers if needed
CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);