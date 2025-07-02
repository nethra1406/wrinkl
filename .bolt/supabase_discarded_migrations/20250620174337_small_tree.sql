/*
  # Fix customers table RLS policy for anonymous insertions

  1. Policy Updates
    - Drop the existing INSERT policy that's causing issues
    - Create a new INSERT policy that properly allows anonymous users to create customer records
    - Ensure the policy works for the schedule pickup functionality

  2. Security
    - Maintain security while allowing anonymous customer creation
    - Keep existing SELECT and UPDATE policies for authenticated users
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Allow anonymous customer creation" ON customers;

-- Create a new INSERT policy that properly allows anonymous insertions
CREATE POLICY "Enable insert for anonymous users" ON customers
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);