import { z } from "zod";

// Schema para validação de URLs
const urlSchema = z.string().url("URL inválida").or(z.string().length(0));

// Schema para validação de e-mails
const emailSchema = z.string().email("E-mail inválido");

// Schema para validação de telefones brasileiros
const phoneSchema = z.string().regex(
  /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  "Formato de telefone inválido. Use: (XX) XXXXX-XXXX"
);

// Schema para validação de CEP
const cepSchema = z.string().regex(
  /^\d{5}-\d{3}$/,
  "Formato de CEP inválido. Use: XXXXX-XXX"
);

// Schema para validação de datas
const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Formato de data inválido. Use: YYYY-MM-DD"
);

// ===== SCHEMAS PARA PÁGINA HOME =====

const bannerPrincipalSchema = z.object({
  titulo_principal: z.string().min(1, "Título principal é obrigatório").max(100, "Título muito longo"),
  subtitulo: z.string().min(1, "Subtítulo é obrigatório").max(300, "Subtítulo muito longo"),
  texto_botao: z.string().min(1, "Texto do botão é obrigatório").max(50, "Texto do botão muito longo"),
  link_botao: z.string().min(1, "Link do botão é obrigatório")
});

const cardAcaoSchema = z.object({
  titulo: z.string().min(1, "Título do card é obrigatório").max(50, "Título muito longo"),
  descricao: z.string().min(1, "Descrição do card é obrigatória").max(200, "Descrição muito longa"),
  link_botao: z.string().min(1, "Link do botão é obrigatório")
});

const destaqueConvencaoSchema = z.object({
  titulo_evento: z.string().min(1, "Título do evento é obrigatório").max(100, "Título muito longo"),
  imagem_evento: z.string().min(1, "Imagem do evento é obrigatória"),
  subtitulo: z.string().min(1, "Subtítulo é obrigatório").max(200, "Subtítulo muito longo"),
  link_evento: z.string().min(1, "Link do evento é obrigatório")
});

const noticiaRecenteSchema = z.object({
  titulo_noticia: z.string().min(1, "Título da notícia é obrigatório").max(100, "Título muito longo"),
  imagem_noticia: z.string().min(1, "Imagem da notícia é obrigatória"),
  data_noticia: dateSchema,
  resumo_noticia: z.string().min(1, "Resumo da notícia é obrigatório").max(300, "Resumo muito longo"),
  link_noticia: z.string().min(1, "Link da notícia é obrigatório")
});

const junteSeMissaoSchema = z.object({
  titulo_principal: z.string().min(1, "Título principal é obrigatório").max(100, "Título muito longo"),
  subtitulo: z.string().min(1, "Subtítulo é obrigatório").max(300, "Subtítulo muito longo"),
  texto_botao: z.string().min(1, "Texto do botão é obrigatório").max(50, "Texto do botão muito longo"),
  link_botao: z.string().min(1, "Link do botão é obrigatório")
});

export const homeContentSchema = z.object({
  banner_principal: bannerPrincipalSchema,
  cards_acao: z.array(cardAcaoSchema).length(4, "Deve haver exatamente 4 cards de ação"),
  destaques_convencao: z.array(destaqueConvencaoSchema).max(6, "Máximo de 6 destaques permitidos"),
  noticias_recentes: z.array(noticiaRecenteSchema).max(4, "Máximo de 4 notícias permitidas"),
  junte_se_missao: junteSeMissaoSchema
});

// ===== SCHEMAS PARA PÁGINA SOBRE =====

const secaoSobreSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, "Título da seção é obrigatório").max(100, "Título muito longo"),
  conteudo: z.string().min(1, "Conteúdo da seção é obrigatório").max(2000, "Conteúdo muito longo"),
  imagem: z.string().optional(),
  ordem: z.number().int().positive("Ordem deve ser um número positivo")
});

export const aboutContentSchema = z.object({
  titulo: z.string().min(1, "Título principal é obrigatório").max(100, "Título muito longo"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(300, "Descrição muito longa"),
  missao: z.object({
    titulo: z.string().min(1, "Título da missão é obrigatório"),
    texto: z.string().min(1, "Texto da missão é obrigatório").max(500, "Texto da missão muito longo")
  }),
  visao: z.object({
    titulo: z.string().min(1, "Título da visão é obrigatório"),
    texto: z.string().min(1, "Texto da visão é obrigatório").max(500, "Texto da visão muito longo")
  }),
  historia: z.object({
    titulo: z.string().min(1, "Título da história é obrigatório"),
    texto: z.string().optional(),
    paragrafos: z.array(z.string().min(1, "Parágrafo não pode estar vazio")).optional()
  })
});

// ===== SCHEMAS PARA PÁGINA LIDERANÇA =====

const liderSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  cargo: z.string().min(1, "Cargo é obrigatório").max(100, "Cargo muito longo"),
  bio: z.string().min(1, "Biografia é obrigatória").max(1000, "Biografia muito longa"),
  imagem: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  categoria: z.enum(["presidencia", "diretoria", "conselho", "campos"]),
  ordem: z.number().int().positive("Ordem deve ser um número positivo")
});

export const leadershipContentSchema = z.object({
  titulo: z.string().min(1, "Título principal é obrigatório").max(100, "Título muito longo"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(300, "Descrição muito longa"),
  lideres: z.array(liderSchema).min(1, "Pelo menos um líder é obrigatório").max(20, "Máximo de 20 líderes permitidos")
});

// ===== SCHEMAS PARA PÁGINA CONTATO =====

const enderecoSchema = z.object({
  rua: z.string().min(1, "Rua é obrigatória").max(200, "Nome da rua muito longo"),
  numero: z.string().max(10, "Número muito longo").optional(),
  complemento: z.string().max(100, "Complemento muito longo").optional(),
  bairro: z.string().max(100, "Nome do bairro muito longo").optional(),
  cidade: z.string().min(1, "Cidade é obrigatória").max(100, "Nome da cidade muito longo"),
  cep: z.string().min(1, "CEP é obrigatório"),
  estado: z.string().min(1, "Estado é obrigatório").max(50, "Nome do estado muito longo")
});

const telefoneSchema = z.object({
  id: z.string(),
  tipo: z.string().min(1, "Tipo do telefone é obrigatório").max(50, "Tipo muito longo"),
  numero: z.string().min(1, "Número é obrigatório"),
  ordem: z.number().optional(),
  whatsapp: z.boolean().optional()
});

const emailContatoSchema = z.object({
  id: z.string(),
  tipo: z.string().min(1, "Tipo do e-mail é obrigatório").max(50, "Tipo muito longo"),
  email: z.string().min(1, "E-mail é obrigatório"),
  ordem: z.number().optional()
});

const horarioFuncionamentoSchema = z.object({
  dias: z.string().min(1, "Dias são obrigatórios"),
  horario: z.string().min(1, "Horário é obrigatório"),
  observacoes: z.string().optional()
});

const redesSociaisSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  whatsapp: z.string().optional()
}).optional();

export const contactContentSchema = z.object({
  titulo: z.string().min(1, "Título principal é obrigatório").max(100, "Título muito longo"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(300, "Descrição muito longa"),
  endereco: enderecoSchema,
  telefones: z.array(telefoneSchema).min(1, "Pelo menos um telefone é obrigatório").max(10, "Máximo de 10 telefones permitidos"),
  emails: z.array(emailContatoSchema).min(1, "Pelo menos um e-mail é obrigatório").max(10, "Máximo de 10 e-mails permitidos"),
  horarioFuncionamento: horarioFuncionamentoSchema,
  redesSociais: redesSociaisSchema
});

// ===== SCHEMA GENÉRICO PARA VALIDAÇÃO DE CONTEÚDO =====

export const contentValidationSchema = z.object({
  page_name: z.enum(["home", "sobre", "lideranca", "contato"], {
    errorMap: () => ({ message: "Página inválida" })
  }),
  content_json: z.any() // Será validado especificamente baseado no page_name
});

// ===== FUNÇÕES DE VALIDAÇÃO =====

export const validateHomeContent = (data: any) => {
  return homeContentSchema.safeParse(data);
};

export const validateAboutContent = (data: any) => {
  return aboutContentSchema.safeParse(data);
};

export const validateLeadershipContent = (data: any) => {
  return leadershipContentSchema.safeParse(data);
};

export const validateContactContent = (data: any) => {
  return contactContentSchema.safeParse(data);
};

export const validateContentByPage = (pageName: string, data: any) => {
  switch (pageName) {
    case 'home':
      return validateHomeContent(data);
    case 'sobre':
      return validateAboutContent(data);
    case 'lideranca':
      return validateLeadershipContent(data);
    case 'contato':
      return validateContactContent(data);
    default:
      return { success: false, error: { issues: [{ message: "Página não suportada" }] } };
  }
};

// ===== UTILITÁRIOS PARA FORMATAÇÃO DE ERROS =====

export const formatValidationErrors = (errors: any[]) => {
  return errors.reduce((acc, error) => {
    const path = error.path.join('.');
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);
};

export const getFirstValidationError = (errors: any[]) => {
  return errors[0]?.message || "Erro de validação";
};

// ===== TIPOS TYPESCRIPT =====

export type HomeContentData = z.infer<typeof homeContentSchema>;
export type AboutContentData = z.infer<typeof aboutContentSchema>;
export type LeadershipContentData = z.infer<typeof leadershipContentSchema>;
export type ContactContentData = z.infer<typeof contactContentSchema>;

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    issues: Array<{
      path: (string | number)[];
      message: string;
      code: string;
    }>;
  };
};