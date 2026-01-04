import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Copy, Trash2, Gift, RefreshCw, Calendar, Users, Crown, Zap, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  subscription_tier: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  redeemed_by_user_id: string | null;
  redeemed_by_email: string | null;
  redeemed_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface ActivePromoSubscriber {
  email: string;
  tier: string;
  subscription_end: string | null;
}

interface PromoCodesManagementProps {
  loading: boolean;
}

const PromoCodesManagement = ({ loading: parentLoading }: PromoCodesManagementProps) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('Starter');
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [promoSubscribers, setPromoSubscribers] = useState<ActivePromoSubscriber[]>([]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoSubscribers = async () => {
    try {
      // Fetch subscribers who have active subscriptions but no stripe_customer_id (promo code users)
      const { data, error } = await supabase
        .from('subscribers')
        .select('email, subscription_tier, subscription_end')
        .eq('subscribed', true)
        .is('stripe_customer_id', null)
        .not('subscription_tier', 'eq', 'Free');

      if (error) throw error;
      
      setPromoSubscribers((data || []).map((s: any) => ({
        email: s.email,
        tier: s.subscription_tier,
        subscription_end: s.subscription_end
      })));
    } catch (error) {
      console.error('Error fetching promo subscribers:', error);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
    fetchPromoSubscribers();
  }, []);

  // Calculate promo stats
  const promoStats = useMemo(() => {
    const STARTER_PRICE = 12;
    const PRO_PRICE = 25;
    
    const starterCount = promoSubscribers.filter(s => s.tier === 'Starter').length;
    const proCount = promoSubscribers.filter(s => s.tier === 'Pro').length;
    const valueGranted = (starterCount * STARTER_PRICE) + (proCount * PRO_PRICE);
    
    return {
      total: promoSubscribers.length,
      starterCount,
      proCount,
      valueGranted
    };
  }, [promoSubscribers]);

  const generateRandomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreatePromoCode = async () => {
    try {
      setCreating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const code = generateRandomCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code,
          subscription_tier: selectedTier,
          expires_at: expiresAt.toISOString(),
          max_uses: 1,
          created_by: user.id
        });

      if (error) throw error;

      toast.success(`Promo code created: ${code}`);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Failed to create promo code');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleDeleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentActive ? 'Promo code deactivated' : 'Promo code activated');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code:', error);
      toast.error('Failed to update promo code');
    }
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    const now = new Date();
    const expiresAt = new Date(promoCode.expires_at);

    if (!promoCode.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (promoCode.used_count >= promoCode.max_uses) {
      return <Badge variant="default" className="bg-green-600">Used</Badge>;
    }
    if (expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="outline" className="border-amber-500 text-amber-600">Available</Badge>;
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'Pro') {
      return <Badge className="bg-purple-600">Pro</Badge>;
    }
    return <Badge className="bg-blue-600">Starter</Badge>;
  };

  if (loading || parentLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promo Subscribers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Promo Users</p>
                <p className="text-2xl font-bold text-purple-600">{promoStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Via promo codes</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Value Granted</p>
                <p className="text-2xl font-bold text-green-600">€{promoStats.valueGranted}</p>
                <p className="text-xs text-gray-500 mt-1">Monthly equivalent</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Starter Plans</p>
                <p className="text-2xl font-bold text-blue-600">{promoStats.starterCount}</p>
                <p className="text-xs text-gray-500 mt-1">Promo subscribers</p>
              </div>
              <Zap className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pro Plans</p>
                <p className="text-2xl font-bold text-orange-600">{promoStats.proCount}</p>
                <p className="text-xs text-gray-500 mt-1">Promo subscribers</p>
              </div>
              <Crown className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Promo Subscribers List */}
      {promoSubscribers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Promo Subscribers
            </CardTitle>
            <CardDescription>
              Users with active subscriptions via promo codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Days Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoSubscribers.map((sub, idx) => {
                    const daysRemaining = sub.subscription_end 
                      ? differenceInDays(new Date(sub.subscription_end), new Date())
                      : null;
                    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
                    
                    return (
                      <TableRow key={idx}>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>
                          {sub.tier === 'Pro' ? (
                            <Badge className="bg-purple-600">Pro</Badge>
                          ) : (
                            <Badge className="bg-blue-600">Starter</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.subscription_end ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(sub.subscription_end), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {daysRemaining !== null ? (
                            <Badge 
                              variant={isExpiringSoon ? 'destructive' : 'outline'}
                              className={isExpiringSoon ? '' : 'border-green-500 text-green-600'}
                            >
                              {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Create Promo Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Create New Promo Code
          </CardTitle>
          <CardDescription>
            Generate a single-use promo code that grants 1 month of subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expires In (days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                className="w-[120px]"
              />
            </div>
            <Button onClick={handleCreatePromoCode} disabled={creating}>
              {creating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>
              Manage all promo codes ({promoCodes.length} total)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPromoCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No promo codes created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Redeemed By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {promo.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopyCode(promo.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(promo.subscription_tier)}</TableCell>
                      <TableCell>{getStatusBadge(promo)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(promo.expires_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {promo.redeemed_by_email ? (
                          <span className="text-sm">{promo.redeemed_by_email}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(promo.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(promo.id, promo.is_active)}
                          >
                            {promo.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCode(promo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodesManagement;
