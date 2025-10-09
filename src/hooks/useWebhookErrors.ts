import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WebhookError {
  id: string;
  payment_id: string;
  error_message: string;
  error_stack?: string;
  payload?: any;
  retry_count: number;
  last_retry_at?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export function useWebhookErrors() {
  const queryClient = useQueryClient();

  // Query para buscar erros não resolvidos
  const { data: errors, isLoading, error } = useQuery({
    queryKey: ["webhook-errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_errors")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WebhookError[];
    },
  });

  // Query para buscar erros resolvidos (histórico)
  const { data: resolvedErrors } = useQuery({
    queryKey: ["webhook-errors-resolved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_errors")
        .select("*")
        .eq("resolved", true)
        .order("resolved_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WebhookError[];
    },
  });

  // Mutation para reprocessar webhook
  const retryWebhook = useMutation({
    mutationFn: async (errorId: string) => {
      const { data, error } = await supabase.rpc("retry_webhook_error", {
        p_error_id: errorId,
      });

      if (error) throw error;
      return data as { success: boolean; message: string; protocolo?: string; error?: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        if (data.protocolo) {
          toast.info(`Protocolo gerado: ${data.protocolo}`);
        }
        // Invalidar queries para atualizar listas
        queryClient.invalidateQueries({ queryKey: ["webhook-errors"] });
        queryClient.invalidateQueries({ queryKey: ["webhook-errors-resolved"] });
        queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
      } else {
        toast.error(`Erro ao reprocessar: ${data.error}`);
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao reprocessar webhook: ${error.message}`);
    },
  });

  // Mutation para marcar como resolvido manualmente
  const markAsResolved = useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from("webhook_errors")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", errorId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Erro marcado como resolvido");
      queryClient.invalidateQueries({ queryKey: ["webhook-errors"] });
      queryClient.invalidateQueries({ queryKey: ["webhook-errors-resolved"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao marcar como resolvido: ${error.message}`);
    },
  });

  return {
    errors,
    resolvedErrors,
    isLoading,
    error,
    retryWebhook: retryWebhook.mutate,
    isRetrying: retryWebhook.isPending,
    markAsResolved: markAsResolved.mutate,
    isMarkingResolved: markAsResolved.isPending,
  };
}
