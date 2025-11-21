import { FacebookLoginButton } from '@/components/FacebookLoginButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FacebookConnectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/social')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Social Settings
        </Button>

        <FacebookLoginButton />
      </div>
    </div>
  );
};

export default FacebookConnectPage;