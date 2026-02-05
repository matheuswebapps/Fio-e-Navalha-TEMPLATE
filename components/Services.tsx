
import React, { useEffect, useState } from 'react';
import { dataProvider } from '../dataProvider';
import { ServiceItem, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedServices, fetchedSettings] = await Promise.all([
        dataProvider.getServices(),
        dataProvider.getSettings()
      ]);
      // Explicitly matching Scheduling.tsx filter: s.active && s.name
      setServices(fetchedServices.filter(s => s.active && s.name));
      setSettings(fetchedSettings);
    };
    fetchData();
  }, []);

  const handleQuickAgendamento = (serviceName: string) => {
    const message = encodeURIComponent(`Olá! Gostaria de agendar: ${serviceName}`);
    window.open(`https://wa.me/${settings.phone}?text=${message}`, '_blank');
  };

  const handleSupportClick = () => {
      if (settings.whatsappLink) {
          window.open(settings.whatsappLink, '_blank');
      } else {
          const cleanPhone = settings.phone.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre os serviços.")}`, '_blank');
      }
  };

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen">
      <div className="mb-10 animate-in pt-4 border-l-4 border-[#C1121F] pl-4">
        <h2 className="text-3xl font-bold text-white uppercase font-oswald">Tabela de Preços</h2>
        <p className="text-gray-400 text-sm mt-1">Qualidade premium, preço justo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12">
        {services.length === 0 && <p className="col-span-2 text-gray-500">Carregando serviços...</p>}
        
        {services.map((service, idx) => (
          <div 
            key={service.id} 
            className="glass-card p-5 flex flex-col justify-between relative overflow-hidden group animate-in hover:bg-[#0B1F3B]/40 transition-colors"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Visual Corner Highlight */}
            <div className="card-highlight"></div>
            
            <div className="mb-4 relative z-10">
              <h3 className="text-lg font-bold text-white leading-tight mb-2 font-oswald tracking-wide">{service.name}</h3>
              <div className="h-px w-8 bg-[#C1121F] mb-3"></div>
              {service.description && (
                  <p className="text-xs text-gray-400 font-light leading-relaxed">{service.description}</p>
              )}
            </div>

            <div className="relative z-10 flex items-end justify-between mt-2">
               <span className="text-2xl font-bold text-white font-oswald">R$ {service.price}</span>
               <button 
                 onClick={() => handleQuickAgendamento(service.name)}
                 className="px-4 py-2 rounded-lg border border-white/20 text-white text-[10px] font-bold uppercase hover:bg-[#C1121F] hover:border-[#C1121F] transition-colors tracking-widest"
               >
                 Agendar
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dúvidas / WhatsApp Block */}
      <div className="glass-card p-8 relative overflow-hidden animate-in" style={{ animationDelay: '300ms' }}>
         {/* Subtle styling elements */}
         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#0B1F3B] to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-white font-oswald uppercase mb-2">Ficou com alguma dúvida?</h3>
                <p className="text-gray-400 font-light text-sm">Fala direto com o barbeiro antes de agendar o seu horário.</p>
            </div>
            
            <button 
                onClick={handleSupportClick}
                className="px-8 py-4 rounded-lg border border-white/20 hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/5 transition-all duration-300 group flex items-center gap-3 text-white font-bold uppercase tracking-widest text-xs whitespace-nowrap"
            >
                <i className="fab fa-whatsapp text-xl group-hover:scale-110 transition-transform"></i>
                Tirar dúvida no WhatsApp
            </button>
         </div>
      </div>
    </div>
  );
};

export default Services;
