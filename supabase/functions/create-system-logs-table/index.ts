import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente com service_role para executar SQL
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Criando tabela system_logs...')

    // Executar SQL de criação
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS system_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
          source TEXT NOT NULL,
          function_name TEXT,
          user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          session_id TEXT,
          request_id TEXT,
          message TEXT NOT NULL,
          details JSONB DEFAULT '{}'::jsonb,
          error_message TEXT,
          error_stack TEXT,
          metadata JSONB DEFAULT '{}'::jsonb
        );

        CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
        CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);
        CREATE INDEX IF NOT EXISTS idx_system_logs_function_name ON system_logs(function_name) WHERE function_name IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);

        ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can view system logs" ON system_logs;
        CREATE POLICY "Admins can view system logs"
          ON system_logs FOR SELECT
          USING (
            COALESCE((auth.jwt() -> 'app_metadata' ->> 'user_role'), '') IN ('admin', 'super_admin')
          );
      `
    })

    if (error) {
      console.error('Erro ao criar tabela:', error)
      throw error
    }

    console.log('Tabela system_logs criada com sucesso!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabela system_logs criada com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
