import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', path: '/dashboard' },
  { label: 'Brand', path: '/dashboard/brand' },
  { label: 'Content', path: '/dashboard/content-generator-pro' },
  { label: 'Posts', path: '/dashboard/posts-pro' },
  { label: 'Campaigns', path: '/dashboard/campaigns' },
  { label: 'Analytics', path: '/dashboard/analytics' },
  { label: 'Team', path: '/dashboard/team' },
  { label: 'Social', path: '/dashboard/social' },
];

const ProDashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mb-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-1 overflow-x-auto scrollbar-hide" aria-label="Dashboard tabs">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
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

export default ProDashboardNav;
