
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Clock } from 'lucide-react';

interface UsageIndicatorsProps {
  monthlyPosts: number;
  daysRemaining: number;
}

const UsageIndicators = ({ monthlyPosts, daysRemaining }: UsageIndicatorsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
            Monthly Usage
          </CardTitle>
          <CardDescription>
            You've used {monthlyPosts} of 10 posts this month
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            Creation Period
          </CardTitle>
          <CardDescription>
            {daysRemaining} days remaining in your 30-day creation window
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default UsageIndicators;
