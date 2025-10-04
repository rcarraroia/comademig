from supabase import create_client

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Dados originais que sabemos que existiam
original_plans = [
    {
        'id': 'fb2f3276-f351-4ab0-950c-e9d4156d0af4',
        'name': 'Plano Administrador',
        'description': 'Acesso completo ao sistema para administradores',
        'price': 25.0,
        'recurrence': 'monthly',
        'is_active': True
    },
    {
        'id': 'd65ab8d7-f370-4ff8-a507-c1cebd8da887',
        'name': 'Anuidade Pastor 2025',
        'description': 'Plano anual para pastores com acesso completo',
        'price': 120.0,
        'recurrence': 'annual',
        'is_active': True
    },
    {
        'id': '22b444f8-8031-4303-b482-de535b68d68b',
        'name': 'Anuidade Membro Regular',
        'description': 'Plano básico anual para membros',
        'price': 60.0,
        'recurrence': 'annual',
        'is_active': True
    },
    {
        'id': 'cba61ce5-f718-4bc4-82de-83713cd46aa0',
        'name': 'Contribuição Mensal Básica',
        'description': 'Contribuição mensal para membros',
        'price': 30.0,
        'recurrence': 'monthly',
        'is_active': True
    }
]

print("🔄 RESTAURANDO DADOS DOS PLANOS...")

try:
    for plan in original_plans:
        print(f"Inserindo: {plan['name']}")
        response = supabase.table('subscription_plans').insert(plan).execute()
        if response.data:
            print(f"✅ {plan['name']} inserido com sucesso!")
        else:
            print(f"❌ Erro ao inserir {plan['name']}")
    
    print("\n✅ RESTAURAÇÃO CONCLUÍDA!")
    
    # Verificar se funcionou
    response = supabase.table('subscription_plans').select('name, recurrence, price').execute()
    print(f"\n📊 {len(response.data)} planos restaurados:")
    for plan in response.data:
        print(f"   - {plan['name']}: {plan['recurrence']} (R$ {plan['price']})")
        
except Exception as e:
    print(f"❌ ERRO na restauração: {e}")