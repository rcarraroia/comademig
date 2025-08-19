
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Não autorizado', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const method = req.method
    const path = url.pathname.split('/').pop()

    if (method === 'POST' && path === 'create') {
      const body = await req.json()
      const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body

      // Validar se já existe afiliado para este usuário
      const { data: existing } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        return new Response('Usuário já possui cadastro de afiliado', { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Criar afiliado
      const { data: affiliate, error } = await supabaseClient
        .from('affiliates')
        .insert({
          user_id: user.id,
          display_name,
          cpf_cnpj,
          asaas_wallet_id,
          contact_email: contact_email || user.email,
          phone,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, affiliate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'GET' && path === 'me') {
      const { data: affiliate, error } = await supabaseClient
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ affiliate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'PUT' && path === 'update') {
      const body = await req.json()
      const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body

      const { data: affiliate, error } = await supabaseClient
        .from('affiliates')
        .update({
          display_name,
          cpf_cnpj,
          asaas_wallet_id,
          contact_email,
          phone
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, affiliate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'GET' && path === 'referrals') {
      const { data: referrals, error } = await supabaseClient
        .from('referrals')
        .select(`
          *,
          affiliate:affiliates(display_name, referral_code)
        `)
        .eq('affiliates.user_id', user.id)

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ referrals }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (method === 'GET' && path === 'transactions') {
      const { data: transactions, error } = await supabaseClient
        .from('transactions')
        .select(`
          *,
          affiliate:affiliates(display_name, referral_code)
        `)
        .eq('affiliates.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ transactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Endpoint não encontrado', { status: 404, headers: corsHeaders })

  } catch (error) {
    console.error('Erro na função de afiliados:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
