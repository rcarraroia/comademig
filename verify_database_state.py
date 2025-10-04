import os
from supabase import create_client, Client
import json

# --- Configurações do Supabase ---
# Extraídas de src/integrations/supabase/client.ts
SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

# --- Tabelas a serem verificadas ---
# Baseado no relatório de diagnóstico original
TABLES_TO_CHECK = [
    # Tabelas funcionais reportadas
    "profiles",
    "member_types",
    "member_type_subscriptions",
    "user_subscriptions",
    "user_roles",
    # Tabelas vazias reportadas
    "subscription_plans",
    "asaas_cobrancas",
    "certidoes",
    "eventos",
    "presencas_eventos",
    "affiliates",
    "affiliate_commissions",
    "notifications",
    "audit_logs",
    # Tabelas inexistentes reportadas
    "notification_templates",
    "content_pages",
]

def run_diagnostic():
    """
    Conecta-se ao Supabase e executa uma verificação de diagnóstico em todas as tabelas relevantes.
    Salva um relatório JSON com os resultados.
    """
    print("Iniciando diagnóstico em tempo real do banco de dados Supabase...")
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Conexão com Supabase estabelecida com sucesso.")
    except Exception as e:
        print(f"ERRO CRÍTICO: Não foi possível conectar ao Supabase. Verifique a URL e a Chave.")
        print(f"Detalhe do erro: {e}")
        return

    diagnostic_results = {}

    for table in TABLES_TO_CHECK:
        print(f"Verificando tabela: '{table}'...")
        try:
            # Usamos 'count' para obter o número de registros de forma eficiente
            count_response = supabase.table(table).select("*", count="exact").execute()
            
            # O resultado do count está no atributo 'count'
            record_count = count_response.count
            
            diagnostic_results[table] = {
                "exists": True,
                "record_count": record_count,
                "status": "OK" if record_count > 0 else "VAZIA",
                "error": None
            }
            print(f"   Status: {diagnostic_results[table]['status']}, Registros: {record_count}")

        except Exception as e:
            error_message = str(e)
            status = "INEXISTENTE"
            
            # Tratamento para erros de permissão RLS vs. tabela inexistente
            if "relation" in error_message and "does not exist" in error_message:
                status = "INEXISTENTE"
            elif "permission denied" in error_message:
                status = "PERMISSAO NEGADA (RLS)"
            
            diagnostic_results[table] = {
                "exists": False,
                "record_count": 0,
                "status": status,
                "error": error_message
            }
            print(f"   Status: {status}")

    # --- Salvando o relatório ---
    report_filename = "real_time_diagnostic_report.json"
    with open(report_filename, "w", encoding="utf-8") as f:
        json.dump(diagnostic_results, f, indent=2, ensure_ascii=False)

    print(f"\nDiagnóstico concluído!")
    print(f"Relatório salvo em: {report_filename}")

if __name__ == "__main__":
    run_diagnostic()