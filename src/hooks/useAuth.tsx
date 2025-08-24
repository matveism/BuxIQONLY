// Global variables
let captchaCode = '';
let currentUser = null;
let isLoggedIn = false;
let loggedInUsers = {};

// Auth functionality
const auth = {
  // Generate CAPTCHA
  generateCaptcha: function() {
    try {
      captchaCode = Math.floor(10000 + Math.random() * 90000).toString();
      const captchaEl = document.getElementById('captcha');
      if (captchaEl) {
        captchaEl.textContent = 'Enter: ' + captchaCode;
      }
      return captchaCode;
    } catch (error) {
      console.error('Error generating CAPTCHA:', error);
      return '12345'; // Fallback CAPTCHA
    }
  },

  // Check existing session
  checkExistingSession: async function() {
    const savedAccount = localStorage.getItem('buxiq_account');
    if (savedAccount) {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQHuo-I6k4RbAnXvz_FvCzshqg7Cm5dqAXwNkvDLpgpZH84OGUSbX6TiOUfMrCHv3CiNnLnx0IhzNZC/pub?gid=0&single=true&output=csv');
        const data = await response.text();
        const rows = data.trim().split('\n').map(row => row.split(','));
        const user = rows.find(r => r[0] === savedAccount);
        
        if (user && user[2]?.toLowerCase() !== 'blocked') {
          currentUser = {
            account: user[0],
            clientId: user[1],
            status: user[2],
            balance: user[3],
            username: user[4],
            avatar: user[5],
            level: user[6]
          };
          isLoggedIn = true;
          
          // Update UI with user data
          updateUserUI(user);
          
          // Show dashboard
          document.getElementById('login-container')?.classList.add('hidden');
          document.getElementById('dashboard')?.classList.remove('hidden');
          
          // Initialize offerwalls for this user
          initializeOfferwallButtons();
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    } else {
      // Show default section if no session
      showSection('earn');
    }
  },

  // Login function
  login: async function(account, clientId, captcha) {
    const errorMsg = document.getElementById('error-msg');
    
    if (captcha !== captchaCode) {
      // Show error using your toast function or alert
      if (typeof toast === 'function') {
        toast({
          title: "Invalid CAPTCHA",
          description: "Please enter the correct CAPTCHA code.",
          variant: "destructive",
        });
      } else {
        showError(errorMsg, 'Invalid CAPTCHA');
      }
      this.generateCaptcha();
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
          if (typeof toast === 'function') {
            toast({
              title: "Account Blocked",
              description: "Your account is blocked.",
              variant: "destructive",
            });
          } else {
            showError(errorMsg, 'Your account is blocked.');
          }
          return false;
        }

        currentUser = {
          account: user[0],
          clientId: user[1],
          status: user[2],
          balance: user[3],
          username: user[4],
          avatar: user[5],
          level: user[6]
        };
        
        isLoggedIn = true;
        localStorage.setItem('buxiq_account', account);
        
        // Update UI with user data
        updateUserUI(user);
        
        // Show dashboard
        document.getElementById('login-container')?.classList.add('hidden');
        document.getElementById('dashboard')?.classList.remove('hidden');
        if (errorMsg) errorMsg.classList.add('hidden');
        
        // Initialize offerwalls for this user
        initializeOfferwallButtons();
        
        if (typeof toast === 'function') {
          toast({
            title: "Welcome back!",
            description: "Successfully logged into your Bux iQ account.",
          });
        }
        
        return true;
      } else {
        if (typeof toast === 'function') {
          toast({
            title: "Invalid credentials",
            description: "Please check your account number and client ID.",
            variant: "destructive",
          });
        } else {
          showError(errorMsg, 'Invalid credentials');
        }
        this.generateCaptcha();
        return false;
      }
    } catch (error) {
      if (typeof toast === 'function') {
        toast({
          title: "Login Error",
          description: "Error loading data. Please try again.",
          variant: "destructive",
        });
      } else {
        showError(errorMsg, 'Error loading data. Please try again.');
      }
      this.generateCaptcha();
      return false;
    }
  },

  // Logout function
  logout: function() {
    try {
      if (currentUser && currentUser.account) {
        // Remove user from logged-in users
        delete loggedInUsers[currentUser.account];
      }
      
      currentUser = null;
      isLoggedIn = false;
      localStorage.removeItem('buxiq_account');

      document.getElementById('dashboard')?.classList.add('hidden');
      document.getElementById('login-container')?.classList.remove('hidden');
      document.getElementById('login-account').value = '';
      document.getElementById('login-clientid').value = '';
      document.getElementById('captchaInput').value = '';

      const errorMsg = document.getElementById('error-msg');
      if (errorMsg) errorMsg.classList.add('hidden');

      this.generateCaptcha();
      showSection('earn'); // Return to default 'earn' section on logout
      
      // Reset balance display
      const balanceEl = document.getElementById('balance');
      const mobileBalanceEl = document.getElementById('mobileBalance');
      if (balanceEl) balanceEl.textContent = '$0.00';
      if (mobileBalanceEl) mobileBalanceEl.textContent = '0.00';
      
      // Reset username
      const usernameEl = document.getElementById('mobileUsername');
      if (usernameEl) usernameEl.textContent = 'User';
      
      // Reset level
      const levelEl = document.getElementById('level');
      const mobileLevelEl = document.getElementById('mobileLevel');
      if (levelEl) levelEl.textContent = '0';
      if (mobileLevelEl) mobileLevelEl.textContent = '0';
      
      if (typeof toast === 'function') {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // Update balance
  updateBalance: async function() {
    if (!currentUser) return;

    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQHuo-I6k4RbAnXvz_FvCzshqg7Cm5dqAXwNkvDLpgpZH84OGUSbX6TiOUfMrCHv3CiNnLnx0IhzNZC/pub?gid=0&single=true&output=csv');
      const data = await response.text();
      const rows = data.trim().split('\n').map(r => r.split(','));
      const user = rows.find(r => r[0] === currentUser.account && r[1] === currentUser.clientId);

      if (user) {
        currentUser.balance = user[3];
        
        // Update UI
        const balanceEl = document.getElementById('balance');
        const mobileBalanceEl = document.getElementById('mobileBalance');
        if (balanceEl) balanceEl.textContent = `$${parseFloat(user[3] || '0').toFixed(2)}`;
        if (mobileBalanceEl) mobileBalanceEl.textContent = parseFloat(user[3] || '0').toFixed(2);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }
};

// DOM Content Loaded - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // Generate initial CAPTCHA
    auth.generateCaptcha();

    // Check for existing session
    auth.checkExistingSession();

    // Initialize all event listeners
    initializeEventListeners();

    // Start server time updates
    updateServerTime();
    setInterval(updateServerTime, 1000);
    
    // Initialize Three.js background
    initThreeJS();
    
    // Create floating particles
    createParticles();
});

// Modify your handleLogin function to use the auth object
async function handleLogin(e) {
    e.preventDefault();

    const account = document.getElementById('login-account')?.value?.trim() || '';
    const clientid = document.getElementById('login-clientid')?.value?.trim() || '';
    const captchaInput = document.getElementById('captchaInput')?.value?.trim() || '';

    // For auto-login, allow a temporary bypass for CAPTCHA verification
    const isAutoLogin = e.type === 'auto';
    if (isAutoLogin) {
        // Skip CAPTCHA check for auto-login
        await auth.login(account, clientid, captchaCode);
    } else {
        await auth.login(account, clientid, captchaInput);
    }
}

// Modify your logout function to use the auth object
function logout() {
    auth.logout();
}

// Modify your updateBalance function to use the auth object
async function updateBalance() {
    await auth.updateBalance();
}
