
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Scheduling from './components/Scheduling';
import Services from './components/Services';
import Location from './components/Location';
import CutSuggestions from './components/CutSuggestions';
import Products from './components/Products'; 
import Navigation from './components/Navigation';
import Admin from './components/Admin';
import PWABanner from './components/PWABanner'; 
import FloatingSocialButtons from './components/FloatingSocialButtons';
import { dataProvider } from './dataProvider';
import { DEFAULT_SETTINGS } from './constants';
import { BusinessSettings } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  
  // Secret Admin Access State
  const [homeClickCount, setHomeClickCount] = useState(0);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => console.log('SW registered: ', registration.scope),
          (err) => console.log('SW registration failed: ', err)
        );
      });
    }

    const loadSettings = async () => {
      try {
        const fetchedSettings = await dataProvider.getSettings();
        setSettings(fetchedSettings);
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, [currentTab]);

  // Effect to update PWA/Browser Icon dynamically
  useEffect(() => {
    if (settings.appIconUrl) {
      let linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(linkIcon);
      }
      linkIcon.href = settings.appIconUrl;
      
      let linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!linkApple) {
        linkApple = document.createElement('link');
        linkApple.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(linkApple);
      }
      linkApple.href = settings.appIconUrl;
    }
  }, [settings.appIconUrl]);

  // Update page title (the installable PWA name/icon come from the manifest served by Netlify)
  useEffect(() => {
    const appName = settings.pwaName || settings.name || "App";
    document.title = appName;

    const ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement | null;
    if (ogTitle) ogTitle.content = appName;
  }, [settings.pwaName, settings.name]);


  const handleTabChange = (tab: string) => {
    // Secret Admin Access Logic
    if (tab === 'home') {
      const newCount = homeClickCount + 1;
      setHomeClickCount(newCount);
      if (newCount >= 5) {
        setCurrentTab('admin');
        setHomeClickCount(0);
        return; 
      }
      setTimeout(() => setHomeClickCount(0), 2000);
    } else {
      setHomeClickCount(0);
    }
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return <Home onNavigate={handleTabChange} settings={settings} />;
      case 'schedule': return <Scheduling settings={settings} />;
      case 'suggestions': return <CutSuggestions onNavigate={handleTabChange} />;
      // Only render products if enabled
      case 'products': return settings.productsEnabled ? <Products /> : <Home onNavigate={handleTabChange} settings={settings} />;
      case 'services': return <Services />;
      case 'location': return <Location settings={settings} />;
      case 'admin': return <Admin />;
      default: return <Home onNavigate={handleTabChange} settings={settings} />;
    }
  };

  if (currentTab === 'admin') {
    return (
      <div className="min-h-screen relative bg-[#04080f]">
         <Admin />
         <button 
           onClick={() => setCurrentTab('home')}
           className="fixed bottom-4 right-4 bg-[#C1121F] text-white p-3 rounded-full text-xs font-bold shadow-lg z-50 border border-white/20"
         >
           Sair
         </button>
      </div>
    );
  }

  // Parse Name for Header
  const nameParts = settings.name.split(' ');
  const firstName = nameParts[0] || 'Fio';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '& Navalha';

  // Desktop Menu Items
  // Order: Home -> Schedule -> Cuts -> (Products) -> Services -> Location
  const desktopTabs = ['home', 'schedule', 'suggestions', 'services', 'location'];
  if (settings.productsEnabled) {
      // Insert products after suggestions (which is index 2: 0=home, 1=schedule, 2=suggestions)
      desktopTabs.splice(3, 0, 'products');
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#04080f]">
      
      {/* HEADER - Navy Background */}
      <header className="bg-[#0B1F3B] sticky top-0 z-40 shadow-xl">
        <div className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 max-w-7xl mx-auto">
          
          <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => handleTabChange('home')}>
             {/* Logo or Icon */}
             {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-8 md:h-10 md:w-10 object-contain" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
             ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-[#04080F] flex items-center justify-center text-[#C1121F]">
                    <i className="fas fa-cut"></i>
                </div>
             )}
             
             {/* Text Logo */}
             <div className="flex flex-col">
               <span className="text-lg font-bold text-white leading-none font-oswald tracking-wide">{firstName}</span>
               <span className="text-xs font-bold text-[#C1121F] leading-none uppercase tracking-widest">{lastName}</span>
             </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
             {desktopTabs.map(tab => (
               <button
                 key={tab}
                 onClick={() => handleTabChange(tab)}
                 className={`text-sm font-bold uppercase tracking-wider font-oswald transition-colors ${
                    currentTab === tab 
                    ? 'text-[#C1121F]' 
                    : 'text-gray-400 hover:text-white'
                 }`}
               >
                 {tab === 'home' ? 'Início' : tab === 'suggestions' ? 'Cortes' : tab === 'products' ? 'Produtos' : tab === 'services' ? 'Preços' : tab === 'schedule' ? 'Agendar' : 'Local'}
               </button>
             ))}
             
             {/* Discrete Social Pill Desktop */}
             <div className="flex items-center gap-3 ml-4 bg-[#04080F] px-3 py-1.5 rounded-full border border-white/5">
                {settings.whatsappLink && <a href={settings.whatsappLink} target="_blank" className="text-gray-400 hover:text-[#25D366] transition-colors"><i className="fab fa-whatsapp"></i></a>}
                {settings.instagramLink && <a href={settings.instagramLink} target="_blank" className="text-gray-400 hover:text-[#E1306C] transition-colors"><i className="fab fa-instagram"></i></a>}
                {settings.facebookLink && <a href={settings.facebookLink} target="_blank" className="text-gray-400 hover:text-[#1877F2] transition-colors"><i className="fab fa-facebook"></i></a>}
             </div>
          </div>
        </div>
        
        {/* Barber Pole Line Detail - Thinner */}
        <div className="h-[2px] w-full barber-pole"></div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto animate-in px-0 md:px-4">
        {renderContent()}
      </main>

      {/* PWA Banner Injection */}
      <PWABanner settings={settings} />

      {/* New Conditional Floating Social Buttons */}
      <FloatingSocialButtons currentTab={currentTab} settings={settings} />

      <div className="lg:hidden">
        <Navigation currentTab={currentTab} setTab={handleTabChange} productsEnabled={settings.productsEnabled} />
      </div>

      {/* Footer - Dynamic Year */}
      <footer className="hidden lg:block bg-[#0B1F3B] text-gray-500 py-6 mt-12 text-center border-t border-gray-800">
         <p className="font-oswald text-sm text-white/50 tracking-widest">{settings.name} © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
