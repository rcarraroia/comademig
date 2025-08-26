import { supabase } from '@/integrations/supabase/client';

export const runContentManagementMigration = async () => {
  try {
    // Criar tabela para gerenciamento de conteúdo
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Criar tabela para gerenciamento de conteúdo
        CREATE TABLE IF NOT EXISTS public.content_management (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          page_name TEXT NOT NULL UNIQUE,
          content_json JSONB NOT NULL DEFAULT '{}',
          last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_updated_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Habilitar RLS
        ALTER TABLE public.content_management ENABLE ROW LEVEL SECURITY;
      `
    });

    if (tableError) {
      console.error('Erro ao criar tabela:', tableError);
      return { success: false, error: tableError };
    }

    // Criar políticas RLS
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Policy para admins gerenciarem conteúdo
        DROP POLICY IF EXISTS "Admins can manage content" ON public.content_management;
        CREATE POLICY "Admins can manage content" ON public.content_management
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'::app_role
          )
        );

        -- Policy para leitura pública
        DROP POLICY IF EXISTS "Public can read content" ON public.content_management;
        CREATE POLICY "Public can read content" ON public.content_management
        FOR SELECT TO anon, authenticated
        USING (true);
      `
    });

    if (policyError) {
      console.error('Erro ao criar políticas:', policyError);
      return { success: false, error: policyError };
    }

    // Inserir dados iniciais
    const { error: insertError } = await supabase
      .from('content_management')
      .upsert([
        { page_name: 'home', content_json: { title: 'Início', description: 'Página inicial do site' } },
        { page_name: 'about', content_json: { title: 'Sobre', description: 'Informações sobre a COMADEMIG' } },
        { page_name: 'leadership', content_json: { title: 'Liderança', description: 'Nossa liderança' } },
        { page_name: 'news', content_json: { title: 'Notícias', description: 'Últimas notícias' } },
        { page_name: 'events', content_json: { title: 'Eventos', description: 'Eventos da COMADEMIG' } },
        { page_name: 'multimedia', content_json: { title: 'Multimídia', description: 'Conteúdo multimídia' } },
        { page_name: 'contact', content_json: { title: 'Contato', description: 'Entre em contato conosco' } }
      ], { 
        onConflict: 'page_name',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Erro ao inserir dados:', insertError);
      return { success: false, error: insertError };
    }

    // Criar função e trigger para timestamp
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Função para atualizar timestamp automaticamente
        CREATE OR REPLACE FUNCTION update_content_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.last_updated_at = now();
          NEW.last_updated_by = auth.uid();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Trigger para atualizar timestamp
        DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
        CREATE TRIGGER update_content_management_timestamp
          BEFORE UPDATE ON public.content_management
          FOR EACH ROW
          EXECUTE FUNCTION update_content_timestamp();
      `
    });

    if (functionError) {
      console.error('Erro ao criar função/trigger:', functionError);
      return { success: false, error: functionError };
    }

    console.log('Migração executada com sucesso!');
    return { success: true };

  } catch (error) {
    console.error('Erro na migração:', error);
    return { success: false, error };
  }
};