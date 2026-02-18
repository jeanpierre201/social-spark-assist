import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PageTitleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageTitleCard = ({ icon: Icon, title, description }: PageTitleCardProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start gap-3">
          <Icon className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageTitleCard;
