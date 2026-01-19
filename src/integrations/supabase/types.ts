export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome_completo: string
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
          endereco: string | null
          cidade: string | null
          estado: string | null
          cep: string | null
          telefone: string | null
          igreja: string | null
          cargo: string | null
          data_ordenacao: string | null
          status: string
          tipo_membro: string
          created_at: string
          updated_at: string
          email: string
          member_type_id: string | null
          bio: string | null
          foto_url: string | null
          show_contact: boolean
          show_ministry: boolean
          asaas_customer_id: string
          asaas_subscription_id: string | null
          numero: string | null
          complemento: any | null
          bairro: string | null
          tempo_ministerio: any | null
        }
        Insert: {
          id?: string | null
          nome_completo?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          cep?: string | null
          telefone?: string | null
          igreja?: string | null
          cargo?: string | null
          data_ordenacao?: string | null
          status?: string | null
          tipo_membro?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          member_type_id?: string | null
          bio?: string | null
          foto_url?: string | null
          show_contact?: boolean | null
          show_ministry?: boolean | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          numero?: string | null
          complemento?: any | null
          bairro?: string | null
          tempo_ministerio?: any | null
        }
        Update: {
          id?: string | null
          nome_completo?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          cep?: string | null
          telefone?: string | null
          igreja?: string | null
          cargo?: string | null
          data_ordenacao?: string | null
          status?: string | null
          tipo_membro?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          member_type_id?: string | null
          bio?: string | null
          foto_url?: string | null
          show_contact?: boolean | null
          show_ministry?: boolean | null
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          numero?: string | null
          complemento?: any | null
          bairro?: string | null
          tempo_ministerio?: any | null
        }
      }
      member_types: {
        Row: {
          id: string
          name: string
          description: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
          created_by: any | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: any | null
          price: number
          recurrence: string
          plan_id_gateway: any | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: any | null
          member_type_id: string
          duration_months: number
          features: Json
          sort_order: number
        }
        Insert: {
          id?: string | null
          name?: string | null
          description?: any | null
          price?: number | null
          recurrence?: string | null
          plan_id_gateway?: any | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
          member_type_id?: string | null
          duration_months?: number | null
          features?: Json | null
          sort_order?: number | null
        }
        Update: {
          id?: string | null
          name?: string | null
          description?: any | null
          price?: number | null
          recurrence?: string | null
          plan_id_gateway?: any | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
          member_type_id?: string | null
          duration_months?: number | null
          features?: Json | null
          sort_order?: number | null
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_plan_id: string | null
          member_type_id: string
          status: string
          payment_reference: any | null
          auto_renew: boolean
          started_at: string
          expires_at: string
          created_at: string
          updated_at: string
          asaas_subscription_id: string | null
          initial_payment_id: any | null
          asaas_customer_id: any | null
          billing_type: any | null
          cycle: any | null
          value: any | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          subscription_plan_id?: string | null
          member_type_id?: string | null
          status?: string | null
          payment_reference?: any | null
          auto_renew?: boolean | null
          started_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          asaas_subscription_id?: string | null
          initial_payment_id?: any | null
          asaas_customer_id?: any | null
          billing_type?: any | null
          cycle?: any | null
          value?: any | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          subscription_plan_id?: string | null
          member_type_id?: string | null
          status?: string | null
          payment_reference?: any | null
          auto_renew?: boolean | null
          started_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          asaas_subscription_id?: string | null
          initial_payment_id?: any | null
          asaas_customer_id?: any | null
          billing_type?: any | null
          cycle?: any | null
          value?: any | null
        }
      }
      asaas_cobrancas: {
        Row: {
          id: string
          user_id: string
          asaas_id: string
          customer_id: string
          valor: number
          net_value: number
          original_value: any | null
          descricao: string
          forma_pagamento: string
          status: string
          data_vencimento: string
          original_due_date: any | null
          data_pagamento: any | null
          client_payment_date: any | null
          url_pagamento: string
          invoice_url: any | null
          invoice_number: any | null
          linha_digitavel: any | null
          nosso_numero: any | null
          qr_code_pix: any | null
          pix_copy_paste: any | null
          pix_expiration_date: any | null
          credit_card_number: string
          credit_card_brand: string
          credit_card_token: string
          service_type: string
          service_data: Json
          referencia_id: any | null
          external_reference: any | null
          installment_number: number
          deleted: boolean
          anticipated: boolean
          anticipable: boolean
          postal_service: boolean
          created_at: string
          updated_at: string
          billing_type: any | null
          payment_date: any | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          asaas_id?: string | null
          customer_id?: string | null
          valor?: number | null
          net_value?: number | null
          original_value?: any | null
          descricao?: string | null
          forma_pagamento?: string | null
          status?: string | null
          data_vencimento?: string | null
          original_due_date?: any | null
          data_pagamento?: any | null
          client_payment_date?: any | null
          url_pagamento?: string | null
          invoice_url?: any | null
          invoice_number?: any | null
          linha_digitavel?: any | null
          nosso_numero?: any | null
          qr_code_pix?: any | null
          pix_copy_paste?: any | null
          pix_expiration_date?: any | null
          credit_card_number?: string | null
          credit_card_brand?: string | null
          credit_card_token?: string | null
          service_type?: string | null
          service_data?: Json | null
          referencia_id?: any | null
          external_reference?: any | null
          installment_number?: number | null
          deleted?: boolean | null
          anticipated?: boolean | null
          anticipable?: boolean | null
          postal_service?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          billing_type?: any | null
          payment_date?: any | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          asaas_id?: string | null
          customer_id?: string | null
          valor?: number | null
          net_value?: number | null
          original_value?: any | null
          descricao?: string | null
          forma_pagamento?: string | null
          status?: string | null
          data_vencimento?: string | null
          original_due_date?: any | null
          data_pagamento?: any | null
          client_payment_date?: any | null
          url_pagamento?: string | null
          invoice_url?: any | null
          invoice_number?: any | null
          linha_digitavel?: any | null
          nosso_numero?: any | null
          qr_code_pix?: any | null
          pix_copy_paste?: any | null
          pix_expiration_date?: any | null
          credit_card_number?: string | null
          credit_card_brand?: string | null
          credit_card_token?: string | null
          service_type?: string | null
          service_data?: Json | null
          referencia_id?: any | null
          external_reference?: any | null
          installment_number?: number | null
          deleted?: boolean | null
          anticipated?: boolean | null
          anticipable?: boolean | null
          postal_service?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          billing_type?: any | null
          payment_date?: any | null
        }
      }
      solicitacoes_servicos: {
        Row: {
          id: string
          protocolo: string
          user_id: string
          servico_id: string
          dados_enviados: Json
          observacoes_admin: any | null
          arquivo_entrega: any | null
          status: string
          payment_reference: string
          valor_pago: number
          forma_pagamento: string
          created_at: string
          updated_at: string
          data_pagamento: any | null
          data_analise: any | null
          data_conclusao: any | null
        }
        Insert: {
          id?: string | null
          protocolo?: string | null
          user_id?: string | null
          servico_id?: string | null
          dados_enviados?: Json | null
          observacoes_admin?: any | null
          arquivo_entrega?: any | null
          status?: string | null
          payment_reference?: string | null
          valor_pago?: number | null
          forma_pagamento?: string | null
          created_at?: string | null
          updated_at?: string | null
          data_pagamento?: any | null
          data_analise?: any | null
          data_conclusao?: any | null
        }
        Update: {
          id?: string | null
          protocolo?: string | null
          user_id?: string | null
          servico_id?: string | null
          dados_enviados?: Json | null
          observacoes_admin?: any | null
          arquivo_entrega?: any | null
          status?: string | null
          payment_reference?: string | null
          valor_pago?: number | null
          forma_pagamento?: string | null
          created_at?: string | null
          updated_at?: string | null
          data_pagamento?: any | null
          data_analise?: any | null
          data_conclusao?: any | null
        }
      }
      servicos: {
        Row: {
          id: string
          nome: string
          descricao: string
          categoria: string
          prazo: string
          valor: number
          is_active: boolean
          sort_order: number
          aceita_pix: boolean
          aceita_cartao: boolean
          max_parcelas: number
          created_at: string
          updated_at: string
          created_by: any | null
        }
        Insert: {
          id?: string | null
          nome?: string | null
          descricao?: string | null
          categoria?: string | null
          prazo?: string | null
          valor?: number | null
          is_active?: boolean | null
          sort_order?: number | null
          aceita_pix?: boolean | null
          aceita_cartao?: boolean | null
          max_parcelas?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
        }
        Update: {
          id?: string | null
          nome?: string | null
          descricao?: string | null
          categoria?: string | null
          prazo?: string | null
          valor?: number | null
          is_active?: boolean | null
          sort_order?: number | null
          aceita_pix?: boolean | null
          aceita_cartao?: boolean | null
          max_parcelas?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: any | null
        }
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          display_name: string
          cpf_cnpj: string
          contact_email: string
          phone: string
          status: string
          is_adimplent: boolean
          referral_code: string
          created_at: string
          updated_at: string
          asaas_wallet_id: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          display_name?: string | null
          cpf_cnpj?: string | null
          contact_email?: string | null
          phone?: string | null
          status?: string | null
          is_adimplent?: boolean | null
          referral_code?: string | null
          created_at?: string | null
          updated_at?: string | null
          asaas_wallet_id?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          display_name?: string | null
          cpf_cnpj?: string | null
          contact_email?: string | null
          phone?: string | null
          status?: string | null
          is_adimplent?: boolean | null
          referral_code?: string | null
          created_at?: string | null
          updated_at?: string | null
          asaas_wallet_id?: string | null
        }
      }
      affiliate_referrals: {
        Row: {
          id: string
          affiliate_id: string
          referred_user_id: string
          referral_code: string
          status: string
          conversion_date: any | null
          conversion_value: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string | null
          affiliate_id?: string | null
          referred_user_id?: string | null
          referral_code?: string | null
          status?: string | null
          conversion_date?: any | null
          conversion_value?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          affiliate_id?: string | null
          referred_user_id?: string | null
          referral_code?: string | null
          status?: string | null
          conversion_date?: any | null
          conversion_value?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          subject: string
          description: string
          status: string
          priority: string
          assigned_to: any | null
          resolved_at: any | null
          closed_at: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          category_id?: string | null
          subject?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: any | null
          resolved_at?: any | null
          closed_at?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          category_id?: string | null
          subject?: string | null
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: any | null
          resolved_at?: any | null
          closed_at?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          created_at: string
          action_url: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          read?: boolean | null
          created_at?: string | null
          action_url?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          type?: string | null
          title?: string | null
          message?: string | null
          read?: boolean | null
          created_at?: string | null
          action_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
