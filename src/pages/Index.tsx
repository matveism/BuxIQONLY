import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
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
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha, register } = useAuth();
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Sample static data
  const offerWalls: Offerwall[] = [
    {
      id: 'openOfferWallCPX',
      name: 'CPX Research',
      type: 'Surveys',
      logo: 'https://www.cpx-research.com/main/en/assets/img/logo.svg',
      color: 'from-cyan-500 to-blue-600',
      description: 'Premium survey platform with high-paying opportunities',
    },
    {
      id: 'openOfferWallsads',
      name: 'SushiAds',
      type: 'Mixed Offers',
      logo: 'https://affi-plat.s3.us-east-2.amazonaws.com/platforms/sushiads-logo-horizontal.png',
      color: 'from-purple-500 to-pink-600',
      description: 'Diverse range of offers and surveys',
    },
    {
      id: 'openOfferWallkiwi',
      name: 'KiwiWall',
      type: 'Offers',
      logo: 'https://www.kiwiwall.com/img/logo.png',
      color: 'from-green-500 to-emerald-600',
      description: 'High-converting offer wall with instant rewards',
    },
    {
      id: 'openOfferWallcheddar',
      name: 'Cheddar.tv',
      type: 'Videos',
      logo: 'https://i.imgur.com/ynkX1XI.png',
      color: 'from-orange-500 to-amber-600',
      description: 'Watch videos and earn passive income',
      badge: 'Videos Only',
    },
    {
      id: 'openOfferWallbuxiq',
      name: 'Cashout',
      type: 'Cashout',
      logo: 'https://i.imgur.com/3CUrxKO.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Redeem your earnings',
    },
    {
      id: 'openOfferWallbuxiqbonus',
      name: 'Bonus',
      type: 'Bonus',
      logo: 'https://i.imgur.com/K5in0eX.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Claim daily bonuses',
    },
  ];

  const rewards: Reward[] = [
    {
      id: 'amazon-us',
      name: 'Amazon US Gift Card',
      icon: <Gift className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-yellow-500 to-orange-600',
      description: 'Shop millions of products on Amazon US',
      requiresEmail: true,
    },
    {
      id: 'amazon-uk',
      name: 'Amazon UK Gift Card',
      icon: <Gift className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-blue-500 to-indigo-600',
      description: 'Shop millions of products on Amazon UK',
      requiresEmail: true,
    },
    {
      id: 'tesco',
      name: 'TESCO Gift Card',
      icon: <ShoppingBag className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-blue-600 to-blue-800',
      description: 'UK supermarket gift card',
      requiresEmail: true,
    },
    {
      id: 'aldi',
      name: 'ALDI Gift Card',
      icon: <ShoppingBag className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-yellow-600 to-blue-800',
      description: 'German supermarket gift card',
      requiresEmail: true,
    },
    {
      id: 'ltc',
      name: 'Litecoin (LTC)',
      icon: <Coins className="w-8 h-8" />,
      minAmount: '$5 (1000 pts)',
      color: 'from-gray-500 to-gray-700',
      description: 'Cryptocurrency payment',
      requiresAddress: true,
    },
  ];

  const stats: StatItem[] = [
    { label: 'Offers Completed', value: '758,502+', icon: <Target className="w-6 h-6" /> },
    { label: 'Total Distributed', value: '$362,630+', icon: <DollarSign className="w-6 h-6" /> },
    { label: 'Active Members', value: '58,236+', icon: <User className="w-6 h-6" /> },
    { label: 'Success Rate', value: '98.7%', icon: <TrendingUp className="w-6 h-6" /> },
  ];

  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'earn', label: 'Earn', icon: Target },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'leaderboard', label: 'Leaders', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  // Handler functions (placeholders)
  const handleLogin = async () => {};
  const handleSignUp = async () => {};
  const handleLogout = () => {};
  const handleOfferwallClick = (id: string) => {};
  const handleCashout = (e) => {};
  const sendMessage = () => {};
  const fetchChatMessages = async () => {};

  // Example state for user data
  const userBalance = 1000; // placeholder
  const offerwallClicksToday = 3; // placeholder
  const lastOfferwallClick = new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Notification Banner */}
      {/* <NotificationBanner /> */}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between">
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
          {useAuth().isLoggedIn && (
            <div className={`flex ${isMobile ? 'flex-col space-y-2 mt-3' : 'items-center space-x-4'}`}>
              <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                <Coins className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-semibold">{userBalance} pts</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="font-semibold">1</p>
                </div>
              </div>
              {!isMobile && (
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={currentUser?.avatar || `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(currentUser?.username || 'U')}`} />
                  <AvatarFallback>{(currentUser?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {isMobile && (
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Navigation for mobile */}
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
        {/* Activity Logs */}
        {/* ... your activity logs component ... */}

        {/* Home Tab Content */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero Section */}
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
                  <Button size="lg" className="btn-premium text-lg px-8" onClick={() => setActiveTab('earn')}>
                    Start Earning
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 hover-lift">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="modern-card hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3 text-primary">{stat.icon}</div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* ... your info cards here ... */}
            </div>
          </div>
        )}

        {/* Earn Tab Content */}
        {activeTab === 'earn' && (
          <div className="space-y-8 animate-fade-in">
            {!isLoggedIn ? (
              <Card className="max-w-md mx-auto modern-card">
                <CardHeader>
                  <CardTitle className="text-center gradient-text">
                    {isSignUp ? 'Register' : 'Login to Earn'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      isSignUp ? handleSignUp() : handleLogin();
                    }}
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
                    {/* Email */}
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
                    {/* Password */}
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
                    {/* Submit Button */}
                    <Button type="submit" className="w-full">
                      {isSignUp ? 'Register' : 'Login'}
                    </Button>
                  </form>
                  {/* Toggle SignUp/Login */}
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
              // Logged in content
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center gradient-text mb-4">
                  Welcome Back, {currentUser?.username || currentUser?.account}
                </h2>
                {/* Offerwalls */}
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
              </div>
            )}
            {/* Cashout Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-center gradient-text">Cash Out Your Points</h3>
              <form onSubmit={handleCashout} className="max-w-xl mx-auto space-y-4">
                <Input
                  type="number"
                  placeholder="Amount (minimum 250 pts)"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  min={250}
                  required
                />
                {/* Reward Type */}
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
                {/* Conditional inputs based on reward */}
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
        {/* Additional tabs like shop, profile, etc. can go here */}
      </main>

      {/* Chat modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full flex flex-col h-full max-h-full">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Chat with Support</h3>
              <button
                className="text-muted-foreground hover:text-primary"
                onClick={() => setIsChatOpen(false)}
              >
                X
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === currentUser?.username ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs p-2 rounded-lg ${
                      msg.sender === currentUser?.username
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
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
                  onKeyDown={(e) => e.key === 'Enter' && (sendMessage(), e.preventDefault())}
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => toast('Support Ticket Created!')}
              >
                Create Support Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe Modal for Offerwalls */}
      {isIframeOpen && (
        <IframeModal url={iframeUrl} onClose={closeIframe} />
      )}
    </div>
  );
};

export default Index;
