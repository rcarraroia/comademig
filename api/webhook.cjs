const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📡 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const { event, payment, subscription } = req.body;
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'PAYMENT_CONFIRMED':
        console.log('💰 Pagamento confirmado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'CONFIRMED',
            data_pagamento: new Date().toISOString()
          })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_RECEIVED':
        console.log('✅ Pagamento recebido:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'RECEIVED',
            data_pagamento: new Date().toISOString()
          })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_OVERDUE':
        console.log('⏰ Pagamento vencido:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'OVERDUE' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_DELETED':
        console.log('🗑️ Pagamento cancelado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'CANCELLED' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_RESTORED':
        console.log('🔄 Pagamento restaurado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'PENDING' })
          .eq('asaas_id', payment.id);
        break;
        
      case 'PAYMENT_REFUNDED':
        console.log('💸 Pagamento estornado:', payment.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ 
            status: 'REFUNDED',
            data_pagamento: null
          })
          .eq('asaas_id', payment.id);
        break;
        
      case 'SUBSCRIPTION_DELETED':
        console.log('❌ Assinatura cancelada:', subscription.id);
        await supabase
          .from('asaas_cobrancas')
          .update({ status: 'CANCELLED' })
          .eq('asaas_id', subscription.id)
          .eq('status', 'PENDING');
        break;
        
      default:
        console.log('📋 Evento não tratado:', event);
    }
    
    res.status(200).json({ 
      received: true, 
      event,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(200).json({ 
      received: false, 
      error: error.message 
    });
  }
};