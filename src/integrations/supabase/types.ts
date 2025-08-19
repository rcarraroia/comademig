export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      carteira_digital: {
        Row: {
          created_at: string
          data_emissao: string
          data_validade: string
          foto_url: string | null
          id: string
          numero_carteira: string
          qr_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          data_validade: string
          foto_url?: string | null
          id?: string
          numero_carteira: string
          qr_code: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_emissao?: string
          data_validade?: string
          foto_url?: string | null
          id?: string
          numero_carteira?: string
          qr_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certidoes: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          data_validade: string | null
          documento_url: string | null
          id: string
          status: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          documento_url?: string | null
          id?: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          documento_url?: string | null
          id?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certidoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados_eventos: {
        Row: {
          created_at: string
          data_emissao: string
          documento_url: string | null
          evento_id: string
          id: string
          numero_certificado: string
          qr_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          documento_url?: string | null
          evento_id: string
          id?: string
          numero_certificado: string
          qr_code: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_emissao?: string
          documento_url?: string | null
          evento_id?: string
          id?: string
          numero_certificado?: string
          qr_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_eventos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          carga_horaria: number | null
          cep: string | null
          certificado_disponivel: boolean | null
          cidade: string | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          endereco: string | null
          estado: string | null
          id: string
          imagem_url: string | null
          local: string | null
          organizador_id: string | null
          preco: number | null
          requer_presenca: boolean | null
          status: string | null
          tipo_evento: string | null
          titulo: string
          updated_at: string | null
          vagas: number | null
        }
        Insert: {
          carga_horaria?: number | null
          cep?: string | null
          certificado_disponivel?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          organizador_id?: string | null
          preco?: number | null
          requer_presenca?: boolean | null
          status?: string | null
          tipo_evento?: string | null
          titulo: string
          updated_at?: string | null
          vagas?: number | null
        }
        Update: {
          carga_horaria?: number | null
          cep?: string | null
          certificado_disponivel?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          organizador_id?: string | null
          preco?: number | null
          requer_presenca?: boolean | null
          status?: string | null
          tipo_evento?: string | null
          titulo?: string
          updated_at?: string | null
          vagas?: number | null
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          id: string
          status: string | null
          tipo: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes_eventos: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_inscricao: string | null
          data_pagamento: string | null
          evento_id: string
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_pago: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_inscricao?: string | null
          data_pagamento?: string | null
          evento_id: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_pago?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_inscricao?: string | null
          data_pagamento?: string | null
          evento_id?: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_eventos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscricoes_eventos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          assunto: string
          conteudo: string
          created_at: string | null
          destinatario_id: string | null
          id: string
          lida: boolean | null
          remetente_id: string
          updated_at: string | null
        }
        Insert: {
          assunto: string
          conteudo: string
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          lida?: boolean | null
          remetente_id: string
          updated_at?: string | null
        }
        Update: {
          assunto?: string
          conteudo?: string
          created_at?: string | null
          destinatario_id?: string | null
          id?: string
          lida?: boolean | null
          remetente_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      multimidia: {
        Row: {
          created_at: string | null
          data_publicacao: string | null
          descricao: string | null
          id: string
          status: string | null
          thumbnail_url: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          data_publicacao?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          thumbnail_url?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      noticias: {
        Row: {
          autor_id: string | null
          conteudo: string
          created_at: string | null
          data_publicacao: string | null
          id: string
          imagem_url: string | null
          resumo: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          autor_id?: string | null
          conteudo: string
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          resumo?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string | null
          conteudo?: string
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          resumo?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presenca_eventos: {
        Row: {
          created_at: string
          data_presenca: string
          evento_id: string
          id: string
          tipo_presenca: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_presenca?: string
          evento_id: string
          id?: string
          tipo_presenca?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_presenca?: string
          evento_id?: string
          id?: string
          tipo_presenca?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presenca_eventos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          data_ordenacao: string | null
          endereco: string | null
          estado: string | null
          id: string
          igreja: string | null
          nome_completo: string
          rg: string | null
          status: string | null
          telefone: string | null
          tipo_membro: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          data_ordenacao?: string | null
          endereco?: string | null
          estado?: string | null
          id: string
          igreja?: string | null
          nome_completo: string
          rg?: string | null
          status?: string | null
          telefone?: string | null
          tipo_membro?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          data_ordenacao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          igreja?: string | null
          nome_completo?: string
          rg?: string | null
          status?: string | null
          telefone?: string | null
          tipo_membro?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solicitacoes_certidoes: {
        Row: {
          arquivo_pdf: string | null
          created_at: string
          data_aprovacao: string | null
          data_entrega: string | null
          data_solicitacao: string
          id: string
          justificativa: string
          numero_protocolo: string
          observacoes_admin: string | null
          status: string
          tipo_certidao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_pdf?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_entrega?: string | null
          data_solicitacao?: string
          id?: string
          justificativa: string
          numero_protocolo: string
          observacoes_admin?: string | null
          status?: string
          tipo_certidao: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_pdf?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_entrega?: string | null
          data_solicitacao?: string
          id?: string
          justificativa?: string
          numero_protocolo?: string
          observacoes_admin?: string | null
          status?: string
          tipo_certidao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suporte: {
        Row: {
          assunto: string
          created_at: string | null
          descricao: string
          id: string
          prioridade: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assunto: string
          created_at?: string | null
          descricao: string
          id?: string
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assunto?: string
          created_at?: string | null
          descricao?: string
          id?: string
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suporte_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_mensagens: {
        Row: {
          created_at: string | null
          id: string
          mensagem: string
          suporte_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem: string
          suporte_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem?: string
          suporte_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suporte_mensagens_suporte_id_fkey"
            columns: ["suporte_id"]
            isOneToOne: false
            referencedRelation: "suporte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suporte_mensagens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: {
        Args: { _user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderador" | "tesoureiro" | "membro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderador", "tesoureiro", "membro"],
    },
  },
} as const
