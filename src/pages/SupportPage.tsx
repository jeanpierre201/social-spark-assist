
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  MessageCircle, 
  Mail, 
  Book, 
  Users, 
  Clock,
  Crown 
} from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SupportPage = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier } = useSubscription();

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Support Center</h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="text-sm sm:text-base">Get help with your account and questions</span>
              {subscribed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Crown className="h-3 w-3 mr-1" />
                  {subscriptionTier} Plan
                </Badge>
              )}
            </div>
          </div>

          {/* Support Options Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card key={index} className={`${!option.available ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${option.available ? 'text-blue-600' : 'text-gray-400'}`} />
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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

          {/* FAQ Section */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Book className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="text-sm">
                Find answers to common questions about our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account & Billing */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-3 text-foreground">Account & Billing</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">How do I upgrade to a paid plan?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Navigate to the pricing section on the homepage or go to Settings → Subscription in your dashboard. 
                      Choose your desired plan (Starter or Pro) and follow the checkout process.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">Can I cancel my subscription anytime?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Yes! You can cancel your subscription at any time from your dashboard. You'll continue to have access 
                      to premium features until the end of your billing period.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">What payment methods do you accept?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Stripe.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features & Usage */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-3 text-foreground">Features & Usage</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">What's the difference between Starter and Pro plans?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Starter Plan gives you 10 AI-generated posts per month with basic scheduling. Pro Plan offers unlimited posts, 
                      advanced analytics, team collaboration, multiple content variations, and priority support.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">How long are free plan posts visible?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Free plan posts are automatically deleted after 24 hours. Upgrade to Starter or Pro to keep your posts permanently.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">Can I generate images with AI?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Yes! AI image generation is available on Starter and Pro plans. You can generate custom images based on your content and industry.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">Which social media platforms are supported?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      We support Instagram, Facebook, Twitter/X, LinkedIn, and TikTok. You can connect multiple accounts and post to all platforms simultaneously with Pro plan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Support */}
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-3 text-foreground">Technical Support</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">What support do I get with the Free plan?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Free plan users have access to our documentation, knowledge base, and community support resources.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">How fast is email support response time?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Starter and Pro plan users typically receive email responses within 24 hours during business days. 
                      Pro users get priority support with faster response times.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm sm:text-base text-foreground mb-1">Can I request new features?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Absolutely! We welcome feature requests from all users. Submit your ideas through the contact form 
                      and we'll consider them for future updates.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <div className="mb-6 sm:mb-8">
            <ContactForm />
          </div>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Additional Resources</CardTitle>
              <CardDescription className="text-sm">
                Other ways to get help and stay updated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm sm:text-base flex items-center">
                    <Book className="h-4 w-4 mr-2 text-blue-600" />
                    Documentation
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Browse our comprehensive guides and tutorials to get the most out of our platform.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-sm sm:text-base flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    Community Forum
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Connect with other users, share tips, and get community-driven support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SupportPage;
