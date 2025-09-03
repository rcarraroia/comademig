import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContentFormLayoutProps {
  title: string;
  description: string;
  backUrl?: string;
  publicUrl?: string;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  saveButtonText?: string;
  showPreviewButton?: boolean;
}

const ContentFormLayout: React.FC<ContentFormLayoutProps> = ({
  title,
  description,
  backUrl = "/dashboard/content",
  publicUrl,
  onSave,
  isSaving = false,
  isDirty = false,
  hasErrors = false,
  errorMessage,
  children,
  saveButtonText = "Salvar Alterações",
  showPreviewButton = true
}) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={backUrl}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-comademig-blue">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {showPreviewButton && publicUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Página
              </a>
            </Button>
          )}
          
          {onSave && (
            <Button 
              onClick={onSave}
              disabled={isSaving || !isDirty || hasErrors}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : saveButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {hasErrors && errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <div className="space-y-8">
        {children}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t">
        <Button variant="outline" asChild>
          <Link to={backUrl}>Cancelar</Link>
        </Button>
        
        <div className="flex items-center space-x-3">
          {showPreviewButton && publicUrl && (
            <Button
              variant="outline"
              asChild
            >
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Página
              </a>
            </Button>
          )}
          
          {onSave && (
            <Button 
              onClick={onSave}
              disabled={isSaving || !isDirty || hasErrors}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : saveButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      {isDirty && !isSaving && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
            Alterações não salvas
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFormLayout;