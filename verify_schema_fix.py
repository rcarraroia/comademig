#!/usr/bin/env python3
"""
Verificar se a correção do schema funcionou completamente
"""

from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_complete_fix():
    """Verificação completa da correção do schema"""
    print("🔍 VERIFICAÇÃO COMPLETA DA CORREÇÃO DO SCHEMA")
    print("=" * 60)
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    success_count = 0
    total_checks = 6
    
    try:
        # 1. Verificar estrutura da tabela
        print("\n1️⃣ VERIFICANDO ESTRUTURA DA TABELA")
        print("-" * 40)
        
        response = supabase.table('subscription_plans').select('*').limit(1).execute()
        if response.data:
            columns = list(response.data[0].keys())
            print("✅ Colunas encontradas:")
            for col in sorted(columns):
                print(f"   - {col}")
            
            # Verificar se 'name' existe e 'plan_title' não existe
            if 'name' in columns and 'plan_title' not in columns:
                print("✅ Coluna renomeada com sucesso: plan_title → name")
                success_count += 1
            else:
                print("❌ Problema na renomeação da coluna")
                if 'plan_title' in columns:
                    print("   - plan_title ainda existe!")
                if 'name' not in columns:
                    print("   - name não foi criada!")
        
        # 2. Verificar dados dos planos
        print("\n2️⃣ VERIFICANDO DADOS DOS PLANOS")
        print("-" * 40)
        
        response = supabase.table('subscription_plans').select('id, name, recurrence, price').execute()
        plans = response.data
        
        if plans:
            print(f"✅ {len(plans)} planos encontrados:")
            valid_recurrence = True
            for plan in plans:
                print(f"   - {plan['name']}: {plan['recurrence']} (R$ {plan['price']})")
                if plan['recurrence'] not in ['monthly', 'semestral', 'annual']:
                    valid_recurrence = False
                    print(f"     ❌ Recurrence inválida: {plan['recurrence']}")
            
            if valid_recurrence:
                print("✅ Todos os valores de recurrence estão padronizados")
                success_count += 1
            else:
                print("❌ Alguns valores de recurrence ainda estão incorretos")
        else:
            print("❌ Nenhum plano encontrado - dados podem ter sido perdidos!")
        
        # 3. Verificar relacionamentos
        print("\n3️⃣ VERIFICANDO RELACIONAMENTOS")
        print("-" * 40)
        
        response = supabase.table('member_type_subscriptions').select('*').execute()
        relationships = response.data
        
        if relationships:
            print(f"✅ {len(relationships)} relacionamentos encontrados")
            success_count += 1
        else:
            print("⚠️  Nenhum relacionamento encontrado")
        
        # 4. Testar hook useMemberTypeWithPlan (simulação)
        print("\n4️⃣ TESTANDO COMPATIBILIDADE COM HOOKS")
        print("-" * 40)
        
        # Simular query do hook
        try:
            query_str = "id,name,description,sort_order,is_active,created_at,updated_at,member_type_subscriptions(subscription_plans(id,name,price,recurrence,plan_id_gateway,description))"
            response = supabase.from('member_types').select(query_str).eq('is_active', True).order('sort_order').execute()
            
            if response.data:
                print("✅ Query do hook useMemberTypeWithPlan funciona!")
                print(f"   - {len(response.data)} tipos de membro encontrados")
                success_count += 1
            else:
                print("⚠️  Query funciona mas não retornou dados")
                
        except Exception as e:
            print(f"❌ Query do hook falhou: {e}")
        
        # 5. Testar função RPC
        print("\n5️⃣ TESTANDO FUNÇÃO RPC")
        print("-" * 40)
        
        try:
            # Apenas verificar se a função existe (não vamos executar)
            # Tentativa de chamada que deve falhar por falta de permissão
            response = supabase.rpc('create_unified_member_type_and_plan', {
                'member_type_data': {'name': 'test'},
                'subscription_plan_data': {'name': 'test'}
            }).execute()
        except Exception as e:
            error_msg = str(e)
            if 'Permission denied' in error_msg or 'administrator' in error_msg:
                print("✅ Função RPC existe e validação de admin funciona!")
                success_count += 1
            elif 'Could not find' in error_msg:
                print("❌ Função RPC não foi criada!")
            else:
                print(f"⚠️  Função RPC existe mas erro inesperado: {error_msg}")
        
        # 6. Verificar constraints
        print("\n6️⃣ VERIFICANDO CONSTRAINTS")
        print("-" * 40)
        
        # Tentar inserir dados inválidos para testar constraints
        try:
            # Teste 1: recurrence inválida
            supabase.table('subscription_plans').insert({
                'name': 'Teste Constraint',
                'price': 10.0,
                'recurrence': 'invalid_value'
            }).execute()
            print("❌ Constraint de recurrence não está funcionando!")
        except Exception as e:
            if 'check constraint' in str(e).lower() or 'violates' in str(e).lower():
                print("✅ Constraint de recurrence está funcionando!")
                success_count += 1
            else:
                print(f"⚠️  Erro inesperado ao testar constraint: {e}")
        
        # Resultado final
        print("\n" + "=" * 60)
        print("🎯 RESULTADO FINAL DA VERIFICAÇÃO")
        print("=" * 60)
        
        percentage = (success_count / total_checks) * 100
        
        if success_count == total_checks:
            print("🎉 SUCESSO COMPLETO! Todas as verificações passaram!")
            print("✅ Schema corrigido com 100% de sucesso")
        elif success_count >= total_checks * 0.8:
            print(f"✅ SUCESSO PARCIAL! {success_count}/{total_checks} verificações passaram ({percentage:.1f}%)")
            print("⚠️  Algumas funcionalidades podem precisar de ajustes menores")
        else:
            print(f"❌ FALHA! Apenas {success_count}/{total_checks} verificações passaram ({percentage:.1f}%)")
            print("🚨 Correções adicionais são necessárias")
        
        print(f"\n📊 Score: {success_count}/{total_checks} ({percentage:.1f}%)")
        
        return success_count == total_checks
        
    except Exception as e:
        print(f"❌ Erro crítico na verificação: {e}")
        return False

if __name__ == "__main__":
    success = verify_complete_fix()
    if success:
        print("\n🚀 PRONTO PARA CONTINUAR COM A FASE 2!")
    else:
        print("\n⚠️  Correções adicionais podem ser necessárias antes de prosseguir.")