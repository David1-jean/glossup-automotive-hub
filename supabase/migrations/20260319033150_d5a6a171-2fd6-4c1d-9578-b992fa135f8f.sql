
-- CLIENTES
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  whatsapp text,
  telefone text,
  email text,
  data_nascimento date,
  origem text,
  tipo_pessoa text DEFAULT 'fisica',
  cpf text,
  cnpj text,
  rg text,
  cep text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view clientes of own oficina" ON public.clientes FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert clientes in own oficina" ON public.clientes FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update clientes of own oficina" ON public.clientes FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete clientes of own oficina" ON public.clientes FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- VEICULOS
CREATE TABLE public.veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  placa text,
  marca text,
  modelo text,
  ano_fabricacao integer,
  ano_modelo integer,
  cor text,
  combustivel text,
  chassi text,
  motor text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view veiculos of own oficina" ON public.veiculos FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert veiculos in own oficina" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update veiculos of own oficina" ON public.veiculos FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete veiculos of own oficina" ON public.veiculos FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- PROPOSTAS
CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  consultor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  total numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view propostas of own oficina" ON public.propostas FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert propostas in own oficina" ON public.propostas FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update propostas of own oficina" ON public.propostas FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete propostas of own oficina" ON public.propostas FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- ITENS_PROPOSTA
CREATE TABLE public.itens_proposta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'servico',
  descricao text NOT NULL,
  quantidade numeric(10,2) DEFAULT 1,
  horas numeric(10,2) DEFAULT 0,
  valor numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.itens_proposta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage itens via proposta oficina" ON public.itens_proposta FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.propostas p WHERE p.id = proposta_id AND (p.oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master')))
);

-- PROTOCOLOS
CREATE TABLE public.protocolos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberta',
  status_assinatura text NOT NULL DEFAULT 'não assinado',
  data_entrada date DEFAULT CURRENT_DATE,
  hora_entrada time,
  km text,
  previsao_entrega date,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocolos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view protocolos of own oficina" ON public.protocolos FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert protocolos in own oficina" ON public.protocolos FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update protocolos of own oficina" ON public.protocolos FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete protocolos of own oficina" ON public.protocolos FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- AGENDAMENTOS
CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE SET NULL,
  servico text,
  data date NOT NULL,
  hora time,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view agendamentos of own oficina" ON public.agendamentos FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert agendamentos in own oficina" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update agendamentos of own oficina" ON public.agendamentos FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete agendamentos of own oficina" ON public.agendamentos FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- FINANCEIRO
CREATE TABLE public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'entrada',
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  categoria text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view financeiro of own oficina" ON public.financeiro FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert financeiro in own oficina" ON public.financeiro FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update financeiro of own oficina" ON public.financeiro FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete financeiro of own oficina" ON public.financeiro FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- ESTOQUE
CREATE TABLE public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  codigo text,
  quantidade numeric(10,2) NOT NULL DEFAULT 0,
  quantidade_minima numeric(10,2) DEFAULT 0,
  valor_unitario numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view estoque of own oficina" ON public.estoque FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert estoque in own oficina" ON public.estoque FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update estoque of own oficina" ON public.estoque FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete estoque of own oficina" ON public.estoque FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- SERVICOS
CREATE TABLE public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view servicos of own oficina" ON public.servicos FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert servicos in own oficina" ON public.servicos FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update servicos of own oficina" ON public.servicos FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete servicos of own oficina" ON public.servicos FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));

-- VALOR_HORA
CREATE TABLE public.valor_hora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oficina_id uuid NOT NULL REFERENCES public.oficinas(id) ON DELETE CASCADE,
  ordem integer DEFAULT 0,
  categoria text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.valor_hora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view valor_hora of own oficina" ON public.valor_hora FOR SELECT TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can insert valor_hora in own oficina" ON public.valor_hora FOR INSERT TO authenticated WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can update valor_hora of own oficina" ON public.valor_hora FOR UPDATE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
CREATE POLICY "Users can delete valor_hora of own oficina" ON public.valor_hora FOR DELETE TO authenticated USING (oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'));
