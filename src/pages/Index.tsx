import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Home, ShoppingBag, Trophy, User, HelpCircle, MessageCircle,
  Coins, Zap, Gift, CreditCard, Gamepad2, DollarSign, Target, Star, TrendingUp,
  Shield, Sparkles, X, Mail, Send
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOfferwall } from '@/hooks/useOfferwall'
import IframeModal from '@/components/IframeModal'
import ActivityLogs from '@/components/ActivityLogs'
import NotificationBanner from '@/components/NotificationBanner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const Index = () => {
  // State variables
  const [activeTab, setActiveTab] = useState('home')
  const [loginForm, setLoginForm] = useState({ account: '', clientId: '', captcha: '' })
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [selectedReward, setSelectedReward] = useState('')
  const [cashoutEmail, setCashoutEmail] = useState('')
  const [cashoutLTCAddress, setCashoutLTCAddress] = useState('')
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])
  const [offerwallClicks, setOfferwallClicks] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' })
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha, register } = useAuth()
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall()
  const chatEndRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // User XP calculation - scaled with offerwall clicks
  const userBalance = currentUser ? parseFloat(currentUser.balance || '0') : 0
  const userLevel = currentUser ? parseInt(currentUser.level || '1') : 1
  const userXP = Math.floor((offerwallClicks / 5) * 1000) // 1000 XP for 5 clicks

  // Fetch chat messages from CSV
  const fetchChatMessages = async () => {
    try {
      setIsLoadingChat(true)
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTMw2OEzCGbQOpzjj47sjvSlKqeLBC14FkZ6gGKnI3r4roaYapdByCLpYsLDFmbxbk87aCb5ChNjwZP/pub?gid=0&single=true&output=csv')
      const csvData = await response.text()
      const lines = csvData.split('\n')
      const headers = lines[0].split(',')
      const messages = []

      for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',')
        if (currentLine.length === headers.length) {
          const messageObj = {}
          for (let j = 0; j < headers.length; j++) {
            messageObj[headers[j].trim()] = currentLine[j].trim()
          }
          messages.push({
            sender: messageObj.sender || 'Unknown',
            message: messageObj.message || '',
            timestamp: messageObj.timestamp || new Date().toLocaleTimeString(),
          })
        }
      }
      setChatMessages(messages)
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      toast.error('Failed to load chat messages')
    } finally {
      setIsLoadingChat(false)
    }
  }

  useEffect(() => {
    if (isChatOpen && isLoggedIn) {
      fetchChatMessages()
    }
  }, [isChatOpen, isLoggedIn])

  // Send postback to Google Sheets
  const sendPostback = async (action, amount, reason) => {
    try {
      const url = `https://script.google.com/macros/s/AKfycbyvw4LiShTvgnTTLRLISnTYJRhqeStmZgL9YD_ZuQEJubcDPH8bSbGpHPCVHDfx0dbW/exec?action=${encodeURIComponent(action)}&amount=${amount}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`
      const response = await fetch(url)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to process')
      return result
    } catch (error) {
      console.error('Postback error:', error)
      throw error
    }
  }

  // Handle cashout
  const handleCashout = async (e) => {
    e.preventDefault()

    if (!isLoggedIn || !currentUser) {
      toast.error('Please login first')
      return
    }

    const points = parseFloat(cashoutAmount)
    if (isNaN(points) || points < 250) {
      toast.error('Minimum cashout is 250 points')
      return
    }
    if (points > userBalance) {
      toast.error("You don't have enough points")
      return
    }
    if (!selectedReward) {
      toast.error('Please select a reward')
      return
    }
    if (selectedReward === 'ltc' && !cashoutLTCAddress) {
      toast.error('Please enter your LTC wallet address')
      return
    }
    if (selectedReward !== 'ltc' && !cashoutEmail) {
      toast.error('Please enter your email')
      return
    }

    try {
      // Send real postback
      await sendPostback('cashout', points, selectedReward)

      // Deduct points locally
      const newBalance = userBalance - points
      updateBalance(newBalance.toString())

      toast.success(`Cashout of ${points} points submitted to ${selectedReward}. Processing in 1-3 days.`)

      // Reset form
      setCashoutAmount('')
      setSelectedReward('')
      setCashoutEmail('')
      setCashoutLTCAddress('')
    } catch (err) {
      toast.error('Failed to process cashout')
    }
  }

  // Send chat message
  const sendMessage = () => {
    if (!message.trim() || !currentUser) return
    const newMsg = {
      sender: currentUser.username || currentUser.account || 'You',
      message,
      timestamp: new Date().toLocaleTimeString(),
    }
    setChatMessages(prev => [...prev, newMsg])
    setMessage('')
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const openSupportTicket = () => {
    if (!currentUser) return
    const ticketMsg = {
      sender: currentUser.username || currentUser.account || 'Support Ticket',
      message: 'I need help with my account',
      timestamp: new Date().toLocaleTimeString(),
    }
    setChatMessages(prev => [...prev, ticketMsg])
    toast.success('Support ticket created!')
  }

  // Offerwalls
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
  ]

  // Rewards
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
    },
  ]

  // Main render
  return (
    <div className="min-h-screen bg-background">
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between">
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
            {/* User Info */}
            {isLoggedIn && currentUser && (
              <div className={`flex ${isMobile ? 'flex-col space-y-2 mt-3' : 'items-center space-x-4'}`}>
                {/* Balance */}
                <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold">{Math.floor(userBalance)} pts</p>
                  </div>
                </div>
                {/* Level */}
                <div className="flex items-center space-x-3 bg-card/80 rounded-xl px-4 py-2 border border-border">
                  <Zap className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="font-semibold">{userLevel}</p>
                  </div>
                </div>
                {/* Avatar */}
                {!isMobile && (
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={currentUser.avatar || `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(currentUser.username || 'User')}`} />
                    <AvatarFallback>{(currentUser.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {/* Logout Button for mobile */}
                {isMobile && (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation (Desktop) */}
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
              const IconComponent = item.icon
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
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ActivityLogs />

        {/* --- Home Tab --- */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Banner */}
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

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Offers Completed', value: '758,502+', icon: <Target className="w-6 h-6" /> },
                { label: 'Total Distributed', value: '$362,630+', icon: <DollarSign className="w-6 h-6" /> },
                { label: 'Active Members', value: '58,236+', icon: <User className="w-6 h-6" /> },
                { label: 'Success Rate', value: '98.7%', icon: <TrendingUp className="w-6 h-6" /> },
              ].map((stat, index) => (
                <Card key={index} className="modern-card hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3 text-primary">{stat.icon}</div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Surveys */}
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

              {/* Gaming Rewards */}
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

              {/* Security */}
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
                    {isSignUp ? 'Create Account' : 'Login to Continue'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {isSignUp ? 'Join our platform to start earning' : 'Access your earning dashboard'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSignUp ? (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupForm.username}
                          onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
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
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="account">Account Number</Label>
                        <Input
                          id="account"
                          type="text"
                          placeholder="Enter account number"
                          value={loginForm.account}
                          onChange={(e) => setLoginForm({ ...loginForm, account: e.target.value })}
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
                          onChange={(e) => setLoginForm({ ...loginForm, clientId: e.target.value })}
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
                          onChange={(e) => setLoginForm({ ...loginForm, captcha: e.target.value })}
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
                {/* User Dashboard */}
                <Card className="modern-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="gradient-text">Earning Dashboard</CardTitle>
                        <CardDescription>Complete offers to earn rewards</CardDescription>
                      </div>
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
                      {/* Balance */}
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-center space-x-3">
                          <Coins className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-2xl font-bold">{Math.floor(userBalance)} pts</p>
                          </div>
                        </div>
                      </div>
                      {/* Level */}
                      <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-8 h-8 text-secondary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Level</p>
                            <p className="text-2xl font-bold">{userLevel}</p>
                          </div>
                        </div>
                      </div>
                      {/* XP */}
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

                    {/* Progress to next level */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Progress to Level {userLevel + 1}</span>
                        <span className="text-sm text-muted-foreground">{userXP}/1000 XP</span>
                      </div>
                      <Progress value={(userXP / 1000) * 100} className="h-2" />
                    </div>

                    {/* Daily Activity (offerwall clicks) */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Daily Activity Requirement</p>
                          <p className="text-sm text-muted-foreground">
                            Click at least 5 offerwalls today to avoid penalty (75 pts per missing click)
                          </p>
                          <Progress value={(offerwallClicks / 5) * 100} className="h-2 mt-2 bg-yellow-500/20" />
                          <p className="text-xs text-right mt-1">{offerwallClicks}/5 clicks completed</p>
                        </div>
                      </div>
                    </div>

                    {/* Offerwalls */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {offerWalls.map((wall) => (
                        <Card key={wall.id} className="modern-card hover-lift group">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                              <img src={wall.logo} alt={wall.name} className="h-8 object-contain filter brightness-0 invert group-hover:filter-none transition-all" />
                              {wall.badge && (
                                <Badge variant="secondary" className="text-xs">{wall.badge}</Badge>
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
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold gradient-text mb-4">Reward Shop</h2>
              <p className="text-muted-foreground mb-8">Redeem your earnings for rewards</p>
            </div>
            {/* Rewards grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className="modern-card hover-lift group">
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
                    <Button className="w-full btn-premium" onClick={() => setSelectedReward(reward.id)}>
                      Redeem Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cashout form */}
            {selectedReward && (
              <Card className="max-w-2xl mx-auto modern-card">
                <CardHeader>
                  <CardTitle className="gradient-text">Cashout Request</CardTitle>
                  <CardDescription>
                    {rewards.find(r => r.id === selectedReward)?.name} - Minimum 250 points (200 points = $1 + 50 points fee)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCashout} className="space-y-4">
                    {/* Amount */}
                    <div>
                      <Label htmlFor="cashoutAmount">Points Amount (Min 250)</Label>
                      <Input
                        id="cashoutAmount"
                        type="number"
                        placeholder="Enter points"
                        min={250}
                        step="1"
                        value={cashoutAmount}
                        onChange={(e) => setCashoutAmount(e.target.value)}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        ${((parseFloat(cashoutAmount) || 0) - 50) / 200?.toFixed(2) || '0.00'} USD equivalent
                      </p>
                    </div>

                    {/* Reward details */}
                    {selectedReward === 'ltc' ? (
                      <div>
                        <Label htmlFor="ltcAddress">Litecoin (LTC) Address</Label>
                        <Input
                          id="ltcAddress"
                          type="text"
                          placeholder="Enter LTC wallet address"
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
                          placeholder="Enter delivery email"
                          value={cashoutEmail}
                          onChange={(e) => setCashoutEmail(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setSelectedReward('')}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="btn-premium"
                        disabled={
                          !cashoutAmount ||
                          (selectedReward === 'ltc' ? !cashoutLTCAddress : !cashoutEmail)
                        }
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

        {/* Other Tabs */}
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
              {/* Help info */}
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
                  <p>• Refer friends and earn bonuses</p>
                </CardContent>
              </Card>
              {/* Withdrawal info */}
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Withdrawal Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Min cashout: 250 points (200 pts = $1 + 50 pts fee)</p>
                  <p>• Processing: 1-3 business days</p>
                  <p>• Supported: Amazon US/UK, TESCO, ALDI, Litecoin</p>
                  <p>• Gift cards via email</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Chat Button and Panel */}
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
                  <SheetTitle className="flex justify-between items-center">
                    <span>Community Chat</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingChat ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                {/* Chat input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="resize-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button size="icon" onClick={sendMessage} disabled={!message.trim()}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full mt-2" onClick={openSupportTicket}>
                    Create Support Ticket
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-6 gap-1 p-2">
          {[
            { id: 'home', icon: Home },
            { id: 'earn', icon: Target },
            { id: 'shop', icon: ShoppingBag },
            { id: 'leaderboard', icon: Trophy },
            { id: 'profile', icon: User },
            { id: 'help', icon: HelpCircle },
          ].map((item) => {
            const IconComponent = item.icon
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
            )
          })}
        </div>
      </nav>

      {/* Iframe Modal for offerwalls */}
      <IframeModal isOpen={isIframeOpen} url={iframeUrl} onClose={closeIframe} />
    </div>
  )
}

export default Index
