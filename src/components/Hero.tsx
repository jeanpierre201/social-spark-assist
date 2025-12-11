import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PlatformIcon from '@/components/PlatformIcon';
import { getFreePlatforms } from '@/config/platforms';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const freePlatforms = getFreePlatforms();

  const handleStartCreating = () => {
    if (user) {
      navigate('/content-generator');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-accent overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--glass-bg)_0%,_transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 lg:order-1 order-2">
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              One AI-Powered
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Content Studio
              </span>
              for Creators & Brands
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl font-sans leading-relaxed">
              Transform your social media strategy with our AI assistant. Generate engaging content, 
              schedule posts, and grow your audience across all platforms - all in one place.
            </p>

            {/* Free platforms highlight */}
            <div className="flex items-center gap-4 p-4 bg-glass/40 backdrop-blur-sm rounded-xl border border-glass-border">
              <div className="flex items-center gap-3">
                {freePlatforms.map((platform) => (
                  <PlatformIcon 
                    key={platform.id} 
                    platform={platform.id} 
                    size={28}
                    tooltipText={platform.name}
                  />
                ))}
              </div>
              <div className="border-l border-border/50 pl-4">
                <p className="text-sm font-medium text-foreground">Start free with Mastodon & Telegram</p>
                <p className="text-xs text-muted-foreground">No credit card required</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg"
                onClick={handleStartCreating}
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="group backdrop-blur-sm bg-glass/30 border-glass-border hover:bg-glass/50">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Free forever plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Upgrade anytime</span>
              </div>
            </div>
          </div>
          
          <div className="relative lg:order-2 order-1">
            <div className="relative bg-glass/40 backdrop-blur-glass rounded-3xl shadow-glass p-8 border border-glass-border">
              <div className="absolute inset-0 bg-gradient-accent opacity-30 rounded-3xl"></div>
              <div className="relative space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-display font-semibold text-foreground mb-2">Generate Content Now</h3>
                  <p className="text-muted-foreground">See AI in action</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                    <label className="text-sm font-medium text-card-foreground">Industry</label>
                    <div className="mt-1 text-muted-foreground">Technology & AI</div>
                  </div>
                  
                  <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                    <label className="text-sm font-medium text-card-foreground">Goal</label>
                    <div className="mt-1 text-muted-foreground">Promote new product launch</div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                    onClick={handleStartCreating}
                  >
                    Generate AI Content
                  </Button>
                  
                  <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-sm text-foreground font-medium">
                      "🚀 Exciting news! We are launching our revolutionary AI platform that will transform 
                      how businesses create content. Join thousands of creators already using AI to scale their success!"
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ready for:</span>
                      <PlatformIcon platform="mastodon" size={14} />
                      <PlatformIcon platform="telegram" size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-primary rounded-full opacity-30 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
