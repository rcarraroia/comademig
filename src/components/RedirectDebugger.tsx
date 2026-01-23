import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { redirectService } from '@/services/RedirectService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Componente de debug para visualizar o estado do sistema de redirecionamento
 * Útil para desenvolvimento e troubleshooting
 */
const RedirectDebugger: React.FC = () => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Só mostrar em desenvolvimento
  }

  const redirectCheck = redirectService.shouldRedirect(
    profile, 
    location.pathname, 
    loading
  );

  const canAccess = redirectService.canAccessRoute(profile, location.pathname);
  const defaultRoute = redirectService.getDefaultRouteAfterLogin(profile);

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto z-50 bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Redirect Debugger</CardTitle>
        <CardDescription className="text-xs">
          Sistema de redirecionamento centralizado
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Current Path:</strong> {location.pathname}
        </div>
        
        <div>
          <strong>User Type:</strong> {profile?.tipo_membro || 'N/A'}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Can Access:</strong> {canAccess ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Should Redirect:</strong> {redirectCheck.shouldRedirect ? '🔄 Yes' : '✅ No'}
        </div>
        
        {redirectCheck.shouldRedirect && (
          <div>
            <strong>Target:</strong> {redirectCheck.targetRoute}
          </div>
        )}
        
        {redirectCheck.reason && (
          <div>
            <strong>Reason:</strong> {redirectCheck.reason}
          </div>
        )}
        
        <div>
          <strong>Default Route:</strong> {defaultRoute}
        </div>
        
        <div className="pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => redirectService.clearRedirectHistory()}
            className="w-full text-xs"
          >
            Clear History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RedirectDebugger;