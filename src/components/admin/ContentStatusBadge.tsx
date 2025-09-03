import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Edit, 
  Eye, 
  Settings, 
  CheckCircle, 
  Circle, 
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface ContentStatusBadgeProps {
  pageName: string;
  pageTitle: string;
  hasCustomContent: boolean;
  editorUrl: string;
  publicUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  showOnlyForAdmins?: boolean;
  compact?: boolean;
  lastUpdated?: Date;
  contentPreview?: string;
}

const ContentStatusBadge: React.FC<ContentStatusBadgeProps> = ({
  pageName,
  pageTitle,
  hasCustomContent,
  editorUrl,
  publicUrl,
  position = 'bottom-right',
  className,
  showOnlyForAdmins = true,
  compact = false,
  lastUpdated,
  contentPreview
}) => {
  const { isAdmin } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Não mostrar se não for admin e showOnlyForAdmins estiver ativo
  if (showOnlyForAdmins && !isAdmin()) {
    return null;
  }

  // Não mostrar se foi ocultado
  if (!isVisible) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getStatusInfo = () => {
    if (hasCustomContent) {
      return {
        status: 'Personalizado',
        color: 'bg-green-500',
        icon: CheckCircle,
        description: 'Esta página tem conteúdo personalizado'
      };
    } else {
      return {
        status: 'Padrão',
        color: 'bg-gray-500',
        icon: Circle,
        description: 'Esta página usa conteúdo padrão'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <div className={cn(
        "fixed z-50 transition-all duration-200",
        getPositionClasses(),
        className
      )}>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow",
              statusInfo.color
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.status}
          </Badge>
          
          <Button
            size="sm"
            asChild
            className="bg-comademig-blue hover:bg-comademig-blue/90 shadow-lg"
          >
            <Link to={editorUrl}>
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300",
      getPositionClasses(),
      className
    )}>
      <Card className={cn(
        "shadow-lg border-2 transition-all duration-300",
        {
          "border-green-200 bg-green-50": hasCustomContent,
          "border-gray-200 bg-gray-50": !hasCustomContent,
          "w-80": isExpanded,
          "w-auto": !isExpanded
        }
      )}>
        <CardContent className="p-3">
          {/* Header compacto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-white text-xs",
                  statusInfo.color
                )}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.status}
              </Badge>
              
              <span className="text-xs font-medium text-gray-700">
                {pageTitle}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Conteúdo expandido */}
          {isExpanded && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="text-xs text-gray-600">
                {statusInfo.description}
              </div>
              
              {lastUpdated && (
                <div className="text-xs text-gray-500">
                  Última atualização: {lastUpdated.toLocaleDateString('pt-BR')} às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              
              {contentPreview && (
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <div className="font-medium mb-1">Preview:</div>
                  <div className="truncate">{contentPreview}</div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Button
                  size="sm"
                  asChild
                  className="bg-comademig-blue hover:bg-comademig-blue/90 flex-1"
                >
                  <Link to={editorUrl}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar Página
                  </Link>
                </Button>
                
                {publicUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver Original
                    </a>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-500">
                  Página: {pageName}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Ocultar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Hook para facilitar o uso do badge
export const useContentStatusBadge = (
  pageName: string,
  hasCustomContent: boolean,
  options?: {
    pageTitle?: string;
    editorUrl?: string;
    publicUrl?: string;
    position?: ContentStatusBadgeProps['position'];
    compact?: boolean;
    lastUpdated?: Date;
    contentPreview?: string;
  }
) => {
  const defaultOptions = {
    pageTitle: pageName.charAt(0).toUpperCase() + pageName.slice(1),
    editorUrl: `/dashboard/admin/content/${pageName}-editor`,
    publicUrl: pageName === 'home' ? '/' : `/${pageName}`,
    position: 'bottom-right' as const,
    compact: false,
    ...options
  };

  const BadgeComponent = () => (
    <ContentStatusBadge
      pageName={pageName}
      pageTitle={defaultOptions.pageTitle}
      hasCustomContent={hasCustomContent}
      editorUrl={defaultOptions.editorUrl}
      publicUrl={defaultOptions.publicUrl}
      position={defaultOptions.position}
      compact={defaultOptions.compact}
      lastUpdated={defaultOptions.lastUpdated}
      contentPreview={defaultOptions.contentPreview}
    />
  );

  return { BadgeComponent };
};

// Componente para mostrar badge flutuante global
interface FloatingContentBadgeProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const FloatingContentBadge: React.FC<FloatingContentBadgeProps> = ({
  isVisible = true,
  onToggle
}) => {
  const { isAdmin } = useAuth();

  if (!isAdmin() || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="bg-white shadow-lg border-comademig-blue text-comademig-blue hover:bg-comademig-light"
      >
        <Settings className="w-4 h-4 mr-2" />
        Modo Editor
      </Button>
    </div>
  );
};

export default ContentStatusBadge;