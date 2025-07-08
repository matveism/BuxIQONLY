import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOfferwall } from '@/hooks/useOfferwall';
import IframeModal from '@/components/IframeModal';
import ActivityLogs from '@/components/ActivityLogs';
import NotificationBanner from '@/components/NotificationBanner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [loginForm, setLoginForm] = useState({ account: '', clientId: '', captcha: '' });
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [selectedReward, setSelectedReward] = useState('');
  const [cashoutEmail, setCashoutEmail] = useState('');
  const [cashoutLTCAddress, setCashoutLTCAddress] = useState('');
  
  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha } = useAuth();
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall();

  // Calculate user stats
  const userBalance = currentUser ? parseFloat(currentUser.balance || '0') : 0;
  const userLevel = currentUser ? parseInt(currentUser.level || '1') : 1;
  const userXP = Math.floor(userBalance / 0.1); // Simple XP calculation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginForm.account, loginForm.clientId, loginForm.captcha);
    if (success) {
      setLoginForm({ account: '', clientId: '', captcha: '' });
      setActiveTab('earn');
    } else {
      setLoginForm(prev => ({ ...prev, captcha: '' }));
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('home');
    setLoginForm({ account: '', clientId: '', captcha: '' });
  };

  const handleOfferwallClick = (buttonId: string) => {
    if (!isLoggedIn || !currentUser) {
      alert('Please login first to access offerwalls');
      setActiveTab('earn');
      return;
    }
    openOfferwall(buttonId, currentUser.username || currentUser.account);
  };

  const handleCashout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !currentUser) {
      alert('Please login first to cash out');
      return;
    }

    const points = parseFloat(cashoutAmount);
    if (isNaN(points) {
      alert('Please enter a valid amount');
      return;
    }

    if (points < 250) {
      alert(`Minimum cashout is 250 points (200 points = $1, 50 points fee)`);
      return;
    }

    if (points > userBalance * 1) {
      alert('You don\'t have enough points for this cashout');
      return;
    }

    if (!selectedReward) {
      alert('Please select a reward type');
      return;
    }

    // Validate based on reward type
    if (selectedReward === 'LTC' && !cashoutLTCAddress) {
      alert('Please enter your Litecoin address');
      return;
    }

    if (selectedReward !== 'LTC' && !cashoutEmail) {
      alert('Please enter your email address');
      return;
    }

    // Here you would typically send the cashout request to your backend
    alert(`Cashout request submitted for ${points} points ($${(points - 50) / 200}) to ${selectedReward}. Processing may take 1-3 business days.`);
    
    // Reset form
    setCashoutAmount('');
    setSelectedReward('');
    setCashoutEmail('');
    setCashoutLTCAddress('');
  };

  useEffect(() => {
    if (isLoggedIn) {
      updateBalance();
    }
  }, [isLoggedIn]);

  const offerWalls = [
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

  const rewards = [
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

  const stats = [
    { label: 'Offers Completed', value: '758,502+', icon: <Target className="w-6 h-6" /> },
    { label: 'Total Distributed', value: '$362,630+', icon: <DollarSign className="w-6 h-6" /> },
    { label: 'Active Members', value: '58,236+', icon: <User className="w-6 h-6" /> },
    { label: 'Success Rate', value: '98.7%', icon: <TrendingUp className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NotificationBanner />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              <div className="hidden md:flex items-center space-x-4">
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
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={currentUser.avatar || `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(currentUser.username || 'User')}`} />
                  <AvatarFallback>{(currentUser.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="hidden md:block border-b border-border bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'earn', label: 'Earn', icon: Target },
              { id: 'shop', label: 'Shop', icon: ShoppingBag },
              { id: 'leaderboard', label: 'Leaders', icon: Trophy },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'help', label: 'Help', icon: HelpCircle }
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
        <ActivityLogs />

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
                  <CardTitle className="text-center gradient-text">Login to Continue</CardTitle>
                  <CardDescription className="text-center">
                    Access your earning dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="account">Account Number</Label>
                      <Input
                        id="account"
                        type="text"
                        placeholder="Enter account number"
                        value={loginForm.account}
                        onChange={(e) => setLoginForm({...loginForm, account: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        type="text"
                        placeholder="Enter client ID"
                        value={loginForm.clientId}
                        onChange={(e) => setLoginForm({...loginForm, clientId: e.target.value})}
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
                        type="text"
                        placeholder="Enter CAPTCHA"
                        value={loginForm.captcha}
                        onChange={(e) => setLoginForm({...loginForm, captcha: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full btn-premium">
                      Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <Card className="modern-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="gradient-text">Earning Dashboard</CardTitle>
                        <CardDescription>Complete offers to earn rewards</CardDescription>
                      </div>
                      <Button variant="outline" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-center space-x-3">
                          <Coins className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-2xl font-bold">{Math.floor(userBalance * 1)} pts</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-8 h-8 text-secondary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Level</p>
                            <p className="text-2xl font-bold">{userLevel}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-3">
                          <Star className="w-8 h-8 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">XP</p>
                            <p className="text-2xl font-bold">{userXP}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progress to Level {userLevel + 1}</span>
                        <span className="text-sm text-muted-foreground">{userXP}/1000 XP</span>
                      </div>
                      <Progress value={(userXP / 1000) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offerWalls.map((wall, index) => (
                    <Card key={index} className="modern-card hover-lift group">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <img 
                            src={wall.logo} 
                            alt={wall.name}
                            className="h-8 object-contain filter brightness-0 invert group-hover:filter-none transition-all"
                          />
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
                          className={`w-full bg-gradient-to-r ${wall.color} hover:scale-105 transition-all`}
                          onClick={() => handleOfferwallClick(wall.id)}
                        >
                          Open {wall.type}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-4">Reward Shop</h2>
              <p className="text-muted-foreground mb-8">Redeem your earnings for amazing rewards</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewards.map((reward, index) => (
                <Card key={index} className="modern-card hover-lift group">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${reward.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
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

            {/* Cashout Form */}
            {selectedReward && (
              <Card className="modern-card max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="gradient-text">Cashout Request</CardTitle>
                  <CardDescription>
                    {rewards.find(r => r.id === selectedReward)?.name} - Minimum 250 points (200 points = $1 + 50 points fee)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCashout} className="space-y-4">
                    <div>
                      <Label htmlFor="cashoutAmount">Points Amount (Min 250)</Label>
                      <Input
                        id="cashoutAmount"
                        type="number"
                        placeholder="Enter points amount"
                        value={cashoutAmount}
                        onChange={(e) => setCashoutAmount(e.target.value)}
                        min="250"
                        step="1"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        ${cashoutAmount ? ((parseFloat(cashoutAmount) - 50) / 200).toFixed(2) : '0.00'} USD equivalent
                      </p>
                    </div>

                    {selectedReward === 'ltc' ? (
                      <div>
                        <Label htmlFor="ltcAddress">Litecoin (LTC) Address</Label>
                        <Input
                          id="ltcAddress"
                          type="text"
                          placeholder="Enter your LTC wallet address"
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
                          placeholder="Enter your email for delivery"
                          value={cashoutEmail}
                          onChange={(e) => setCashoutEmail(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedReward('')}
                      >
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
        )}

        {activeTab === 'leaderboard' && (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
            <p className="text-muted-foreground">Coming soon - compete with top earners!</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-20">
            <User className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold gradient-text mb-4">Help & Support</h2>
              <p className="text-muted-foreground">Get assistance with your account</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <span>How to Earn</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Complete surveys and offers from our partner networks</p>
                  <p>• Play games and reach achievement milestones</p>
                  <p>• Watch videos and engage with sponsored content</p>
                  <p>• Refer friends and earn commission bonuses</p>
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Withdrawal Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Minimum cashout: 250 points (200 points = $1 + 50 points fee)</p>
                  <p>• Processing time: 1 - 3 BUSINESS DAYS</p>
                  <p>• Supported: Amazon US/UK, TESCO, ALDI, Litecoin</p>
                  <p>• Gift cards delivered via email</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-6 gap-1 p-2">
          {[
            { id: 'home', icon: Home },
            { id: 'earn', icon: Target },
            { id: 'shop', icon: ShoppingBag },
            { id: 'leaderboard', icon: Trophy },
            { id: 'profile', icon: User },
            { id: 'help', icon: HelpCircle }
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs mt-1 capitalize">{item.id}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="h-20 md:h-0" />
      
      <IframeModal 
        isOpen={isIframeOpen} 
        url={iframeUrl} 
        onClose={closeIframe} 
      />
    </div>
  );
};

export default Index;
