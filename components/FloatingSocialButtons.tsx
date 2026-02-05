
import React from 'react';
import { BusinessSettings } from '../types';

interface FloatingSocialButtonsProps {
  currentTab: string;
  settings: BusinessSettings;
}

const FloatingSocialButtons: React.FC<FloatingSocialButtonsProps> = ({ currentTab, settings }) => {
  // 1. Only show on Home tab
  if (currentTab !== 'home') return null;

  // 2. Check if links exist (Settings)
  const hasWhatsapp = !!settings.whatsappLink;
  const hasInstagram = !!settings.instagramLink;
  const hasFacebook = !!settings.facebookLink;

  // If no social links configured, render nothing
  if (!hasWhatsapp && !hasInstagram && !hasFacebook) return null;

  return (
    // Positioned fixed bottom-right, hidden on large screens (desktop usually has header links)
    // Z-Index 30 to float above content but below modals/PWA banner if needed
    <div className="lg:hidden fixed bottom-20 right-4 z-30 animate-in">
      <div className="bg-[#0B1F3B]/90 border border-[#C1121F]/30 p-2 rounded-lg shadow-xl flex flex-col gap-3 backdrop-blur-md">
        
        {hasWhatsapp && (
          <a 
            href={settings.whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 hover:text-[#25D366] flex items-center justify-center transition-colors w-8 h-8"
            aria-label="WhatsApp"
          >
            <i className="fab fa-whatsapp text-2xl"></i>
          </a>
        )}

        {hasInstagram && (
          <a 
            href={settings.instagramLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 hover:text-[#E1306C] flex items-center justify-center transition-colors w-8 h-8"
            aria-label="Instagram"
          >
            <i className="fab fa-instagram text-2xl"></i>
          </a>
        )}

        {hasFacebook && (
          <a 
            href={settings.facebookLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 hover:text-[#1877F2] flex items-center justify-center transition-colors w-8 h-8"
            aria-label="Facebook"
          >
            <i className="fab fa-facebook text-2xl"></i>
          </a>
        )}

      </div>
    </div>
  );
};

export default FloatingSocialButtons;
