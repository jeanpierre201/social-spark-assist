
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
    if (subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Pro')) {
      navigate('/dashboard');
    } else {
      // User needs to upgrade - redirect to Stripe checkout for Starter plan
      await createCheckout();
    }
  };

  const handleProPlan = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // If user is already Pro, go to dashboard
    if (subscribed && subscriptionTier === 'Pro') {
      navigate('/dashboard');
    } else {
      // Navigate to Pro Plan upgrade page (for both free and starter users)
      navigate('/upgrade-pro');
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
      buttonText: subscribed && (subscriptionTier === 'Starter' || subscriptionTier === 'Pro') 
        ? "Access Features" 
        : "Start Starter Plan",
      popular: !subscribed || subscriptionTier === 'Free',
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
        "Unlimited posts per month",
        "Multiple content variations",
        "Advanced AI features",
        "Auto-posting to all platforms",
        "Advanced analytics",
        "Priority support",
        "Team collaboration",
        "Custom branding"
      ],
      buttonText: subscribed && subscriptionTier === 'Pro'
        ? "Access Pro Features"
        : subscriptionTier === 'Starter'
          ? "Upgrade to Pro"
          : "Go Pro",
      popular: false,
      buttonVariant: "outline" as const,
      onClick: handleProPlan
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Simple, Transparent
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-sans">
            Choose the perfect plan for your social media needs. Start free and scale as you grow.
          </p>
          {subscribed && (
            <div className="mt-4">
              <p className="text-lg font-medium text-primary">
                Current Plan: {subscriptionTier}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover:shadow-glass transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-glass ${
                plan.popular 
                  ? 'border-primary/30 shadow-glass ring-2 ring-primary/20' 
                  : plan.name === 'Pro Plan'
                  ? 'border-primary/20 hover:border-primary/40'
                  : 'border-glass-border hover:border-primary/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center backdrop-blur-sm">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-display font-bold text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground font-sans">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground font-sans">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className={`w-full mb-6 font-sans ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90' 
                      : plan.name === 'Pro Plan'
                      ? 'bg-gradient-primary hover:opacity-90 text-primary-foreground'
                      : ''
                  }`}
                  variant={plan.name === 'Pro Plan' ? 'default' : plan.buttonVariant}
                  size="lg"
                  onClick={plan.onClick}
                >
                  {plan.buttonText}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground font-sans">{feature}</span>
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
