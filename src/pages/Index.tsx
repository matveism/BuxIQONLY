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
  Shield, Sparkles, X, Mail, Send, Loader2
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
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

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
  const [isProcessingCashout, setIsProcessingCashout] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState([])
  const [statsData, setStatsData] = useState({
    offersCompleted: 0,
    totalDistributed: 0,
    activeMembers: 0,
    successRate: 0
  })

  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha, register } = useAuth()
  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe } = useOfferwall()
  const chatEndRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // User XP calculation - scaled with offerwall clicks
  const userBalance = currentUser ? parseFloat(currentUser.balance || '0') : 0
  const userLevel = currentUser ? parseInt(currentUser.level || '1') : 1
  const userXP = Math.floor((offerwallClicks / 5) * 1000) // 1000 XP for 5 clicks

  // Fetch platform statistics from Supabase
  const fetchPlatformStats = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_stats')
        .select('*')
        .single()
      
      if (error) throw error
      
      if (data) {
        setStatsData({
          offersCompleted: data.offers_completed || 0,
          totalDistributed: data.total_distributed || 0,
          activeMembers: data.active_members || 0,
          successRate: data.success_rate || 0
        })
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    }
  }

  // Fetch leaderboard data from Supabase
  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar, balance, level')
        .order('balance', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      setLeaderboardData(data || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Failed to load leaderboard')
    }
  }

  // Fetch active users from Supabase
  const fetchActiveUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar, last_active_at')
        .order('last_active_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      setActiveUsers(data || [])
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }

  // Fetch chat messages from Supabase
  const fetchChatMessages = async () => {
    try {
      setIsLoadingChat(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, user:users(username, avatar)')
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        sender: msg.user?.username || 'Unknown',
        avatar: msg.user?.avatar,
        message: msg.message || '',
        timestamp: new Date(msg.created_at).toLocaleTimeString(),
      }))

      setChatMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      toast.error('Failed to load chat messages')
    } finally {
      setIsLoadingChat(false)
    }
  }

  // Send chat message to Supabase
  const sendChatMessage = async (messageData) => {
    try {
      if (!currentUser?.id) return

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: currentUser.id,
          message: messageData.message,
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      await login(loginForm.account, loginForm.clientId, loginForm.captcha)
      // Update last active time
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', currentUser.id)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Handle signup
  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      await register(signupForm.username, signupForm.email, signupForm.password)
      // Update last active time
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', currentUser.id)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      // Update last active time before logging out
      if (currentUser?.id) {
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', currentUser.id)
      }
      logout()
    } catch (error) {
      console.error('Error updating last active:', error)
      logout() // Still proceed with logout
    }
  }

  useEffect(() => {
    if (isChatOpen && isLoggedIn) {
      fetchChatMessages()
      
      // Set up real-time subscription for chat messages
      const subscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          // Fetch the user data for the new message
          supabase
            .from('users')
            .select('username, avatar')
            .eq('id', payload.new.user_id)
            .single()
            .then(({ data: user }) => {
              setChatMessages(prev => [...prev, {
                id: payload.new.id,
                sender: user?.username || 'Unknown',
                avatar: user?.avatar,
                message: payload.new.message || '',
                timestamp: new Date(payload.new.created_at).toLocaleTimeString(),
              }])
            })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [isChatOpen, isLoggedIn])

  // Initial data fetch
  useEffect(() => {
    fetchPlatformStats()
    fetchActiveUsers()
    
    if (activeTab === 'leaderboard') {
      fetchLeaderboard()
    }
  }, [activeTab])

  // Track offerwall clicks
  const handleOfferwallClick = (wallId) => {
    const now = Date.now()
    if (lastClickTime && now - lastClickTime < 1000) return // Prevent rapid clicks
    
    setOfferwallClicks(prev => prev + 1)
    setLastClickTime(now)
    
    // Record the click in Supabase
    if (currentUser?.id) {
      supabase
        .from('offerwall_clicks')
        .insert([{
          user_id: currentUser.id,
          offerwall_id: wallId,
          points_earned: 0 // Will be updated when offer completes
        }])
        .then(({ error }) => {
          if (error) console.error('Error recording click:', error)
        })
    }
    
    openOfferwall(wallId)
  }

  // Handle cashout with Supabase
  const handleCashout = async (e) => {
    e.preventDefault()
    setIsProcessingCashout(true)

    if (!isLoggedIn || !currentUser) {
      toast.error('Please login first')
      setIsProcessingCashout(false)
      return
    }

    const points = parseFloat(cashoutAmount)
    if (isNaN(points) || points < 250) {
      toast.error('Minimum cashout is 250 points')
      setIsProcessingCashout(false)
      return
    }
    if (points > userBalance) {
      toast.error("You don't have enough points")
      setIsProcessingCashout(false)
      return
    }
    if (!selectedReward) {
      toast.error('Please select a reward')
      setIsProcessingCashout(false)
      return
    }
    if (selectedReward === 'ltc' && !cashoutLTCAddress) {
      toast.error('Please enter your LTC wallet address')
      setIsProcessingCashout(false)
      return
    }
    if (selectedReward !== 'ltc' && !cashoutEmail) {
      toast.error('Please enter your email')
      setIsProcessingCashout(false)
      return
    }

    try {
      // Record cashout in Supabase
      const { data, error } = await supabase
        .from('cashouts')
        .insert([{
          user_id: currentUser.id,
          amount: points,
          reward_type: selectedReward,
          email: cashoutEmail,
          wallet_address: cashoutLTCAddress,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      // Deduct points from user balance in Supabase
      const newBalance = userBalance - points
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      // Update local balance
      updateBalance(newBalance.toString())

      toast.success(`Cashout of ${points} points submitted to ${selectedReward}. Processing in 1-3 days.`)

      // Reset form
      setCashoutAmount('')
      setSelectedReward('')
      setCashoutEmail('')
      setCashoutLTCAddress('')
    } catch (err) {
      console.error('Cashout error:', err)
      toast.error('Failed to process cashout')
    } finally {
      setIsProcessingCashout(false)
    }
  }

  // Send chat message
  const sendMessage = async () => {
    if (!message.trim() || !currentUser) return
    
    const newMsg = {
      sender: currentUser.username || currentUser.account || 'You',
      avatar: currentUser.avatar,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }
    
    // Send to Supabase
    await sendChatMessage(newMsg)
    
    // Optimistically update UI
    setChatMessages(prev => [...prev, newMsg])
    setMessage('')
    
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const openSupportTicket = async () => {
    if (!currentUser) return
    
    const ticketMsg = {
      sender: currentUser.username || currentUser.account || 'Support Ticket',
      avatar: currentUser.avatar,
      message: 'I need help with my account',
      timestamp: new Date().toLocaleTimeString(),
    }
    
    // Send to Supabase
    await sendChatMessage(ticketMsg)
    
    // Optimistically update UI
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
                { label: 'Offers Completed', value: `${statsData.offersCompleted.toLocaleString()}+`, icon: <Target className="w-6 h-6" /> },
                { label: 'Total Distributed', value: `$${statsData.totalDistributed.toLocaleString()}+`, icon: <DollarSign className="w-6 h-6" /> },
                { label: 'Active Members', value: `${statsData.activeMembers.toLocaleString()}+`, icon: <User className="w-6 h-6" /> },
                { label: 'Success Rate', value: `${statsData.successRate}%`, icon: <TrendingUp className="w-6 h-6" /> },
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
                          (selectedReward === 'ltc' ? !cashoutLTCAddress : !cashoutEmail) ||
                          isProcessingCashout
                        }
                      >
                        {isProcessingCashout ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Submit Cashout'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-3xl font-bold gradient-text mb-2">Leaderboard</h2>
              <p className="text-muted-foreground">Top earners this week</p>
            </div>

            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Users with the highest balances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboardData.length > 0 ? (
                    leaderboardData.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}`} />
                              <AvatarFallback>{user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">Level {user.level || 1}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold">{Math.floor(user.balance || 0)} pts</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
                      <p>Loading leaderboard...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Recently active community members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {activeUsers.length > 0 ? (
                    activeUsers.map(user => (
                      <div key={user.id} className="flex flex-col items-center">
                        <Avatar className="h-12 w-12 mb-2">
                          <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}`} />
                          <AvatarFallback>{user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{user.username || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground w-full">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
                      <p>Loading active users...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fade-in">
            {isLoggedIn && currentUser ? (
              <>
                <div className="text-center mb-8">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                    <AvatarImage src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username || 'User')}`} />
                    <AvatarFallback>{(currentUser.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-3xl font-bold gradient-text mb-2">{currentUser.username || 'User'}</h2>
                  <p className="text-muted-foreground">Member since {new Date(currentUser.created_at).toLocaleDateString()}</p>
                </div>

                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Account ID</Label>
                        <div className="p-2 bg-muted rounded-md">{currentUser.id}</div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="p-2 bg-muted rounded-md">{currentUser.email || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Level</Label>
                        <div className="p-2 bg-muted rounded-md text-center font-bold">{userLevel}</div>
                      </div>
                      <div>
                        <Label>XP</Label>
                        <div className="p-2 bg-muted rounded-md text-center">{userXP}/1000</div>
                      </div>
                      <div>
                        <Label>Balance</Label>
                        <div className="p-2 bg-muted rounded-md text-center font-bold">{Math.floor(userBalance)} pts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Account security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Last Login</Label>
                      <div className="p-2 bg-muted rounded-md">
                        {currentUser.last_login ? new Date(currentUser.last_login).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <Label>Last Activity</Label>
                      <div className="p-2 bg-muted rounded-md">
                        {currentUser.last_active_at ? new Date(currentUser.last_active_at).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-20">
                <User className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Profile</h2>
                <p className="text-muted-foreground mb-6">Please login to view your profile</p>
                <Button onClick={() => setActiveTab('earn')}>Go to Login</Button>
              </div>
            )}
          </div>
        )}

        {/* Help Tab */}
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

            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span>Community Support</span>
                </CardTitle>
                <CardDescription>Join our community chat for help</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => setIsChatOpen(true)}
                  disabled={!isLoggedIn}
                >
                  {isLoggedIn ? 'Open Community Chat' : 'Login to Access Chat'}
                </Button>
              </CardContent>
            </Card>
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
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="flex items-center space-x-2">
                            {msg.avatar && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={msg.avatar} />
                                <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="font-medium text-xs">{msg.sender}</div>
                          </div>
                          <div className="mt-1">{msg.message}</div>
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
