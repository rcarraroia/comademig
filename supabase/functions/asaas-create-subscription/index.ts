import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSplitConfiguration, formatSplitsForAsaas } from '../shared/split-config.ts'

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://api.asaas.com/v3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            customer,
            billingType,
            value,
            nextDueDate,
            cycle,
            description,
            externalReference,
            creditCard,
            creditCardToken, // NOVO: Token do cartão já salvo
            creditCardHolderInfo,
            discount,
            affiliateCode, // NOVO: código de afiliado
            userId, // NOVO: ID do usuário para salvar em user_subscriptions
            memberTypeId, // NOVO: ID do tipo de membro
            subscriptionPlanId, // NOVO: ID do plano de assinatura
            initialPaymentId // NOVO: ID do pagamento inicial já processado
        } = await req.json()

        console.log('📝 Criando assinatura no Asaas:', {
            customer,
            value,
            cycle,
            billingType,
            hasAffiliate: !!affiliateCode
        })

        // Validações
        if (!customer || !billingType || !value || !nextDueDate || !cycle) {
            throw new Error('Dados obrigatórios faltando')
        }

        if (!userId || !memberTypeId || !subscriptionPlanId) {
            throw new Error('userId, memberTypeId e subscriptionPlanId são obrigatórios')
        }

        if (!ASAAS_API_KEY) {
            throw new Error('ASAAS_API_KEY não configurada')
        }

        // Validar método de pagamento
        if (billingType === 'BOLETO') {
            throw new Error('Boleto não é mais aceito. Use Cartão de Crédito.')
        }

        // Cartão de crédito obrigatório para filiações (renovação automática)
        if (billingType !== 'CREDIT_CARD') {
            throw new Error('Filiações requerem Cartão de Crédito para renovação automática.')
        }

        // NOVO: Buscar configuração de split
        console.log('🔍 Buscando configuração de split...')
        const splitConfig = await getSplitConfiguration({
            affiliateCode,
            serviceType: 'filiacao', // Assinaturas são sempre filiação
            totalValue: value
        })
        const splits = formatSplitsForAsaas(splitConfig)

        console.log('✅ Split configurado:', {
            hasAffiliate: splitConfig.hasAffiliate,
            affiliateName: splitConfig.affiliateInfo?.name,
            splits: splitConfig.splits.map(s => `${s.recipientName}: ${s.percentualValue}%`)
        })

        // 1. CRIAR PAGAMENTO INICIAL COM SPLIT (se não foi fornecido)
        let actualInitialPaymentId = initialPaymentId
        
        if (!initialPaymentId) {
            console.log('💳 Criando pagamento inicial COM split...')
            
            const today = new Date().toISOString().split('T')[0]
            
            const initialPaymentPayload: any = {
                customer,
                billingType,
                value,
                dueDate: today, // Pagamento inicial vence HOJE
                description: description || 'Pagamento Inicial - Assinatura COMADEMIG',
                externalReference: externalReference ? `${externalReference}-initial` : undefined,
                split: splits // ✅ SPLIT NO PAGAMENTO INICIAL
            }

            if (discount) {
                initialPaymentPayload.discount = discount
            }

            // Adicionar dados do cartão
            if (billingType === 'CREDIT_CARD') {
                if (creditCardToken) {
                    initialPaymentPayload.creditCardToken = creditCardToken
                } else if (creditCard && creditCardHolderInfo) {
                    initialPaymentPayload.creditCard = creditCard
                    initialPaymentPayload.creditCardHolderInfo = creditCardHolderInfo
                }
            }

            const initialPaymentResponse = await fetch(`${ASAAS_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'access_token': ASAAS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(initialPaymentPayload),
            })

            const initialPayment = await initialPaymentResponse.json()

            if (!initialPaymentResponse.ok) {
                console.error('❌ Erro ao criar pagamento inicial:', initialPayment)
                throw new Error(initialPayment.errors?.[0]?.description || initialPayment.message || 'Erro ao criar pagamento inicial')
            }

            console.log('✅ Pagamento inicial criado:', initialPayment.id)
            actualInitialPaymentId = initialPayment.id
        } else {
            console.log('ℹ️ Usando pagamento inicial já processado:', initialPaymentId)
        }

        // 2. Criar assinatura recorrente COM SPLIT
        console.log('📅 Criando assinatura recorrente...')

        const subscriptionPayload: any = {
            customer,
            billingType,
            value,
            nextDueDate, // Próxima cobrança (30 dias após hoje)
            cycle,
            description: description || 'Assinatura COMADEMIG',
            externalReference,
            split: splits // Incluir split na assinatura
        }

        if (discount) {
            subscriptionPayload.discount = discount
        }

        // Adicionar token do cartão se disponível
        if (billingType === 'CREDIT_CARD') {
            if (creditCardToken) {
                subscriptionPayload.creditCardToken = creditCardToken
            } else if (creditCard && creditCardHolderInfo) {
                subscriptionPayload.creditCard = creditCard
                subscriptionPayload.creditCardHolderInfo = creditCardHolderInfo
            }
        }

        const subscriptionResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
            method: 'POST',
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriptionPayload),
        })

        const subscription = await subscriptionResponse.json()

        if (!subscriptionResponse.ok) {
            console.error('❌ Erro ao criar assinatura:', subscription)
            throw new Error(subscription.errors?.[0]?.description || subscription.message || 'Erro ao criar assinatura')
        }

        console.log('✅ Assinatura criada:', subscription.id)

        // NOVO: 3. Salvar dados em user_subscriptions (não mais em asaas_subscriptions)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('💾 Salvando assinatura em user_subscriptions...')

        const { data: userSubscription, error: dbError } = await supabaseClient
            .from('user_subscriptions')
            .insert({
                user_id: userId,
                subscription_plan_id: subscriptionPlanId,
                member_type_id: memberTypeId,
                status: 'active', // Já ativo pois pagamento inicial foi confirmado
                payment_id: actualInitialPaymentId,
                initial_payment_id: actualInitialPaymentId, // ID da cobrança inicial
                asaas_subscription_id: subscription.id, // ID da assinatura recorrente
                asaas_customer_id: customer,
                billing_type: billingType,
                cycle: cycle,
                value: value,
                started_at: null, // Será preenchido quando pagamento for confirmado
                expires_at: null, // Será calculado após primeiro pagamento
            })
            .select()
            .single()

        if (dbError) {
            console.error('❌ Erro ao salvar em user_subscriptions:', dbError)
            throw new Error(`Erro ao salvar assinatura no banco: ${dbError.message}`)
        }

        console.log('✅ Assinatura salva em user_subscriptions:', userSubscription.id)

        // NOVO: 4. Registrar splits em asaas_splits
        console.log('📊 Registrando splits em asaas_splits...')

        const splitsToInsert = splitConfig.splits
            .filter(split => split.recipientType !== 'comademig') // COMADEMIG não precisa de registro
            .map(split => ({
                subscription_id: userSubscription.id,
                payment_id: actualInitialPaymentId,
                affiliate_id: split.recipientType === 'affiliate' ? splitConfig.affiliateInfo?.id : null,
                recipient_type: split.recipientType,
                recipient_name: split.recipientName,
                wallet_id: split.walletId,
                percentage: split.percentualValue,
                status: 'pending', // Será atualizado quando receber webhook
            }))

        const { error: splitsError } = await supabaseClient
            .from('asaas_splits')
            .insert(splitsToInsert)

        if (splitsError) {
            console.error('⚠️ Erro ao salvar splits:', splitsError)
            // Não falhar se erro ao salvar splits, assinatura já foi criada
        } else {
            console.log(`✅ ${splitsToInsert.length} splits registrados`)
        }

        // NOVO: 5. Registrar referral se houver afiliado
        if (splitConfig.hasAffiliate && splitConfig.affiliateInfo) {
            console.log('🤝 Registrando indicação de afiliado...')

            const { error: referralError } = await supabaseClient
                .from('affiliate_referrals')
                .insert({
                    affiliate_id: splitConfig.affiliateInfo.id,
                    referred_user_id: userId,
                    subscription_id: userSubscription.id,
                    status: 'pending', // Será 'converted' quando pagamento for confirmado
                })

            if (referralError) {
                console.error('⚠️ Erro ao registrar referral:', referralError)
                // Não falhar se erro ao registrar referral
            } else {
                console.log('✅ Indicação registrada')
            }
        }

        // Retornar IDs de subscription e initial payment
        return new Response(
            JSON.stringify({
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    nextDueDate: subscription.nextDueDate,
                },
                initialPaymentId: actualInitialPaymentId,
                userSubscriptionId: userSubscription.id,
                split: {
                    configured: true,
                    hasAffiliate: splitConfig.hasAffiliate,
                    affiliateName: splitConfig.affiliateInfo?.name,
                    splits: splitConfig.splits.map(s => ({
                        recipient: s.recipientName,
                        percentage: s.percentualValue
                    }))
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('❌ Erro na Edge Function:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Erro ao criar assinatura',
                details: error
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
