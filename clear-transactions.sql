-- SQL script to clear existing transactions and statements
-- Run this in Supabase SQL Editor before re-uploading with improved parsing

-- 1. Clear all transactions first (due to foreign key constraints)
DELETE FROM public.transactions;

-- 2. Clear all statements
DELETE FROM public.statements;

-- 3. Reset any auto-increment sequences if they exist
-- (This is optional, but helps keep IDs clean)
-- ALTER SEQUENCE IF EXISTS statements_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;

-- 4. Verify tables are empty
SELECT 'statements' as table_name, COUNT(*) as count FROM public.statements
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as count FROM public.transactions;
