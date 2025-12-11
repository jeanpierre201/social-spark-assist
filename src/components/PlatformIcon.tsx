import { LucideIcon } from 'lucide-react';
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Facebook, 
  Linkedin,
  Twitter,
  Music2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformStatus, getStatusBadge } from '@/config/platforms';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PlatformIconProps {
  platform: string;
  size?: number;
  showBadge?: boolean;
  status?: PlatformStatus;
  disabled?: boolean;
  className?: string;
  tooltipText?: string;
}

const iconMap: Record<string, LucideIcon> = {
  mastodon: MessageCircle, // Using MessageCircle as Mastodon proxy
  telegram: Send,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Music2, // Using Music2 as TikTok proxy
};

const colorMap: Record<string, string> = {
  mastodon: 'text-[#6364FF]',
  telegram: 'text-[#0088CC]',
  instagram: 'text-[#E4405F]',
  facebook: 'text-[#1877F2]',
  linkedin: 'text-[#0A66C2]',
  twitter: 'text-foreground',
  tiktok: 'text-foreground',
};

export const PlatformIcon = ({
  platform,
  size = 20,
  showBadge = false,
  status = 'available',
  disabled = false,
  className,
  tooltipText,
}: PlatformIconProps) => {
  const Icon = iconMap[platform.toLowerCase()] || MessageCircle;
  const color = colorMap[platform.toLowerCase()] || 'text-muted-foreground';
  const badge = getStatusBadge(status);

  const iconElement = (
    <div className={cn('relative inline-flex items-center', className)}>
      <Icon 
        size={size} 
        className={cn(
          color,
          disabled && 'opacity-40 grayscale',
          'transition-all duration-200'
        )} 
      />
      {showBadge && badge.label && (
        <span className={cn(
          'absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded',
          badge.className
        )}>
          {badge.label}
        </span>
      )}
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {iconElement}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return iconElement;
};

export default PlatformIcon;
