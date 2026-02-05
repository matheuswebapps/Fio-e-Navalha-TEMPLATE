
import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '../types';

interface PWABannerProps {
  settings: BusinessSettings;
}

const PWABanner: React.FC<PWABannerProps> = ({ settings }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if feature is enabled in Admin
    if (!settings.enablePWABanner) return;

    // 2. Check if already dismissed
    const isDismissed = localStorage.getItem('pwa_dismissed');
    if (isDismissed) return;

    // 3. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 4. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 5. Logic for Android/Chrome (Capture Event)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Logic for iOS (Show immediately if not standalone/dismissed)
    if (isIosDevice) {
      setShowBanner(true);
    }

    // 7. Listen for successful install to hide banner
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [settings.enablePWABanner]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in">
      <div className="bg-[#0B1F3B]/95 backdrop-blur-md border border-[#C1121F]/30 rounded-xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        
        {/* Subtle Barber Pole Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 barber-pole"></div>

        <div className="flex justify-between items-start pt-2">
           <div className="flex-1">
             <h4 className="text-white font-bold font-oswald uppercase tracking-wide text-sm mb-1">
               {settings.name || 'Fio & Navalha'}
             </h4>
             <p className="text-gray-300 text-xs leading-relaxed">
               {settings.pwaBannerText || 'Adicione à tela inicial para agendar mais rápido!'}
             </p>
           </div>
           
           <button 
             onClick={handleDismiss} 
             className="text-gray-500 hover:text-white p-1 -mt-1 -mr-1"
             aria-label="Fechar"
           >
             <i className="fas fa-times"></i>
           </button>
        </div>

        {/* Buttons / Instructions */}
        {isIOS ? (
           <div className="bg-white/5 rounded p-2 text-[10px] text-gray-300 border border-white/10 flex items-center gap-3">
              <i className="fas fa-share-square text-lg text-[#C1121F]"></i>
              <span>Toque em <b>Compartilhar</b> e depois em <br/> <b>Adicionar à Tela de Início</b> <i className="far fa-plus-square"></i></span>
           </div>
        ) : (
           <div className="flex gap-3 mt-1">
              <button 
                onClick={handleInstallClick}
                className="flex-1 bg-[#C1121F] hover:bg-[#A00F19] text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
              >
                Instalar App
              </button>
              <button 
                onClick={handleDismiss}
                className="px-4 py-2 rounded border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5"
              >
                Agora não
              </button>
           </div>
        )}

      </div>
    </div>
  );
};

export default PWABanner;
