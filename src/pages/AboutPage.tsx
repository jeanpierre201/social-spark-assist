import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlatformIcon from '@/components/PlatformIcon';

const AboutPage = () => {
  const platforms = ['instagram', 'facebook', 'tiktok', 'linkedin', 'mastodon', 'telegram'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-display font-bold text-foreground mb-6">About RombiPost</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            RombiPost is an AI-powered content engine and cross-platform publishing tool designed for creators, brands, and communities.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mt-4">
            Whether you're building an audience or managing multiple clients, we give you the tools to write better, post faster, and stay consistent everywhere.
          </p>
        </div>

        {/* Platform icons */}
        <div className="flex items-center justify-center gap-4 mb-12 p-6 bg-glass/40 backdrop-blur-sm rounded-2xl border border-glass-border">
          {platforms.map((p) => (
            <PlatformIcon key={p} platform={p} size={28} tooltipText={p.charAt(0).toUpperCase() + p.slice(1)} />
          ))}
        </div>

        {/* Built for */}
        <div className="space-y-6 mb-12">
          <p className="text-muted-foreground leading-relaxed">
            Built for social platforms like Instagram, Facebook, TikTok, LinkedIn, Mastodon and Telegram — RombiPost brings your entire content workflow into one clean interface.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From ideas to captions, images to scheduling, analytics to multi-brand management — it's all here.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-glass/40 backdrop-blur-sm rounded-2xl border border-glass-border p-8 text-center">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-2">
            Make content creation effortless. Make publishing seamless.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Let creators and brands focus on what matters — their voice, their message, their growth.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
