/*
  # Fix order submission flow

  1. Security Updates
    - Ensure proper RLS policies for both customers and orders tables
    - Allow anonymous users to create customers and orders
    - Allow authenticated users to read all data

  2. Policy Updates
    - Drop and recreate all policies with correct permissions
    - Ensure anonymous users can insert into both tables
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous customer creation" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can read all orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;

-- Create customer policies
CREATE POLICY "Allow anonymous customer creation"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create order policies
CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);