import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPreviewProps {
  title?: string;
  description?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  publicUrl?: string;
  children: React.ReactNode;
  className?: string;
  hasChanges?: boolean;
  lastSaved?: Date;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  title = "Visualização",
  description = "Preview das alterações em tempo real",
  isVisible = true,
  onToggleVisibility,
  isExpanded = false,
  onToggleExpanded,
  publicUrl,
  children,
  className,
  hasChanges = false,
  lastSaved
}) => {
  if (!isVisible) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-gray-500">{title}</CardTitle>
              <CardDescription>Preview oculto</CardDescription>
            </div>
            {onToggleVisibility && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleVisibility}
              >
                <Eye className="w-4 h-4 mr-2" />
                Mostrar Preview
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      {
        "border-blue-200 shadow-md": isExpanded,
        "border-yellow-200": hasChanges,
      },
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{title}</span>
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Alterações não salvas
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {description}
                {lastSaved && (
                  <span className="ml-2 text-xs text-gray-500">
                    • Última atualização: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {publicUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Original
                </a>
              </Button>
            )}
            
            {onToggleExpanded && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExpanded}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Expandir
                  </>
                )}
              </Button>
            )}
            
            {onToggleVisibility && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleVisibility}
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Ocultar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={cn(
        "transition-all duration-200",
        {
          "max-h-96 overflow-y-auto": !isExpanded,
          "max-h-none": isExpanded,
        }
      )}>
        <div className={cn(
          "border rounded-lg p-4 bg-gray-50",
          {
            "border-yellow-300 bg-yellow-50": hasChanges,
          }
        )}>
          {children}
        </div>
        
        {!isExpanded && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="text-comademig-blue"
            >
              Ver preview completo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentPreview;