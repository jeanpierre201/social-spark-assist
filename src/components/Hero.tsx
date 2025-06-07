
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Calendar, TrendingUp } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Social Media Management
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            Generate & Schedule
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Social Content
            </span>
            <span className="block text-4xl sm:text-5xl lg:text-6xl">
              with AI Magic
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your social media strategy with AI-generated content, automated scheduling, 
            and intelligent posting across all platforms. Save hours while growing your audience.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-purple-200 hover:bg-purple-50">
              Watch Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground">AI Content</h3>
              <p className="text-sm text-muted-foreground">Generate captions & hashtags</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground">Auto Schedule</h3>
              <p className="text-sm text-muted-foreground">30-day content calendar</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-full shadow-lg mb-3">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-foreground">Grow Audience</h3>
              <p className="text-sm text-muted-foreground">Cross-platform posting</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
