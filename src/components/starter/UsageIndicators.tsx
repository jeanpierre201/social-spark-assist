
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Crown, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useProUpgrade } from '@/hooks/useProUpgrade';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface UsageIndicatorsProps {
  monthlyPosts: number;
  previousPeriodPosts: number;
  daysRemaining: number;
  maxPosts: number;
  isProPlan?: boolean;
  subscriptionStartDate?: string | null;
  canCreatePosts: boolean;
}

const UsageIndicators = ({ monthlyPosts, previousPeriodPosts, daysRemaining, maxPosts, isProPlan = false, subscriptionStartDate, canCreatePosts }: UsageIndicatorsProps) => {
  const { createCheckout } = useSubscription();
  const { createProCheckout } = useProUpgrade();
  const { user } = useAuth();
  const [lastPeriodPosts, setLastPeriodPosts] = useState(0);
  
  const usagePercentage = maxPosts > 0 ? Math.min((monthlyPosts / maxPosts) * 100, 100) : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = monthlyPosts >= maxPosts;
  const isPeriodExpired = daysRemaining === 0;

  const handleUpgrade = () => {
    window.location.href = '/upgrade-pro';
  };

  const handleExtend = () => {
    if (isProPlan) {
      createProCheckout();
    } else {
      createCheckout();
    }
  };

  useEffect(() => {
    const fetchLastPeriodPosts = async () => {
      if (subscriptionStartDate && user && isPeriodExpired) {
        try {
          const subscriptionStart = new Date(subscriptionStartDate);
          if (isNaN(subscriptionStart.getTime())) {
            console.warn('UsageIndicators: invalid subscriptionStartDate', subscriptionStartDate);
            return;
          }
          const previousPeriodStart = new Date(subscriptionStart);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
          
          const { data: posts, error } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', previousPeriodStart.toISOString())
            .lt('created_at', subscriptionStart.toISOString());
          
          if (error) throw error;
          setLastPeriodPosts(posts?.length || 0);
        } catch (error) {
          console.error('Error fetching last period posts:', error);
        }
      }
    };

    fetchLastPeriodPosts();
  }, [subscriptionStartDate, user, isPeriodExpired]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card className={`${isProPlan ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              {isProPlan ? (
                <Crown className="h-5 w-5 mr-2 text-purple-600" />
              ) : (
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
              )}
              30 Days Usage
            </div>
            {isPeriodExpired && (
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Period Expired
              </Badge>
            )}
            {isAtLimit && !isPeriodExpired && (
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limit Reached
              </Badge>
            )}
            {isNearLimit && !isAtLimit && !isPeriodExpired && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Near Limit
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {!canCreatePosts
              ? isProPlan
                ? `You used ${previousPeriodPosts} out of ${maxPosts} posts in your last 30-day period (Pro Plan)`
                : `You used ${previousPeriodPosts} out of ${maxPosts} posts in your last 30-day period (Starter Plan)`
              : isProPlan 
                ? `You've used ${monthlyPosts} out of ${maxPosts} posts in your 30-day period (Pro Plan)`
                : `You've used ${monthlyPosts} out of ${maxPosts} posts in your 30-day period (Starter Plan)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Posts used</span>
              <span className="font-medium">
                {!canCreatePosts ? `${previousPeriodPosts}/${maxPosts}` : `${monthlyPosts}/${maxPosts}`}
              </span>
            </div>
            <Progress 
              value={!canCreatePosts ? Math.min((previousPeriodPosts / maxPosts) * 100, 100) : usagePercentage} 
              className={`h-3 ${
                isPeriodExpired
                  ? '[&>div]:bg-gray-500' 
                  : isAtLimit 
                    ? '[&>div]:bg-red-500' 
                    : isNearLimit 
                      ? '[&>div]:bg-orange-500' 
                      : isProPlan 
                        ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-blue-500' 
                        : '[&>div]:bg-blue-500'
              }`}
            />
            <div className="text-xs text-muted-foreground">
              {isPeriodExpired ? (
                  <span>
                    {isProPlan ? (
                      <>
                        <button 
                          onClick={handleExtend}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          Extend
                        </button>
                        {" subscription to create new posts."}
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={handleUpgrade}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          Upgrade
                        </button>
                        {" or "}
                        <button 
                          onClick={handleExtend}
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          extend
                        </button>
                        {" subscription to create new posts."}
                      </>
                    )}
                  </span>
              ) : isAtLimit 
                ? "You've reached your limit for this 30-day period." 
                : `${maxPosts - monthlyPosts} posts remaining in your 30-day period`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${isPeriodExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center text-lg ${isPeriodExpired ? 'text-red-700' : ''}`}>
            <Calendar className={`h-5 w-5 mr-2 ${isPeriodExpired ? 'text-red-600' : 'text-gray-600'}`} />
            Reset Timeline
          </CardTitle>
          <CardDescription className={isPeriodExpired ? 'text-red-600' : ''}>
            {isPeriodExpired 
              ? "Your 30-day creation period has expired."
              : `Your post limit will reset in ${daysRemaining} days (30 days from subscription start/upgrade)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className={isPeriodExpired ? 'text-red-600' : 'text-muted-foreground'}>Days until reset</span>
              <span className={`font-medium ${isPeriodExpired ? 'text-red-700' : ''}`}>
                {isPeriodExpired ? 'Expired' : `${daysRemaining} days`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reset date</span>
              <span className="font-medium">
                {(() => {
                  if (!subscriptionStartDate) return 'N/A';
                  const startDate = new Date(subscriptionStartDate);
                  if (isNaN(startDate.getTime())) return 'N/A';
                  const resetDate = new Date(startDate);
                  resetDate.setDate(resetDate.getDate() + 30);
                  return resetDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                })()}
              </span>
            </div>
            <div className={`text-xs ${isPeriodExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
              {isPeriodExpired 
                ? isProPlan 
                  ? "Extend your creation period"
                  : "Extend your creation period or upgrade subscription"
                : "Creation period resets 30 days after subscription start"
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageIndicators;
