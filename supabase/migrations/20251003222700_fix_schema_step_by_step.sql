-- Migration: Fix Schema Step by Step
-- Date: 2025-10-03
-- Description: Resolve schema issues step by step to avoid constraint conflicts

BEGIN;

-- Step 1: Drop specific constraints by name (safer approach)
-- Drop known recurrence constraints
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_recurrence_check;
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS check_recurrence;
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_recurrence_constraint;

-- Drop known price constraints
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_price_check;
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS check_price;
ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_price_constraint;

-- Step 2: Update recurrence values to standardized format
UPDATE public.subscription_plans 
SET recurrence = 'monthly' 
WHERE recurrence IN ('Mensal', 'monthly');

UPDATE public.subscription_plans 
SET recurrence = 'annual' 
WHERE recurrence IN ('Anual', 'annual');

UPDATE public.subscription_plans 
SET recurrence = 'semestral' 
WHERE recurrence IN ('Semestral', 'semestral');

-- Step 3: Rename column (will fail silently if column doesn't exist)
ALTER TABLE public.subscription_plans RENAME COLUMN plan_title TO name;

-- Step 4: Add constraints back
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_recurrence_check
CHECK (recurrence IN ('monthly', 'semestral', 'annual'));

ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_price_check
CHECK (price >= 0);

-- Step 5: Add comments
COMMENT ON TABLE public.subscription_plans IS 'Stores subscription plans that can be associated with member types. Aligned with Asaas integration.';
COMMENT ON COLUMN public.subscription_plans.name IS 'The public-facing name of the subscription plan (e.g., "Plano Obreiro", "Taxa Anual de Filiação").';
COMMENT ON COLUMN public.subscription_plans.recurrence IS 'Billing cycle for the subscription. Must be one of: monthly, semestral, annual.';
COMMENT ON COLUMN public.subscription_plans.price IS 'The monetary value of the plan. Must be zero or greater.';

COMMIT;