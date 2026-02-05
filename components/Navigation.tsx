
import React from 'react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  productsEnabled?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab, productsEnabled = true }) => {
  // Define tabs with desired order: Home -> Schedule -> Cuts -> (Products) -> Services -> Location
  const tabs = [
    { id: 'home', icon: 'fa-home', label: 'Início' },
    { id: 'schedule', icon: 'fa-calendar-alt', label: 'Agendar' }, // Moved next to Home
    { id: 'suggestions', icon: 'fa-cut', label: 'Cortes' },
    ...(productsEnabled ? [{ id: 'products', icon: 'fa-pump-soap', label: 'Prod.' }] : []),
    { id: 'services', icon: 'fa-list-ul', label: 'Preços' },
    { id: 'location', icon: 'fa-map-marker-alt', label: 'Local' },
  ];

  // Calculate grid columns based on number of tabs
  const gridCols = tabs.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B1F3B] border-t border-white/10 pb-safe-area-inset-bottom z-50 shadow-2xl">
      {/* Used Grid instead of Flex for exact distribution of 5-6 items */}
      <div 
        className="grid items-center h-16 max-w-lg mx-auto"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 relative group px-0.5 ${
              currentTab === tab.id ? 'text-[#C1121F]' : 'text-gray-500'
            }`}
          >
            {/* Active Indicator Line */}
            {currentTab === tab.id && (
               <div className="absolute top-0 w-8 h-0.5 bg-[#C1121F]"></div>
            )}
            
            <i className={`fas ${tab.icon} text-lg mb-1 ${currentTab === tab.id ? '-translate-y-1' : 'group-hover:text-gray-300'} transition-transform`}></i>
            <span className="text-[9px] uppercase font-bold tracking-widest font-oswald truncate w-full text-center px-0.5">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
