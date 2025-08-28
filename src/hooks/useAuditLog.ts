import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Interface para log de auditoria
export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  
  // Campos calculados
  operation_description?: string;
  changes_summary?: string;
}

// Interface para criar log manual
export interface CreateAuditLogData {
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'DOWNLOAD';
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  // Query para buscar logs de auditoria com filtros
  const useAuditLogs = (filters?: {
    table_name?: string;
    operation?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) => {
    return useSupabaseQuery<AuditLog[]>(
      ['audit-logs', filters],
      async (): Promise<AuditLog[]> => {
        let query = supabase
          .from('member_system_audit')
          .select('*')
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters?.table_name) {
          query = query.eq('table_name', filters.table_name);
        }
        
        if (filters?.operation) {
          query = query.eq('operation', filters.operation);
        }
        
        if (filters?.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        
        if (filters?.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        
        if (filters?.date_to) {
          query = query.lte('created_at', filters.date_to);
        }
        
        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.limit(100); // Limite padrão
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar logs de auditoria:', error);
          throw error;
        }

        // Processar dados para adicionar campos calculados
        return (data || []).map(log => ({
          ...log,
          operation_description: getOperationDescription(log.operation, log.table_name),
          changes_summary: getChangesSummary(log.old_values, log.new_values)
        }));
      },
      {
        staleTime: 30 * 1000, // Cache por 30 segundos
        cacheTime: 5 * 60 * 1000 // Manter em cache por 5 minutos
      }
    );
  };

  // Query para buscar logs do usuário atual
  const { 
    data: userLogs = [], 
    isLoading: loadingUserLogs, 
    refetch: refetchUserLogs 
  } = useSupabaseQuery<AuditLog[]>(
    ['user-audit-logs', user?.id],
    async (): Promise<AuditLog[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('member_system_audit')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar logs do usuário:', error);
        throw error;
      }

      return (data || []).map(log => ({
        ...log,
        operation_description: getOperationDescription(log.operation, log.table_name),
        changes_summary: getChangesSummary(log.old_values, log.new_values)
      }));
    },
    {
      enabled: !!user,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000
    }
  );

  // Mutation para criar log manual
  const createAuditLog = useSupabaseMutation<AuditLog, CreateAuditLogData>(
    async (logData: CreateAuditLogData): Promise<AuditLog> => {
      // Obter informações do navegador
      const userAgent = navigator.userAgent;
      const ipAddress = await getUserIP();

      const { data, error } = await supabase
        .from('member_system_audit')
        .insert({
          table_name: logData.table_name,
          operation: logData.operation,
          record_id: logData.record_id,
          old_values: logData.old_values,
          new_values: logData.new_values,
          user_id: user?.id,
          user_email: user?.email,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            description: logData.description,
            ...logData.metadata
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar log de auditoria:', error);
        throw error;
      }

      return {
        ...data,
        operation_description: getOperationDescription(data.operation, data.table_name),
        changes_summary: getChangesSummary(data.old_values, data.new_values)
      };
    }
  );

  // Função para obter IP do usuário (simplificada)
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  };

  // Função para gerar descrição da operação
  const getOperationDescription = (operation: string, tableName: string): string => {
    const tableNames: Record<string, string> = {
      'member_types': 'Tipos de Membro',
      'subscription_plans': 'Planos de Assinatura',
      'user_subscriptions': 'Assinaturas de Usuário',
      'profiles': 'Perfis de Usuário',
      'carteira_digital': 'Carteira Digital',
      'payments': 'Pagamentos'
    };

    const operations: Record<string, string> = {
      'INSERT': 'Criação',
      'UPDATE': 'Atualização',
      'DELETE': 'Exclusão',
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',
      'VIEW': 'Visualização',
      'DOWNLOAD': 'Download'
    };

    const table = tableNames[tableName] || tableName;
    const op = operations[operation] || operation;

    return `${op} em ${table}`;
  };

  // Função para gerar resumo das mudanças
  const getChangesSummary = (oldValues?: Record<string, any>, newValues?: Record<string, any>): string => {
    if (!oldValues && !newValues) return 'Sem alterações registradas';
    
    if (!oldValues && newValues) {
      const fields = Object.keys(newValues).length;
      return `Registro criado com ${fields} campo(s)`;
    }
    
    if (oldValues && !newValues) {
      return 'Registro excluído';
    }
    
    if (oldValues && newValues) {
      const changes: string[] = [];
      
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes.push(key);
        }
      });
      
      if (changes.length === 0) return 'Nenhuma alteração detectada';
      
      return `Alterados: ${changes.join(', ')}`;
    }
    
    return 'Alteração não especificada';
  };

  // Função para registrar atividade do usuário
  const logUserActivity = async (activity: {
    action: string;
    table_name: string;
    record_id: string;
    description?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      await createAuditLog.mutateAsync({
        table_name: activity.table_name,
        operation: 'VIEW',
        record_id: activity.record_id,
        description: activity.description || activity.action,
        metadata: {
          action: activity.action,
          ...activity.metadata
        }
      });
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  };

  // Função para registrar login
  const logLogin = async () => {
    if (!user) return;
    
    try {
      await createAuditLog.mutateAsync({
        table_name: 'auth_sessions',
        operation: 'LOGIN',
        record_id: user.id,
        description: 'Login realizado com sucesso',
        metadata: {
          login_method: 'email',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao registrar login:', error);
    }
  };

  // Função para registrar logout
  const logLogout = async () => {
    if (!user) return;
    
    try {
      await createAuditLog.mutateAsync({
        table_name: 'auth_sessions',
        operation: 'LOGOUT',
        record_id: user.id,
        description: 'Logout realizado',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao registrar logout:', error);
    }
  };

  // Função para registrar download
  const logDownload = async (fileName: string, fileType: string) => {
    if (!user) return;
    
    try {
      await createAuditLog.mutateAsync({
        table_name: 'downloads',
        operation: 'DOWNLOAD',
        record_id: `${user.id}_${Date.now()}`,
        description: `Download de ${fileName}`,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erro ao registrar download:', error);
    }
  };

  return {
    // Hooks
    useAuditLogs,
    
    // Data
    userLogs,
    loadingUserLogs,
    
    // Actions
    createAuditLog,
    refetchUserLogs,
    
    // Utilities
    logUserActivity,
    logLogin,
    logLogout,
    logDownload,
    getOperationDescription,
    getChangesSummary
  };
};