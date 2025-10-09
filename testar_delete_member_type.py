#!/usr/bin/env python3
"""
Testar delete/update de member_types
"""
from supabase import create_client, Client

# Configurações do Supabase
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

def testar():
    """Testar operações em member_types"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("=" * 80)
        print("🧪 TESTE: DELETE/UPDATE EM MEMBER_TYPES")
        print("=" * 80)
        
        # 1. Listar tipos inativos
        print("\n1. Buscando tipos inativos...")
        result = supabase.table('member_types').select('*').eq('is_active', False).execute()
        
        if result.data:
            print(f"✅ Encontrados {len(result.data)} tipos inativos:")
            for item in result.data:
                print(f"   - {item['name']} (ID: {item['id']})")
            
            # Pegar o primeiro inativo para testar
            test_id = result.data[0]['id']
            test_name = result.data[0]['name']
            
            print(f"\n2. Tentando ATUALIZAR (soft delete) o tipo: {test_name}")
            print(f"   ID: {test_id}")
            
            # Tentar atualizar is_active
            try:
                update_result = supabase.table('member_types').update({
                    'is_active': False
                }).eq('id', test_id).execute()
                
                print(f"✅ UPDATE bem-sucedido!")
                print(f"   Dados retornados: {update_result.data}")
                
            except Exception as e:
                print(f"❌ ERRO no UPDATE: {str(e)}")
                print(f"   Tipo de erro: {type(e).__name__}")
                
                # Verificar se é erro de RLS
                if 'policy' in str(e).lower() or 'permission' in str(e).lower():
                    print("\n⚠️ PROBLEMA IDENTIFICADO: RLS Policy bloqueando UPDATE")
                    print("   Solução: Adicionar policy que permite UPDATE em member_types")
                
        else:
            print("⚠️ Nenhum tipo inativo encontrado")
            print("   Vamos tentar com um tipo ativo...")
            
            # Buscar tipos ativos
            result = supabase.table('member_types').select('*').eq('is_active', True).limit(1).execute()
            
            if result.data:
                test_id = result.data[0]['id']
                test_name = result.data[0]['name']
                
                print(f"\n2. Tentando ATUALIZAR tipo ativo: {test_name}")
                
                try:
                    update_result = supabase.table('member_types').update({
                        'is_active': True  # Manter como está
                    }).eq('id', test_id).execute()
                    
                    print(f"✅ UPDATE bem-sucedido!")
                    
                except Exception as e:
                    print(f"❌ ERRO no UPDATE: {str(e)}")
                    
                    if 'policy' in str(e).lower() or 'permission' in str(e).lower():
                        print("\n⚠️ PROBLEMA: RLS Policy bloqueando UPDATE")
        
        # 3. Verificar RLS policies (não conseguimos ver com anon key, mas podemos tentar)
        print("\n3. Diagnóstico:")
        print("   - Se UPDATE falhou com erro de 'policy' ou 'permission':")
        print("     → RLS está bloqueando a operação")
        print("     → Precisa adicionar policy que permite UPDATE")
        print("\n   - Se UPDATE funcionou:")
        print("     → RLS está OK")
        print("     → Problema pode estar no frontend")
        
        print("\n" + "=" * 80)
        print("✅ TESTE CONCLUÍDO")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Erro geral: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    testar()
