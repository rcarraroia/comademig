-- Lista TODAS as tabelas do schema public
SELECT 
    tablename as "Tabela"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
