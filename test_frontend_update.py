#!/usr/bin/env python3

import os
from supabase import create_client, Client
from datetime import datetime

# Configuração do Supabase
url = "https://amkelczfwazutrciqtlk.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(url, key)

def test_frontend_update():
    print("🧪 TESTANDO OPERAÇÃO DE UPDATE DO FRONTEND")
    print("=" * 60)
    
    # Dados que o frontend enviaria para liderança
    test_data = {
        "titulo": "Nossa Liderança - Teste Frontend",
        "descricao": "Conheça os líderes que conduzem a COMADEMIG - Editado via Frontend",
        "lideres": [
            {
                "id": "leader-1703123456789-0",
                "nome": "Pastor João Silva Santos - Editado Frontend",
                "cargo": "Presidente da COMADEMIG",
                "bio": "Pastor há mais de 30 anos - TESTE DE EDIÇÃO FRONTEND",
                "email": "presidencia@comademig.org.br",
                "telefone": "(31) 3333-4444",
                "ordem": 1,
                "categoria": "presidencia"
            },
            {
                "id": "leader-1703123456789-1",
                "nome": "Pastor Maria Santos - Novo Líder",
                "cargo": "Vice-Presidente",
                "bio": "Líder experiente na área administrativa",
                "email": "vice@comademig.org.br",
                "telefone": "(31) 3333-5555",
                "ordem": 2,
                "categoria": "diretoria"
            }
        ]
    }
    
    try:
        print("📤 Simulando UPDATE exato do frontend...")
        
        # Exatamente como o frontend faz
        result = supabase.table('content_management').update({
            'content_json': test_data,
            'last_updated_at': datetime.now().isoformat()
        }).eq('page_name', 'lideranca').execute()
        
        if result.data:
            print("✅ UPDATE realizado com sucesso!")
            print(f"   Página: {result.data[0]['page_name']}")
            print(f"   Título: {result.data[0]['content_json']['titulo']}")
            print(f"   Líderes: {len(result.data[0]['content_json']['lideres'])} encontrados")
            print(f"   Atualizado em: {result.data[0]['last_updated_at']}")
            
            # Verificar se os dados foram salvos corretamente
            for i, lider in enumerate(result.data[0]['content_json']['lideres']):
                print(f"     Líder {i+1}: {lider['nome']} - {lider['cargo']}")
        else:
            print("❌ UPDATE falhou - nenhum dado retornado")
            print(f"   Resposta completa: {result}")
            
    except Exception as e:
        print(f"❌ Erro durante UPDATE: {e}")
        import traceback
        traceback.print_exc()

def test_read_after_update():
    print("\n📖 VERIFICANDO DADOS APÓS UPDATE")
    print("=" * 60)
    
    try:
        result = supabase.table('content_management').select('*').eq('page_name', 'lideranca').execute()
        
        if result.data:
            content = result.data[0]['content_json']
            print("✅ Dados lidos com sucesso:")
            print(f"   Título: {content.get('titulo', 'N/A')}")
            print(f"   Descrição: {content.get('descricao', 'N/A')}")
            print(f"   Líderes: {len(content.get('lideres', []))}")
            
            for i, lider in enumerate(content.get('lideres', [])):
                print(f"     {i+1}. {lider.get('nome', 'Sem nome')} - {lider.get('cargo', 'Sem cargo')}")
        else:
            print("❌ Nenhum dado encontrado")
            
    except Exception as e:
        print(f"❌ Erro na leitura: {e}")

if __name__ == "__main__":
    test_frontend_update()
    test_read_after_update()
    
    print("\n🎯 CONCLUSÃO:")
    print("Se o teste passou, o problema NÃO está no backend.")
    print("Verifique o frontend: formulários, estados, validações, etc.")