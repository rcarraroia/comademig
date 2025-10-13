#!/usr/bin/env python3
"""
Verificar se há splits configurados e processados no banco
"""

from supabase import create_client, Client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verify_splits():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print(f"🔍 VERIFICANDO SISTEMA DE SPLITS")
    print(f"{'='*60}\n")
    
    # 1. Verificar se tabela asaas_splits existe
    try:
        response = supabase.table('asaas_splits').select('*').limit(1).execute()
        print("✅ Tabela 'asaas_splits' existe")
        
        # Contar total de splits
        count_response = supabase.table('asaas_splits').select('*', count='exact').execute()
        total_splits = count_response.count
        print(f"📊 Total de splits no banco: {total_splits}")
        
        if total_splits > 0:
            # Buscar últimos splits
            recent_splits = supabase.table('asaas_splits').select('*').order('created_at', desc=True).limit(5).execute()
            
            print(f"\n📋 ÚLTIMOS {len(recent_splits.data)} SPLITS:")
            for split in recent_splits.data:
                print(f"\n  Split ID: {split.get('id')}")
                print(f"  Cobrança: {split.get('cobranca_id')}")
                print(f"  Beneficiário: {split.get('recipient_name')} ({split.get('recipient_type')})")
                print(f"  Valor: R$ {split.get('commission_amount', 0):.2f}")
                print(f"  Percentual: {split.get('percentage')}%")
                print(f"  Status: {split.get('status')}")
                print(f"  Asaas Split ID: {split.get('asaas_split_id')}")
                print(f"  Criado em: {split.get('created_at')}")
        else:
            print("\n⚠️ NENHUM SPLIT ENCONTRADO NO BANCO")
            
    except Exception as e:
        print(f"❌ Erro ao acessar tabela asaas_splits: {str(e)}")
    
    # 2. Verificar configurações de split
    print(f"\n{'='*60}")
    print("🔧 CONFIGURAÇÕES DE SPLIT")
    print(f"{'='*60}\n")
    
    try:
        response = supabase.table('split_configurations').select('*').execute()
        if response.data:
            print(f"✅ Encontradas {len(response.data)} configurações de split")
            for config in response.data:
                print(f"\n  Tipo: {config.get('service_type')}")
                print(f"  Configuração: {config.get('split_config')}")
        else:
            print("⚠️ Nenhuma configuração de split encontrada")
    except Exception as e:
        print(f"❌ Tabela split_configurations não existe ou erro: {str(e)}")
    
    # 3. Verificar afiliados
    print(f"\n{'='*60}")
    print("👥 AFILIADOS")
    print(f"{'='*60}\n")
    
    try:
        response = supabase.table('affiliates').select('id, display_name, asaas_wallet_id, status').execute()
        if response.data:
            print(f"✅ Encontrados {len(response.data)} afiliados")
            for affiliate in response.data:
                wallet_status = "✅ Configurado" if affiliate.get('asaas_wallet_id') else "❌ Sem Wallet"
                print(f"  - {affiliate.get('display_name')}: {wallet_status} (Status: {affiliate.get('status')})")
        else:
            print("⚠️ Nenhum afiliado encontrado")
    except Exception as e:
        print(f"❌ Erro ao buscar afiliados: {str(e)}")
    
    # 4. Verificar cobranças recentes
    print(f"\n{'='*60}")
    print("💰 COBRANÇAS RECENTES")
    print(f"{'='*60}\n")
    
    try:
        response = supabase.table('asaas_cobrancas').select('*').order('created_at', desc=True).limit(5).execute()
        if response.data:
            print(f"✅ Encontradas {len(response.data)} cobranças recentes")
            for cobranca in response.data:
                print(f"\n  Cobrança ID: {cobranca.get('id')}")
                print(f"  Asaas Payment ID: {cobranca.get('asaas_payment_id')}")
                print(f"  Valor: R$ {cobranca.get('value', 0):.2f}")
                print(f"  Status: {cobranca.get('status')}")
                print(f"  Tipo: {cobranca.get('billing_type')}")
                print(f"  Criado em: {cobranca.get('created_at')}")
                
                # Verificar se tem splits
                try:
                    splits_response = supabase.table('asaas_splits').select('*').eq('cobranca_id', cobranca.get('id')).execute()
                    if splits_response.data:
                        print(f"  ✅ {len(splits_response.data)} splits configurados")
                    else:
                        print(f"  ❌ Nenhum split configurado")
                except:
                    pass
        else:
            print("⚠️ Nenhuma cobrança encontrada")
    except Exception as e:
        print(f"❌ Erro ao buscar cobranças: {str(e)}")
    
    print(f"\n{'='*60}")
    print("✅ VERIFICAÇÃO CONCLUÍDA")
    print(f"{'='*60}")

if __name__ == "__main__":
    verify_splits()
