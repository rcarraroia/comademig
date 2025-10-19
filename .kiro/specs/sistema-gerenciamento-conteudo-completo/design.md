# Design Document

## Overview

Este documento descreve o design técnico para implementar um sistema completo de gerenciamento de conteúdo dinâmico para o site COMADEMIG. O sistema será construído sobre a infraestrutura existente (React, TypeScript, Supabase) e seguirá os padrões já estabelecidos no projeto.

O design aborda 9 problemas críticos identificados, organizados em 5 fases de implementação, com foco em reutilização de código, consistência de padrões e manutenibilidade.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Public Pages │  │ Admin Panel  │  │   Hooks      │     │
│  │              │  │              │  │              │     │
│  │ - Home       │  │ - Content    │  │ - useContent │     │
│  │ - Noticias   │  │   Management │  │ - useNoticias│     │
│  │ - Multimidia │  │ - Editors    │  │ - useVideos  │     │
│  │ - Privacidade│  │              │  │ - useAlbuns  │     │
│  │ - Termos     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Supabase Client
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    SUPABASE (Backend)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │     │
│  │              │  │              │  │              │     │
│  │ - content_   │  │ - Images     │  │ - Users      │     │
│  │   management │  │ - Photos     │  │ - Roles      │     │
│  │ - noticias   │  │              │  │ - RLS        │     │
│  │ - videos     │  │              │  │              │     │
│  │ - albuns     │  │              │  │              │     │
│  │ - fotos      │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Admin edita conteúdo no painel
   ↓
2. Hook mutation envia dados para Supabase
   ↓
3. Supabase valida permissões (RLS)
   ↓
4. Dados são salvos no PostgreSQL
   ↓
5. React Query invalida cache
   ↓
6. Página pública recarrega dados automaticamente
   ↓
7. Visitante vê conteúdo atualizado
```

## Components and Interfaces

### Database Schema

#### Tabela: noticias (NOVA)
```sql
CREATE TABLE noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resumo TEXT NOT NULL,
  conteudo_completo TEXT NOT NULL,
  autor TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  categoria TEXT NOT NULL,
  imagem_url TEXT,
  visualizacoes INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_noticias_data ON noticias(data_publicacao DESC);
CREATE INDEX idx_noticias_categoria ON noticias(categoria);
CREATE INDEX idx_noticias_slug ON noticias(slug);
```

#### Tabela: videos (NOVA)
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url_youtube TEXT NOT NULL,
  duracao TEXT,
  categoria TEXT NOT NULL,
  thumbnail_url TEXT,
  data_publicacao DATE NOT NULL,
  visualizacoes INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_videos_data ON videos(data_publicacao DESC);
CREATE INDEX idx_videos_categoria ON videos(categoria);
```

#### Tabela: albuns_fotos (NOVA)
```sql
CREATE TABLE albuns_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  data_evento DATE NOT NULL,
  capa_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_albuns_data ON albuns_fotos(data_evento DESC);
```

#### Tabela: fotos (NOVA)
```sql
CREATE TABLE fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albuns_fotos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  legenda TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fotos_album ON fotos(album_id, ordem);
```

#### Atualização: content_management (EXISTENTE)
```sql
-- Adicionar novos registros para privacidade e termos
INSERT INTO content_management (page_name, content_json) VALUES
('privacidade', '{"titulo": "Política de Privacidade", "data_atualizacao": "2025-10-17", "secoes": []}'),
('termos', '{"titulo": "Termos de Uso", "data_atualizacao": "2025-10-17", "secoes": []}');
```

### TypeScript Interfaces

#### Notícias
```typescript
export interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo_completo: string;
  autor: string;
  data_publicacao: string;
  categoria: string;
  imagem_url?: string;
  visualizacoes: number;
  destaque: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoticiaFormData {
  titulo: string;
  resumo: string;
  conteudo_completo: string;
  autor: string;
  data_publicacao: string;
  categoria: string;
  imagem?: File;
  destaque: boolean;
  ativo: boolean;
}
```

#### Multimídia
```typescript
export interface Video {
  id: string;
  titulo: string;
  descricao?: string;
  url_youtube: string;
  duracao?: string;
  categoria: string;
  thumbnail_url?: string;
  data_publicacao: string;
  visualizacoes: number;
  destaque: boolean;
  ativo: boolean;
}

export interface AlbumFotos {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  data_evento: string;
  capa_url?: string;
  ativo: boolean;
  fotos?: Foto[];
}

export interface Foto {
  id: string;
  album_id: string;
  url: string;
  legenda?: string;
  ordem: number;
}
```

#### Páginas Legais
```typescript
export interface LegalSection {
  id: string;
  titulo: string;
  conteudo: string;
  itens?: string[];
  ordem: number;
}

export interface LegalContentData {
  titulo: string;
  data_atualizacao: string;
  secoes: LegalSection[];
}
```

### Custom Hooks

#### useNoticias
```typescript
export const useNoticias = (filters?: {
  categoria?: string;
  destaque?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['noticias', filters],
    queryFn: async () => {
      let query = supabase
        .from('noticias')
        .select('*')
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false });
      
      if (filters?.categoria) {
        query = query.eq('categoria', filters.categoria);
      }
      
      if (filters?.destaque !== undefined) {
        query = query.eq('destaque', filters.destaque);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Noticia[];
    }
  });
};
```

#### useVideos e useAlbuns
Similar ao useNoticias, com filtros específicos.

### React Components

#### Estrutura de Componentes

```
src/
├── pages/
│   ├── Home.tsx (ATUALIZAR)
│   ├── Noticias.tsx (ATUALIZAR)
│   ├── NoticiaDetalhes.tsx (NOVO)
│   ├── Multimidia.tsx (ATUALIZAR)
│   ├── AlbumDetalhes.tsx (NOVO)
│   ├── Privacidade.tsx (ATUALIZAR)
│   ├── Termos.tsx (ATUALIZAR)
│   └── dashboard/
│       ├── ContentManagement.tsx (ATUALIZAR)
│       ├── NoticiasContentEdit.tsx (NOVO)
│       ├── MultimidiaContentEdit.tsx (NOVO)
│       ├── PrivacidadeContentEdit.tsx (NOVO)
│       └── TermosContentEdit.tsx (NOVO)
├── components/
│   ├── layout/
│   │   └── Footer.tsx (ATUALIZAR - tornar dinâmico)
│   └── content/
│       ├── NoticiaCard.tsx (NOVO)
│       ├── VideoCard.tsx (NOVO)
│       └── AlbumCard.tsx (NOVO)
└── hooks/
    ├── useContent.ts (ATUALIZAR)
    ├── useNoticias.ts (NOVO)
    ├── useMultimidia.ts (NOVO)
    └── useContentMutation.ts (ATUALIZAR)
```

## Data Models

### Content Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CREATION                                                 │
│     Admin → Editor Form → Validation → Supabase             │
│                                                              │
│  2. STORAGE                                                  │
│     Supabase → PostgreSQL (data) + Storage (images)         │
│                                                              │
│  3. RETRIEVAL                                                │
│     Public Page → Hook → React Query Cache → Supabase       │
│                                                              │
│  4. UPDATE                                                   │
│     Admin → Editor Form → Mutation → Invalidate Cache       │
│                                                              │
│  5. DISPLAY                                                  │
│     Cache Update → Component Re-render → User Sees Change   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Image Upload Flow

```
1. User selects image in form
   ↓
2. Frontend validates (type, size)
   ↓
3. Generate unique filename
   ↓
4. Upload to Supabase Storage (bucket: content-images)
   ↓
5. Get public URL
   ↓
6. Save URL in database record
   ↓
7. Display image in page
```

## Error Handling

### Error Handling Strategy

1. **Network Errors**: Retry automático (3 tentativas) com backoff exponencial
2. **Validation Errors**: Exibir mensagens específicas no formulário
3. **Permission Errors**: Redirecionar para login ou exibir acesso negado
4. **Upload Errors**: Exibir mensagem e permitir nova tentativa
5. **Database Errors**: Log no console + toast de erro genérico

### Error Messages

```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  PERMISSION_DENIED: 'Você não tem permissão para esta ação.',
  VALIDATION_ERROR: 'Verifique os campos obrigatórios.',
  UPLOAD_ERROR: 'Erro ao fazer upload da imagem.',
  SAVE_ERROR: 'Erro ao salvar. Tente novamente.',
  LOAD_ERROR: 'Erro ao carregar dados.',
};
```

## Testing Strategy

### Unit Tests (Opcional)

- Testar hooks customizados (useNoticias, useVideos, etc)
- Testar funções de validação
- Testar transformações de dados

### Integration Tests (Opcional)

- Testar fluxo completo de criação de notícia
- Testar fluxo de upload de imagem
- Testar atualização de cache após mutation

### Manual Testing (Obrigatório)

**Fase 1 - Home:**
1. Verificar exibição de destaques
2. Verificar exibição de notícias recentes
3. Verificar rodapé dinâmico com dados corretos

**Fase 2 - Notícias:**
1. Criar notícia no painel admin
2. Verificar exibição na página /noticias
3. Acessar página individual da notícia
4. Editar notícia e verificar atualização
5. Deletar notícia e verificar remoção

**Fase 3 - Multimídia:**
1. Adicionar vídeo no painel admin
2. Criar álbum de fotos
3. Upload de múltiplas fotos
4. Verificar exibição na página /multimidia
5. Testar player de vídeo do YouTube

**Fase 4 - Privacidade/Termos:**
1. Editar seções no painel admin
2. Adicionar/remover seções
3. Verificar atualização automática da data
4. Verificar exibição nas páginas públicas
5. Confirmar rodapé único (não duplicado)

**Fase 5 - Painel Admin:**
1. Verificar listagem de todas as 8 páginas
2. Verificar badges de status corretos
3. Testar navegação para editores
4. Verificar estatísticas
5. Testar permissões (admin vs não-admin)

## Performance Considerations

### Optimization Strategies

1. **React Query Caching**: Cache de 5 minutos para conteúdo público
2. **Image Optimization**: Usar OptimizedImage component existente
3. **Lazy Loading**: Carregar imagens sob demanda
4. **Pagination**: Limitar notícias/vídeos por página (10-20 itens)
5. **Database Indexes**: Índices em campos de busca e ordenação

### Caching Strategy

```typescript
// Configuração de cache por tipo de conteúdo
const CACHE_CONFIG = {
  staticContent: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  },
  dynamicContent: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
  },
  userContent: {
    staleTime: 0, // Sempre refetch
    cacheTime: 1 * 60 * 1000, // 1 minuto
  },
};
```

## Security Considerations

### Row Level Security (RLS) Policies

```sql
-- Notícias: Leitura pública, escrita apenas admin
CREATE POLICY "Notícias são públicas" ON noticias
  FOR SELECT USING (ativo = true);

CREATE POLICY "Apenas admins podem criar notícias" ON noticias
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Apenas admins podem atualizar notícias" ON noticias
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Políticas similares para videos, albuns_fotos, fotos
```

### Input Validation

```typescript
// Validação de formulário com Zod
const noticiaSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200),
  resumo: z.string().min(20, 'Resumo deve ter no mínimo 20 caracteres').max(500),
  conteudo_completo: z.string().min(50, 'Conteúdo deve ter no mínimo 50 caracteres'),
  autor: z.string().min(3, 'Nome do autor é obrigatório'),
  data_publicacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  categoria: z.enum(['institucional', 'social', 'educacao', 'eventos', 'evangelismo', 'familia']),
  imagem: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 5 * 1024 * 1024,
    'Imagem deve ter no máximo 5MB'
  ).refine(
    (file) => !file || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Apenas imagens JPEG, PNG ou WebP são permitidas'
  ),
});
```

### File Upload Security

1. Validar tipo de arquivo (apenas imagens)
2. Validar tamanho máximo (5MB)
3. Gerar nomes únicos para evitar sobrescrita
4. Usar bucket público apenas para imagens aprovadas
5. Implementar rate limiting no Supabase

## Migration Strategy

### Phase 1: Home Fixes (1.5 horas)
- Ajustar mapeamento de campos em Home.tsx
- Criar/atualizar Footer dinâmico
- Testar exibição

### Phase 2: Notícias (4-6 horas)
- Criar tabela noticias
- Criar hooks e mutations
- Atualizar página Noticias.tsx
- Criar NoticiaDetalhes.tsx
- Criar NoticiasContentEdit.tsx
- Adicionar rotas
- Testar CRUD completo

### Phase 3: Multimídia (5-7 horas)
- Criar tabelas videos, albuns_fotos, fotos
- Criar hooks e mutations
- Atualizar página Multimidia.tsx
- Criar AlbumDetalhes.tsx
- Criar MultimidiaContentEdit.tsx
- Adicionar rotas
- Testar CRUD completo

### Phase 4: Privacidade/Termos (7-8 horas)
- Criar registros no content_management
- Criar hooks específicos
- Atualizar páginas Privacidade.tsx e Termos.tsx
- Criar editores admin
- Corrigir rodapé duplicado
- Adicionar ao ContentManagement
- Testar CRUD completo

### Phase 5: Finalizações (0.5 hora)
- Atualizar ContentManagement com todas as páginas
- Verificar badges de status
- Testar permissões
- Validação final

## Rollback Plan

Em caso de problemas durante a implementação:

1. **Fase 1**: Reverter alterações em Home.tsx e Footer.tsx
2. **Fase 2**: Remover tabela noticias e arquivos relacionados
3. **Fase 3**: Remover tabelas de multimídia e arquivos relacionados
4. **Fase 4**: Remover registros de privacidade/termos e reverter páginas
5. **Fase 5**: Reverter ContentManagement.tsx

Todas as migrações devem incluir scripts de rollback.

## Dependencies

### Existing Dependencies (Already Installed)
- React 18
- TypeScript
- React Router DOM v6
- TanStack Query (React Query) v5
- React Hook Form
- Zod
- Supabase Client
- Tailwind CSS
- shadcn/ui components

### No New Dependencies Required
Todas as funcionalidades serão implementadas usando as bibliotecas já existentes no projeto.

## Conclusion

Este design fornece uma solução completa e escalável para o sistema de gerenciamento de conteúdo da COMADEMIG. A implementação seguirá os padrões existentes do projeto, garantindo consistência e manutenibilidade.

O sistema permitirá que administradores gerenciem todo o conteúdo do site de forma autônoma, sem necessidade de alterações no código, atendendo aos requisitos de conformidade LGPD e proporcionando uma experiência profissional tanto para administradores quanto para visitantes do site.
