import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Calendar, 
  Share2, 
  ImageIcon, 
  BarChart3, 
  Shield,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import PlatformIcon from '@/components/PlatformIcon';
import { platforms, getFreePlatforms, getStarterPlatforms, getProPlatforms } from '@/config/platforms';

const Features = () => {
  const freePlatforms = getFreePlatforms();
  const starterPlatforms = getStarterPlatforms();
  const proPlatforms = getProPlatforms();

  const features = [
    {
      icon: Brain,
      title: "AI Content Generation",
      description: "Generate engaging captions and content ideas tailored to your industry and goals.",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Create 30-day content calendars and schedule posts up to a month in advance.",
    },
    {
      icon: Share2,
      title: "Multi-Platform Posting",
      description: "Post to multiple platforms from one dashboard. Platforms unlock as you upgrade.",
      customContent: (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-14">Free:</span>
            <div className="flex items-center gap-2">
              {freePlatforms.map((p) => (
                <PlatformIcon 
                  key={p.id} 
                  platform={p.id} 
                  size={18} 
                  showBadge 
                  status={p.status}
                  tooltipText={p.name}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-14">Starter:</span>
            <div className="flex items-center gap-2">
              {starterPlatforms.map((p) => (
                <PlatformIcon 
                  key={p.id} 
                  platform={p.id} 
                  size={18} 
                  showBadge 
                  status={p.status}
                  tooltipText={`${p.name}${p.status === 'beta' ? ' (Beta)' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-14">Pro:</span>
            <div className="flex items-center gap-2">
              {proPlatforms.map((p) => (
                <PlatformIcon 
                  key={p.id} 
                  platform={p.id} 
                  size={18} 
                  showBadge 
                  status={p.status}
                  tooltipText={`${p.name}${p.status === 'coming' ? ' (Coming Soon)' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: ImageIcon,
      title: "AI Image Generation",
      description: "Create stunning visuals with AI-generated images perfectly matched to your content.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track performance and optimize your content strategy with tiered analytics.",
      customContent: (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-muted/50 px-2 py-0.5 rounded">Free</span>
            <span className="text-xs text-muted-foreground">Basic stats only</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">Starter</span>
            <span className="text-xs text-muted-foreground">Engagement & reach</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-gradient-primary text-primary-foreground px-2 py-0.5 rounded">Pro</span>
            <span className="text-xs text-muted-foreground">Advanced analytics</span>
          </div>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for your social media management.",
    },
    {
      icon: Clock,
      title: "Time-Saving Automation",
      description: "Save 10+ hours per week with automated content creation and scheduling workflows.",
    },
    {
      icon: Zap,
      title: "Instant Content Creation",
      description: "Generate months of content in minutes with our advanced AI algorithms.",
    },
    {
      icon: Globe,
      title: "Open & Decentralized First",
      description: "Built with open-source platforms like Mastodon in mind. Own your social presence.",
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Powerful Features for
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Social Media Success
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-sans">
            Everything you need to create, schedule, and manage your social media content with the power of AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-glass transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-glass border-glass-border">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-accent/30 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground font-sans">
                    {feature.description}
                  </CardDescription>
                  {feature.customContent}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
