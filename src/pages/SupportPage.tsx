
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  MessageCircle, 
  Mail, 
  Book, 
  Users, 
  Clock,
  Crown 
} from 'lucide-react';
import ContactForm from '@/components/ContactForm';

const SupportPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();
  const navigate = useNavigate();

  const supportOptions = [
    {
      title: "Email Support",
      description: "Direct email assistance from our support team",
      icon: Mail,
      available: subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Pro' || subscriptionTier === 'Premium'),
      responseTime: "24 hours",
      tier: "Starter+"
    },
    {
      title: "Community Support",
      description: "Get help from the community and documentation",
      icon: Users,
      available: true,
      responseTime: "Community driven",
      tier: "All plans"
    },
    {
      title: "Knowledge Base",
      description: "Browse our comprehensive documentation",
      icon: Book,
      available: true,
      responseTime: "Instant",
      tier: "All plans"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Support Center</h1>
            <p className="text-muted-foreground">
              Get help with your account and questions
              {subscribed && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  <Crown className="h-3 w-3 mr-1" />
                  {subscriptionTier} Plan
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        {/* Support Options Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card key={index} className={`${!option.available ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Icon className={`h-5 w-5 mr-2 ${option.available ? 'text-blue-600' : 'text-gray-400'}`} />
                    {option.title}
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      Response: {option.responseTime}
                    </div>
                    <Badge variant={option.available ? "secondary" : "outline"} className="text-xs">
                      {option.tier}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="mb-8">
          <ContactForm />
        </div>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>
              Other ways to get help and stay updated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <Book className="h-4 w-4 mr-2 text-blue-600" />
                  Documentation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Browse our comprehensive guides and tutorials to get the most out of our platform.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium flex items-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  Community Forum
                </h3>
                <p className="text-sm text-muted-foreground">
                  Connect with other users, share tips, and get community-driven support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportPage;
