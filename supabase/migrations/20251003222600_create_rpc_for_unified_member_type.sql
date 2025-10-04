-- Migration: Create RPC for Unified Member Type and Plan Creation
-- Date: 2025-10-03
-- Description: This script creates a PostgreSQL function (`create_unified_member_type_and_plan`)
-- to handle the creation of a member type and its associated subscription plan within a
-- single, atomic database transaction. This replaces the old, error-prone Edge Function.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_unified_member_type_and_plan(
    member_type_data jsonb,
    subscription_plan_data jsonb
)
RETURNS jsonb -- Returning a json object with the new IDs
LANGUAGE plpgsql
-- SECURITY DEFINER allows the function to run with the permissions of the user who defined it,
-- bypassing RLS for the internal table inserts. Admin check is performed inside.
SECURITY DEFINER
AS $$
DECLARE
    -- Variable to hold the result of the admin check
    is_admin_user boolean;
    
    -- Variables to hold the IDs of the newly created records
    new_member_type_id uuid;
    new_plan_id uuid;
BEGIN
    -- Step 1: Verify that the calling user is an administrator.
    -- This is a critical security check because this is a SECURITY DEFINER function.
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_admin_user;

    IF NOT is_admin_user THEN
        RAISE EXCEPTION 'Permission denied: You must be an administrator to perform this action.';
    END IF;

    -- Step 2: Insert into member_types table
    -- The `->>` operator extracts a JSON object field as text.
    INSERT INTO public.member_types (name, description, sort_order, is_active, created_by)
    VALUES (
        member_type_data->>'name',
        member_type_data->>'description',
        (member_type_data->>'sort_order')::integer,
        COALESCE((member_type_data->>'is_active')::boolean, true),
        auth.uid()
    )
    RETURNING id INTO new_member_type_id;

    -- Step 3: Insert into subscription_plans table
    INSERT INTO public.subscription_plans (name, description, price, recurrence, is_active, created_by)
    VALUES (
        subscription_plan_data->>'name',
        subscription_plan_data->>'description',
        (subscription_plan_data->>'price')::decimal,
        subscription_plan_data->>'recurrence',
        COALESCE((subscription_plan_data->>'is_active')::boolean, true),
        auth.uid()
    )
    RETURNING id INTO new_plan_id;

    -- Step 4: Insert into the linking table member_type_subscriptions
    INSERT INTO public.member_type_subscriptions (member_type_id, subscription_plan_id, created_by)
    VALUES (
        new_member_type_id,
        new_plan_id,
        auth.uid()
    );

    -- Step 5: Return the IDs of the newly created records in a JSON object
    RETURN jsonb_build_object(
        'success', true,
        'memberTypeId', new_member_type_id,
        'subscriptionPlanId', new_plan_id
    );
END;
$$;

COMMENT ON FUNCTION public.create_unified_member_type_and_plan(jsonb, jsonb)
IS 'Creates a new member type and its associated subscription plan in a single atomic transaction. Requires admin privileges.';

COMMIT;