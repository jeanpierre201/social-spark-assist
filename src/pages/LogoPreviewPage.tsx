import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import logoOption1 from '@/assets/logo-option-1.png';
import logoOption2 from '@/assets/logo-option-2.png';
import logoOption3 from '@/assets/logo-option-3.png';
import currentLogo from '@/assets/rombipost-logo-icon.svg';
import logo3D from '@/assets/rombipost-logo-3d.svg';
import logoAlt4 from '@/assets/rombipost-logo-alt4.svg';

const LogoPreviewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="mb-8"
        >
          ← Back to Home
        </Button>
        
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          RombiPost Logo Options
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Compare the logo variations and choose your favorite
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Current Logo</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={currentLogo} alt="Current Logo" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Flat SVG with hollow center
            </p>
          </Card>

          <Card className="p-8 border-2 border-primary">
            <h3 className="text-xl font-semibold mb-4 text-center">Option 1 - 3D SVG ⭐</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={logo3D} alt="3D Logo SVG" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Thick 3D borders with depth effects - bold and substantial (SVG format)
            </p>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Option 1 - PNG</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={logoOption1} alt="Logo Option 1" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Original PNG version for reference
            </p>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Option 2</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={logoOption2} alt="Logo Option 2" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Double concentric outlines - elegant and premium
            </p>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Option 3</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={logoOption3} alt="Logo Option 3" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Geometric split design - dynamic and unique
            </p>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Option 4</h3>
            <div className="flex items-center justify-center bg-white rounded-lg p-8 mb-4">
              <img src={logoAlt4} alt="Logo Option 4" className="h-48 w-48 object-contain" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Arrow-shaped inner edges pointing outward
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LogoPreviewPage;
