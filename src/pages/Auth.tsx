
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { user } = useAuth();
  const { signIn } = useAuthActions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const confirmed = searchParams.get('confirmed');

  useEffect(() => {
    if (user) {
      // Verificar se é admin e redirecionar apropriadamente
      // Nota: profile pode não estar carregado ainda no useEffect
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
        return { success: false };
      }
      
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await handleSignIn(loginData.email, loginData.password);
    
    if (result.success) {
      // Buscar perfil do usuário para verificar se é admin
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          // Redirecionar baseado no role
          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            navigate("/admin/users");
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        // Em caso de erro, redirecionar para dashboard
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-comademig-light py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-montserrat font-bold text-3xl text-comademig-blue mb-2">
              Portal COMADEMIG
            </h1>
            <p className="font-inter text-gray-600">
              Acesse sua conta
            </p>
          </div>

          {confirmed && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email confirmado com sucesso! Agora você pode fazer login.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Fazer Login</CardTitle>
              <CardDescription className="text-center">
                Entre com seu email e senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <Link
                      to="/esqueci-senha"
                      className="text-sm text-comademig-blue hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Ainda não possui uma conta?
                </p>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
                >
                  <Link to="/filiacao">
                    Solicitar Filiação
                  </Link>
                </Button>
              </div>
            </CardContent>
            
            <div className="px-6 pb-6">
              <div className="text-center text-sm text-gray-600">
                <Link to="/" className="text-comademig-blue hover:underline">
                  ← Voltar para o site
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
