-- Função para reprocessar webhook manualmente
CREATE OR REPLACE FUNCTION retry_webhook_error(
  p_error_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error RECORD;
  v_cobranca RECORD;
  v_payment JSONB;
  v_protocolo TEXT;
  v_solicitacao_id UUID;
  v_result JSONB;
BEGIN
  -- Verificar se usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND tipo_membro IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem reprocessar webhooks.';
  END IF;

  -- Buscar erro
  SELECT * INTO v_error
  FROM webhook_errors
  WHERE id = p_error_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Erro de webhook não encontrado';
  END IF;

  IF v_error.resolved THEN
    RAISE EXCEPTION 'Este erro já foi resolvido';
  END IF;

  -- Extrair dados do payload
  v_payment := v_error.payload->'payment';
  
  -- Buscar cobrança
  SELECT * INTO v_cobranca
  FROM asaas_cobrancas
  WHERE asaas_payment_id = v_error.payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cobrança não encontrada';
  END IF;

  -- Verificar se já existe solicitação para este pagamento
  IF EXISTS (
    SELECT 1 FROM solicitacoes_servicos
    WHERE payment_id = v_error.payment_id
  ) THEN
    -- Marcar como resolvido
    UPDATE webhook_errors
    SET resolved = TRUE,
        resolved_at = NOW(),
        resolved_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_error_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Solicitação já existe para este pagamento',
      'already_exists', true
    );
  END IF;

  -- Gerar protocolo
  v_protocolo := 'SRV-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || 
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 9));

  -- Criar solicitação
  INSERT INTO solicitacoes_servicos (
    user_id,
    servico_id,
    protocolo,
    status,
    valor,
    dados_adicionais,
    documentos,
    payment_id,
    payment_status,
    payment_method,
    created_at
  )
  VALUES (
    v_cobranca.user_id,
    (v_cobranca.service_data->>'servico_id')::UUID,
    v_protocolo,
    'pendente',
    (v_payment->>'value')::DECIMAL,
    COALESCE(v_cobranca.service_data->'dados_formulario', '{}'::JSONB),
    COALESCE(v_cobranca.service_data->'documentos', '[]'::JSONB),
    v_error.payment_id,
    v_payment->>'status',
    v_payment->>'billingType',
    NOW()
  )
  RETURNING id INTO v_solicitacao_id;

  -- Criar notificação para usuário
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    link,
    read,
    created_at
  )
  VALUES (
    v_cobranca.user_id,
    'Pagamento Confirmado',
    'Seu pagamento foi confirmado! Protocolo: ' || v_protocolo || '. Sua solicitação está sendo processada.',
    'payment_confirmed',
    '/dashboard/solicitacao-servicos?protocolo=' || v_protocolo,
    FALSE,
    NOW()
  );

  -- Criar notificações para admins
  INSERT INTO notifications (user_id, title, message, type, link, read, created_at)
  SELECT 
    id,
    'Nova Solicitação de Serviço',
    'Nova solicitação recebida. Protocolo: ' || v_protocolo,
    'new_service_request',
    '/admin/solicitacoes?protocolo=' || v_protocolo,
    FALSE,
    NOW()
  FROM profiles
  WHERE tipo_membro IN ('admin', 'super_admin');

  -- Registrar em audit_logs
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes,
    created_at
  )
  VALUES (
    auth.uid(),
    'service_request_created_from_retry',
    'solicitacoes_servicos',
    v_solicitacao_id,
    jsonb_build_object(
      'protocolo', v_protocolo,
      'servico_id', v_cobranca.service_data->>'servico_id',
      'payment_id', v_error.payment_id,
      'valor', v_payment->>'value',
      'retry_from_error_id', p_error_id
    ),
    NOW()
  );

  -- Atualizar erro como resolvido
  UPDATE webhook_errors
  SET resolved = TRUE,
      resolved_at = NOW(),
      resolved_by = auth.uid(),
      retry_count = retry_count + 1,
      last_retry_at = NOW(),
      updated_at = NOW()
  WHERE id = p_error_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Solicitação criada com sucesso',
    'protocolo', v_protocolo,
    'solicitacao_id', v_solicitacao_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Incrementar contador de retry
    UPDATE webhook_errors
    SET retry_count = retry_count + 1,
        last_retry_at = NOW(),
        updated_at = NOW()
    WHERE id = p_error_id;

    -- Retornar erro
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Comentário
COMMENT ON FUNCTION retry_webhook_error IS 'Reprocessa manualmente um webhook que falhou, criando a solicitação de serviço';
