
-- Criar extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis (estende auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  data_nascimento DATE,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  igreja TEXT,
  cargo TEXT,
  data_ordenacao DATE,
  status TEXT DEFAULT 'pendente',
  tipo_membro TEXT DEFAULT 'membro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Tabela de eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  imagem_url TEXT,
  preco DECIMAL(10,2),
  vagas INTEGER,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de inscrições em eventos
CREATE TABLE public.inscricoes_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  evento_id UUID REFERENCES public.eventos(id) NOT NULL,
  status TEXT DEFAULT 'pendente',
  valor_pago DECIMAL(10,2),
  data_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, evento_id)
);

-- Tabela de notícias
CREATE TABLE public.noticias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  imagem_url TEXT,
  autor_id UUID REFERENCES public.profiles(id),
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'publicado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de multimídia
CREATE TABLE public.multimidia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('video', 'audio', 'imagem')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'publicado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de financeiro
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensalidade', 'anuidade', 'doacao', 'evento')),
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pendente',
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de certidões
CREATE TABLE public.certidoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('filiacao', 'ordenacao', 'regularidade')),
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_validade TIMESTAMP WITH TIME ZONE,
  documento_url TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remetente_id UUID REFERENCES public.profiles(id) NOT NULL,
  destinatario_id UUID REFERENCES public.profiles(id),
  assunto TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de suporte
CREATE TABLE public.suporte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  assunto TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT DEFAULT 'aberto',
  prioridade TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens de suporte
CREATE TABLE public.suporte_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suporte_id UUID REFERENCES public.suporte(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimidia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certidoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suporte_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para eventos (públicos para leitura)
CREATE POLICY "Eventos ativos são públicos" ON public.eventos
  FOR SELECT USING (status = 'ativo');

-- Políticas para inscrições em eventos
CREATE POLICY "Usuários podem ver suas próprias inscrições" ON public.inscricoes_eventos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias inscrições" ON public.inscricoes_eventos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias inscrições" ON public.inscricoes_eventos
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para notícias (públicas para leitura)
CREATE POLICY "Notícias publicadas são públicas" ON public.noticias
  FOR SELECT USING (status = 'publicado');

-- Políticas para multimídia (públicas para leitura)
CREATE POLICY "Multimídia publicada é pública" ON public.multimidia
  FOR SELECT USING (status = 'publicado');

-- Políticas para financeiro
CREATE POLICY "Usuários podem ver seus próprios registros financeiros" ON public.financeiro
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios registros financeiros" ON public.financeiro
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios registros financeiros" ON public.financeiro
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para certidões
CREATE POLICY "Usuários podem ver suas próprias certidões" ON public.certidoes
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para mensagens
CREATE POLICY "Usuários podem ver mensagens enviadas ou recebidas" ON public.mensagens
  FOR SELECT USING (auth.uid() = remetente_id OR auth.uid() = destinatario_id);

CREATE POLICY "Usuários podem enviar mensagens" ON public.mensagens
  FOR INSERT WITH CHECK (auth.uid() = remetente_id);

CREATE POLICY "Usuários podem atualizar mensagens que receberam" ON public.mensagens
  FOR UPDATE USING (auth.uid() = destinatario_id);

-- Políticas para suporte
CREATE POLICY "Usuários podem ver seus próprios tickets de suporte" ON public.suporte
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios tickets de suporte" ON public.suporte
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios tickets de suporte" ON public.suporte
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para mensagens de suporte
CREATE POLICY "Usuários podem ver mensagens de seus tickets" ON public.suporte_mensagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suporte 
      WHERE id = suporte_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar mensagens em seus tickets" ON public.suporte_mensagens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suporte 
      WHERE id = suporte_id AND user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', false),
('eventos', 'eventos', true),
('comprovantes', 'comprovantes', false),
('documentos', 'documentos', false),
('multimidia', 'multimidia', true);

-- Políticas de storage para avatars
CREATE POLICY "Usuários podem ver seus próprios avatares" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Usuários podem fazer upload de seus próprios avatares" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas de storage para eventos (públicos)
CREATE POLICY "Qualquer pessoa pode ver imagens de eventos" ON storage.objects
  FOR SELECT USING (bucket_id = 'eventos');

-- Políticas de storage para comprovantes
CREATE POLICY "Usuários podem ver seus próprios comprovantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Usuários podem fazer upload de seus próprios comprovantes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comprovantes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas de storage para documentos
CREATE POLICY "Usuários podem ver seus próprios documentos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Políticas de storage para multimídia (públicos)
CREATE POLICY "Qualquer pessoa pode ver conteúdo multimídia" ON storage.objects
  FOR SELECT USING (bucket_id = 'multimidia');
