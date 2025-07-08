
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';

const NotificationBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto">
      <Alert className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <AlertDescription className="font-medium">
                <span className="text-primary">$1 = 200 PTS</span> required to cashout
                <Badge variant="destructive" className="ml-2">50% fee</Badge>
              </AlertDescription>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Alert>
    </div>
  );
};

export default NotificationBanner;
