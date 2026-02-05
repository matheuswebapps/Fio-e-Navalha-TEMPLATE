
import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { CutSuggestion } from '../types';

interface CutSuggestionsProps {
  onNavigate: (tabId: string) => void;
}

const CutSuggestions: React.FC<CutSuggestionsProps> = ({ onNavigate }) => {
  const [cuts, setCuts] = useState<CutSuggestion[]>([]);

  useEffect(() => {
    const loadCuts = async () => {
      const fetchedCuts = await dataProvider.getCuts();
      setCuts(fetchedCuts.filter(c => c.active && c.imageUrl.trim() !== ''));
    };
    loadCuts();
  }, []);

  const handleSelectCut = (cut: CutSuggestion) => {
    localStorage.setItem('selected_cut', JSON.stringify({
      id: cut.id,
      name: cut.name,
      technical: cut.technicalName
    }));
    onNavigate('schedule');
  };

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen">
      <div className="mb-10 animate-in pt-4 border-l-4 border-[#C1121F] pl-4">
        <h2 className="text-3xl font-bold text-white uppercase font-oswald">Sugestão de Cortes</h2>
        <p className="text-gray-400 text-sm mt-1">Os estilos mais pedidos da casa.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {cuts.length === 0 && <p className="col-span-2 text-gray-500">Carregando catálogo...</p>}

        {cuts.map((cut, idx) => (
          <div 
            key={cut.id} 
            className="glass-card p-3 pb-4 group animate-in flex flex-col hover:border-[#C1121F]/40 transition-all"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Image container - No badges */}
            <div className="aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-[#04080F] relative">
              <img 
                src={cut.imageUrl} 
                alt={cut.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0"
              />
            </div>
            
            <div className="px-1 flex-1 flex flex-col">
              <h3 className="font-bold text-white text-md leading-tight font-oswald uppercase">{cut.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-3 tracking-wider">{cut.technicalName}</p>
              
              <div className="mt-auto">
                  <button 
                    onClick={() => handleSelectCut(cut)}
                    className="w-full py-2.5 rounded bg-[#0B1F3B] border border-white/10 text-white text-[10px] font-bold uppercase hover:bg-[#C1121F] hover:border-[#C1121F] transition-colors tracking-widest"
                  >
                    Quero Esse
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CutSuggestions;
