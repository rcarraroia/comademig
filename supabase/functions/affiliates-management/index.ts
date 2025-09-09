
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

// Ensure environment variables are set
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Error handling utility
function handleError(message: string, status = 400) {
  console.error('Error:', message);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  console.log(`${req.method} request to: ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return handleError('Authorization required', 401);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return handleError('Não autorizado', 401);
    }

    console.log('Authenticated user:', user.id);

    // Route handling
    switch (req.method) {
      case 'GET':
        return await getAffiliateData(supabaseClient, user.id);
      
      case 'POST':
        return await createAffiliate(req, supabaseClient, user.id);
      
      case 'PUT':
        return await updateAffiliate(req, supabaseClient, user.id);
      
      default:
        return handleError('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Edge Function Error:', error);
    return handleError(`Erro interno: ${error.message}`, 500);
  }
});

async function getAffiliateData(supabaseClient: any, userId: string) {
  console.log('Getting affiliate data for user:', userId);

  try {
    // Get affiliate
    const { data: affiliate, error: affiliateError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (affiliateError) {
      console.error('Error fetching affiliate:', affiliateError);
      return handleError(affiliateError.message);
    }

    // If no affiliate exists, return empty data
    if (!affiliate) {
      console.log('No affiliate found for user');
      return new Response(JSON.stringify({ 
        affiliate: null,
        referrals: [],
        transactions: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Affiliate found:', affiliate.id);

    // Get referrals
    const { data: referrals = [], error: referralsError } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('affiliate_id', affiliate.id);

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
    }

    // Get transactions
    const { data: transactions = [], error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    const responseData = {
      affiliate,
      referrals,
      transactions
    };

    console.log('Returning affiliate data:', {
      affiliate: !!affiliate,
      referralsCount: referrals.length,
      transactionsCount: transactions.length
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in getAffiliateData:', error);
    return handleError(`Erro ao buscar dados do afiliado: ${error.message}`);
  }
}

async function createAffiliate(req: Request, supabaseClient: any, userId: string) {
  console.log('Creating affiliate for user:', userId);

  try {
    const body = await req.json();
    console.log('Create affiliate payload:', body);

    // Validate required fields
    const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body;

    // Validação mais robusta
    if (!asaas_wallet_id || asaas_wallet_id.trim() === '') {
      return handleError('Wallet ID da Asaas é obrigatório');
    }

    if (!display_name || display_name.trim() === '') {
      return handleError('Nome de exibição é obrigatório');
    }

    if (!cpf_cnpj || cpf_cnpj.trim() === '') {
      return handleError('CPF/CNPJ é obrigatório');
    }

    // Validar formato do Wallet ID (básico)
    const walletIdTrimmed = asaas_wallet_id.trim();
    if (walletIdTrimmed.length < 10) {
      return handleError('Wallet ID deve ter pelo menos 10 caracteres');
    }

    // Check if affiliate already exists
    const { data: existingAffiliate, error: checkError } = await supabaseClient
      .from('affiliates')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing affiliate:', checkError);
      return handleError(`Erro ao verificar afiliado existente: ${checkError.message}`);
    }

    if (existingAffiliate) {
      return handleError('Usuário já possui cadastro de afiliado');
    }

    // Check if wallet ID is already in use
    const { data: existingWallet, error: walletCheckError } = await supabaseClient
      .from('affiliates')
      .select('id')
      .eq('asaas_wallet_id', walletIdTrimmed)
      .maybeSingle();

    if (walletCheckError) {
      console.error('Error checking existing wallet:', walletCheckError);
      return handleError(`Erro ao verificar Wallet ID: ${walletCheckError.message}`);
    }

    if (existingWallet) {
      return handleError('Este Wallet ID já está sendo usado por outro afiliado');
    }

    // Generate referral code
    const referralCode = `REF${Date.now()}${userId.slice(-4).toUpperCase()}`;

    // Create affiliate with validated data
    const affiliateData = {
      user_id: userId,
      display_name: display_name.trim(),
      cpf_cnpj: cpf_cnpj.trim(),
      asaas_wallet_id: walletIdTrimmed,
      contact_email: contact_email?.trim() || '',
      phone: phone?.trim() || '',
      status: 'pending',
      referral_code: referralCode
    };

    console.log('Inserting affiliate with validated data:', {
      ...affiliateData,
      asaas_wallet_id: '[HIDDEN]' // Não logar o wallet ID completo
    });

    const { data: affiliate, error } = await supabaseClient
      .from('affiliates')
      .insert(affiliateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating affiliate:', error);
      
      // Tratar erros específicos
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('referral_code')) {
          return handleError('Erro interno: código de referência duplicado. Tente novamente.');
        }
        if (error.message.includes('user_id')) {
          return handleError('Usuário já possui cadastro de afiliado');
        }
        if (error.message.includes('asaas_wallet_id')) {
          return handleError('Este Wallet ID já está sendo usado por outro afiliado');
        }
      }
      
      return handleError(`Erro ao criar afiliado: ${error.message}`);
    }

    console.log('Affiliate created successfully:', affiliate.id);

    return new Response(JSON.stringify({ 
      success: true, 
      affiliate: {
        ...affiliate,
        asaas_wallet_id: '[HIDDEN]' // Não retornar o wallet ID completo
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201
    });

  } catch (error) {
    console.error('Error in createAffiliate:', error);
    
    // Tratar erro de JSON parsing
    if (error.message.includes('JSON')) {
      return handleError('Dados inválidos enviados na requisição');
    }
    
    return handleError(`Erro ao processar cadastro: ${error.message}`);
  }
}

async function updateAffiliate(req: Request, supabaseClient: any, userId: string) {
  console.log('Updating affiliate for user:', userId);

  try {
    const body = await req.json();
    console.log('Update affiliate payload:', body);

    const { display_name, cpf_cnpj, asaas_wallet_id, contact_email, phone } = body;

    const updateData = {
      display_name,
      cpf_cnpj,
      asaas_wallet_id,
      contact_email,
      phone,
      updated_at: new Date().toISOString()
    };

    const { data: affiliate, error } = await supabaseClient
      .from('affiliates')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating affiliate:', error);
      return handleError(`Erro ao atualizar afiliado: ${error.message}`);
    }

    console.log('Affiliate updated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      affiliate 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in updateAffiliate:', error);
    return handleError(`Erro ao atualizar dados: ${error.message}`);
  }
}
