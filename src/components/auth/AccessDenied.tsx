import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AccessDeniedProps {
  title?: string
  message?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  backTo?: string
}

export default function AccessDenied({
  title = 'Acesso Negado',
  message = 'Você não tem permissão para acessar esta página.',
  showBackButton = true,
  showHomeButton = true,
  backTo = '/dashboard'
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              Se você acredita que deveria ter acesso a esta página, 
              entre em contato com o administrador do sistema.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {showBackButton && (
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link to={backTo}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                className="flex-1"
                asChild
              >
                <Link to="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Início
                </Link>
              </Button>
            )}
          </div>

          <div className="text-center">
            <Link 
              to="/support" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Precisa de ajuda? Entre em contato
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}