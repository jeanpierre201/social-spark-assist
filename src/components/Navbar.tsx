import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionStatusBadge from '@/components/SubscriptionStatusBadge';
import logoIcon from '@/assets/socialnova-logo-icon.png';
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>('');
  const {
    user,
    logout
  } = useAuth();
  const {
    isAuthorized: isAdminAuthorized
  } = useAdminAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      // Fetch user profile from database
      const fetchProfile = async () => {
        const {
          data
        } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data?.full_name) {
          setProfileName(data.full_name);
        }
      };
      fetchProfile();
    } else {
      setProfileName('');
    }
  }, [user]);
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
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const displayName = profileName || user?.email || '';
  return <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button onClick={() => navigate('/')} className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" aria-label="Go to home page">
            <img alt="RombiPost Logo" className="h-16 w-16 object-contain" src="/lovable-uploads/06177a36-ee2d-41cc-969e-bebbc9325597.png" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              RombiPost
            </span>
          </button>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" onClick={e => {
            e.preventDefault();
            window.location.href = '/#features';
          }} className="text-foreground hover:text-purple-600 transition-colors cursor-pointer">
              Features
            </a>
            <a href="/" onClick={e => {
            e.preventDefault();
            window.location.href = '/#pricing';
          }} className="text-foreground hover:text-purple-600 transition-colors cursor-pointer">
              Pricing
            </a>
            <a href="/about" className="text-foreground hover:text-purple-600 transition-colors">About</a>
            <a href="/support" className="text-foreground hover:text-purple-600 transition-colors">Support</a>
            
            {user ? <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Welcome, {displayName}</span>
                <SubscriptionStatusBadge />
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                {isAdminAuthorized && <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="border-red-200 hover:bg-red-50 text-red-700 hover:text-red-800">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin CMS
                  </Button>}
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div> : <>
                <Button variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="/" onClick={e => {
            e.preventDefault();
            window.location.href = '/#features';
          }} className="block px-3 py-2 text-foreground hover:text-purple-600 cursor-pointer">
                Features
              </a>
              <a href="/" onClick={e => {
            e.preventDefault();
            window.location.href = '/#pricing';
          }} className="block px-3 py-2 text-foreground hover:text-purple-600 cursor-pointer">
                Pricing
              </a>
              <a href="/about" className="block px-3 py-2 text-foreground hover:text-purple-600">About</a>
              <a href="/support" className="block px-3 py-2 text-foreground hover:text-purple-600">Support</a>
              
              {user ? <div className="flex flex-col space-y-2 pt-2">
                  <span className="px-3 py-2 text-sm text-muted-foreground">Welcome, {displayName}</span>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </Button>
                  {isAdminAuthorized && <Button variant="outline" onClick={() => navigate('/admin/dashboard')} className="border-red-200 hover:bg-red-50 text-red-700 hover:text-red-800">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin CMS
                    </Button>}
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div> : <div className="flex flex-col space-y-2 pt-2">
                  <Button variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </div>}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;