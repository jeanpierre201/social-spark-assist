import { useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', path: '/dashboard' },
  { label: 'Brand', path: '/dashboard/brand' },
  { label: 'Content', path: '/dashboard/content-generator-starter' },
  { label: 'Posts', path: '/dashboard/posts-starter' },
  { label: 'Social', path: '/dashboard/social' },
  { label: 'Subscription', path: '/dashboard/subscription' },
];

const StarterDashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const scrollToActive = useCallback(() => {
    if (activeRef.current && navRef.current) {
      const nav = navRef.current;
      const btn = activeRef.current;
      const scrollLeft = btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2;
      nav.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    scrollToActive();
  }, [location.pathname, scrollToActive]);

  return (
    <div className="mb-6">
      <div className="border-b border-border">
        <nav ref={navRef} className="-mb-px flex space-x-1 overflow-x-auto scrollbar-hide" aria-label="Dashboard tabs">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                ref={isActive ? activeRef : undefined}
                onClick={() => !isActive && navigate(item.path)}
                className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default StarterDashboardNav;
