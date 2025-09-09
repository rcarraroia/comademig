import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthActions } from "@/hooks/useAuthActions";

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuthActions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });

    } catch (error: any) {
      console.error('Erro ao enviar email de reset:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-comademig-light py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-800">Email Enviado!</CardTitle>
                <CardDescription>
                  Instruções para redefinir sua senha foram enviadas para seu email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Próximos passos:</strong>
                    <ol className="mt-2 text-sm space-y-1 list-decimal list-inside">
                      <li>Verifique sua caixa de entrada</li>
                      <li>Procure por um email da COMADEMIG</li>
                      <li>Clique no link para redefinir sua senha</li>
                      <li>Se não encontrar, verifique a pasta de spam</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Enviar novamente
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
                  >
                    Voltar para Login
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Não recebeu o email? Verifique se o endereço está correto ou entre em contato com o suporte.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-comademig-light py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-montserrat font-bold text-3xl text-comademig-blue mb-2">
              Esqueci Minha Senha
            </h1>
            <p className="font-inter text-gray-600">
              Digite seu email para receber instruções de redefinição
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Redefinir Senha</CardTitle>
              <CardDescription className="text-center">
                Enviaremos um link para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Digite o email associado à sua conta COMADEMIG. 
                    Enviaremos um link seguro para redefinir sua senha.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full bg-comademig-blue hover:bg-comademig-blue/90"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Link de Redefinição"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full border-comademig-blue text-comademig-blue hover:bg-comademig-blue hover:text-white"
                >
                  <Link to="/auth">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                  </Link>
                </Button>
                
                <div className="text-sm text-gray-600">
                  <p>Lembrou da senha? <Link to="/auth" className="text-comademig-blue hover:underline">Fazer login</Link></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;