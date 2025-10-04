from supabase import create_client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Testando conexão...")
    response = supabase.table('subscription_plans').select('*').execute()
    print(f"Response: {response}")
    print(f"Data: {response.data}")
    print(f"Count: {len(response.data) if response.data else 0}")
    
    if response.data:
        print("✅ DADOS ENCONTRADOS!")
        for i, plan in enumerate(response.data):
            print(f"Plano {i+1}: {plan}")
    else:
        print("❌ NENHUM DADO ENCONTRADO!")
        
except Exception as e:
    print(f"❌ ERRO: {e}")