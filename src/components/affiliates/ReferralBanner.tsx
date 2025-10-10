import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, Gift } from "lucide-react";

interface ReferralBannerProps {
  affiliateName: string;
}

export function ReferralBanner({ affiliateName }: ReferralBannerProps) {
  return (
    <Card className="border-comademig-gold bg-gradient-to-r from-comademig-gold/10 to-comademig-blue/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-comademig-gold rounded-full flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-comademig-blue">
                Você foi indicado!
              </h3>
              <Gift className="h-4 w-4 text-comademig-gold" />
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>{affiliateName}</strong> indicou você para se filiar ao COMADEMIG.
              Complete seu cadastro para que a indicação seja registrada.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
