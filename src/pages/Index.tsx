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
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useOfferwall } from '@/hooks/useOfferwall';
import IframeModal from '@/components/IframeModal';
import NotificationBanner from '@/components/NotificationBanner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loginForm, setLoginForm] = useState({ account: '', clientId: '', captcha: '' });
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [selectedReward, setSelectedReward] = useState('');
  const [cashoutEmail, setCashoutEmail] = useState('');
  const [cashoutLTCAddress, setCashoutLTCAddress] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string; timestamp: string }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const [offerwallClicks, setOfferwallClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState<Date | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' });
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha, register } = useAuth();
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Static data
  const offerWalls = [
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

  const rewards = [
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

  const stats = [
    { label: 'Offers Completed', value: '758,502+', icon: <Target className="w-6 h-6" /> },
    { label: 'Total Distributed', value: '$362,630+', icon: <DollarSign className="w-6 h-6" /> },
    { label: 'Active Members', value: '58,236+', icon: <User className="w-6 h-6" /> },
    { label: 'Success Rate', value: '98.7%', icon: <TrendingUp className="w-6 h-6" /> },
  ];

  // Placeholder handlers
  const handleLogin = async () => {};
  const handleSignUp = async () => {};
  const handleLogout = () => {};
  const handleOfferwallClick = (id: string) => {};
  const handleCashout = (e) => {};
  const sendMessage = () => {};
  const fetchChatMessages = async () => {};

  // User stats
  const userBalance = 1000; // placeholder
  const userLevel = 1; // placeholder
  const userXP = Math.floor(userBalance / 0.1);

  // Fetch chat messages
  useEffect(() => {
    if (isChatOpen) fetchChatMessages();
  }, [isChatOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Notification Banner */}
      {/* <NotificationBanner /> */}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between">
          {/* Logo & Title */}
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
          {/* User info */}
          {isLoggedIn && (
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
                  <p className="font-semibold">{userLevel}</p>
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
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'earn', label: 'Earn', icon: Target },
              { id: 'shop', label: 'Shop', icon: ShoppingBag },
              { id: 'leaderboard', label: 'Leaders', icon: Trophy },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'help', label: 'Help', icon: HelpCircle },
            ].map((item) => {
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
        {/* <ActivityLogs /> */}

        {/* Home Tab Content */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero section */}
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

            {/* Info cards placeholder */}
            {/* Add your info cards here */}
          </div>
        )}

        {/* Earn Tab Content */}
        {activeTab === 'earn' && (
          <div className="space-y-8 animate-fade-in">
            {!isLoggedIn ? (
              <Card className="max-w-md mx-auto modern-card">
                <CardHeader>
                  <CardTitle className="text-center gradient-text">
                    {isSignUp ? 'Create Account' : 'Login to Continue'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSignUp ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="signup-username">Username</Label>
                        <Input
                          id="signup-username"
                          placeholder="Choose a username"
                          value={signupForm.username}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full btn-premium">
                        Sign Up
                      </Button>
                      <div className="text-center text-sm mt-4">
                        Already have an account?{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => setIsSignUp(false)}
                        >
                          Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="login-account">Account Number</Label>
                        <Input
                          id="login-account"
                          placeholder="Enter account number"
                          value={loginForm.account}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, account: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-clientId">Client ID</Label>
                        <Input
                          id="login-clientId"
                          placeholder="Enter client ID"
                          value={loginForm.clientId}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, clientId: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="captcha">CAPTCHA</Label>
                        <div className="bg-muted p-3 rounded-lg text-center font-mono text-lg mb-2 select-none">
                          Enter: {captchaCode}
                        </div>
                        <Input
                          id="captcha"
                          placeholder="Enter CAPTCHA"
                          value={loginForm.captcha}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, captcha: e.target.value }))}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full btn-premium">
                        Login
                      </Button>
                      <div className="text-center text-sm mt-4">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => setIsSignUp(true)}
                        >
                          Sign Up
                        </button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Dashboard */}
                <Card className="modern-card">
                  <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                      <CardTitle className="gradient-text">Earning Dashboard</CardTitle>
                      {!isMobile && (
                        <Button variant="outline" onClick={handleLogout}>
                          Logout
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* User Stats */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-center space-x-3">
                          <Coins className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="font-bold">{userBalance} pts</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-8 h-8 text-secondary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Level</p>
                            <p className="font-bold">{userLevel}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-3">
                          <Star className="w-8 h-8 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">XP</p>
                            <p className="font-bold">{userXP}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* XP Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progress to Next Level</span>
                        <span className="text-sm text-muted-foreground">{userXP} XP</span>
                      </div>
                      <Progress value={(userXP / 1000) * 100} className="h-2" />
                    </div>
                    {/* Daily Offerwall Clicks */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Daily Offerwall Clicks</p>
                          <p className="text-sm text-muted-foreground">
                            {offerwallClicks}/5 clicks completed
                          </p>
                          <Progress value={(offerwallClicks / 5) * 100} className="h-2 mt-2" />
                        </div>
                      </div>
                    </div>

                    {/* Offerwalls */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {offerWalls.map((wall) => (
                        <Card key={wall.id} className="modern-card hover-lift group">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                              <img src={wall.logo} alt={wall.name} className="h-8 object-contain" />
                              {wall.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {wall.badge}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{wall.name}</CardTitle>
                            <CardDescription>{wall.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button
                              className={`w-full bg-gradient-to-r ${wall.color} hover:scale-105 transition-transform`}
                              onClick={() => handleOfferwallClick(wall.id)}
                            >
                              Open {wall.type}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Rewards shop and cashout */}
                <div className="space-y-8">
                  <h2 className="text-xl font-bold gradient-text mb-4">Rewards Shop</h2>
                  {/* Rewards grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {rewards.map((reward) => (
                      <Card key={reward.id} className="modern-card hover-lift">
                        <CardHeader className="text-center">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${reward.color} flex items-center justify-center text-white`}>
                            {reward.icon}
                          </div>
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          <CardDescription>{reward.description}</CardDescription>
                          <Badge variant="outline" className="mt-2">
                            From {reward.minAmount}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <Button
                            className="w-full btn-premium"
                            onClick={() => setSelectedReward(reward.id)}
                          >
                            Redeem Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {/* Cashout form */}
                  {selectedReward && (
                    <Card className="modern-card max-w-2xl mx-auto">
                      <CardHeader>
                        <CardTitle className="gradient-text">Cashout for {rewards.find(r => r.id === selectedReward)?.name}</CardTitle>
                        <CardDescription>Minimum 250 points (200 pts = $1 + 50 pts fee)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCashout} className="space-y-4">
                          <div>
                            <Label htmlFor="cashoutAmount">Points Amount</Label>
                            <Input
                              id="cashoutAmount"
                              type="number"
                              placeholder="Enter points"
                              value={cashoutAmount}
                              onChange={(e) => setCashoutAmount(e.target.value)}
                              min="250"
                              required
                            />
                          </div>
                          {selectedReward === 'ltc' ? (
                            <div>
                              <Label htmlFor="ltcAddress">Litecoin Address</Label>
                              <Input
                                id="ltcAddress"
                                placeholder="Your LTC address"
                                value={cashoutLTCAddress}
                                onChange={(e) => setCashoutLTCAddress(e.target.value)}
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="cashoutEmail">Email Address</Label>
                              <Input
                                id="cashoutEmail"
                                type="email"
                                placeholder="Your email"
                                value={cashoutEmail}
                                onChange={(e) => setCashoutEmail(e.target.value)}
                                required
                              />
                            </div>
                          )}
                          <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setSelectedReward('')}>
                              Back
                            </Button>
                            <Button
                              type="submit"
                              className="btn-premium"
                              disabled={!cashoutAmount || (selectedReward === 'ltc' ? !cashoutLTCAddress : !cashoutEmail)}
                            >
                              Submit Cashout
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile, leaderboard, help tabs can be added similarly */}

      </main>

      {/* Chat Button */}
      {isLoggedIn && (
        <div className="fixed bottom-6 right-6 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="rounded-full w-14 h-14 p-0 shadow-xl hover:scale-110 transition-transform"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0">
              <div className="h-full flex flex-col">
                <SheetHeader className="border-b p-4">
                  <div className="flex justify-between items-center">
                    <SheetTitle className="flex items-center justify-center w-full">
                      <span>Community Chat</span>
                    </SheetTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </SheetHeader>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {isLoadingChat ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="font-medium text-xs mb-1">{msg.sender}</div>
                          <div>{msg.message}</div>
                          <div className="text-xs opacity-70 mt-1 text-right">{msg.timestamp}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Mail className="w-10 h-10 mb-4" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start chatting with the community!</p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="resize-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!message.trim()}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={openSupportTicket}
                  >
                    Create Support Ticket
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Iframe Modal */}
      <IframeModal isOpen={isIframeOpen} url={iframeUrl} onClose={closeIframe} />
    </div>
  );
};

export default Index;
