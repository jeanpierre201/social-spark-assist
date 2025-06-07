
const RobotCalendarIcon = ({ className = "h-6 w-6", ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Calendar base */}
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      
      {/* Robot face inside calendar */}
      <circle cx="9" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <path d="M10 18 L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Robot antennas */}
      <line x1="9" y1="13" x2="9" y2="12" strokeWidth="1" />
      <line x1="15" y1="13" x2="15" y2="12" strokeWidth="1" />
      <circle cx="9" cy="12" r="0.5" fill="currentColor" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
};

export default RobotCalendarIcon;
