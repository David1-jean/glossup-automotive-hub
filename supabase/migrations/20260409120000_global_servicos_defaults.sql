-- Permite serviços globais compartilhados entre oficinas
ALTER TABLE public.servicos
  ALTER COLUMN oficina_id DROP NOT NULL;

-- Atualiza a policy de leitura para incluir serviços globais
DROP POLICY IF EXISTS "Users can view servicos of own oficina" ON public.servicos;

CREATE POLICY "Users can view servicos of own oficina"
  ON public.servicos FOR SELECT TO authenticated
  USING (
    oficina_id IS NULL
    OR oficina_id = get_user_oficina_id(auth.uid())
    OR has_role(auth.uid(), 'admin_master')
  );

-- Serviços padrão globais de funilaria e pintura
WITH default_servicos(nome) AS (
  VALUES
    ('VIGIA TRASEIRA (DESMONTAGEM/MONTAGEM)'),
    ('VIDRO PARABRISA (DESMONTAGEM/MONTAGEM)'),
    ('TRAVESSA PARACHOQUE TRAS (RECUPERAÇÃO)'),
    ('TRAVESSA PARACHOQUE TRAS (PINTURA)'),
    ('TRAVESSA PARACHOQUE DIANT (TROCA)'),
    ('TRAVESSA PARACHOQUE DIANT (RECUPERAÇÃO)'),
    ('TRAVESSA PARACHOQUE DIANT (PINTURA)'),
    ('TRAVESSA PARACHOQUE DIANT (DESMONTAGEM/MONTAGEM)'),
    ('TETO (RECUPERAÇÃO)'),
    ('TETO (PINTURA)'),
    ('TETO (MARTELINHO)'),
    ('PARALAMA DIANT DIREITO (PINTURA)'),
    ('PARALAMA DIANT DIREITO (RECUPERAÇÃO)'),
    ('PARALAMA DIANT DIREITO (TROCA)'),
    ('PARALAMA DIANT ESQUERDO (PINTURA)'),
    ('PARALAMA DIANT ESQUERDO (RECUPERAÇÃO)'),
    ('PARALAMA DIANT ESQUERDO (TROCA)'),
    ('PORTA DIANT DIREITA (PINTURA)'),
    ('PORTA DIANT DIREITA (RECUPERAÇÃO)'),
    ('PORTA DIANT DIREITA (TROCA)'),
    ('PORTA DIANT ESQUERDA (PINTURA)'),
    ('PORTA DIANT ESQUERDA (RECUPERAÇÃO)'),
    ('PORTA DIANT ESQUERDA (TROCA)'),
    ('PORTA TRAS DIREITA (PINTURA)'),
    ('PORTA TRAS DIREITA (RECUPERAÇÃO)'),
    ('PORTA TRAS DIREITA (TROCA)'),
    ('PORTA TRAS ESQUERDA (PINTURA)'),
    ('PORTA TRAS ESQUERDA (RECUPERAÇÃO)'),
    ('PORTA TRAS ESQUERDA (TROCA)'),
    ('MALA (PINTURA)'),
    ('MALA (RECUPERAÇÃO)'),
    ('MALA (TROCA)'),
    ('CAPÔ (PINTURA)'),
    ('CAPÔ (RECUPERAÇÃO)'),
    ('CAPÔ (TROCA)'),
    ('PARA-CHOQUE DIANT (PINTURA)'),
    ('PARA-CHOQUE DIANT (RECUPERAÇÃO)'),
    ('PARA-CHOQUE DIANT (TROCA)'),
    ('PARA-CHOQUE TRAS (PINTURA)'),
    ('PARA-CHOQUE TRAS (RECUPERAÇÃO)'),
    ('PARA-CHOQUE TRAS (TROCA)'),
    ('LONGARINA DIANT DIREITA (RECUPERAÇÃO)'),
    ('LONGARINA DIANT ESQUERDA (RECUPERAÇÃO)'),
    ('ASSOALHO (RECUPERAÇÃO)'),
    ('COLUNA A DIREITA (RECUPERAÇÃO)'),
    ('COLUNA A ESQUERDA (RECUPERAÇÃO)'),
    ('COLUNA B DIREITA (RECUPERAÇÃO)'),
    ('COLUNA B ESQUERDA (RECUPERAÇÃO)')
)
INSERT INTO public.servicos (nome, oficina_id)
SELECT ds.nome, NULL
FROM default_servicos ds
WHERE NOT EXISTS (
  SELECT 1
  FROM public.servicos s
  WHERE s.oficina_id IS NULL
    AND s.nome = ds.nome
);
