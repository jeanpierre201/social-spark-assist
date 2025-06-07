import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Social Assistance AI
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-purple-600 transition-colors">Features</a>
            <a href="#pricing" className="text-foreground hover:text-purple-600 transition-colors">Pricing</a>
            <a href="#about" className="text-foreground hover:text-purple-600 transition-colors">About</a>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Welcome, {user.name || user.email}</span>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 text-foreground hover:text-purple-600">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-foreground hover:text-purple-600">Pricing</a>
              <a href="#about" className="block px-3 py-2 text-foreground hover:text-purple-600">About</a>
              
              {user ? (
                <div className="flex flex-col space-y-2 pt-2">
                  <span className="px-3 py-2 text-sm text-muted-foreground">Welcome, {user.name || user.email}</span>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Button variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
