#!/usr/bin/env python3

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)

print("🔍 TESTANDO SALVAMENTO DE CONTEÚDO...")
print("=" * 50)

# Dados de teste similares ao que o editor envia
test_content = {
    'page_name': 'home',
    'content_json': {
        'banner_principal': {
            'titulo_principal': 'Com Deus nós podemos Mais',
            'subtitulo': 'Teste',
            'texto_botao': 'Conheça',
            'link_botao': '/sobre'
        },
        'cards_acao': [
            {'titulo': 'Inscreva-se', 'descricao': 'Participe dos nossos eventos', 'link_botao': '/eventos'},
            {'titulo': 'Filie-se', 'descricao': 'Torne-se membro', 'link_botao': '/filiacao'},
            {'titulo': 'Regularização', 'descricao': 'Regularize sua igreja', 'link_botao': '/dashboard/regularizacao'},
            {'titulo': 'Ao Vivo', 'descricao': 'Acompanhe nossos cultos', 'link_botao': '/eventos'}
        ],
        'destaques_convencao': [],
        'noticias_recentes': [],
        'junte_se_missao': {
            'titulo_principal': 'Junte-se à Nossa Missão',
            'subtitulo': 'Faça parte da família COMADEMIG',
            'texto_botao': 'Filie-se Agora',
            'link_botao': '/filiacao'
        }
    },
    'last_updated_at': '2024-02-09T12:00:00Z'
}

try:
    print("🧪 TESTANDO UPSERT...")
    response = supabase.table('content_management').upsert(test_content).execute()
    print("✅ SUCESSO!")
    print(f"📋 Resposta: {response.data}")
    
except Exception as e:
    print(f"❌ ERRO: {e}")
    
    # Tentar apenas UPDATE se o registro já existe
    print("\n🔄 TENTANDO UPDATE...")
    try:
        update_response = supabase.table('content_management').update({
            'content_json': test_content['content_json'],
            'last_updated_at': test_content['last_updated_at']
        }).eq('page_name', 'home').execute()
        print("✅ UPDATE FUNCIONOU!")
        print(f"📋 Resposta: {update_response.data}")
    except Exception as update_error:
        print(f"❌ UPDATE TAMBÉM FALHOU: {update_error}")

print("\n" + "=" * 50)
print("✅ TESTE CONCLUÍDO")