
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, Home, ArrowLeft, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UpgradePromptProps {
  subscribed: boolean;
  canCreatePosts: boolean;
}

const UpgradePrompt = ({ subscribed, canCreatePosts }: UpgradePromptProps) => {
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExtending, setIsExtending] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await createCheckout();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleExtendPeriod = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to extend your creation period",
        variant: "destructive",
      });
      return;
    }

    setIsExtending(true);
    try {
      const { data, error } = await supabase.functions.invoke('extend-creation-period', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your creation period has been extended for another 30 days",
      });

      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error extending creation period:', error);
      toast({
        title: "Error",
        description: "Failed to extend creation period. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Content Generator</h1>
            <p className="text-muted-foreground">Upgrade to access AI-powered content generation</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </div>
        </div>

        <Card className="text-center p-8">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl mb-2">
              {!subscribed ? "Upgrade Required" : "Creation Period Expired"}
            </CardTitle>
            <CardDescription className="text-lg">
              {!subscribed 
                ? "Subscribe to the Starter or Pro plan to access AI content generation"
                : `Post creation is only available for 30 days from subscription start. Your creation period has ended.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!subscribed ? (
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Upgrade to Starter Plan
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your creation period has ended, but you can extend it for another 30 days.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleExtendPeriod}
                    disabled={isExtending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {isExtending ? "Extending..." : "Extend Creation Period"}
                  </Button>
                  <Button variant="outline" onClick={handleGoHome}>
                    Return to Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradePrompt;
