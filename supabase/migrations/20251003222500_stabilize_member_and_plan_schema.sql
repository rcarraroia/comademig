-- Migration: Stabilize and Unify Member & Plan Schema
-- Date: 2025-10-03
-- Description: This script standardizes the schema for the 'subscription_plans' table
-- to resolve inconsistencies from previous migrations. It ensures column names
-- and constraints are aligned with the new Asaas integration architecture.

BEGIN;

-- 0. Remove any functions or triggers that reference plan_title
-- Drop the validation function if it exists
DROP FUNCTION IF EXISTS public.validate_subscription_plan_data() CASCADE;

-- Drop any triggers that might reference plan_title
DROP TRIGGER IF EXISTS validate_subscription_plan_trigger ON public.subscription_plans;

-- 1. Standardize the 'plan_title' column to 'name'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscription_plans'
        AND column_name = 'plan_title'
    ) THEN
        ALTER TABLE public.subscription_plans RENAME COLUMN plan_title TO name;
        RAISE NOTICE 'Column "plan_title" in "subscription_plans" renamed to "name".';
    ELSE
        RAISE NOTICE 'Column "name" in "subscription_plans" already exists or "plan_title" not found. No action taken.';
    END IF;
END $$;

-- 2. Standardize the 'recurrence' values and constraint
-- First, update existing data to use standardized values
UPDATE public.subscription_plans 
SET recurrence = CASE 
    WHEN recurrence = 'Mensal' THEN 'monthly'
    WHEN recurrence = 'Anual' THEN 'annual'
    WHEN recurrence = 'Semestral' THEN 'semestral'
    ELSE recurrence
END
WHERE recurrence IN ('Mensal', 'Anual', 'Semestral');

-- Drop any existing recurrence constraints to avoid conflicts
DO $$
DECLARE
    constraint_name_to_drop TEXT;
BEGIN
    SELECT conname INTO constraint_name_to_drop
    FROM pg_constraint
    WHERE conrelid = 'public.subscription_plans'::regclass
      AND conname LIKE '%recurrence%';

    IF constraint_name_to_drop IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.subscription_plans DROP CONSTRAINT ' || quote_ident(constraint_name_to_drop);
        RAISE NOTICE 'Dropped existing recurrence constraint: %', constraint_name_to_drop;
    END IF;
END $$;

-- Add the correct, unified recurrence constraint
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_recurrence_check
CHECK (recurrence IN ('monthly', 'semestral', 'annual'));

-- 3. Verify the 'price' constraint
-- Drop old price constraints
DO $$
DECLARE
    constraint_name_to_drop TEXT;
BEGIN
    SELECT conname INTO constraint_name_to_drop
    FROM pg_constraint
    WHERE conrelid = 'public.subscription_plans'::regclass
      AND conname LIKE '%price%';

    IF constraint_name_to_drop IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.subscription_plans DROP CONSTRAINT ' || quote_ident(constraint_name_to_drop);
        RAISE NOTICE 'Dropped existing price constraint: %', constraint_name_to_drop;
    END IF;
END $$;

-- Add the correct price constraint (>= 0 as per the latest spec)
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_price_check
CHECK (price >= 0);


-- 4. Add comments for clarity
COMMENT ON TABLE public.subscription_plans IS 'Stores subscription plans that can be associated with member types. Aligned with Asaas integration.';
COMMENT ON COLUMN public.subscription_plans.name IS 'The public-facing name of the subscription plan (e.g., "Plano Obreiro", "Taxa Anual de Filiação").';
COMMENT ON COLUMN public.subscription_plans.recurrence IS 'Billing cycle for the subscription. Must be one of: monthly, semestral, annual.';
COMMENT ON COLUMN public.subscription_plans.price IS 'The monetary value of the plan. Must be zero or greater.';

COMMIT;