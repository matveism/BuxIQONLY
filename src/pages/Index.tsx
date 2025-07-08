

import { useState, useEffect} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import { Button} from '@/components/ui/button';
import { Badge} from '@/components/ui/badge';
import { Progress} from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import { Input} from '@/components/ui/input';
import { Label} from '@/components/ui/label';
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
  Sparkles} from 'lucide-react';
import { useAuth} from '@/hooks/useAuth';
import { useOfferwall} from '@/hooks/useOfferwall';
import IframeModal from '@/components/IframeModal';
import ActivityLogs from '@/components/ActivityLogs';
import NotificationBanner from '@/components/NotificationBanner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');  const [loginForm, setLoginForm] = useState({ account: '', clientId: '', captcha: '' });  const [cashoutPoints, setCashoutPoints] = useState(0);  const [cashoutMethod, setCashoutMethod] = useState('');  
  const { currentUser, isLoggedIn, captchaCode, login, logout, updateBalance, generateCaptcha} = useAuth();  const { isIframeOpen, iframeUrl, openOfferwall, closeIframe} = useOfferwall();  // Calculate user stats
  const userBalance = currentUser? parseFloat(currentUser.balance || '0') : 0;
  const userLevel = currentUser? parseInt(currentUser.level || '1') : 1;
  const userXP = Math.floor(userBalance / 0.1); // Simple XP calculation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();    const success = await login(loginForm.account, loginForm.clientId, loginForm.captcha);    if (success) {
      setLoginForm({ account: '', clientId: '', captcha: '' });      setActiveTab('earn');} else {
      setLoginForm(prev => ({ ...prev, captcha: '' }));} };

  const handleLogout = () => {
    logout();    setActiveTab('home');    setLoginForm({ account: '', clientId: '', captcha: '' });}; const handleOfferwallClick = (buttonId: string) => {
    if (!isLoggedIn ||!currentUser) {
      alert('Please login first to access offerwalls');      setActiveTab('earn');      return;} openOfferwall(buttonId, currentUser.username || currentUser.account);}; const handleCashout = () => {
    if (cashoutPoints < 250) {
      alert("Minimum cashout is 250 points.");      return;} // Proceed with cashout logic here
    alert(`Cashout of${cashoutPoints} points to${cashoutMethod} requested!`);}; useEffect(() => {
    if (isLoggedIn) {
      updateBalance();} }, [isLoggedIn]);  const offerWalls = [
    {
      id: 'openOfferWallCPX',
      name: 'CPX Research',
      type: 'Surveys',
      logo: 'https://www.cpx-research.com/main/en/assets/img/logo.svg',
      color: 'from-cyan-500 to-blue-600',
      description: 'Premium survey platform with high-paying opportunities'}, {
      id: 'openOfferWallsads',
      name: 'SushiAds',
      type: 'Mixed Offers',
      logo: 'https://affi-plat.s3.us-east-2.amazonaws.com/platforms/sushiads-logo-horizontal.png',
      color: 'from-purple-500 to-pink-600',
      description: 'Diverse range of offers and surveys'}, {
      id: 'openOfferWallkiwi',
      name: 'KiwiWall',
      type: 'Offers',
      logo: 'https://www.kiwiwall.com/img/logo.png',
      color: 'from-green-500 to-emerald-600',
      description: 'High-converting offer wall with instant rewards'}, {
      id: 'openOfferWallcheddar',
      name: 'Cheddar.tv',
      type: 'Videos',
      logo: 'https://i.imgur.com/ynkX1XI.png',
      color: 'from-orange-500 to-amber-600',
      description: 'Watch videos and earn passive income',
      badge: 'Videos Only'}, {
      id: 'openOfferWallbuxiq',
      name: 'Cashout',
      type: 'Cashout',
      logo: 'https://i.imgur.com/3CUrxKO.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Redeem your earnings'}, {
      id: 'openOfferWallbuxiqbonus',
      name: 'Bonus',
      type: 'Bonus',
      logo: 'https://i.imgur.com/K5in0eX.png',
      color: 'from-blue-500 to-indigo-600',
      description: 'Claim daily bonuses'} ];

  const rewards = [
    {
      name: 'PayPal Cash',
      icon: <CreditCard className="w-8 h-8" />,
      minAmount: '$5',
      color: 'from-blue-500 to-blue-700',
      description: 'Instant transfer to your PayPal account'}      name: 'Amazon Gift Card',
      icon: <Gift className="w-8 h-8" />,
      minAmount: '$10',
      color: 'from-yellow-500 to-yellow-700',
      description: 'Redeemable for all products on Amazon'}, {
      name: 'Steam Wallet',
      icon: <Zap className="w-8 h-8" />,
      minAmount: '$20',
      color: 'from-green-500 to-green-700',
      description: 'Use for in-game purchases and more on Steam'} ];

  return (
    <div>
      <NotificationBanner />
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {currentUser? currentUser.username : 'Guest'}</CardTitle>
          <CardDescription>Your balance:${userBalance.toFixed(2)}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoggedIn? (            <>
              <Button onClick={handleLogout}>Logout</Button>
              <Progress value={userXP} max={100} />
              <Badge>{`Level:${userLevel}`}</Badge>
            </>) : (
            <form onSubmit={handleLogin}>              <Input
                placeholder="Account"                value={loginForm.account}                onChange={(e) => setLoginForm({ ...loginForm, account: e.target.value })}              />
              <Input
                placeholder="Client ID"                value={loginForm.clientId}                onChange={(e) => setLoginForm({ ...loginForm, clientId: e.target.value })}              />
              <Input
                placeholder="Captcha"                value={loginForm.captcha}                onChange={(e) => setLoginForm({ ...loginForm, captcha: e.target.value })}              />
              <Button type="submit">Login</Button>
            </form>
          )}        </CardContent>
      </Card>
      <div>
        {offerWalls.map((offerWall) => (
          <Card key={offerWall.id}>            <CardHeader>
              <CardTitle>{offerWall.name}</CardTitle>
              <CardDescription>{offerWall.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <img src={offerWall.logo} alt={offerWall.name} />
              <Button onClick={() => handleOfferwallClick(offerWall.id)}>Open Offer Wall</Button>
            </CardContent>
          </Card>
        ))}      </div>
      <div>
        <h2>Rewards</h2>
        {rewards.map((reward) => (
          <div key={reward.name} className={`bg-gradient-to-r${reward.color} p-4 rounded-md`}>            {reward.icon}            <h3>{reward.name}</h3>
            <p>{reward.description}</p>
            <p>Minimum Amount: {reward.minAmount}</p>
          </div>
        ))}      </div>
    </div>);};export default Index;
