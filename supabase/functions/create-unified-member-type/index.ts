import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUnifiedMemberTypeRequest {
  // Member Type Data
  memberType: {
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
  };
  
  // Subscription Plan Data
  subscriptionPlan: {
    plan_title: string;
    description?: string;
    price: number;
    recurrence: 'Mensal' | 'Anual';
    permissions?: Record<string, boolean>;
  };
}

interface CreateUnifiedMemberTypeResponse {
  success: boolean;
  data?: {
    memberTypeId: string;
    subscriptionPlanId: string;
    gatewayPlanId?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin (simplified check)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('cargo')
      .eq('id', user.id)
      .single()

    if (!profile || profile.cargo !== 'admin') {
      throw new Error('Admin access required')
    }

    // Parse request body
    const requestData: CreateUnifiedMemberTypeRequest = await req.json()

    // Validate input data
    if (!requestData.memberType?.name || !requestData.subscriptionPlan?.plan_title) {
      throw new Error('Missing required fields: name and plan_title are required')
    }

    if (requestData.subscriptionPlan.price < 25.00) {
      throw new Error('Price must be at least R$ 25.00')
    }

    if (!['Mensal', 'Anual'].includes(requestData.subscriptionPlan.recurrence)) {
      throw new Error('Recurrence must be either "Mensal" or "Anual"')
    }

    // Check uniqueness constraints
    const { data: existingMemberType } = await supabaseClient
      .from('member_types')
      .select('id')
      .eq('name', requestData.memberType.name)
      .single()

    if (existingMemberType) {
      throw new Error(`Member type name "${requestData.memberType.name}" already exists`)
    }

    const { data: existingPlan } = await supabaseClient
      .from('subscription_plans')
      .select('id')
      .eq('plan_title', requestData.subscriptionPlan.plan_title)
      .single()

    if (existingPlan) {
      throw new Error(`Plan title "${requestData.subscriptionPlan.plan_title}" already exists`)
    }

    // Start transaction-like operations
    let memberTypeId: string
    let subscriptionPlanId: string

    try {
      // 1. Create member type
      const { data: newMemberType, error: memberTypeError } = await supabaseClient
        .from('member_types')
        .insert({
          name: requestData.memberType.name,
          description: requestData.memberType.description,
          sort_order: requestData.memberType.sort_order,
          is_active: requestData.memberType.is_active,
          created_by: user.id
        })
        .select('id')
        .single()

      if (memberTypeError) {
        throw memberTypeError
      }

      memberTypeId = newMemberType.id

      // 2. Create subscription plan
      const { data: newPlan, error: planError } = await supabaseClient
        .from('subscription_plans')
        .insert({
          plan_title: requestData.subscriptionPlan.plan_title,
          description: requestData.subscriptionPlan.description,
          price: requestData.subscriptionPlan.price,
          recurrence: requestData.subscriptionPlan.recurrence,
          permissions: requestData.subscriptionPlan.permissions || {},
          is_active: true,
          created_by: user.id
        })
        .select('id')
        .single()

      if (planError) {
        throw planError
      }

      subscriptionPlanId = newPlan.id

      // 3. Create relationship
      const { error: relationError } = await supabaseClient
        .from('member_type_subscriptions')
        .insert({
          member_type_id: memberTypeId,
          subscription_plan_id: subscriptionPlanId,
          created_by: user.id
        })

      if (relationError) {
        throw relationError
      }

      const response: CreateUnifiedMemberTypeResponse = {
        success: true,
        data: {
          memberTypeId,
          subscriptionPlanId
        }
      }

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (transactionError) {
      // Rollback: Delete created member type if it was created
      if (memberTypeId) {
        await supabaseClient
          .from('member_types')
          .delete()
          .eq('id', memberTypeId)
      }

      // Rollback: Delete created subscription plan if it was created
      if (subscriptionPlanId) {
        await supabaseClient
          .from('subscription_plans')
          .delete()
          .eq('id', subscriptionPlanId)
      }

      throw transactionError
    }

  } catch (error) {
    console.error('Error in create-unified-member-type:', error)
    
    const errorResponse: CreateUnifiedMemberTypeResponse = {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: error
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})