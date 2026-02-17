
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoNew from '@/assets/rombipost-logo-new.png';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Already on home page, just scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      navigate('/');
    }
  };
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <a 
              href="/" 
              onClick={handleLogoClick}
              className="flex items-center mb-4 cursor-pointer inline-flex"
              aria-label="Go to home page"
            >
              <img 
                src={logoNew} 
                alt="RombiPost Logo" 
                className="h-[46px] w-auto object-contain"
              />
              <div className="h-10 w-px bg-gradient-to-b from-purple-600 via-blue-600 to-cyan-600 opacity-50 mx-3"></div>
              <span className="text-xl md:text-3xl font-bold text-white">RombiPost</span>
            </a>
            <p className="text-gray-400 mb-4">
              Empowering businesses with AI-driven social media management and content creation.
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer transition-colors" />
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/#features';
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="/" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/#pricing';
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Starter Plan
                </a>
              </li>
              <li>
                <a 
                  href="/" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/#pricing';
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Pro Plan
                </a>
              </li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/support" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/data-deletion" className="text-gray-400 hover:text-white transition-colors">Data Deletion</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 RombiPost. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
