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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_id: string | null
          created_at: string
          data: string
          hora: string | null
          id: string
          observacoes: string | null
          oficina_id: string
          servico: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data: string
          hora?: string | null
          id?: string
          observacoes?: string | null
          oficina_id: string
          servico?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data?: string
          hora?: string | null
          id?: string
          observacoes?: string | null
          oficina_id?: string
          servico?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          numero: string | null
          observacoes: string | null
          oficina_id: string | null
          origem: string | null
          rg: string | null
          rua: string | null
          telefone: string | null
          tipo_pessoa: string | null
          uf: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          numero?: string | null
          observacoes?: string | null
          oficina_id?: string | null
          origem?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          numero?: string | null
          observacoes?: string | null
          oficina_id?: string | null
          origem?: string | null
          rg?: string | null
          rua?: string | null
          telefone?: string | null
          tipo_pessoa?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          codigo: string | null
          created_at: string
          id: string
          nome: string
          oficina_id: string
          quantidade: number
          quantidade_minima: number | null
          updated_at: string
          valor_unitario: number | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          oficina_id: string
          quantidade?: number
          quantidade_minima?: number | null
          updated_at?: string
          valor_unitario?: number | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          oficina_id?: string
          quantidade?: number
          quantidade_minima?: number | null
          updated_at?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          oficina_id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          oficina_id: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          oficina_id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_proposta: {
        Row: {
          created_at: string
          descricao: string
          horas: number | null
          id: string
          proposta_id: string
          quantidade: number | null
          tipo: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          horas?: number | null
          id?: string
          proposta_id: string
          quantidade?: number | null
          tipo?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          horas?: number | null
          id?: string
          proposta_id?: string
          quantidade?: number | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_proposta_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      oficinas: {
        Row: {
          ativa: boolean
          cnpj: string | null
          created_at: string
          data_inicio: string | null
          data_vencimento: string | null
          email: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          plano: string
          status_assinatura: string
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          data_vencimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          plano?: string
          status_assinatura?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativa?: boolean
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          data_vencimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: string
          status_assinatura?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          oficina_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          oficina_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          oficina_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_imagens: {
        Row: {
          created_at: string
          id: string
          proposta_id: string
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposta_id: string
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          proposta_id?: string
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposta_imagens_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          cliente_id: string | null
          consultor_id: string | null
          created_at: string
          id: string
          observacoes: string | null
          oficina_id: string
          status: string
          total: number | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          consultor_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string | null
          oficina_id: string
          status?: string
          total?: number | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          consultor_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string | null
          oficina_id?: string
          status?: string
          total?: number | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_checklist: {
        Row: {
          condicao: string | null
          created_at: string
          id: string
          item: string
          protocolo_id: string
        }
        Insert: {
          condicao?: string | null
          created_at?: string
          id?: string
          item: string
          protocolo_id: string
        }
        Update: {
          condicao?: string | null
          created_at?: string
          id?: string
          item?: string
          protocolo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_checklist_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_fotos: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          peca: string | null
          protocolo_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          peca?: string | null
          protocolo_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          peca?: string | null
          protocolo_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_fotos_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_pecas: {
        Row: {
          created_at: string
          fracao: number | null
          id: string
          imagem_url: string | null
          nome: string
          protocolo_id: string
          qtd_tinta_g: number | null
          qtd_tinta_m: number | null
          qtd_tinta_p: number | null
          qtd_verniz_g: number | null
          qtd_verniz_m: number | null
          qtd_verniz_p: number | null
          sinonimos: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string
          fracao?: number | null
          id?: string
          imagem_url?: string | null
          nome: string
          protocolo_id: string
          qtd_tinta_g?: number | null
          qtd_tinta_m?: number | null
          qtd_tinta_p?: number | null
          qtd_verniz_g?: number | null
          qtd_verniz_m?: number | null
          qtd_verniz_p?: number | null
          sinonimos?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string
          fracao?: number | null
          id?: string
          imagem_url?: string | null
          nome?: string
          protocolo_id?: string
          qtd_tinta_g?: number | null
          qtd_tinta_m?: number | null
          qtd_tinta_p?: number | null
          qtd_verniz_g?: number | null
          qtd_verniz_m?: number | null
          qtd_verniz_p?: number | null
          sinonimos?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_pecas_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_servicos: {
        Row: {
          adicional_sem_pintura: number | null
          created_at: string
          hora_linear: boolean | null
          horas: number | null
          id: string
          nome: string
          protocolo_id: string
          servico_id: string | null
          tamanho: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          adicional_sem_pintura?: number | null
          created_at?: string
          hora_linear?: boolean | null
          horas?: number | null
          id?: string
          nome: string
          protocolo_id: string
          servico_id?: string | null
          tamanho?: string | null
          tipo?: string
          valor?: number | null
        }
        Update: {
          adicional_sem_pintura?: number | null
          created_at?: string
          hora_linear?: boolean | null
          horas?: number | null
          id?: string
          nome?: string
          protocolo_id?: string
          servico_id?: string | null
          tamanho?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_servicos_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolo_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos: {
        Row: {
          cliente_id: string | null
          corresponsavel_id: string | null
          created_at: string
          data_entrada: string | null
          data_fechamento: string | null
          forma_pagamento: string | null
          hora_entrada: string | null
          hora_entrega: string | null
          hora_fechamento: string | null
          id: string
          km: string | null
          obs_int: string | null
          obs_os: string | null
          observacoes: string | null
          oficina_id: string
          previsao_entrega: string | null
          relato_cliente: string | null
          status: string
          status_assinatura: string
          termo_autorizacao: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          corresponsavel_id?: string | null
          created_at?: string
          data_entrada?: string | null
          data_fechamento?: string | null
          forma_pagamento?: string | null
          hora_entrada?: string | null
          hora_entrega?: string | null
          hora_fechamento?: string | null
          id?: string
          km?: string | null
          obs_int?: string | null
          obs_os?: string | null
          observacoes?: string | null
          oficina_id: string
          previsao_entrega?: string | null
          relato_cliente?: string | null
          status?: string
          status_assinatura?: string
          termo_autorizacao?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          corresponsavel_id?: string | null
          created_at?: string
          data_entrada?: string | null
          data_fechamento?: string | null
          forma_pagamento?: string | null
          hora_entrada?: string | null
          hora_entrega?: string | null
          hora_fechamento?: string | null
          id?: string
          km?: string | null
          obs_int?: string | null
          obs_os?: string | null
          observacoes?: string | null
          oficina_id?: string
          previsao_entrega?: string | null
          relato_cliente?: string | null
          status?: string
          status_assinatura?: string
          termo_autorizacao?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_corresponsavel_id_fkey"
            columns: ["corresponsavel_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          created_at: string
          id: string
          nome: string
          oficina_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          oficina_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          oficina_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valor_hora: {
        Row: {
          categoria: string
          created_at: string
          id: string
          oficina_id: string
          ordem: number | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          oficina_id: string
          ordem?: number | null
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          oficina_id?: string
          ordem?: number | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "valor_hora_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano_fabricacao: number | null
          ano_modelo: number | null
          chassi: string | null
          cliente_id: string | null
          combustivel: string | null
          cor: string | null
          created_at: string
          id: string
          marca: string | null
          modelo: string | null
          motor: string | null
          observacoes: string | null
          oficina_id: string
          placa: string | null
          updated_at: string
        }
        Insert: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          chassi?: string | null
          cliente_id?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          motor?: string | null
          observacoes?: string | null
          oficina_id: string
          placa?: string | null
          updated_at?: string
        }
        Update: {
          ano_fabricacao?: number | null
          ano_modelo?: number | null
          chassi?: string | null
          cliente_id?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          motor?: string | null
          observacoes?: string | null
          oficina_id?: string
          placa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_oficina_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin_master" | "gerente" | "consultor"
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
      app_role: ["admin_master", "gerente", "consultor"],
    },
  },
} as const
