
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Clock, Crown, Zap } from 'lucide-react';

interface UsageIndicatorsProps {
  monthlyPosts: number;
  daysRemaining: number;
  isProPlan?: boolean;
  maxPosts?: number;
}

const UsageIndicators = ({ monthlyPosts, daysRemaining, isProPlan = false, maxPosts = 10 }: UsageIndicatorsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className={`${isProPlan ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isProPlan ? (
              <Crown className="h-5 w-5 text-purple-600 mr-2" />
            ) : (
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            )}
            Monthly Usage
          </CardTitle>
          <CardDescription>
            {isProPlan 
              ? `You've used ${monthlyPosts} of ${maxPosts} posts this month`
              : `You've used ${monthlyPosts} of ${maxPosts} posts this month`
            }
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className={`${isProPlan ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50' : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isProPlan ? (
              <Zap className="h-5 w-5 text-purple-600 mr-2" />
            ) : (
              <Clock className="h-5 w-5 text-green-600 mr-2" />
            )}
            {isProPlan ? 'Subscription Status' : 'Creation Period'}
          </CardTitle>
          <CardDescription>
            {isProPlan 
              ? 'Active Pro subscription with monthly renewal'
              : `${daysRemaining} days remaining in your 30-day creation window`
            }
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default UsageIndicators;
