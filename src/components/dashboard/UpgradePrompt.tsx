
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Sparkles, 
  Calendar, 
  BarChart3,
  Crown
} from 'lucide-react';

const UpgradePrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-8">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Zap className="h-5 w-5 mr-2" />
            Get Started with Starter Plan
          </CardTitle>
          <CardDescription>
            Unlock AI-powered content generation and scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm">10 AI-Generated Posts</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm">Post Scheduling</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm">Basic Analytics</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/#pricing')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start with Starter Plan
            </Button>
            <Button 
              onClick={() => navigate('/upgrade-pro')}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Crown className="h-4 w-4 mr-2" />
              Go Pro Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradePrompt;
