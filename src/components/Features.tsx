
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

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Content Generation",
      description: "Generate engaging captions, hashtags, and content ideas tailored to your industry and goals.",
      color: "text-purple-600"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Create 30-day content calendars and schedule posts up to a month in advance.",
      color: "text-blue-600"
    },
    {
      icon: Share2,
      title: "Multi-Platform Posting",
      description: "Auto-post to Facebook, Instagram, LinkedIn, Twitter, and more from one dashboard.",
      color: "text-green-600"
    },
    {
      icon: ImageIcon,
      title: "AI Image Generation",
      description: "Create stunning visuals with AI-generated images perfectly matched to your content.",
      color: "text-pink-600"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track performance, engagement rates, and optimize your content strategy with detailed analytics.",
      color: "text-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for your social media management.",
      color: "text-red-600"
    },
    {
      icon: Clock,
      title: "Time-Saving Automation",
      description: "Save 10+ hours per week with automated content creation and scheduling workflows.",
      color: "text-indigo-600"
    },
    {
      icon: Zap,
      title: "Instant Content Creation",
      description: "Generate months of content in minutes with our advanced AI algorithms.",
      color: "text-yellow-600"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Optimize posting times for different time zones and maximize your global audience reach.",
      color: "text-teal-600"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Powerful Features for
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Social Media Success
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create, schedule, and manage your social media content with the power of AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
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
