// Offerwall functionality
const offerwall = {
  isIframeOpen: false,
  iframeUrl: '',

  // Offerwall configuration
  offerwallButtons: {
    'openOfferWallCPX': (user) => `https://offers.cpx-research.com/index.php?app_id=26219&ext_user_id=${user}&username=${user}&subid_1=&subid_2`,
    'openOfferWallsads': (user) => `https://offerwall.sushiads.com/surveywall?apiKey=67e76c74ca62f460071524&userId=${user}`,
    'openOfferWallchat': () => `https://bux-iq.netlify.app/chat.html`,
    'openOfferWallwannads': (user) => `https://earn.wannads.com/wall?apiKey=67d3d43d63631681386947&userId=${user}`,
    'openOfferWallsads1': (user) => `https://offerwall.sushiads.com/wall?apiKey=67e76c74ca62f460071524&userId=${user}`,
    'openOfferWallExcentiv': (user) => `https://excentiv.com/offerwall/?&userid=${user}&key=q1v8KGQfCjmNeXnhsHyo`,
    'openOfferWallbuxiq': () => `https://bux-iq.netlify.app/cashout.html`,
    'openOfferWallbuxiqbonus': () => `https://bux-iq.netlify.app/bonus.html`,
    'openOfferWallkiwi': (user) => `https://www.kiwiwall.com/wall/ICKEzWAlZv8O6QOXSxFdfJ7jLfU6RUtl/${user}`,
    'openOfferWalltaskwall': (user) => `https://wall.taskwall.io/?app_id=532d75c281c9725adc821ff7de18c199&userid=${user}`,
    'openOfferWallporix': (user) => `https://porix.org/app/iframe/10221/${user}`,
    'openOfferWallrevtoo': (user) => `https://revtoo.com/offerwall/m7l0au6f6w8tzh0ghly11tur1oucce/${user}`,
    'openOfferWallcheddar': (user) => {
      const url = `https://revtoo.com/redirect?api_key=m7l0au6f6w8tzh0ghly11tur1oucce&offer_id=479&user_id=${user}`;
      setTimeout(() => window.open(url, '_blank'), 100);
      return;
    }
  },

  // Open offerwall
  openOfferwall: function(buttonId, username) {
    if (!username) {
      alert('Please login first to access offerwalls');
      return;
    }

    const urlGenerator = this.offerwallButtons[buttonId];
    if (!urlGenerator) {
      console.error('No URL generator found for button:', buttonId);
      return;
    }

    const result = urlGenerator(username);
    if (typeof result === 'string') {
      this.iframeUrl = result;
      this.isIframeOpen = true;
      
      // Update the iframe
      const dashboardIframe = document.getElementById('dashboardIframe');
      if (dashboardIframe) {
        dashboardIframe.src = result;
      }
      
      // Show the iframe container
      const iframeContainer = document.getElementById('iframeContainer');
      if (iframeContainer) {
        iframeContainer.style.display = 'block';
      }
      
      document.body.style.overflow = 'hidden';
    }
  },

  // Close iframe
  closeIframe: function() {
    this.isIframeOpen = false;
    this.iframeUrl = '';
    
    // Hide the iframe container
    const iframeContainer = document.getElementById('iframeContainer');
    if (iframeContainer) {
      iframeContainer.style.display = 'none';
    }
    
    // Clear the iframe source
    const dashboardIframe = document.getElementById('dashboardIframe');
    if (dashboardIframe) {
      dashboardIframe.src = '';
    }
    
    document.body.style.overflow = 'auto';
  }
};

// Update your offerwallClickHandler to use the new offerwall object
function offerwallClickHandler(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('Please login first to access offerwalls');
    showSection('earn');
    return;
  }

  const buttonId = this.id;
  // Use user[4] (username) or user[0] (account) as fallback
  const username = currentUser[4] || currentUser[0] || 'user';
  
  offerwall.openOfferwall(buttonId, username);
}

// Update your closeIframe function to use the offerwall object
function closeIframe() {
  offerwall.closeIframe();
}

// Update your initializeOfferwallButtons function
function initializeOfferwallButtons() {
  Object.keys(offerwall.offerwallButtons).forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      // Remove any existing listeners to prevent duplicates
      button.removeEventListener('click', offerwallClickHandler);
      // Add new listener
      button.addEventListener('click', offerwallClickHandler);
    }
  });
}
