-- Migration: Nuclear Option - Remove Everything and Rebuild
-- Date: 2025-10-03
-- Description: Complete table recreation to avoid all constraint issues

BEGIN;

-- Step 1: Create backup of data
CREATE TEMP TABLE subscription_plans_backup AS 
SELECT * FROM public.subscription_plans;

-- Step 2: Drop the entire table (this removes ALL constraints, triggers, functions)
DROP TABLE public.subscription_plans CASCADE;

-- Step 3: Recreate table with correct structure
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    recurrence VARCHAR(20) NOT NULL CHECK (recurrence IN ('monthly', 'semestral', 'annual')),
    plan_id_gateway VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT subscription_plans_name_check CHECK (length(trim(name)) > 0)
);

-- Step 4: Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 5: Restore data with corrected values
INSERT INTO public.subscription_plans (
    id, name, description, price, recurrence, plan_id_gateway, 
    is_active, created_at, updated_at, created_by
)
SELECT 
    id,
    plan_title as name,
    description,
    price,
    CASE 
        WHEN recurrence = 'Mensal' THEN 'monthly'
        WHEN recurrence = 'Anual' THEN 'annual'
        WHEN recurrence = 'Semestral' THEN 'semestral'
        WHEN recurrence = 'monthly' THEN 'monthly'
        WHEN recurrence = 'annual' THEN 'annual'
        WHEN recurrence = 'semestral' THEN 'semestral'
        ELSE 'monthly'
    END as recurrence,
    plan_id_gateway,
    is_active,
    created_at,
    updated_at,
    created_by
FROM subscription_plans_backup;

-- Step 6: Create essential triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 7: Create RLS policies
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view active subscription plans" ON public.subscription_plans
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Step 8: Add comments
COMMENT ON TABLE public.subscription_plans IS 'Stores subscription plans that can be associated with member types. Aligned with Asaas integration.';
COMMENT ON COLUMN public.subscription_plans.name IS 'The public-facing name of the subscription plan (e.g., "Plano Obreiro", "Taxa Anual de Filiação").';
COMMENT ON COLUMN public.subscription_plans.recurrence IS 'Billing cycle for the subscription. Must be one of: monthly, semestral, annual.';
COMMENT ON COLUMN public.subscription_plans.price IS 'The monetary value of the plan. Must be zero or greater.';

COMMIT;