/**
 * Banner para destacar o desconto PIX de 5%
 * Mostra economia e incentiva o uso do PIX
 */

import React from 'react';
import { Zap, Percent, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PixDiscountBannerProps {
  originalValue: number;
  discountedValue: number;
  discountPercentage?: number;
  className?: string;
}

export const PixDiscountBanner: React.FC<PixDiscountBannerProps> = ({
  originalValue,
  discountedValue,
  discountPercentage = 5,
  className = ""
}) => {
  const savings = originalValue - discountedValue;

  return (
    <Card className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-800">PIX Instantâneo</span>
                <Badge className="bg-green-600 text-white">
                  <Percent className="w-3 h-3 mr-1" />
                  {discountPercentage}% OFF
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>Aprovação imediata</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 line-through">
              R$ {originalValue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-lg font-bold text-green-600">
              R$ {discountedValue.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-xs text-green-600">
              Economia: R$ {savings.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-center gap-2 text-xs text-green-700">
            <Zap className="w-3 h-3" />
            <span>Pagamento instantâneo • Sem taxas adicionais • Desconto automático</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};