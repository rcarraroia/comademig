import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  onClick?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  hasErrors?: boolean;
  disabled?: boolean;
  text?: string;
  savingText?: string;
  savedText?: string;
  errorText?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  showSavedState?: boolean;
  savedStateDuration?: number;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onClick,
  isSaving = false,
  isDirty = false,
  hasErrors = false,
  disabled = false,
  text = "Salvar Alterações",
  savingText = "Salvando...",
  savedText = "Salvo!",
  errorText = "Erro ao Salvar",
  variant = "default",
  size = "default",
  className,
  showSavedState = true,
  savedStateDuration = 2000
}) => {
  const [showSaved, setShowSaved] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  // Reset states when saving starts
  React.useEffect(() => {
    if (isSaving) {
      setShowSaved(false);
      setShowError(false);
    }
  }, [isSaving]);

  // Show saved state when saving completes successfully
  React.useEffect(() => {
    if (!isSaving && isDirty === false && !hasErrors && showSavedState) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, savedStateDuration);
      return () => clearTimeout(timer);
    }
  }, [isSaving, isDirty, hasErrors, showSavedState, savedStateDuration]);

  // Show error state when there are errors
  React.useEffect(() => {
    if (hasErrors) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasErrors]);

  const getButtonContent = () => {
    if (isSaving) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {savingText}
        </>
      );
    }

    if (showError) {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          {errorText}
        </>
      );
    }

    if (showSaved) {
      return (
        <>
          <Check className="w-4 h-4 mr-2" />
          {savedText}
        </>
      );
    }

    return (
      <>
        <Save className="w-4 h-4 mr-2" />
        {text}
      </>
    );
  };

  const getButtonVariant = () => {
    if (showError) return "destructive";
    if (showSaved) return "default";
    return variant;
  };

  const getButtonClassName = () => {
    const baseClasses = cn(
      "transition-all duration-200",
      {
        "bg-comademig-blue hover:bg-comademig-blue/90": variant === "default" && !showError && !showSaved,
        "bg-green-500 hover:bg-green-600": showSaved,
        "bg-red-500 hover:bg-red-600": showError,
        "opacity-50 cursor-not-allowed": disabled || (!isDirty && !isSaving && !showSaved),
      },
      className
    );
    return baseClasses;
  };

  const isDisabled = disabled || isSaving || (!isDirty && !showSaved) || hasErrors;

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      variant={getButtonVariant() as any}
      size={size}
      className={getButtonClassName()}
    >
      {getButtonContent()}
    </Button>
  );
};

export default SaveButton;