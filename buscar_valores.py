from supabase import create_client

s = create_client('https://amkelczfwazutrciqtlk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFta2VsY3pmd2F6dXRyY2lxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODQxMjYsImV4cCI6MjA2ODc2MDEyNn0.7-M7DCqMzfZtXvcg6Zlf24zNv-XqvDT_oAznQGiqFHY')
r = s.table('valores_certidoes').select('*').execute()
print('VALORES DE CERTIDÕES:')
for d in r.data:
    print(f"  {d['tipo']}: R$ {d['valor']} - {d['nome']} (Ativo: {d['is_active']})")
