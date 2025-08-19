
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProfileValidation } from "@/hooks/useProfileValidation";
import { AlertCircle, CheckCircle } from "lucide-react";

export const ProfileCompletion = () => {
  const { 
    isProfileComplete, 
    getProfileCompletionPercentage, 
    getMissingRequiredFields,
    profileStatus 
  } = useProfileValidation();

  const completionPercentage = getProfileCompletionPercentage();
  const missingFields = getMissingRequiredFields();
  const isComplete = isProfileComplete();

  if (isComplete && profileStatus === 'ativo') {
    return null; // Não mostrar se o perfil está completo e ativo
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          Status do Perfil
        </CardTitle>
        <CardDescription>
          {isComplete ? 
            "Seu perfil está completo. Aguarde a aprovação." :
            "Complete seu perfil para ter acesso completo aos serviços"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Completude do Perfil</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {profileStatus !== 'ativo' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Status atual: <strong>{profileStatus === 'pendente' ? 'Pendente de aprovação' : profileStatus}</strong>
              {profileStatus === 'pendente' && ' - Sua documentação está sendo analisada'}
            </AlertDescription>
          </Alert>
        )}

        {!isComplete && missingFields.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Campos obrigatórios pendentes:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {missingFields.slice(0, 5).map((field) => (
                <li key={field.key}>• {field.label}</li>
              ))}
              {missingFields.length > 5 && (
                <li>• ... e mais {missingFields.length - 5} campos</li>
              )}
            </ul>
          </div>
        )}

        {!isComplete && (
          <Button asChild className="w-full">
            <Link to="/dashboard/meus-dados">
              Completar Perfil
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
