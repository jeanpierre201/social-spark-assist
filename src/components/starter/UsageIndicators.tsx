
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Zap, Crown, AlertTriangle } from 'lucide-react';

interface UsageIndicatorsProps {
  monthlyPosts: number;
  daysRemaining: number;
  maxPosts: number;
  isProPlan?: boolean;
  subscriptionStartDate?: string | null;
}

const UsageIndicators = ({ monthlyPosts, daysRemaining, maxPosts, isProPlan = false, subscriptionStartDate }: UsageIndicatorsProps) => {
  const usagePercentage = maxPosts > 0 ? Math.min((monthlyPosts / maxPosts) * 100, 100) : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = monthlyPosts >= maxPosts;

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
              Monthly Usage
            </div>
            {isAtLimit && (
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limit Reached
              </Badge>
            )}
            {isNearLimit && !isAtLimit && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Near Limit
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isProPlan 
              ? `You've used ${monthlyPosts} out of ${maxPosts} posts this month (Pro Plan)`
              : `You've used ${monthlyPosts} out of ${maxPosts} posts this month (Starter Plan)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Posts used</span>
              <span className="font-medium">{monthlyPosts}/{maxPosts}</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-3 ${
                isAtLimit 
                  ? '[&>div]:bg-red-500' 
                  : isNearLimit 
                    ? '[&>div]:bg-orange-500' 
                    : isProPlan 
                      ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-blue-500' 
                      : '[&>div]:bg-blue-500'
              }`}
            />
            <div className="text-xs text-muted-foreground">
              {isAtLimit 
                ? "You've reached your monthly limit. Posts will reset next month." 
                : `${maxPosts - monthlyPosts} posts remaining this month`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Reset Timeline
          </CardTitle>
          <CardDescription>
            Your monthly post limit will reset {daysRemaining} days from now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Days until reset</span>
              <span className="font-medium">{daysRemaining} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reset date</span>
              <span className="font-medium">
                {(() => {
                  if (!subscriptionStartDate) return 'N/A';
                  const startDate = new Date(subscriptionStartDate);
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
            <div className="text-xs text-muted-foreground">
              Posts reset 30 days after subscription start/upgrade
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageIndicators;
