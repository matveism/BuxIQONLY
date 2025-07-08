
import { useState } from 'react';

interface OfferwallConfig {
  [key: string]: (user: string) => string | void;
}

export const useOfferwall = () => {
  const [isIframeOpen, setIsIframeOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  const offerwallButtons: OfferwallConfig = {
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
  };

  const openOfferwall = (buttonId: string, username?: string) => {
    if (!username) {
      alert('Please login first to access offerwalls');
      return;
    }

    const urlGenerator = offerwallButtons[buttonId];
    if (!urlGenerator) {
      console.error('No URL generator found for button:', buttonId);
      return;
    }

    const result = urlGenerator(username);
    if (typeof result === 'string') {
      setIframeUrl(result);
      setIsIframeOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeIframe = () => {
    setIsIframeOpen(false);
    setIframeUrl('');
    document.body.style.overflow = 'auto';
  };

  return {
    isIframeOpen,
    iframeUrl,
    openOfferwall,
    closeIframe
  };
};
