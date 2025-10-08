#!/usr/bin/env python3
"""
Script para verificar usuários na tabela auth.users do Supabase
"""
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def verificar_auth():
    """Verifica estrutura e dados disponíveis"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("=" * 60)
        print("🔍 DIAGNÓSTICO COMPLETO DO BANCO")
        print("=" * 60)
        
        # Listar todas as tabelas disponíveis
        print("\n📊 Verificando tabelas disponíveis...")
        
        tabelas = [
            'profiles',
            'member_types',
            'subscription_plans',
            'user_subscriptions',
            'asaas_cobrancas',
            'solicitacoes_certidoes'
        ]
        
        for tabela in tabelas:
            try:
                result = supabase.table(tabela).select('*', count='exact').limit(1).execute()
                count = result.count if hasattr(result, 'count') else len(result.data) if result.data else 0
                print(f"  ✅ {tabela}: {count} registros")
                
                # Se for profiles, mostrar estrutura
                if tabela == 'profiles' and result.data:
                    print(f"     Campos: {list(result.data[0].keys())}")
                    
            except Exception as e:
                print(f"  ❌ {tabela}: Erro - {str(e)[:50]}")
        
        # Tentar fazer login de teste para ver o que acontece
        print("\n🔐 Tentando autenticação de teste...")
        print("   (Isso NÃO vai funcionar com anon key, mas mostra a estrutura)")
        
        # Verificar se há trigger para criar profile automaticamente
        print("\n🔧 Verificando se profiles são criados automaticamente...")
        print("   Nota: Com anon key não podemos ver triggers/functions")
        print("   Mas podemos verificar se há dados em profiles")
        
        # Contar registros em cada tabela
        print("\n📈 Resumo de dados:")
        for tabela in tabelas:
            try:
                result = supabase.table(tabela).select('*', count='exact').execute()
                count = result.count if hasattr(result, 'count') else 0
                print(f"  {tabela}: {count} registros")
            except:
                pass
        
        print("\n" + "=" * 60)
        print("💡 CONCLUSÃO:")
        print("=" * 60)
        print("\nSe profiles está vazio, o problema pode ser:")
        print("1. Trigger de criação automática não existe")
        print("2. Trigger existe mas falhou")
        print("3. Usuário foi criado mas profile não")
        print("\nSOLUÇÃO: Criar profile manualmente para o usuário admin")
        
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verificar_auth()
