
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Calendar, 
  Image,
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
            Perfect for getting started with social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
              <span className="text-sm font-medium">10 posts per month</span>
            </div>
            <div className="flex items-center">
              <Image className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
              <span className="text-sm font-medium">2 AI-generated images per post</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
              <span className="text-sm font-medium">Auto-create 10 posts at once</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/upgrade-starter')}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Start with Starter Plan
            </Button>
            <Button 
              onClick={() => navigate('/upgrade-pro')}
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto"
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
