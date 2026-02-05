
import React from 'react';
import { BusinessSettings } from '../types';

interface HomeProps {
  onNavigate: (tab: string) => void;
  settings: BusinessSettings;
}

const Home: React.FC<HomeProps> = ({ onNavigate, settings }) => {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* HERO SECTION - Dark/Premium Blend (Symmetric) */}
      <section className="relative min-h-[550px] flex items-center overflow-hidden mb-12 bg-[#04080F]">
        
        {/* Background Layer with Opacity & Blend */}
        <div className="absolute inset-0 z-0">
           {/* The Image */}
           <img 
            src={settings.heroImage} 
            alt="Ambiente" 
            className="w-full h-full object-cover opacity-30"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1600'; }}
          />
          
          {/* Overlays for "Melting" effect - 3 Way Blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#04080F] via-[#04080F]/60 to-transparent z-10"></div> {/* Bottom */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#04080F] via-transparent to-transparent z-10"></div> {/* Left */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#04080F] via-transparent to-transparent z-10"></div> {/* Right */}
        </div>

        {/* Decorative Seal (Optional Logo in Hero) */}
        {settings.logoUrl && (
          <div className="absolute top-10 right-10 z-10 hidden lg:block opacity-10 rotate-12">
             <img src={settings.logoUrl} className="w-64 h-64 object-contain grayscale" />
          </div>
        )}

        <div className="relative z-20 w-full px-6 max-w-5xl mx-auto mt-8">
           <div className="inline-block border-l-4 border-[#C1121F] pl-4 mb-6">
              <span className="text-[#C1121F] text-xs font-bold uppercase tracking-[0.2em] block mb-1">Desde 2018</span>
              <span className="text-gray-400 text-xs uppercase tracking-wider">Barbearia Clássica</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-3xl drop-shadow-lg font-oswald uppercase">
             {settings.name}
           </h1>
           
           <p className="text-gray-300 text-lg md:text-xl max-w-lg mb-10 leading-relaxed font-light border-l border-white/10 pl-4">
             {settings.subtitle}
           </p>
           
           <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => onNavigate('schedule')}
               className="btn-primary px-8 py-4 shadow-lg shadow-[#C1121F]/20"
             >
               <i className="far fa-calendar-alt text-lg"></i>
               {settings.heroButtonTextSchedule || 'Agendar'}
             </button>
             <button 
               onClick={() => onNavigate('suggestions')}
               className="btn-outline px-8 py-4"
             >
               {settings.heroButtonTextCuts || 'Sugestão de Cortes'}
             </button>
           </div>
        </div>
      </section>

      {/* 3 FEATURE CARDS - Varied Highlights */}
      <section className="px-6 -mt-16 relative z-30">
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1: Prioridade - RED */}
          <div className="glass-card p-8 relative overflow-hidden group hover:border-[#C1121F]/30 transition-colors">
            <div className="card-highlight highlight-red"></div>
            <div className="w-12 h-12 bg-[#0B1F3B] rounded-lg flex items-center justify-center text-[#C1121F] text-xl mb-6 border border-white/5">
              <i className="far fa-clock"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-oswald">{settings.feature1Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{settings.feature1Description}</p>
          </div>

          {/* Card 2: Preço - BLUE */}
          <div className="glass-card p-8 relative overflow-hidden group hover:border-[#0B1F3B]/50 transition-colors">
            <div className="card-highlight highlight-blue"></div>
            <div className="w-12 h-12 bg-[#0B1F3B] rounded-lg flex items-center justify-center text-white text-xl mb-6 border border-white/5">
              <i className="fas fa-tag"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-oswald">{settings.feature2Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{settings.feature2Description}</p>
          </div>

          {/* Card 3: Ambiente - TEAL/GRAY */}
          <div className="glass-card p-8 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
            <div className="card-highlight highlight-teal"></div>
            <div className="w-12 h-12 bg-[#0B1F3B] rounded-lg flex items-center justify-center text-teal-500 text-xl mb-6 border border-white/5">
              <i className="fas fa-beer"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-oswald">{settings.feature3Title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{settings.feature3Description}</p>
          </div>

        </div>
      </section>

      <div className="mt-16 text-center px-4">
        <div className="w-12 h-1 bg-[#C1121F] mx-auto mb-4"></div>
        <p className="text-gray-500 italic font-medium font-inter">{settings.footerQuote}</p>
      </div>
    </div>
  );
};

export default Home;
