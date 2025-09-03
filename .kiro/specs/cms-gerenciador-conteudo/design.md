# Design Document - CMS Gerenciador de Conteúdo

## Overview

O sistema de Gerenciamento de Conteúdo (CMS) da COMADEMIG permite que administradores editem dinamicamente o conteúdo das páginas públicas do site através de uma interface administrativa intuitiva. O sistema utiliza uma arquitetura baseada em hooks React, cache inteligente e armazenamento no Supabase.

## Architecture

### Arquitetura Geral
```
Frontend (React) ↔ Hooks (TanStack Query) ↔ Supabase (PostgreSQL + Storage)
```

### Componentes Principais
- **Páginas Públicas**: Consomem conteúdo via hooks específicos
- **Editores Administrativos**: Interfaces para edição de conteúdo
- **Sistema de Hooks**: Gerencia estado, cache e comunicação com API
- **Banco de Dados**: Tabela `content_management` centralizada
- **Storage**: Supabase Storage para imagens

## Components and Interfaces

### 1. Sistema de Hooks Unificado

#### Hook Base: `useContent(pageName)`
```typescript
interface ContentData {
  page_name: string;
  content_json: any;
  last_updated_at?: string;
}

const useContent = (pageName: string) => {
  return useQuery({
    queryKey: ['content', pageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_management')
        .select('page_name, content_json, last_updated_at, created_at')
        .eq('page_name', pageName)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ContentData | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
```

#### Hooks Específicos por Página
- `useHomeContent()` - Página inicial
- `useAboutContent()` - Página sobre
- `useLeadershipContent()` - Página liderança
- `useContactContent()` - Página contato

#### Hook de Mutação: `useUpdateContent()`
```typescript
const useUpdateContent = () => {
  return useMutation({
    mutationFn: async ({ pageName, content }) => {
      const { data, error } = await supabase
        .from('content_management')
        .update({
          content_json: content,
          last_updated_at: new Date().toISOString()
        })
        .eq('page_name', pageName)
        .select('page_name, content_json, last_updated_at');
      
      if (error) throw error;
      return data?.[0] || data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content', variables.pageName] });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    }
  });
};
```

### 2. Estrutura de Dados por Página

#### Home (Página Inicial)
```typescript
interface HomeContentData {
  banner_principal: {
    titulo_principal: string;
    subtitulo: string;
    texto_botao: string;
    link_botao: string;
  };
  cards_acao: Array<{
    titulo: string;
    descricao: string;
    link_botao: string;
  }>;
  destaques_convencao: Array<{
    titulo_evento: string;
    imagem_evento: string;
    subtitulo: string;
    link_evento: string;
  }>;
  noticias_recentes: Array<{
    titulo_noticia: string;
    imagem_noticia: string;
    data_noticia: string;
    resumo_noticia: string;
    link_noticia: string;
  }>;
  junte_se_missao: {
    titulo_principal: string;
    subtitulo: string;
    texto_botao: string;
    link_botao: string;
  };
}
```

#### About (Sobre)
```typescript
interface AboutContentData {
  titulo: string;
  descricao: string;
  missao: {
    titulo: string;
    texto: string;
  };
  visao: {
    titulo: string;
    texto: string;
  };
  historia: {
    titulo: string;
    texto: string;
  };
}
```

#### Leadership (Liderança)
```typescript
interface LeadershipContentData {
  titulo: string;
  descricao: string;
  lideres: Array<{
    nome: string;
    cargo: string;
    foto_url: string;
    telefone: string;
    email: string;
    ordem: number;
  }>;
}
```

#### Contact (Contato)
```typescript
interface ContactContentData {
  titulo: string;
  descricao: string;
  endereco: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefones: Array<{
    tipo: string;
    numero: string;
  }>;
  emails: Array<{
    tipo: string;
    email: string;
  }>;
  horario_funcionamento: {
    dias: string;
    horario: string;
  };
}
```

### 3. Componentes de Interface

#### ContentManagementList
- Lista todas as páginas editáveis
- Mostra status (customizado/padrão)
- Links para editores específicos

#### Editores Específicos
- `HomeContentEdit` - ✅ Já implementado
- `AboutContentEdit` - A implementar
- `LeadershipContentEdit` - A implementar
- `ContactContentEdit` - A implementar

#### Componentes Compartilhados
- `ImageUpload` - Upload de imagens com validação
- `ContentFormLayout` - Layout padrão para editores
- `SaveButton` - Botão de salvar com estados de loading
- `ContentPreview` - Preview das alterações

### 4. Sistema de Upload de Imagens

#### Componente ImageUpload
```typescript
interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  section: string;
  index?: number;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  section,
  index = 0,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  // Implementação do upload
};
```

#### Validações
- Formato: JPG, PNG, WebP
- Tamanho máximo: 5MB
- Redimensionamento automático se necessário
- Compressão para otimização

## Data Models

### Tabela content_management
```sql
CREATE TABLE public.content_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Bucket content-images (Supabase Storage)
- Estrutura: `/{page_name}/{section}/{timestamp}.{ext}`
- Exemplo: `/home/destaques/1709123456789.jpg`
- Políticas: Leitura pública, escrita apenas para admins

## Error Handling

### Estratégias de Tratamento de Erro

#### 1. Erro de Carregamento
```typescript
if (error) {
  return (
    <div className="error-container">
      <p>Erro ao carregar conteúdo</p>
      <Button onClick={() => refetch()}>Tentar Novamente</Button>
    </div>
  );
}
```

#### 2. Erro de Salvamento
```typescript
onError: (error) => {
  toast({
    title: "Erro ao salvar",
    description: error.message || "Erro inesperado",
    variant: "destructive",
  });
}
```

#### 3. Fallback Gracioso
- Conteúdo padrão quando não há customização
- Skeleton loading durante carregamento
- Retry automático em caso de falha de rede

### Tipos de Erro
- **Validação**: Campos obrigatórios, formatos inválidos
- **Rede**: Timeout, conexão perdida
- **Permissão**: Usuário não autorizado
- **Servidor**: Erro interno do Supabase

## Testing Strategy

### 1. Testes Unitários
- Hooks customizados
- Componentes de formulário
- Validações de dados
- Upload de imagens

### 2. Testes de Integração
- Fluxo completo de edição
- Cache e invalidação
- Comunicação com Supabase

### 3. Testes E2E
- Jornada completa do administrador
- Edição de cada tipo de página
- Upload de imagens
- Visualização das alterações

### 4. Testes de Performance
- Tempo de carregamento das páginas
- Eficiência do cache
- Otimização de imagens

## Security Considerations

### 1. Autenticação e Autorização
- Apenas usuários com role 'admin' podem editar
- Verificação de permissões em cada operação
- Tokens JWT válidos obrigatórios

### 2. Validação de Dados
- Sanitização de inputs
- Validação de tipos de arquivo
- Limite de tamanho de upload
- Escape de HTML em conteúdo dinâmico

### 3. Políticas RLS (Row Level Security)
```sql
-- Leitura pública
CREATE POLICY "Public can read content" ON content_management
FOR SELECT TO anon, authenticated USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Admins can manage content" ON content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

## Performance Optimizations

### 1. Cache Strategy
- **Stale Time**: 5 minutos para conteúdo
- **GC Time**: 10 minutos para limpeza
- **Background Refetch**: Revalidação automática
- **Invalidação**: Após mutações bem-sucedidas

### 2. Image Optimization
- Compressão automática
- Formatos modernos (WebP)
- Lazy loading nas páginas públicas
- CDN via Supabase Storage

### 3. Bundle Optimization
- Code splitting por página
- Lazy loading de editores
- Tree shaking de dependências não utilizadas

## Deployment Considerations

### 1. Migrations
- Estrutura da tabela já existe
- Triggers corrigidos para `last_updated_at`
- Políticas RLS configuradas

### 2. Environment Variables
- URLs do Supabase
- Chaves de API
- Configurações de storage

### 3. Monitoring
- Logs de erro no Supabase
- Métricas de performance
- Alertas para falhas críticas

## Future Enhancements

### 1. Versioning
- Histórico de alterações
- Rollback para versões anteriores
- Comparação entre versões

### 2. Preview Mode
- Visualização antes de publicar
- Modo de rascunho
- Agendamento de publicações

### 3. Multi-language Support
- Conteúdo em múltiplos idiomas
- Interface de tradução
- Fallback para idioma padrão

### 4. Advanced Media Management
- Galeria de imagens
- Reutilização de assets
- Otimização automática
- Metadados de imagens