
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signOut, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login');
        } else {
          throw new Error(error.message);
        }
      }
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao portal COMADEMIG!",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, userData: any) => {
    setLoading(true);
    try {
      const { error } = await signUp(email, password, userData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Verifique seu email para confirmar a conta.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handlePasswordReset,
    loading,
  };
};
