
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
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const method = req.method
    
    console.log('Full URL:', req.url)
    console.log('Method:', method)
    console.log('User ID:', user.id)

    // POST - Criar afiliado
    if (method === 'POST') {
      const body = await req.json()
      console.log('Creating affiliate with data:', body)
      
      const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body

      if (!asaas_wallet_id) {
        return new Response(JSON.stringify({ error: 'Wallet ID é obrigatório' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

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
        console.error('Error creating affiliate:', error)
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Affiliate created successfully:', affiliate)
      return new Response(JSON.stringify({ success: true, affiliate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET - Buscar dados (afiliado, referrals, transactions)
    if (method === 'GET') {
      const body = await req.json().catch(() => ({}))
      console.log('GET request body:', body)

      // Buscar afiliado do usuário
      const { data: affiliate, error: affiliateError } = await supabaseClient
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (affiliateError) {
        console.error('Error fetching affiliate:', affiliateError)
        return new Response(JSON.stringify({ error: affiliateError.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Se não existe afiliado, retornar null
      if (!affiliate) {
        return new Response(JSON.stringify({ 
          affiliate: null,
          referrals: [],
          transactions: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Buscar referrals
      const { data: referrals = [], error: referralsError } = await supabaseClient
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError)
      }

      // Buscar transactions
      const { data: transactions = [], error: transactionsError } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      }

      console.log('Returning data:', { affiliate: !!affiliate, referrals: referrals.length, transactions: transactions.length })
      
      return new Response(JSON.stringify({ 
        affiliate,
        referrals,
        transactions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PUT - Atualizar afiliado
    if (method === 'PUT') {
      const body = await req.json()
      console.log('Updating affiliate with data:', body)
      
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
        console.error('Error updating affiliate:', error)
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, affiliate }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Method not supported:', method)
    return new Response(JSON.stringify({ error: `Método ${method} não suportado` }), { 
      status: 405, 
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
