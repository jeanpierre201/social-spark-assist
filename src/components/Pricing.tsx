import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, createCheckout } = useSubscription();
  const navigate = useNavigate();

  const handleGetStartedFree = () => {
    if (user) {
      navigate('/content-generator');
    } else {
      navigate('/login');
    }
  };

  const handleStarterPlan = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user already has Starter plan or higher
    if (subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise')) {
      navigate('/content-generator-starter');
    } else {
      // User needs to upgrade - redirect to Stripe checkout
      await createCheckout();
    }
  };

  const plans = [
    {
      name: "Free Plan",
      price: "€0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "1 post per month",
        "AI-generated captions",
        "Basic hashtags",
        "Manual posting only",
        "Community support"
      ],
      buttonText: "Get Started Free",
      popular: false,
      buttonVariant: "outline" as const,
      onClick: handleGetStartedFree
    },
    {
      name: "Starter Plan",
      price: "€12",
      period: "/month",
      description: "Ideal for small businesses",
      features: [
        "Everything in Free",
        "AI image generation",
        "10 posts per month",
        "Basic scheduling",
        "Email support",
        "Content calendar"
      ],
      buttonText: subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Premium' || subscriptionTier === 'Enterprise') 
        ? "Access Features" 
        : "Start Starter Plan",
      popular: true,
      buttonVariant: "default" as const,
      onClick: handleStarterPlan
    },
    {
      name: "Pro Plan",
      price: "€25",
      period: "/month",
      description: "For agencies and growing businesses",
      features: [
        "Everything in Starter",
        "100 posts per month",
        "Advanced AI features",
        "Auto-posting to all platforms",
        "Advanced analytics",
        "Priority support",
        "Team collaboration",
        "Custom branding"
      ],
      buttonText: "Go Pro",
      popular: false,
      buttonVariant: "outline" as const,
      onClick: () => console.log('Pro plan coming soon!')
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your social media needs. Start free and scale as you grow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-purple-200 shadow-lg ring-2 ring-purple-100' 
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className={`w-full mb-6 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : ''
                  }`}
                  variant={plan.buttonVariant}
                  size="lg"
                  onClick={plan.onClick}
                >
                  {plan.buttonText}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
