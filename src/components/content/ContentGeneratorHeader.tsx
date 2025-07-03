
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap } from 'lucide-react';

interface ContentGeneratorHeaderProps {
  isProUser: boolean;
  isStarterUser: boolean;
}

const ContentGeneratorHeader = ({ isProUser, isStarterUser }: ContentGeneratorHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isProUser ? 'Pro Content Generator' : isStarterUser ? 'Starter Content Generator' : 'Content Generator'}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Create engaging social media content with AI
            {isProUser && (
              <Badge className="bg-purple-100 text-purple-800">
                <Crown className="h-3 w-3 mr-1 text-purple-600" />
                Pro Plan
              </Badge>
            )}
            {isStarterUser && (
              <Badge className="bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1 text-blue-600" />
                Starter Plan
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorHeader;
