# 🔍 DIAGNÓSTICO COMPLETO: Problemas de Gerenciamento de Conteúdo - COMADEMIG

**Data:** 17/10/2025  
**Analista:** Kiro AI  
**Status:** ⚠️ MÚLTIPLOS PROBLEMAS IDENTIFICADOS

---

## 📋 RESUMO EXECUTIVO

Foram identificados **9 problemas principais** no sistema de gerenciamento de conteúdo:

### Problemas na Home:
1. ❌ **Destaques da Convenção** - Não aparecem (mapeamento incorreto)
2. ❌ **Notícias Recentes** - Não aparecem (mapeamento incorreto)
3. ❌ **Dados de Contato no Rodapé** - Não implementado

### Problemas em Outras Páginas:
4. ❌ **Rodapé Duplicado** - Páginas `/privacidade` e `/termos`
5. ❌ **Página Notícias** - Conteúdo estático, sem gerenciamento dinâmico
6. ❌ **Página Multimídia** - Conteúdo estático, sem gerenciamento dinâmico
7. ❌ **Falta de Editores** - Notícias e Multimídia sem painel admin
8. ❌ **Página Privacidade** - Conteúdo hardcoded, sem gerenciamento dinâmico
9. ❌ **Página Termos** - Conteúdo hardcoded, sem gerenciamento dinâmico

---

## 🔎 ANÁLISE DETALHADA

### 1. DESTAQUES DA CONVENÇÃO

**Status:** ✅ FUNCIONANDO CORRETAMENTE

**Dados no Banco:**
```json
"destaques_convencao": [
  {
    "subtitulo": "Estamos testando os destaques",
    "link_evento": "https://www.facebook.com/comademig.comademig",
    "imagem_evento": "https://amkelczfwazutrciqtlk.supabase.co/storage/v1/object/public/content-images/test_1760554440490_asamls.png",
    "titulo_evento": "Teste de Destaque"
  }
]
```

**Código na Home (src/pages/Home.tsx):**
```typescript
{content.destaques_convencao && content.destaques_convencao?.length > 0 && (
  <section className="py-16 bg-white">
    {content.destaques_convencao?.map((destaque: any, index: number) => (
      <Card key={index}>
        <OptimizedImage src={destaque.imagem} alt={destaque.titulo} />
        <CardTitle>{destaque.titulo}</CardTitle>
        <CardDescription>{destaque.descricao}</CardDescription>
      </Card>
    ))}
  </section>
)}
```

**PROBLEMA IDENTIFICADO:**
- ❌ **Mapeamento incorreto de campos**
- Banco usa: `titulo_evento`, `subtitulo`, `imagem_evento`, `link_evento`
- Código espera: `titulo`, `descricao`, `imagem`, `link`

**IMPACTO:** Seção não aparece porque os campos não correspondem.

---

### 2. NOTÍCIAS RECENTES

**Status:** ✅ FUNCIONANDO CORRETAMENTE

**Dados no Banco:**
```json
"noticias_recentes": [
  {
    "data_noticia": "2025-10-15",
    "link_noticia": "https://www.facebook.com/comademig.comademig",
    "imagem_noticia": "https://amkelczfwazutrciqtlk.supabase.co/storage/v1/object/public/content-images/test_1760554401886_pn93cd.png",
    "resumo_noticia": "teste de noticias no site",
    "titulo_noticia": "Noticia Teste"
  }
]
```

**Código na Home:**
```typescript
{content.noticias_recentes && content.noticias_recentes?.length > 0 && (
  <section className="py-16 bg-comademig-light">
    {content.noticias_recentes?.slice(0, 3).map((noticia: any, index: number) => (
      <Card key={index}>
        <OptimizedImage src={noticia.imagem} alt={noticia.titulo} />
        <CardTitle>{noticia.titulo}</CardTitle>
        <CardDescription>{noticia.resumo}</CardDescription>
      </Card>
    ))}
  </section>
)}
```

**PROBLEMA IDENTIFICADO:**
- ❌ **Mapeamento incorreto de campos**
- Banco usa: `titulo_noticia`, `resumo_noticia`, `imagem_noticia`, `link_noticia`, `data_noticia`
- Código espera: `titulo`, `resumo`, `imagem`, `link`, `data`

**IMPACTO:** Seção não aparece porque os campos não correspondem.

---

### 3. DADOS DE CONTATO NO RODAPÉ

**Status:** ❌ NÃO IMPLEMENTADO

**Dados no Banco (página 'contato'):**
```json
{
  "titulo": "Entre em Contato",
  "descricao": "Estamos aqui para ajudar você",
  "endereco": {
    "rua": "Rua Serra do Mar, 910",
    "cidade": "Ipatinga",
    "estado": "MG",
    "cep": "35164-238"
  },
  "telefones": [
    {
      "tipo": "Principal",
      "numero": "+55 31 9413-0040"
    },
    {
      "tipo": "WhatsApp",
      "numero": "+55 31 9413-0040"
    }
  ],
  "emails": [
    {
      "tipo": "Geral",
      "email": "contato@comademig.org.br"
    },
    {
      "tipo": "Secretaria",
      "email": "secretaria@comademig.org.br"
    }
  ]
}
```

**Código na Home:**
- ❌ **NÃO EXISTE RODAPÉ NA HOME**
- ❌ **NÃO HÁ IMPORTAÇÃO DO HOOK `useContactContent`**
- ❌ **NÃO HÁ SEÇÃO DE CONTATO NO FINAL DA PÁGINA**

**IMPACTO:** Dados de contato não aparecem em lugar nenhum da Home.

---

## 🎯 CAUSA RAIZ DOS PROBLEMAS

### Problema 1 e 2: Inconsistência de Nomenclatura

**Painel Admin salva com sufixos:**
- `titulo_evento`, `imagem_evento`, `link_evento`
- `titulo_noticia`, `imagem_noticia`, `link_noticia`

**Home espera sem sufixos:**
- `titulo`, `imagem`, `link`
- `titulo`, `imagem`, `link`

### Problema 3: Funcionalidade Não Implementada

- Rodapé com dados dinâmicos nunca foi criado
- Home não tem seção de contato no final
- Não há componente Footer sendo usado

---

## ✅ SOLUÇÕES PROPOSTAS

### Solução 1: Corrigir Mapeamento de Campos na Home

**Opção A - Ajustar código da Home (RECOMENDADO):**
```typescript
// Para Destaques
{content.destaques_convencao?.map((destaque: any, index: number) => (
  <Card key={index}>
    <OptimizedImage 
      src={destaque.imagem_evento}  // ← Corrigir
      alt={destaque.titulo_evento}  // ← Corrigir
    />
    <CardTitle>{destaque.titulo_evento}</CardTitle>  // ← Corrigir
    <CardDescription>{destaque.subtitulo}</CardDescription>  // ← Corrigir
    <Link to={destaque.link_evento}>Saiba Mais</Link>  // ← Corrigir
  </Card>
))}

// Para Notícias
{content.noticias_recentes?.map((noticia: any, index: number) => (
  <Card key={index}>
    <OptimizedImage 
      src={noticia.imagem_noticia}  // ← Corrigir
      alt={noticia.titulo_noticia}  // ← Corrigir
    />
    <CardTitle>{noticia.titulo_noticia}</CardTitle>  // ← Corrigir
    <CardDescription>{noticia.resumo_noticia}</CardDescription>  // ← Corrigir
    <Link to={noticia.link_noticia}>Ler Mais</Link>  // ← Corrigir
    <span>{new Date(noticia.data_noticia).toLocaleDateString('pt-BR')}</span>  // ← Corrigir
  </Card>
))}
```

**Opção B - Ajustar painel admin:**
- Remover sufixos `_evento` e `_noticia`
- Usuário teria que preencher novamente

**RECOMENDAÇÃO:** Opção A (ajustar código da Home) para não perder dados já cadastrados.

---

### Solução 2: Implementar Rodapé com Dados Dinâmicos

**Criar componente Footer:**
```typescript
// src/components/layout/Footer.tsx
import { useContactContent } from "@/hooks/useContent";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Footer = () => {
  const { content } = useContactContent();
  
  return (
    <footer className="bg-comademig-blue text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Endereço */}
          <div>
            <h3 className="font-bold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Endereço
            </h3>
            <p>{content.endereco.rua}</p>
            <p>{content.endereco.cidade} - {content.endereco.estado}</p>
            <p>CEP: {content.endereco.cep}</p>
          </div>
          
          {/* Contato */}
          <div>
            <h3 className="font-bold mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Telefones
            </h3>
            {content.telefones.map((tel, i) => (
              <p key={i}>{tel.tipo}: {tel.numero}</p>
            ))}
            
            <h3 className="font-bold mt-4 mb-2 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              E-mails
            </h3>
            {content.emails.map((email, i) => (
              <p key={i}>{email.tipo}: {email.email}</p>
            ))}
          </div>
          
          {/* Horário */}
          <div>
            <h3 className="font-bold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Horário de Funcionamento
            </h3>
            <p>{content.horario_funcionamento.dias}</p>
            <p>{content.horario_funcionamento.horario}</p>
            {content.horario_funcionamento.observacoes && (
              <p className="text-sm mt-2">{content.horario_funcionamento.observacoes}</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
```

**Adicionar na Home:**
```typescript
// src/pages/Home.tsx
import { Footer } from "@/components/layout/Footer";

// No final do componente, antes do </div> final:
<Footer />
```

---

## 📊 RESUMO EXECUTIVO

| Problema | Status Atual | Causa | Solução | Prioridade |
|----------|--------------|-------|---------|------------|
| Destaques da Convenção | ❌ Não aparece | Mapeamento incorreto de campos | Ajustar nomes dos campos na Home | 🔴 Alta |
| Notícias Recentes | ❌ Não aparece | Mapeamento incorreto de campos | Ajustar nomes dos campos na Home | 🔴 Alta |
| Rodapé com Contato | ❌ Não existe | Funcionalidade não implementada | Criar componente Footer | 🔴 Alta |

---

## ⏭️ PRÓXIMOS PASSOS

1. **AGUARDAR AUTORIZAÇÃO** para implementar correções
2. Ajustar mapeamento de campos na Home (Destaques e Notícias)
3. Criar componente Footer com dados dinâmicos
4. Testar todas as seções na Home
5. Validar com o usuário

---

## 📝 OBSERVAÇÕES IMPORTANTES

- ✅ Dados estão salvos corretamente no banco
- ✅ Painel admin está funcionando perfeitamente
- ❌ Problema está apenas na exibição (mapeamento de campos)
- ⚠️ Não há perda de dados - apenas ajuste de código necessário

---

**FIM DO DIAGNÓSTICO**


---

## 🔎 ANÁLISE DETALHADA - PROBLEMAS ADICIONAIS

### 4. RODAPÉ DUPLICADO (Privacidade e Termos)

**Status:** ❌ PROBLEMA CONFIRMADO

**Páginas Afetadas:**
- `/privacidade` (src/pages/Privacidade.tsx)
- `/termos` (src/pages/Termos.tsx)

**Causa Raiz:**
Ambas as páginas usam o componente `<Layout>` que já inclui o `<Footer>`, mas as páginas têm conteúdo estático hardcoded que pode estar causando duplicação visual.

**Estrutura Atual:**
```typescript
// src/pages/Privacidade.tsx e Termos.tsx
import Layout from '@/components/Layout';

export default function Privacidade() {
  return (
    <Layout>  {/* ← Já inclui Header + Footer */}
      <div className="container mx-auto py-8 px-4">
        <Card>
          {/* Conteúdo da página */}
        </Card>
      </div>
    </Layout>  {/* ← Footer é renderizado aqui */}
  );
}
```

**Componente Layout:**
```typescript
// src/components/Layout.tsx
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />  {/* ← Footer único aqui */}
    </div>
  );
};
```

**Análise:**
- Layout está correto (1 Footer apenas)
- Problema pode ser visual/CSS causando aparência de duplicação
- Ou pode haver Footer adicional sendo renderizado em outro lugar

**Solução:**
1. Verificar se há CSS causando espaçamento duplicado
2. Inspecionar DOM no navegador para confirmar duplicação real
3. Se confirmado, remover Footer extra

---

### 5. PÁGINA NOTÍCIAS - SEM GERENCIAMENTO DINÂMICO

**Status:** ❌ CONTEÚDO ESTÁTICO

**Página:** `/noticias` (src/pages/Noticias.tsx)

**Problema Identificado:**
- Página existe e está implementada
- Conteúdo é **HARDCODED** (estático no código)
- Não há integração com banco de dados
- Não há painel admin para gerenciar notícias

**Conteúdo Atual:**
```typescript
// src/pages/Noticias.tsx
const noticias = [
  {
    id: 1,
    titulo: "Nova Diretoria da COMADEMIG é Empossada",
    resumo: "Cerimônia de posse...",
    autor: "Pastor João Silva",
    data: "2 de Dezembro de 2024",
    categoria: "institucional",
    // ... mais campos hardcoded
  },
  // ... 5 notícias mais (todas estáticas)
];
```

**O que está faltando:**
1. ❌ Tabela `noticias` no banco de dados
2. ❌ Hook `useNoticias` para buscar dados
3. ❌ Painel admin para criar/editar notícias
4. ❌ Upload de imagens para notícias
5. ❌ Sistema de categorias dinâmico
6. ❌ Paginação de notícias
7. ❌ Página individual de notícia (`/noticias/:id`)

**Painel Admin:**
- Existe arquivo `src/pages/dashboard/NoticiasContentEdit.tsx`
- Mas está marcado como "Não Implementado" no ContentManagement
- Precisa ser desenvolvido completamente

---

### 6. PÁGINA MULTIMÍDIA - SEM GERENCIAMENTO DINÂMICO

**Status:** ❌ CONTEÚDO ESTÁTICO

**Página:** `/multimidia` (src/pages/Multimidia.tsx)

**Problema Identificado:**
- Página existe e está implementada
- Conteúdo é **HARDCODED** (estático no código)
- Não há integração com banco de dados
- Não há painel admin para gerenciar multimídia

**Conteúdo Atual:**
```typescript
// src/pages/Multimidia.tsx
const videos = [
  {
    id: 1,
    titulo: "Congresso Estadual 2024 - Dia 1",
    descricao: "Abertura do Congresso...",
    duracao: "2h 30min",
    visualizacoes: 1250,
    // ... mais campos hardcoded
  },
  // ... 5 vídeos mais (todos estáticos)
];

const fotos = [
  {
    id: 1,
    titulo: "Congresso Estadual 2024",
    quantidade: 45,
    // ... mais campos hardcoded
  },
  // ... 3 álbuns mais (todos estáticos)
];
```

**O que está faltando:**
1. ❌ Tabela `videos` no banco de dados
2. ❌ Tabela `albuns_fotos` no banco de dados
3. ❌ Hook `useMultimidia` para buscar dados
4. ❌ Painel admin para gerenciar vídeos/fotos
5. ❌ Integração com YouTube/Vimeo para vídeos
6. ❌ Upload de fotos para álbuns
7. ❌ Sistema de categorias dinâmico
8. ❌ Player de vídeo integrado

**Painel Admin:**
- Existe arquivo `src/pages/dashboard/MultimidiaContentEdit.tsx`
- Mas está marcado como "Não Implementado" no ContentManagement
- Precisa ser desenvolvido completamente

---

### 7. FALTA DE EDITORES NO PAINEL ADMIN

**Status:** ❌ EDITORES NÃO IMPLEMENTADOS

**Painel de Gerenciamento de Conteúdo:**
- Localização: `/dashboard/content` (src/pages/dashboard/ContentManagement.tsx)
- Status atual: Mostra 4 páginas implementadas, 2 não implementadas

**Páginas Implementadas (com editor):**
1. ✅ Início (Home)
2. ✅ Sobre
3. ✅ Liderança
4. ✅ Contato

**Páginas NÃO Implementadas (sem editor):**
1. ❌ Notícias - Badge "Não Implementado" (vermelho)
2. ❌ Multimídia - Badge "Não Implementado" (vermelho)

**Código do ContentManagement:**
```typescript
{ 
  name: "Notícias", 
  key: "noticias", 
  description: "Notícias, comunicados e atualizações importantes",
  hasCustomContent: false,
  publicUrl: "/noticias",
  editorUrl: "/dashboard/admin/content/noticias-editor",
  icon: Newspaper,
  priority: "média",
  status: "não implementado",
  implemented: false  // ← Marcado como não implementado
},
{ 
  name: "Multimídia", 
  key: "multimidia", 
  description: "Galeria de fotos, vídeos e materiais visuais",
  hasCustomContent: false,
  publicUrl: "/multimidia",
  editorUrl: "/dashboard/admin/content/multimidia-editor",
  icon: Camera,
  priority: "baixa",
  status: "não implementado",
  implemented: false  // ← Marcado como não implementado
}
```

**Impacto:**
- Admin não consegue gerenciar notícias pelo painel
- Admin não consegue gerenciar multimídia pelo painel
- Conteúdo precisa ser alterado diretamente no código (inviável)

---

## 📊 TABELA COMPARATIVA DE PROBLEMAS

| # | Problema | Página/Seção | Causa | Impacto | Prioridade |
|---|----------|--------------|-------|---------|------------|
| 1 | Destaques não aparecem | Home | Mapeamento de campos | Alto - Seção invisível | 🔴 Alta |
| 2 | Notícias não aparecem | Home | Mapeamento de campos | Alto - Seção invisível | 🔴 Alta |
| 3 | Rodapé sem dados dinâmicos | Home | Não implementado | Médio - Dados estáticos | 🟡 Média |
| 4 | Rodapé duplicado | Privacidade/Termos | CSS ou estrutura | Baixo - Visual | 🟢 Baixa |
| 5 | Notícias estáticas | /noticias | Sem banco de dados | Alto - Sem gerenciamento | 🔴 Alta |
| 6 | Multimídia estática | /multimidia | Sem banco de dados | Médio - Sem gerenciamento | 🟡 Média |
| 7 | Editores faltando | Painel Admin | Não desenvolvidos | Alto - Sem controle admin | 🔴 Alta |

---

## 🎯 PLANO DE CORREÇÃO PROPOSTO

### FASE 1: CORREÇÕES URGENTES (Prioridade Alta)

#### 1.1 Corrigir Destaques e Notícias na Home
**Tempo estimado:** 30 minutos

**Ações:**
- Ajustar mapeamento de campos em `src/pages/Home.tsx`
- Trocar `titulo` por `titulo_evento` e `titulo_noticia`
- Trocar `imagem` por `imagem_evento` e `imagem_noticia`
- Trocar `descricao` por `subtitulo` e `resumo_noticia`
- Testar exibição na Home

**Arquivos afetados:**
- `src/pages/Home.tsx`

---

#### 1.2 Implementar Rodapé Dinâmico na Home
**Tempo estimado:** 1 hora

**Ações:**
- Criar componente `Footer` dinâmico (ou atualizar existente)
- Importar `useContactContent` hook
- Renderizar dados de contato do banco
- Adicionar Footer no final da Home
- Testar exibição

**Arquivos afetados:**
- `src/components/layout/Footer.tsx` (novo ou atualizar)
- `src/pages/Home.tsx`

---

### FASE 2: IMPLEMENTAÇÃO DE EDITORES (Prioridade Alta)

#### 2.1 Criar Sistema de Notícias Dinâmico
**Tempo estimado:** 4-6 horas

**Ações:**

**2.1.1 Banco de Dados:**
- Criar tabela `noticias` com campos:
  - id, titulo, resumo, conteudo_completo
  - autor, data_publicacao, categoria
  - imagem_url, slug, visualizacoes
  - destaque (boolean), ativo (boolean)
  - created_at, updated_at
- Criar políticas RLS
- Criar índices

**2.1.2 Backend:**
- Criar hook `useNoticias` para listar notícias
- Criar hook `useNoticia(id)` para notícia individual
- Criar mutation para criar/editar/deletar notícias

**2.1.3 Frontend:**
- Atualizar `src/pages/Noticias.tsx` para usar dados do banco
- Criar página individual `src/pages/NoticiaDetalhes.tsx`
- Adicionar rota `/noticias/:id`

**2.1.4 Painel Admin:**
- Implementar `src/pages/dashboard/NoticiasContentEdit.tsx`
- Formulário para criar/editar notícias
- Upload de imagens
- Editor de texto rico (opcional)
- Lista de notícias com ações (editar/deletar)
- Filtros e busca

**Arquivos afetados:**
- `supabase/migrations/[timestamp]_create_noticias.sql` (novo)
- `src/hooks/useNoticias.ts` (novo)
- `src/pages/Noticias.tsx` (atualizar)
- `src/pages/NoticiaDetalhes.tsx` (novo)
- `src/pages/dashboard/NoticiasContentEdit.tsx` (implementar)
- `src/App.tsx` (adicionar rota)

---

#### 2.2 Criar Sistema de Multimídia Dinâmico
**Tempo estimado:** 5-7 horas

**Ações:**

**2.2.1 Banco de Dados:**
- Criar tabela `videos` com campos:
  - id, titulo, descricao, url_youtube
  - duracao, visualizacoes, categoria
  - thumbnail_url, data_publicacao
  - destaque (boolean), ativo (boolean)
- Criar tabela `albuns_fotos` com campos:
  - id, titulo, descricao, categoria
  - data_evento, quantidade_fotos
  - capa_url, ativo (boolean)
- Criar tabela `fotos` com campos:
  - id, album_id, url, legenda, ordem
- Criar políticas RLS
- Criar índices

**2.2.2 Backend:**
- Criar hook `useVideos` para listar vídeos
- Criar hook `useAlbuns` para listar álbuns
- Criar hook `useFotos(albumId)` para fotos de um álbum
- Criar mutations para CRUD

**2.2.3 Frontend:**
- Atualizar `src/pages/Multimidia.tsx` para usar dados do banco
- Criar página de álbum `src/pages/AlbumDetalhes.tsx`
- Adicionar rota `/multimidia/album/:id`
- Integrar player de vídeo do YouTube

**2.2.4 Painel Admin:**
- Implementar `src/pages/dashboard/MultimidiaContentEdit.tsx`
- Seção para gerenciar vídeos (adicionar URL do YouTube)
- Seção para gerenciar álbuns de fotos
- Upload de múltiplas fotos
- Reordenação de fotos (drag and drop)
- Filtros e busca

**Arquivos afetados:**
- `supabase/migrations/[timestamp]_create_multimidia.sql` (novo)
- `src/hooks/useMultimidia.ts` (novo)
- `src/pages/Multimidia.tsx` (atualizar)
- `src/pages/AlbumDetalhes.tsx` (novo)
- `src/pages/dashboard/MultimidiaContentEdit.tsx` (implementar)
- `src/App.tsx` (adicionar rota)

---

### FASE 3: CORREÇÕES MENORES (Prioridade Baixa)

#### 3.1 Corrigir Rodapé Duplicado
**Tempo estimado:** 30 minutos

**Ações:**
- Inspecionar páginas `/privacidade` e `/termos` no navegador
- Verificar se há duplicação real no DOM
- Se confirmado, identificar causa (CSS ou componente extra)
- Remover duplicação
- Testar em diferentes resoluções

**Arquivos afetados:**
- `src/pages/Privacidade.tsx`
- `src/pages/Termos.tsx`
- `src/components/Footer.tsx` (possivelmente)

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Correções Urgentes
- [ ] Ajustar mapeamento de campos - Destaques da Convenção
- [ ] Ajustar mapeamento de campos - Notícias Recentes
- [ ] Testar exibição das seções na Home
- [ ] Criar/atualizar componente Footer dinâmico
- [ ] Integrar Footer na Home
- [ ] Testar dados de contato no rodapé

### Fase 2: Sistema de Notícias
- [ ] Criar migração do banco de dados (tabela noticias)
- [ ] Aplicar migração no Supabase
- [ ] Criar hook useNoticias
- [ ] Atualizar página Noticias.tsx
- [ ] Criar página NoticiaDetalhes.tsx
- [ ] Adicionar rota no App.tsx
- [ ] Implementar painel admin NoticiasContentEdit
- [ ] Testar CRUD completo de notícias
- [ ] Validar com usuário

### Fase 2: Sistema de Multimídia
- [ ] Criar migração do banco de dados (tabelas videos, albuns, fotos)
- [ ] Aplicar migração no Supabase
- [ ] Criar hook useMultimidia
- [ ] Atualizar página Multimidia.tsx
- [ ] Criar página AlbumDetalhes.tsx
- [ ] Adicionar rota no App.tsx
- [ ] Implementar painel admin MultimidiaContentEdit
- [ ] Integrar player do YouTube
- [ ] Testar CRUD completo de multimídia
- [ ] Validar com usuário

### Fase 3: Correções Menores
- [ ] Inspecionar rodapé duplicado
- [ ] Corrigir duplicação (se confirmada)
- [ ] Testar em diferentes navegadores
- [ ] Validar com usuário

---

## ⏱️ ESTIMATIVA DE TEMPO TOTAL

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| Fase 1 | Correções Urgentes (Home) | 1.5 horas |
| Fase 2.1 | Sistema de Notícias | 4-6 horas |
| Fase 2.2 | Sistema de Multimídia | 5-7 horas |
| Fase 3 | Correções Menores | 0.5 hora |
| **TOTAL** | **Implementação Completa** | **11-15 horas** |

---

## 🚀 RECOMENDAÇÕES

### Ordem de Execução Sugerida:

1. **PRIMEIRO:** Fase 1 (Correções Urgentes)
   - Impacto imediato na Home
   - Rápido de implementar
   - Resolve problemas visíveis

2. **SEGUNDO:** Fase 2.1 (Sistema de Notícias)
   - Prioridade alta
   - Funcionalidade importante para comunicação
   - Base para outros sistemas

3. **TERCEIRO:** Fase 2.2 (Sistema de Multimídia)
   - Prioridade média
   - Complementa o sistema de notícias
   - Enriquece o site

4. **QUARTO:** Fase 3 (Correções Menores)
   - Prioridade baixa
   - Problema visual menor
   - Pode ser feito por último

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Dados Existentes:
- ✅ Dados de Destaques e Notícias **JÁ ESTÃO SALVOS** no banco
- ✅ Dados de Contato **JÁ ESTÃO SALVOS** no banco
- ✅ Não há perda de dados - apenas ajustes de código

### Compatibilidade:
- ✅ Painel admin existente está funcionando perfeitamente
- ✅ Sistema de upload de imagens já está implementado
- ✅ Hooks de conteúdo já estão criados e funcionando

### Riscos:
- ⚠️ Implementação de novos editores pode afetar performance
- ⚠️ Upload de muitas imagens pode consumir storage
- ⚠️ Vídeos do YouTube dependem de API externa

---

## 📞 PRÓXIMOS PASSOS

**AGUARDANDO AUTORIZAÇÃO DO USUÁRIO PARA:**

1. Implementar correções da Fase 1 (Home)
2. Desenvolver sistema de Notícias (Fase 2.1)
3. Desenvolver sistema de Multimídia (Fase 2.2)
4. Corrigir rodapé duplicado (Fase 3)

**OU**

Priorizar apenas algumas fases conforme necessidade do usuário.

---

**FIM DO DIAGNÓSTICO COMPLETO**


---

## 🔎 PROBLEMAS 8 e 9: PRIVACIDADE E TERMOS SEM GERENCIAMENTO

**Status:** ❌ CONTEÚDO TOTALMENTE HARDCODED

**Páginas Afetadas:**
- `/privacidade` (src/pages/Privacidade.tsx)
- `/termos` (src/pages/Termos.tsx)

### Situação Crítica

**Banco de Dados:**
```
❌ NÃO EXISTE registro para 'privacidade' na tabela content_management
❌ NÃO EXISTE registro para 'termos' na tabela content_management
```

**Painel Admin:**
```
❌ NÃO LISTADAS no ContentManagement (/dashboard/content)
❌ NÃO HÁ editor para Privacidade
❌ NÃO HÁ editor para Termos
```

**Código Atual:**
Todo o conteúdo está **HARDCODED** no arquivo TypeScript (mais de 100 linhas de HTML/texto por página).

### Impacto

**Para o Admin:**
- ❌ Não consegue editar Política de Privacidade pelo painel
- ❌ Não consegue editar Termos de Uso pelo painel
- ❌ Precisa pedir ao desenvolvedor para alterar código
- ❌ Não pode atualizar datas de "última atualização"
- ❌ Não pode adicionar/remover seções

**Conformidade Legal:**
- ⚠️ **LGPD exige que políticas sejam atualizáveis facilmente**
- ⚠️ Mudanças legais podem exigir atualizações rápidas
- ⚠️ Data de "última atualização" está hardcoded (Janeiro 2024)

### Solução

**Implementar sistema completo de gerenciamento:**

1. Criar registros no banco de dados
2. Criar hooks (usePrivacidadeContent, useTermosContent)
3. Atualizar páginas frontend para usar dados dinâmicos
4. Criar editores admin (PrivacidadeContentEdit, TermosContentEdit)
5. Adicionar ao ContentManagement
6. Adicionar rotas

**Tempo estimado:** 7-8 horas

**Prioridade:** 🔴 ALTA (conformidade legal LGPD)

**Documentação completa:** Ver arquivo `ANALISE_PRIVACIDADE_TERMOS.md`

---

## 📊 TABELA ATUALIZADA DE PROBLEMAS

| # | Problema | Página/Seção | Causa | Impacto | Prioridade |
|---|----------|--------------|-------|---------|------------|
| 1 | Destaques não aparecem | Home | Mapeamento de campos | Alto - Seção invisível | 🔴 Alta |
| 2 | Notícias não aparecem | Home | Mapeamento de campos | Alto - Seção invisível | 🔴 Alta |
| 3 | Rodapé sem dados dinâmicos | Home | Não implementado | Médio - Dados estáticos | 🟡 Média |
| 4 | Rodapé duplicado | Privacidade/Termos | CSS ou estrutura | Baixo - Visual | 🟢 Baixa |
| 5 | Notícias estáticas | /noticias | Sem banco de dados | Alto - Sem gerenciamento | 🔴 Alta |
| 6 | Multimídia estática | /multimidia | Sem banco de dados | Médio - Sem gerenciamento | 🟡 Média |
| 7 | Editores faltando | Painel Admin | Não desenvolvidos | Alto - Sem controle admin | 🔴 Alta |
| **8** | **Privacidade hardcoded** | **/privacidade** | **Sem banco de dados** | **Alto - LGPD** | **🔴 Alta** |
| **9** | **Termos hardcoded** | **/termos** | **Sem banco de dados** | **Alto - LGPD** | **🔴 Alta** |

---

## 🎯 PLANO DE CORREÇÃO ATUALIZADO

### FASE 1: CORREÇÕES URGENTES (Prioridade Alta)

#### 1.1 Corrigir Destaques e Notícias na Home
**Tempo estimado:** 30 minutos
[Mantém descrição anterior]

#### 1.2 Implementar Rodapé Dinâmico na Home
**Tempo estimado:** 1 hora
[Mantém descrição anterior]

---

### FASE 2: IMPLEMENTAÇÃO DE EDITORES (Prioridade Alta)

#### 2.1 Criar Sistema de Notícias Dinâmico
**Tempo estimado:** 4-6 horas
[Mantém descrição anterior]

#### 2.2 Criar Sistema de Multimídia Dinâmico
**Tempo estimado:** 5-7 horas
[Mantém descrição anterior]

#### **2.3 Criar Sistema de Gerenciamento para Privacidade e Termos (NOVO)**
**Tempo estimado:** 7-8 horas

**Ações:**

**2.3.1 Banco de Dados:**
- Criar registros para 'privacidade' e 'termos' na tabela content_management
- Migrar conteúdo hardcoded para formato JSON estruturado
- Definir estrutura de seções (id, titulo, conteudo, itens, ordem)

**2.3.2 Backend:**
- Criar hook `usePrivacidadeContent` para buscar dados
- Criar hook `useTermosContent` para buscar dados
- Criar mutations para atualizar conteúdo

**2.3.3 Frontend:**
- Atualizar `src/pages/Privacidade.tsx` para usar dados dinâmicos
- Atualizar `src/pages/Termos.tsx` para usar dados dinâmicos
- Implementar renderização de seções dinâmicas
- Adicionar loading states

**2.3.4 Painel Admin:**
- Criar `src/pages/dashboard/PrivacidadeContentEdit.tsx`
- Criar `src/pages/dashboard/TermosContentEdit.tsx`
- Formulário para editar título e data de atualização
- Sistema de seções (adicionar/remover/reordenar)
- Editor de texto para cada seção
- Suporte a listas de itens por seção
- Adicionar ao ContentManagement
- Adicionar rotas no App.tsx

**Arquivos afetados:**
- `supabase/migrations/[timestamp]_add_privacidade_termos.sql` (novo)
- `src/hooks/useContent.ts` (atualizar - adicionar hooks)
- `src/pages/Privacidade.tsx` (atualizar)
- `src/pages/Termos.tsx` (atualizar)
- `src/pages/dashboard/PrivacidadeContentEdit.tsx` (novo)
- `src/pages/dashboard/TermosContentEdit.tsx` (novo)
- `src/pages/dashboard/ContentManagement.tsx` (atualizar)
- `src/App.tsx` (adicionar rotas)

**Justificativa da Prioridade Alta:**
- ⚠️ **Conformidade LGPD** - Políticas devem ser atualizáveis facilmente
- ⚠️ **Mudanças legais** podem exigir atualizações rápidas
- ⚠️ **Data de atualização** hardcoded (Janeiro 2024) está desatualizada
- ⚠️ **Consistência** - Todas as outras páginas têm gerenciamento dinâmico
- ⚠️ **Autonomia do Admin** - Deve poder atualizar sem desenvolvedor

---

### FASE 3: CORREÇÕES MENORES (Prioridade Baixa)

#### 3.1 Corrigir Rodapé Duplicado
**Tempo estimado:** 30 minutos
[Mantém descrição anterior]

---

## ⏱️ ESTIMATIVA DE TEMPO TOTAL ATUALIZADA

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| Fase 1 | Correções Urgentes (Home) | 1.5 horas |
| Fase 2.1 | Sistema de Notícias | 4-6 horas |
| Fase 2.2 | Sistema de Multimídia | 5-7 horas |
| **Fase 2.3** | **Sistema Privacidade/Termos** | **7-8 horas** |
| Fase 3 | Correções Menores | 0.5 hora |
| **TOTAL** | **Implementação Completa** | **18-23 horas** |

---

## 🚀 ORDEM DE EXECUÇÃO ATUALIZADA

### Recomendação Revisada:

1. **PRIMEIRO:** Fase 1 (Correções Urgentes - Home)
   - Impacto imediato na Home
   - Rápido de implementar (1.5h)
   - Resolve problemas visíveis

2. **SEGUNDO:** Fase 2.3 (Sistema Privacidade/Termos) **← NOVO**
   - **Prioridade ALTA por conformidade LGPD**
   - Páginas legais devem ser atualizáveis
   - Data de atualização está desatualizada
   - Tempo: 7-8 horas

3. **TERCEIRO:** Fase 2.1 (Sistema de Notícias)
   - Prioridade alta
   - Funcionalidade importante para comunicação
   - Tempo: 4-6 horas

4. **QUARTO:** Fase 2.2 (Sistema de Multimídia)
   - Prioridade média
   - Complementa o sistema de notícias
   - Tempo: 5-7 horas

5. **QUINTO:** Fase 3 (Correções Menores)
   - Prioridade baixa
   - Problema visual menor
   - Tempo: 0.5 hora

---

## 📝 CHECKLIST ATUALIZADO

### Fase 1: Correções Urgentes
- [ ] Ajustar mapeamento de campos - Destaques da Convenção
- [ ] Ajustar mapeamento de campos - Notícias Recentes
- [ ] Testar exibição das seções na Home
- [ ] Criar/atualizar componente Footer dinâmico
- [ ] Integrar Footer na Home
- [ ] Testar dados de contato no rodapé

### **Fase 2.3: Sistema Privacidade/Termos (NOVO)**
- [ ] Criar registros no banco (privacidade e termos)
- [ ] Migrar conteúdo hardcoded para JSON
- [ ] Criar hook usePrivacidadeContent
- [ ] Criar hook useTermosContent
- [ ] Atualizar página Privacidade.tsx
- [ ] Atualizar página Termos.tsx
- [ ] Criar editor PrivacidadeContentEdit
- [ ] Criar editor TermosContentEdit
- [ ] Adicionar ao ContentManagement
- [ ] Adicionar rotas no App.tsx
- [ ] Testar CRUD completo
- [ ] Validar com usuário

### Fase 2.1: Sistema de Notícias
[Mantém checklist anterior]

### Fase 2.2: Sistema de Multimídia
[Mantém checklist anterior]

### Fase 3: Correções Menores
[Mantém checklist anterior]

---

## 📞 PRÓXIMOS PASSOS ATUALIZADOS

**AGUARDANDO AUTORIZAÇÃO DO USUÁRIO PARA:**

1. Implementar correções da Fase 1 (Home)
2. **Implementar sistema de gerenciamento para Privacidade e Termos (Fase 2.3) - NOVO**
3. Desenvolver sistema de Notícias (Fase 2.1)
4. Desenvolver sistema de Multimídia (Fase 2.2)
5. Corrigir rodapé duplicado (Fase 3)

**OU**

Priorizar apenas algumas fases conforme necessidade do usuário.

---

**DOCUMENTAÇÃO ADICIONAL:**
- Análise completa de Privacidade/Termos: `ANALISE_PRIVACIDADE_TERMOS.md`

---

**FIM DO DIAGNÓSTICO COMPLETO ATUALIZADO**
