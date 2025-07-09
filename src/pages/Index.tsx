
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Home, 
  ShoppingBag, 
  Trophy, 
  User, 
  HelpCircle, 
  MessageCircle,
  Coins,
  Zap,
  Gift,
  CreditCard,
  Gamepad2,
  DollarSign,
  Target,
  Star,
  TrendingUp,
  Shield,
  Sparkles,
  X,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOfferwall } from '@/hooks/useOfferwall';
import IframeModal from '@/components/IframeModal';
import ActivityLogs from '@/components/ActivityLogs';
import NotificationBanner from '@/components/NotificationBanner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Skeleton } from '@/components/ui/skeleton';

interface UserData {
  account: string;
  clientId: string;
  status: string;
  balance: string;
  promo: string;
  avatar: string;
  level: string;
  username?: string;
  email?: string;
  lastOfferwallClick?: string;
  offerwallClicksToday?: number;
}

interface Offerwall {
  id: string;
  name: string;
  type: string;
  logo: string;
  color: string;
  description: string;
  badge?: string;
}

interface Reward {
  id: string;
  name: string;
  icon: JSX.Element;
  minAmount: string;
  color: string;
  description: string;
  requiresEmail?: boolean;
  requiresAddress?: boolean;
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

interface StatItem {
  label: string;
  value: string;
  icon: JSX.Element;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loginForm, setLoginForm] = useState({ account: '', clientId: '', captcha: '' });
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [selectedReward, setSelectedReward] = useState('');
  const [cashoutEmail, setCashoutEmail] = useState('');
  const [cashoutLTCAddress, setCashoutLTCAddress] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{id: string, name: string, avatar: string}>>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  
  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha, register } = useAuth();
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch users data from Google Sheets
  const fetchUsersData = async () => {
    try {
      setIsLoadingUserData(true);
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3p3daAnCETfJtrUUvaiNqoUreYkn9FIHus6rEyq-e8E8oLaV51L_NrVWjHp1CyTv3UqBqryq3aH-0/pub?gid=0&single=true&output=csv');
      const csvData = await response.text();
      
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const users = [];
      
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === headers.length) {
          const userObj: any = {};
          for (let j = 0; j < headers.length; j++) {
            userObj[headers[j]] = currentLine[j].trim();
          }
          users.push({
            account: userObj.Account || '',
            clientId: userObj.ClientID || '',
            status: userObj.Status || '',
            balance: userObj.Balance || '0',
            promo: userObj.Promo || '',
            avatar: userObj.UserAvatar || '',
            level: userObj.Level || '1',
            lastOfferwallClick: userObj.LastOfferwallClick || '',
            offerwallClicksToday: parseInt(userObj.OfferwallClicksToday || '0')
          });
        }
      }
      
      setUsersData(users);
    } catch (error) {
      console.error('Error fetching users data:', error);
      toast.error('Failed to load users data');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Calculate user stats
  const userBalance = currentUser ? parseFloat(currentUser.balance || '0') : 0;
  const userLevel = currentUser ? parseInt(currentUser.level || '1') : 1;
  const userXP = Math.floor(userBalance / 0.1);
  const offerwallClicksToday = currentUser?.offerwallClicksToday || 0;
  const lastOfferwallClick = currentUser?.lastOfferwallClick ? new Date(currentUser.lastOfferwallClick) : null;

  // Check if user met daily requirement
  const hasMetDailyRequirement = offerwallClicksToday >= 5;
  const missingClicks = Math.max(0, 5 - offerwallClicksToday);
  const penaltyPoints = missingClicks * 75;

  // Check if it's a new day since last click
  const isNewDay = () => {
    if (!lastOfferwallClick) return true;
    const today = new Date();
    return (
      today.getDate() !== lastOfferwallClick.getDate() ||
      today.getMonth() !== lastOfferwallClick.getMonth() ||
      today.getFullYear() !== lastOfferwallClick.getFullYear()
    );
  };

  // Apply penalty if needed
  const checkAndApplyPenalty = async () => {
    if (!isLoggedIn || !currentUser) return;

    // Reset clicks if it's a new day
    if (isNewDay() && offerwallClicksToday > 0) {
      await updateUserOfferwallClicks(currentUser.account, 0);
    }

    // Apply penalty if user didn't meet requirement and it's end of day
    const now = new Date();
    const hours = now.getHours();
    const isEndOfDay = hours >= 23; // Check if it's near end of day
    
    if (isEndOfDay && !hasMetDailyRequirement && penaltyPoints > 0) {
      const newBalance = Math.max(0, userBalance - penaltyPoints);
      await updateBalance(newBalance.toString());
      toast.warning(`Daily activity requirement not met. ${penaltyPoints} points deducted.`);
      
      // Reset counter for new day
      await updateUserOfferwallClicks(currentUser.account, 0);
    }
  };

  // Update user's offerwall clicks in the database
  const updateUserOfferwallClicks = async (account: string, clicks: number) => {
    try {
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbyvw4LiShTvgnTTLRLISnTYJRhqeStmZgL9YD_ZuQEJubcDPH8bSbGpHPCVHDfx0dbW/exec';
      
      await fetch(`${scriptUrl}?action=updateOfferwallClicks&account=${account}&clicks=${clicks}&timestamp=${new Date().toISOString()}`, {
        method: 'GET'
      });
      
      // Update local state if it's the current user
      if (currentUser && currentUser.account === account) {
        const updatedUser = {
          ...currentUser,
          offerwallClicksToday: clicks,
          lastOfferwallClick: new Date().toISOString()
        };
        // Normally you would update this in your auth context
      }
    } catch (error) {
      console.error('Error updating offerwall clicks:', error);
    }
  };

  // Send cashout postback
  const sendCashoutPostback = async (amount: number, rewardType: string, account: string) => {
    try {
      const postbackUrl = `https://script.google.com/macros/s/AKfycbyvw4LiShTvgnTTLRLISnTYJRhqeStmZgL9YD_ZuQEJubcDPH8bSbGpHPCVHDfx0dbW/exec`;
      
      const response = await fetch(postbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cashout',
          amount,
          rewardType,
          account,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send postback');
      }

      const result = await response.json();
      if (result.success) {
        console.log(`Postback sent for cashout: ${amount} points to ${rewardType}`);
        return true;
      } else {
        throw new Error(result.message || 'Cashout failed');
      }
    } catch (error) {
      console.error('Error sending cashout postback:', error);
      toast.error('Failed to process cashout request. Please try again later.');
      return false;
    }
  };

  // Fetch chat messages from CSV
  const fetchChatMessages = async () => {
    try {
      setIsLoadingChat(true);
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTMw2OEzCGbQOpzjj47sjvSlKqeLBC14FkZ6gGKnI3r4roaYapdByCLpYsLDFmbxbk87aCb5ChNjwZP/pub?gid=0&single=true&output=csv');
      const csvData = await response.text();
      
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const messages = [];
      
      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === headers.length) {
          const messageObj: any = {};
          for (let j = 0; j < headers.length; j++) {
            messageObj[headers[j]] = currentLine[j].trim();
          }
          messages.push({
            sender: messageObj.sender || 'Unknown',
            message: messageObj.message || '',
            timestamp: messageObj.timestamp || new Date().toLocaleTimeString()
          });
        }
      }
      
      setChatMessages(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginForm.account, loginForm.clientId, loginForm.captcha);
    if (success) {
      setLoginForm({ account: '', clientId: '', captcha: '' });
      setActiveTab('earn');
      toast.success('Login successful!');
      fetchUsersData(); // Refresh user data after login
    } else {
      setLoginForm(prev => ({ ...prev, captcha: '' }));
      generateCaptcha(); // Generate new CAPTCHA on failed login
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(
      signupForm.username,
      signupForm.email,
      signupForm.password
    );
    if (success) {
      setSignupForm({ username: '', email: '', password: '' });
      toast.success('Registration successful! Please login.');
      setIsSignUp(false);
      fetchUsersData(); // Refresh user data after registration
    } else {
      toast.error('Registration failed. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('home');
    setLoginForm({ account: '', clientId: '', captcha: '' });
    toast.success('Logged out successfully.');
  };

  const handleOfferwallClick = (buttonId: string) => {
    if (!isLoggedIn || !currentUser) {
      toast.error('Please login first to access offerwalls');
      setActiveTab('earn');
      return;
    }
    
    // Track click for active user requirement
    const newClickCount = (currentUser.offerwallClicksToday || 0) + 1;
    updateUserOfferwallClicks(currentUser.account, newClickCount);
    
    openOfferwall(buttonId, currentUser.username || currentUser.account);
  };

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !currentUser) {
      toast.error('Please login first to cash out');
      return;
    }

    const points = parseFloat(cashoutAmount);
    if (isNaN(points)) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (points < 250) {
      toast.error(`Minimum cashout is 250 points (200 points = $1, 50 points fee)`);
      return;
    }

    if (points > userBalance) {
      toast.error('You don\'t have enough points for this cashout');
      return;
    }

    if (!selectedReward) {
      toast.error('Please select a reward type');
      return;
    }

    // Validate based on reward type
    if (selectedReward === 'ltc' && !cashoutLTCAddress) {
      toast.error('Please enter your Litecoin address');
      return;
    }

    if (selectedReward !== 'ltc' && !cashoutEmail) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      // Send cashout postback first
      const postbackSuccess = await sendCashoutPostback(
        points, 
        selectedReward, 
        currentUser.account
      );

      if (!postbackSuccess) {
        return;
      }

      // Deduct balance locally (in a real app, this would be handled by the backend)
      const newBalance = userBalance - points;
      await updateBalance(newBalance.toString());

      // Show success message
      toast.success(`Cashout request submitted for ${points} points ($${(points - 50) / 200}) to ${selectedReward}. Processing may take 1-3 business days.`);
      
      // Reset form
      setCashoutAmount('');
      setSelectedReward('');
      setCashoutEmail('');
      setCashoutLTCAddress('');
    } catch (error) {
      console.error('Cashout error:', error);
      toast.error('Failed to process cashout. Please try again.');
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !currentUser) return;
    
    const newMessage = {
      sender: currentUser.username || currentUser.account || 'You',
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessage('');
    
    // Auto-scroll to bottom
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openSupportTicket = () => {
    if (!currentUser) return;
    
    const ticketMessage = {
      sender: currentUser.username || currentUser.account || 'Support Ticket',
      message: 'I need help with my account',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages([...chatMessages, ticketMessage]);
    toast.success('Support ticket created! We will respond shortly.');
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsersData();
      
      // Check penalty every hour
      const penaltyCheckInterval = setInterval(checkAndApplyPenalty, 60 * 60 * 1000);
      
      // Simulate fetching active users
      setActiveUsers([
        { id: '1', name: 'JohnDoe', avatar: 'https://i.pravatar.cc/150?img=1' },
        { id: '2', name: 'JaneSmith', avatar: 'https://i.pravatar.cc/150?img=2' },
        { id: '3', name: 'MikeJohnson', avatar: 'https://i.pravatar.cc/150?img=3' }
      ]);

      return () => clearInterval(penaltyCheckInterval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isChatOpen && isLoggedIn) {
      fetchChatMessages();
    }
  }, [isChatOpen, isLoggedIn]);

  const offerWalls: Offerwall[] = [
    {
      id: 'openOfferWallCPX',
      name: 'CPX Research',
      type: 'Surveys',
      logo: 'https://www.cpx-research.com/main/en/assets/img/logo.svg',
      color: 'from-cyan-500 to-blue-600',
      description: 'Premium survey platform with high-paying opportunities'
    },
    {
      id: 'openOfferWallsads',
      name: 'SushiAds',
      type: 'Mixed Offers',
      logo: 'https://affi-plat.s3.us-east-2.amazonaws.com/platforms/sushiads-logo-horizontal.png',
      color: 'from-purple-500 to-pink-600',
      description: 'Diverse range of offers and surveys'
    },
    {
      id: 'openOfferWallkiwi',
      name: 'KiwiWall',
      type: 'Offers',
      logo: 'https://www.kiwiwall.com/img/logo.png',
      color: 'from-green-500 to-emerald-600',
      description: 'High-converting offer wall with instant rewards'
    },
    {
      id: 'openOfferWallcheddar',
      name: 'Cheddar.tv',
      type: 'Videos',
      logo: 'https://i.imgur.com/ynkX1XI.png',
      color: 'from-orange-500 to-amber-600',
      description: 'Watch videos and earn passive income',
      badge: 'Videos Only'
    },
    {
      id: 'openOfferWallbuxiq',
      name: 'Cashout',
      type: 'Cashout',
      logo: 'https://i.imgur.com/3CUrxKO.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Redeem your earnings'
    },
    {
      id: 'openOfferWallbuxiqbonus',
      name: 'Bonus',
      type: 'Bonus',
      logo: 'https://i.imgur.com/K5in0eX.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Claim daily bonuses'
    }
  ];

  const rewards: Reward[] = [
    {
      id: 'amazon-us',
      name: 'Amazon US Gift Card',
      icon: <Gift className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-yellow-500 to-orange-600',
      description: 'Shop millions of products on Amazon US',
      requiresEmail: true
    },
    {
      id: 'amazon-uk',
      name: 'Amazon UK Gift Card',
      icon: <Gift className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-blue-500 to-indigo-600',
      description: 'Shop millions of products on Amazon UK',
      requiresEmail: true
    },
    {
      id: 'tesco',
      name: 'TESCO Gift Card',
      icon: <ShoppingBag className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-blue-600 to-blue-800',
      description: 'UK supermarket gift card',
      requiresEmail: true
    },
    {
      id: 'aldi',
      name: 'ALDI Gift Card',
      icon: <ShoppingBag className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-yellow-600 to-blue-800',
      description: 'German supermarket gift card',
      requiresEmail: true
    },
    {
      id: 'ltc',
      name: 'Litecoin (LTC)',
      icon: <Coins className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-gray-500 to-gray-700',
      description: 'Cryptocurrency payment',
      requiresAddress: true
    }
  ];

  const stats: StatItem[] = [
    { label: 'Offers Completed', value: '758,502+', icon: <Target className="w-6 h-6" /> },
    { label: 'Total Distributed', value: '$362,630+', icon: <DollarSign className="w-6 h-6" /> },
    { label: 'Active Members', value: '58,236+', icon: <User className="w-6 h-6" /> },
    { label: 'Success Rate', value: '98.7%', icon: <TrendingUp className="w-6 h-6" /> }
  ];

  // Mobile navigation items
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'earn', label: 'Earn', icon: Target },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'leaderboard', label: 'Leaders', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NotificationBanner />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">BUX iQ</h1>
                <p className="text-xs text-muted-foreground"></p>
              </div>
            </div>

            {isLoggedIn && currentUser && (
              <div className={`flex ${isMobile ? 'flex-col space-y-2 mt-3' : 'items-center space-x-4'}`}>
                <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold">{Math.floor(userBalance * 1)} pts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="font-semibold">{userLevel}</p>
                  </div>
                </div>
                {!isMobile && (
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={currentUser.avatar || `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(currentUser.username || 'User')}`} />
                    <AvatarFallback>{(currentUser.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {isMobile && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="hidden md:block border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2">
            {mobileNavItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Activity Logs Section */}
        <div className="mb-8">
          <Card className="modern-card">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Daily Activity</span>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={() => setShowActivityDetails(!showActivityDetails)}
                >
                  {showActivityDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {hasMetDailyRequirement ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">Offerwall Clicks</p>
                      <p className="text-sm text-muted-foreground">
                        {hasMetDailyRequirement 
                          ? 'Requirement met' 
                          : `${missingClicks} more clicks needed`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={hasMetDailyRequirement ? 'default' : 'secondary'}>
                    {offerwallClicksToday}/5
                  </Badge>
                </div>

                {showActivityDetails && (
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className={hasMetDailyRequirement ? 'text-green-500' : 'text-yellow-500'}>
                        {hasMetDailyRequirement ? 'Completed' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Penalty</span>
                      <span className={hasMetDailyRequirement ? 'text-green-500' : 'text-yellow-500'}>
                        {hasMetDailyRequirement ? 'None' : `${penaltyPoints} pts`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Click</span>
                      <span>
                        {lastOfferwallClick 
                          ? lastOfferwallClick.toLocaleTimeString() 
                          : 'Never'}
                      </span>
                    </div>
                    <Progress 
                      value={(offerwallClicksToday / 5) * 100} 
                      className="h-2 mt-2" 
                      indicatorClass={hasMetDailyRequirement ? 'bg-green-500' : 'bg-yellow-500'}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-background border border-border">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,hsl(var(--primary)/0.1)_25%,transparent_25%,transparent_75%,hsl(var(--primary)/0.1)_75%)] bg-[length:20px_20px]" />
              <div className="relative p-8 md:p-12 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="gradient-text">Elevate Your</span>
                  <br />
                  <span className="text-foreground">Earnings</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Premium crypto rewards platform with instant payouts and professional offer walls
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="btn-premium text-lg px-8"
                    onClick={() => setActiveTab('earn')}
                  >
                    Start Earning
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 hover-lift"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="modern-card hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3 text-primary">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="modern-card hover-lift">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Premium Surveys</CardTitle>
                  <CardDescription>
                    High-paying market research surveys with instant rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Up to $1 per survey</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>Instant crediting</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>24/7 availability</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                    <Gamepad2 className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle>Gaming Rewards</CardTitle>
                  <CardDescription>
                    Play games and earn while having fun
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span>Mobile & desktop games</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span>Achievement bonuses</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span>Daily challenges</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="modern-card hover-lift">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>Secure Payouts</CardTitle>
                  <CardDescription>
                    Multiple withdrawal methods with guaranteed security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>Crypto & Gift Cards</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>250 PTS min ($1 = 200 PTS + 50 PTS fee)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>1 - 3 DAYS processing</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Earn Tab */}
        {activeTab === 'earn' && (
          <div className="space-y-8 animate-fade-in">
            {!isLoggedIn ? (
              <Card className="max-w-md mx-auto modern-card">
                <CardHeader>
                  <CardTitle className="text-center gradient-text">
                    {isSign                  <CardTitle className="text-center gradient-text">
                    {isSignUp ? 'Register' : 'Login to Earn'} 
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={isSignUp ? handleSignUp : handleLogin}
                  >
                    {isSignUp && (
                      <Input
                        placeholder="Username"
                        value={signupForm.username}
                        onChange={(e) =>
                          setSignupForm((prev) => ({ ...prev, username: e.target.value }))
                        }
                        required
                      />
                    )}
                    <Input
                      type="email"
                      placeholder="Email"
                      value={isSignUp ? signupForm.email : loginForm.account}
                      onChange={(e) =>
                        isSignUp
                          ? setSignupForm((prev) => ({ ...prev, email: e.target.value }))
                          : setLoginForm((prev) => ({ ...prev, account: e.target.value }))
                      }
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={isSignUp ? signupForm.password : loginForm.clientId}
                      onChange={(e) =>
                        isSignUp
                          ? setSignupForm((prev) => ({ ...prev, password: e.target.value }))
                          : setLoginForm((prev) => ({ ...prev, clientId: e.target.value }))
                      }
                      required
                    />
                    {/* CAPTCHA can be added here if needed */}
                    <Button type="submit" className="w-full">
                      {isSignUp ? 'Register' : 'Login'}
                    </Button>
                  </form>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {isSignUp ? (
                      <>
                        Already have an account?{' '}
                        <button
                          className="underline hover:text-primary"
                          onClick={() => setIsSignUp(false)}
                        >
                          Login here
                        </button>
                      </>
                    ) : (
                      <>
                        Don't have an account?{' '}
                        <button
                          className="underline hover:text-primary"
                          onClick={() => setIsSignUp(true)}
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Logged-in content for Earn tab
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center gradient-text mb-4">
                  Welcome Back, {currentUser?.username || currentUser?.account}
                </h2>

                {/* Offerwall Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {offerWalls.map((offerwall) => (
                    <Button
                      key={offerwall.id}
                      className="flex flex-col items-center p-4 rounded-xl hover-lift"
                      style={{ background: `linear-gradient(to right, ${offerwall.color})` }}
                      onClick={() => handleOfferwallClick(offerwall.id)}
                    >
                      <img src={offerwall.logo} alt={offerwall.name} className="w-12 h-12 mb-2" />
                      <span className="text-center font-medium">{offerwall.name}</span>
                      {offerwall.badge && (
                        <Badge variant="secondary" className="mt-2">
                          {offerwall.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Cashout Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 text-center gradient-text">
                    Cash Out Your Points
                  </h3>
                  <form onSubmit={handleCashout} className="space-y-4 max-w-xl mx-auto">
                    <Input
                      type="number"
                      placeholder="Amount (minimum 250 pts)"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      min={250}
                      required
                    />
                    <div>
                      <Label>Select Reward Type</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rewards.map((reward) => (
                          <Button
                            key={reward.id}
                            variant={selectedReward === reward.id ? 'primary' : 'outline'}
                            onClick={() => setSelectedReward(reward.id)}
                            className="flex items-center gap-2"
                          >
                            {reward.icon}
                            <span className="text-sm">{reward.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    {selectedReward === 'ltc' && (
                      <Input
                        placeholder="Litecoin Address"
                        value={cashoutLTCAddress}
                        onChange={(e) => setCashoutLTCAddress(e.target.value)}
                        required
                      />
                    )}
                    {selectedReward !== 'ltc' && (
                      <Input
                        type="email"
                        placeholder="Your Email"
                        value={cashoutEmail}
                        onChange={(e) => setCashoutEmail(e.target.value)}
                        required
                      />
                    )}
                    <Button type="submit" className="w-full mt-4">
                      Submit Cashout
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop Tab (if any) */}
        {activeTab === 'shop' && (
          <div>
            {/* Shop content here */}
            <h2 className="text-xl font-semibold mb-4">Shop</h2>
            {/* Placeholder */}
            <p>Shop items will be displayed here.</p>
          </div>
        )}

        {/* Leaderboard / Profile / Help tabs can be added similarly */}

      </main>

      {/* Chat modal or sidebar */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Chat with Support</h3>
              <button onClick={() => setIsChatOpen(false)} className="text-muted-foreground hover:text-primary">
                X
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === currentUser?.username ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-2 rounded-lg ${msg.sender === currentUser?.username ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <div className="text-xs text-muted-foreground text-right">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={openSupportTicket}
              >
                Create Support Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe modal for offerwalls */}
      {isIframeOpen && (
        <IframeModal url={iframeUrl} onClose={closeIframe} />
      )}

      {/* Additional modals, notifications, or components can be added here */}
    </div>
  );
};

export default Index;
