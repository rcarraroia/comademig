from supabase import create_client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Verificando estrutura...")
response = supabase.table('subscription_plans').select('*').limit(1).execute()

if response.data:
    columns = list(response.data[0].keys())
    print("Colunas:", sorted(columns))
    
    if 'name' in columns:
        print("✅ Coluna 'name' existe!")
    if 'plan_title' not in columns:
        print("✅ Coluna 'plan_title' foi removida!")

print("\nVerificando dados...")
response = supabase.table('subscription_plans').select('name, recurrence').execute()
for plan in response.data:
    print(f"- {plan['name']}: {plan['recurrence']}")

print("\n✅ VERIFICAÇÃO CONCLUÍDA!")