
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
    const pathSegments = url.pathname.split('/').filter(segment => segment !== '')
    const endpoint = pathSegments[pathSegments.length - 1] // Pega o último segmento

    console.log('Method:', method, 'Endpoint:', endpoint, 'Full path:', url.pathname)

    // POST para criar afiliado (sem endpoint específico ou com 'create')
    if (method === 'POST' && (endpoint === 'affiliates-management' || endpoint === 'create')) {
      const body = await req.json()
      const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body

      // Validar se já existe afiliado para este usuário
      const { data: existing } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ error: 'Usuário já possui cadastro de afiliado' }), { 
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

    // GET para buscar dados do afiliado (endpoint 'me')
    if (method === 'GET' && endpoint === 'me') {
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

    // PUT para atualizar afiliado (endpoint 'update')
    if (method === 'PUT' && endpoint === 'update') {
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

    // GET para buscar indicações (endpoint 'referrals')
    if (method === 'GET' && endpoint === 'referrals') {
      // Primeiro busca o afiliado
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!affiliate) {
        return new Response(JSON.stringify({ referrals: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: referrals, error } = await supabaseClient
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)

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

    // GET para buscar transações (endpoint 'transactions')
    if (method === 'GET' && endpoint === 'transactions') {
      // Primeiro busca o afiliado
      const { data: affiliate } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!affiliate) {
        return new Response(JSON.stringify({ transactions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: transactions, error } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
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

    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro na função de afiliados:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
