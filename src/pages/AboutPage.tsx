import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Zap, Target, Heart, Lightbulb } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

const AboutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscriptionTier } = useSubscription();

  const isStarterOrPro = subscriptionTier === 'Starter' || subscriptionTier === 'Pro';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">About Social Assistance AI</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering solo entrepreneurs and small businesses to master social media with AI-driven automation
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Target className="h-6 w-6 mr-3 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Social Assistance AI was born from a simple belief: every entrepreneur deserves access to powerful 
              social media tools without the complexity or cost of enterprise solutions. We're on a mission to 
              democratize social media management by combining cutting-edge AI with intuitive design, making it 
              easy for anyone to create engaging content, grow their audience, and build their brand.
            </p>
          </CardContent>
        </Card>

        {/* Story */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Lightbulb className="h-6 w-6 mr-3 text-purple-600" />
              The Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As a small team of developers and entrepreneurs, we experienced firsthand the challenges of maintaining a 
              consistent social media presence while building a business. The existing tools were either too 
              expensive, too complicated, or simply didn't leverage AI in meaningful ways.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Social Assistance AI is our answer to that problem. It's designed by a team who understands 
              the constraints of limited time and resources, built to deliver maximum value without unnecessary 
              complexity.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Heart className="h-6 w-6 mr-3 text-red-600" />
              What We Stand For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Simplicity First</h3>
                <p className="text-muted-foreground">
                  Complex features don't require complex interfaces. We believe in making powerful AI tools 
                  accessible and easy to use.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Fair Pricing</h3>
                <p className="text-muted-foreground">
                  Quality tools shouldn't break the bank. Our pricing is designed to be accessible for 
                  businesses at any stage.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Continuous Innovation</h3>
                <p className="text-muted-foreground">
                  We're constantly learning, improving, and adding new features based on real user needs 
                  and feedback.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Community-Driven</h3>
                <p className="text-muted-foreground">
                  Your feedback shapes our roadmap. Every feature request is considered, and we build what 
                  our users actually need.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to transform your social media presence?
          </h2>
          <div className="flex justify-center gap-4">
            {!user && (
              <Button size="lg" onClick={() => navigate('/signup')}>
                Get Started Free
              </Button>
            )}
            {isStarterOrPro && (
              <Button size="lg" variant="outline" onClick={() => navigate('/support')}>
                Contact Us
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;