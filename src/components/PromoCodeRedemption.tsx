import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePromoCode } from '@/hooks/usePromoCode';
import { Gift, Loader2 } from 'lucide-react';

interface PromoCodeRedemptionProps {
  onSuccess?: () => void;
}

const PromoCodeRedemption = ({ onSuccess }: PromoCodeRedemptionProps) => {
  const [code, setCode] = useState('');
  const { redeemPromoCode, loading } = usePromoCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await redeemPromoCode(code);
    if (success) {
      setCode('');
      onSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Have a Promo Code?
        </CardTitle>
        <CardDescription>
          Enter your promo code to unlock subscription benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="promo-code" className="sr-only">
              Promo Code
            </Label>
            <Input
              id="promo-code"
              type="text"
              placeholder="Enter promo code (e.g., A9F3C8E2D1B4)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              disabled={loading}
              maxLength={12}
            />
          </div>
          <Button type="submit" disabled={loading || !code.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PromoCodeRedemption;
