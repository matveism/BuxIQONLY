
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  account: string;
  clientId: string;
  status: string;
  balance: string;
  username: string;
  avatar?: string;
  level: string;
}

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const { toast } = useToast();

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setCaptchaCode(code);
    return code;
  };

  // Check existing session
  const checkExistingSession = async () => {
    const savedAccount = localStorage.getItem('buxiq_account');
    if (savedAccount) {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQHuo-I6k4RbAnXvz_FvCzshqg7Cm5dqAXwNkvDLpgpZH84OGUSbX6TiOUfMrCHv3CiNnLnx0IhzNZC/pub?gid=0&single=true&output=csv');
        const data = await response.text();
        const rows = data.trim().split('\n').map(row => row.split(','));
        const user = rows.find(r => r[0] === savedAccount);
        
        if (user && user[2]?.toLowerCase() !== 'blocked') {
          const userData: User = {
            account: user[0],
            clientId: user[1],
            status: user[2],
            balance: user[3],
            username: user[4],
            avatar: user[5],
            level: user[6]
          };
          setCurrentUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    }
  };

  // Login function
  const login = async (account: string, clientId: string, captcha: string) => {
    if (captcha !== captchaCode) {
      toast({
        title: "Invalid CAPTCHA",
        description: "Please enter the correct CAPTCHA code.",
        variant: "destructive",
      });
      generateCaptcha();
      return false;
    }

    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQHuo-I6k4RbAnXvz_FvCzshqg7Cm5dqAXwNkvDLpgpZH84OGUSbX6TiOUfMrCHv3CiNnLnx0IhzNZC/pub?gid=0&single=true&output=csv');
      const data = await response.text();
      const rows = data.trim().split('\n').map(row => row.split(','));
      const user = rows.find(r => r[0] === account && r[1] === clientId);

      if (user) {
        const status = (user[2] || '').toLowerCase();
        if (status === 'blocked') {
          toast({
            title: "Account Blocked",
            description: "Your account is blocked.",
            variant: "destructive",
          });
          return false;
        }

        const userData: User = {
          account: user[0],
          clientId: user[1],
          status: user[2],
          balance: user[3],
          username: user[4],
          avatar: user[5],
          level: user[6]
        };

        setCurrentUser(userData);
        setIsLoggedIn(true);
        localStorage.setItem('buxiq_account', account);
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged into your Bux iQ account.",
        });
        
        return true;
      } else {
        toast({
          title: "Invalid credentials",
          description: "Please check your account number and client ID.",
          variant: "destructive",
        });
        generateCaptcha();
        return false;
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Error loading data. Please try again.",
        variant: "destructive",
      });
      generateCaptcha();
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('buxiq_account');
    generateCaptcha();
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Update balance
  const updateBalance = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQHuo-I6k4RbAnXvz_FvCzshqg7Cm5dqAXwNkvDLpgpZH84OGUSbX6TiOUfMrCHv3CiNnLnx0IhzNZC/pub?gid=0&single=true&output=csv');
      const data = await response.text();
      const rows = data.trim().split('\n').map(r => r.split(','));
      const user = rows.find(r => r[0] === currentUser.account && r[1] === currentUser.clientId);

      if (user) {
        setCurrentUser(prev => prev ? { ...prev, balance: user[3] } : null);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  useEffect(() => {
    generateCaptcha();
    checkExistingSession();
  }, []);

  return {
    currentUser,
    isLoggedIn,
    captchaCode,
    login,
    logout,
    updateBalance,
    generateCaptcha
  };
};
