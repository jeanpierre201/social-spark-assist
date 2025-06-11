
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import RobotCalendarIcon from './RobotCalendarIcon';

const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                AI-Powered
                <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Social Media
                </span>
                Content Creation
              </h1>
              <div className="flex-shrink-0">
                <RobotCalendarIcon className="w-16 h-16 lg:w-20 lg:h-20" />
              </div>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Transform your social media strategy with our AI assistant. Generate engaging content, 
              schedule posts, and grow your audience across all platforms - all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Free forever plan</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-3xl"></div>
              <div className="relative space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Generate Content Now</h3>
                  <p className="text-muted-foreground">See AI in action</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-700">Industry</label>
                    <div className="mt-1 text-gray-600">Technology & AI</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-700">Goal</label>
                    <div className="mt-1 text-gray-600">Promote new product launch</div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Generate AI Content
                  </Button>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-800">
                      "🚀 Exciting news! We're launching our revolutionary AI platform that will transform 
                      how businesses create content. Join thousands of creators already using AI to scale their success! 
                      #AI #Innovation #TechLaunch #Startup #Future"
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
