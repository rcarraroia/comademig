-- Migration: Restore Lost Data
-- Date: 2025-10-03
-- Description: Restore the subscription plans data that was lost during table recreation

BEGIN;

-- Temporarily disable RLS to insert data
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

-- Insert the original plans with corrected data
INSERT INTO public.subscription_plans (
    id, name, description, price, recurrence, is_active, created_at, updated_at
) VALUES 
(
    'fb2f3276-f351-4ab0-950c-e9d4156d0af4',
    'Plano Administrador',
    'Acesso completo ao sistema para administradores',
    25.00,
    'monthly',
    true,
    '2025-09-28 18:50:45.952722+00',
    now()
),
(
    'd65ab8d7-f370-4ff8-a507-c1cebd8da887',
    'Anuidade Pastor 2025',
    'Plano anual para pastores com acesso completo',
    120.00,
    'annual',
    true,
    '2025-09-29 20:56:49.913113+00',
    now()
),
(
    '22b444f8-8031-4303-b482-de535b68d68b',
    'Anuidade Membro Regular',
    'Plano básico anual para membros',
    60.00,
    'annual',
    true,
    '2025-09-29 20:56:49.913113+00',
    now()
),
(
    'cba61ce5-f718-4bc4-82de-83713cd46aa0',
    'Contribuição Mensal Básica',
    'Contribuição mensal para membros',
    30.00,
    'monthly',
    true,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    recurrence = EXCLUDED.recurrence,
    updated_at = now();

-- Re-enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

COMMIT;