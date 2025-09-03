import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContentFormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  step?: number;
  totalSteps?: number;
  isRequired?: boolean;
  isCompleted?: boolean;
  hasErrors?: boolean;
  errorCount?: number;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const ContentFormSection: React.FC<ContentFormSectionProps> = ({
  title,
  description,
  icon,
  step,
  totalSteps,
  isRequired = false,
  isCompleted = false,
  hasErrors = false,
  errorCount = 0,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const getStepIndicator = () => {
    if (!step) return null;

    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold",
        {
          "bg-comademig-gold text-white": !hasErrors && !isCompleted,
          "bg-green-500 text-white": isCompleted && !hasErrors,
          "bg-red-500 text-white": hasErrors,
        }
      )}>
        {hasErrors ? '!' : step}
      </div>
    );
  };

  const getStatusBadges = () => {
    const badges = [];

    if (isRequired) {
      badges.push(
        <Badge key="required" variant="destructive" className="text-xs">
          Obrigatório
        </Badge>
      );
    }

    if (isCompleted && !hasErrors) {
      badges.push(
        <Badge key="completed" variant="default" className="bg-green-500 text-xs">
          Completo
        </Badge>
      );
    }

    if (hasErrors) {
      badges.push(
        <Badge key="errors" variant="destructive" className="text-xs">
          {errorCount > 1 ? `${errorCount} erros` : '1 erro'}
        </Badge>
      );
    }

    return badges;
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      {
        "border-red-200 bg-red-50/30": hasErrors,
        "border-green-200 bg-green-50/30": isCompleted && !hasErrors,
        "border-yellow-200 bg-yellow-50/30": isRequired && !isCompleted && !hasErrors,
      },
      className
    )}>
      <CardHeader 
        className={cn(
          "pb-4",
          {
            "cursor-pointer": collapsible,
          }
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStepIndicator()}
            {icon && !step && (
              <div className="mr-3">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{title}</span>
                {totalSteps && step && (
                  <span className="text-sm text-gray-500 font-normal">
                    ({step} de {totalSteps})
                  </span>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadges()}
            {collapsible && (
              <div className="ml-2">
                {isCollapsed ? '▼' : '▲'}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      {(!collapsible || !isCollapsed) && (
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default ContentFormSection;