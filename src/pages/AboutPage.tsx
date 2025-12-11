import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Target, Heart, Lightbulb, Globe } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlatformIcon from '@/components/PlatformIcon';
import { getFreePlatforms, getStarterPlatforms, getProPlatforms } from '@/config/platforms';

const AboutPage = () => {
  const freePlatforms = getFreePlatforms();
  const starterPlatforms = getStarterPlatforms();
  const proPlatforms = getProPlatforms();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-primary p-4 rounded-2xl">
              <Zap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">About RombiPost</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering solo entrepreneurs and small businesses to master social media with AI-driven automation
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Target className="h-6 w-6 mr-3 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              RombiPost was born from a simple belief: every entrepreneur deserves access to powerful 
              social media tools without the complexity or cost of enterprise solutions. We are on a mission to 
              democratize social media management by combining cutting-edge AI with intuitive design, making it 
              easy for anyone to create engaging content, grow their audience, and build their brand.
            </p>
          </CardContent>
        </Card>

        {/* Open-source first */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Globe className="h-6 w-6 mr-3 text-primary" />
              Open & Decentralized First
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe in the power of open-source and decentralized platforms. That is why our free tier 
              starts with Mastodon and Telegram - platforms that respect user privacy and data ownership.
            </p>
            <div className="bg-accent/30 rounded-lg p-4 border border-border/50">
              <p className="text-sm font-medium text-foreground mb-3">Platform Roadmap</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-muted/50 px-2 py-0.5 rounded w-16">Free</span>
                  <div className="flex items-center gap-2">
                    {freePlatforms.map((p) => (
                      <PlatformIcon key={p.id} platform={p.id} size={18} tooltipText={p.name} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Available now</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded w-16">Starter</span>
                  <div className="flex items-center gap-2">
                    {starterPlatforms.map((p) => (
                      <PlatformIcon key={p.id} platform={p.id} size={18} showBadge status={p.status} tooltipText={p.name} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">TikTok in beta</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-gradient-primary text-primary-foreground px-2 py-0.5 rounded w-16">Pro</span>
                  <div className="flex items-center gap-2">
                    {proPlatforms.map((p) => (
                      <PlatformIcon key={p.id} platform={p.id} size={18} showBadge status={p.status} tooltipText={p.name} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">X coming soon</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Lightbulb className="h-6 w-6 mr-3 text-primary" />
              The Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              As a small team of developers and entrepreneurs, we experienced firsthand the challenges of maintaining a 
              consistent social media presence while building a business. The existing tools were either too 
              expensive, too complicated, or simply did not leverage AI in meaningful ways.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              RombiPost is our answer to that problem. It is designed by a team who understands 
              the constraints of limited time and resources, built to deliver maximum value without unnecessary 
              complexity.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Heart className="h-6 w-6 mr-3 text-primary" />
              What We Stand For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Simplicity First</h3>
                <p className="text-muted-foreground">
                  Complex features do not require complex interfaces. We believe in making powerful AI tools 
                  accessible and easy to use.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Fair Pricing</h3>
                <p className="text-muted-foreground">
                  Quality tools should not break the bank. Our pricing is designed to be accessible for 
                  businesses at any stage.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Open Ecosystem</h3>
                <p className="text-muted-foreground">
                  We prioritize open-source and decentralized platforms, giving you more control over your 
                  social media presence and data.
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

      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
