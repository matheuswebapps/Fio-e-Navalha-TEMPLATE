
import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '../types';

interface LocationProps {
  settings: BusinessSettings;
}

const Location: React.FC<LocationProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Logic: 
    // Mon(1)-Fri(5): 09:00 - 20:00
    // Sat(6): 09:00 - 18:00
    // Sun(0): Closed
    const checkOpenStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = now.getHours();
      
      let open = false;

      if (day >= 1 && day <= 5) {
        // Weekdays: 9am to 8pm (20:00)
        // If hour is 9 or more, and strictly less than 20
        if (hour >= 9 && hour < 20) open = true;
      } else if (day === 6) {
        // Saturday: 9am to 6pm (18:00)
        if (hour >= 9 && hour < 18) open = true;
      }
      // Sunday remains false

      setIsOpen(open);
    };

    checkOpenStatus();
    // Re-check every minute just in case
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen">
      <div className="mb-10 animate-in pt-4 border-l-4 border-[#C1121F] pl-4">
        <h2 className="text-3xl font-bold text-white uppercase font-oswald">Localização</h2>
        <p className="text-gray-400 text-sm mt-1">Venha nos fazer uma visita.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 animate-in">
        
        {/* Map Section (2/3) */}
        <div className="md:col-span-2 glass-card h-96 relative overflow-hidden group border border-white/10 flex flex-col">
             {/* Map Placeholder Image (Takes up space) */}
             <div className="flex-1 relative bg-[#04080F] overflow-hidden">
                 <div className="absolute inset-0 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-cover bg-center grayscale"></div>
                 
                 {/* Animated Pin */}
                 <div className="absolute inset-0 flex items-center justify-center">
                     <div className="relative">
                         <div className="w-4 h-4 bg-[#C1121F] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                         <div className="w-10 h-10 bg-[#C1121F] rounded-full flex items-center justify-center shadow-[0_0_20px_#C1121F] relative z-10 text-white animate-bounce">
                             <i className="fas fa-map-marker-alt text-lg"></i>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Separated Info Section */}
             <div className="p-6 bg-[#0B1F3B] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="text-center md:text-left">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Endereço</p>
                    <p className="text-white font-bold text-sm max-w-md">{settings.address}</p>
                 </div>
                 
                 <button 
                  onClick={() => window.open(settings.googleMapsUrl || settings.mapLink, '_blank')}
                  className="px-6 py-3 rounded bg-white/5 hover:bg-[#C1121F] border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                 >
                   Abrir no Maps <i className="fas fa-external-link-alt ml-2"></i>
                 </button>
             </div>
        </div>

        {/* Hours Section (1/3) with Barber Pole Accent */}
        <div className="glass-card p-0 relative overflow-hidden flex flex-col border border-white/10">
          <div className="barber-pole"></div>
          
          <div className="p-8 flex-1 flex flex-col justify-center text-center md:text-left">
             <div className="w-10 h-10 bg-[#0B1F3B] rounded flex items-center justify-center mb-6 mx-auto md:mx-0 text-white border border-white/10">
                <i className="far fa-clock"></i>
             </div>
             
             <h3 className="text-xl font-bold text-white mb-4 font-oswald uppercase">Horários</h3>
             <div className="space-y-3 text-sm text-gray-400 font-light">
                <p className="whitespace-pre-line leading-loose">
                    {settings.openingHoursText}
                </p>
             </div>
             
             <div className="mt-8 pt-6 border-t border-white/5">
                 {isOpen ? (
                     <span className="inline-block px-3 py-1 rounded bg-green-900/30 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-900/50">
                        <i className="fas fa-circle text-[8px] mr-1"></i> Aberto Agora
                     </span>
                 ) : (
                     <span className="inline-block px-3 py-1 rounded bg-red-900/30 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-900/50">
                        <i className="fas fa-circle text-[8px] mr-1"></i> Fechado Agora
                     </span>
                 )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Location;
