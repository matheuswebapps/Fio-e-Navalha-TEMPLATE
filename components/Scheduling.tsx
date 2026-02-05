
import React, { useState, useEffect } from 'react';
import { ServiceItem, DayType, Appointment, CutSuggestion, ProductItem } from '../types';
import { dataProvider } from '../dataProvider';
import { generateSlug } from '../constants';

interface SchedulingProps {
  settings: any;
}

const Scheduling: React.FC<SchedulingProps> = ({ settings }) => {
  const [step, setStep] = useState(1);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [availableCuts, setAvailableCuts] = useState<CutSuggestion[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  
  // CHANGED: From array (multi) to string | null (single)
  // null = "Definir na hora"
  const [selectedAdultCutId, setSelectedAdultCutId] = useState<string | null>(null);
  const [selectedChildCutId, setSelectedChildCutId] = useState<string | null>(null);
  
  // CHANGED: Separate option state for cuts to prevent collision
  const [selectedAdultOption, setSelectedAdultOption] = useState<string>('');
  const [selectedChildOption, setSelectedChildOption] = useState<string>('');

  // Products: Map of Product ID -> Quantity (e.g. { 'prod-1': 2 })
  const [selectedProductQuantities, setSelectedProductQuantities] = useState<Record<string, number>>({});
  
  // Track sub-options for SERVICES and PRODUCTS only
  const [itemOptions, setItemOptions] = useState<Record<string, string>>({});

  const [childName, setChildName] = useState('');
  const [errors, setErrors] = useState({ clientName: false, childName: false });

  const [appointment, setAppointment] = useState<Appointment>({
    services: [],
    products: [],
    dayType: null,
    specificDate: null,
    time: null,
    clientName: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const [services, cuts, products] = await Promise.all([
        dataProvider.getServices(),
        dataProvider.getCuts(),
        dataProvider.getProducts()
      ]);
      // Filter Services
      let filteredServices = services.filter(s => s.active && s.name);
      
      // Remove Child Cut from list if disabled globally
      if (settings.childCutEnabled === false) {
         // Filter out items marked as child
         filteredServices = filteredServices.filter(s => !s.isChild);
      }
      
      setAvailableServices(filteredServices);
      setAvailableCuts(cuts.filter(c => c.active && c.name));
      setAvailableProducts(products.filter(p => p.active && p.name));
    };
    loadData();
    
    // Clear legacy local storage selection
    const savedCut = localStorage.getItem('selected_cut');
    if (savedCut) {
      try {
        const parsed = JSON.parse(savedCut);
        // Set as single selection
        setSelectedAdultCutId(parsed.id);
      } catch (e) { console.error(e); }
    }
  }, [settings.childCutEnabled]);

  // --- LOGIC ---
  
  // Detect if any selected service is marked as child
  const hasChildService = appointment.services.some(s => s.isChild);

  // Adult Style required if: !isChild AND name looks like a Cut/Combo
  const hasAdultCut = appointment.services.some(s => 
    !s.isChild && (s.name.toLowerCase().includes('corte') || s.name.toLowerCase().includes('combo'))
  );

  const showAdultStyles = hasAdultCut;
  // Child styles logic: If child service selected AND global switch is on
  const showChildStyles = hasChildService && settings.childCutEnabled !== false;

  // Calculate Totals
  const servicesTotal = appointment.services.reduce((acc, curr) => acc + Number(curr.price), 0);
  
  const productsTotal = Object.entries(selectedProductQuantities).reduce((acc, [id, qty]) => {
     const prod = availableProducts.find(p => p.id === id);
     return acc + ((prod ? Number(prod.price) : 0) * Number(qty));
  }, 0);
  
  const totalValue = servicesTotal + productsTotal;

  const toggleService = (service: ServiceItem) => {
    setAppointment(prev => {
      const exists = prev.services.find(s => s.id === service.id);
      let newServices = [];
      if (exists) {
        newServices = prev.services.filter(s => s.id !== service.id);
        // Remove option selection if deselected
        const newOpts = { ...itemOptions };
        delete newOpts[service.id];
        setItemOptions(newOpts);
      } else {
        newServices = [...prev.services, service];
      }
      return { ...prev, services: newServices };
    });
  };

  // Improved Toggle Product: Handles Addition and Full Removal (including options cleanup)
  const toggleProduct = (id: string) => {
    const isSelected = !!selectedProductQuantities[id];
    
    if (isSelected) {
        // Remove completely
        const newQtys = { ...selectedProductQuantities };
        delete newQtys[id];
        setSelectedProductQuantities(newQtys);
        
        // Clean up options
        const newOpts = { ...itemOptions };
        delete newOpts[id];
        setItemOptions(newOpts);
    } else {
        // Add with default quantity 1
        setSelectedProductQuantities(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const updateProductQty = (id: string, delta: number) => {
    const currentQty = selectedProductQuantities[id] || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
        toggleProduct(id);
    } else {
        setSelectedProductQuantities(prev => ({ ...prev, [id]: Math.min(99, newQty) }));
    }
  };

  // --- NEW STYLE LOGIC (RADIO BEHAVIOR) ---

  const selectAdultStyle = (id: string | null) => {
    setSelectedAdultCutId(id);
    // Reset sub-option when changing style
    setSelectedAdultOption('');
  };

  const selectChildStyle = (id: string | null) => {
    setSelectedChildCutId(id);
    // Reset sub-option when changing style
    setSelectedChildOption('');
  };

  // Helper for Services/Products
  const setItemOption = (itemId: string, option: string) => {
    setItemOptions(prev => ({
       ...prev,
       [itemId]: option
    }));
  };

  const validateFields = () => {
    const newErrors = {
      clientName: !appointment.clientName.trim(),
      childName: hasChildService && !childName.trim()
    };
    setErrors(newErrors);
    return !newErrors.clientName && !newErrors.childName;
  };

  const confirmOnWhatsApp = () => {
    if (!validateFields()) return;
    
    // Formatting helper for services/products
    const getNameWithOption = (name: string, id: string) => {
       const opt = itemOptions[id];
       return opt ? `${name} (${opt})` : name;
    };

    const servicesList = appointment.services
      .map(s => `* ${getNameWithOption(s.name, s.id)} – R$ ${s.price},00`)
      .join('\n');

    const productsList = Object.entries(selectedProductQuantities)
      .map(([id, qty]) => {
         const p = availableProducts.find(prod => prod.id === id);
         if (!p) return '';
         const subtotal = Number(p.price) * Number(qty);
         return `* ${getNameWithOption(p.name, p.id)} (x${qty}) – R$ ${subtotal},00`;
      }).filter(Boolean).join('\n');

    // Logic for Styles text
    const getStyleText = (cutId: string | null, option: string) => {
        if (!cutId) return '- Definir na hora / Escolher no local';
        const cut = availableCuts.find(c => c.id === cutId);
        if (!cut) return '';
        const optStr = option ? ` (${option})` : '';
        return `- ${cut.name}${optStr}`;
    };

    const adultStylesText = getStyleText(selectedAdultCutId, selectedAdultOption);
    const childStylesText = getStyleText(selectedChildCutId, selectedChildOption);

    const businessName = settings.name || 'Fio & Navalha';
    const businessSlug = generateSlug(businessName);
    
    let msg = `agendamento-${businessSlug}\n`; // Technical Identifier Line
    msg += `✂️ *Agendamento – ${businessName}*\n\n`; // Human Readable Title
    
    msg += `👤 *Responsável:* ${appointment.clientName}\n`;
    
    if (hasChildService && childName) {
      msg += `👶 *Criança:* ${childName}\n`;
    }
    msg += `\n`;

    if (appointment.services.length > 0) {
      msg += `💈 *Serviços:*\n${servicesList}\n\n`;
    }

    if (productsList) {
      msg += `🛍️ *Produtos:*\n${productsList}\n\n`;
    }

    if (showAdultStyles) {
      msg += `✂️ *Estilo(s) Adulto:*\n`;
      msg += adultStylesText;
      msg += `\n\n`;
    }

    if (showChildStyles) {
       msg += `✂️ *Estilo(s) Infantil:*\n`;
       msg += childStylesText;
       msg += `\n\n`;
    }

    msg += `💰 *Total Geral:* R$ ${totalValue},00\n\n`;
    msg += `📅 *Data:* ${appointment.specificDate || appointment.dayType}\n`;
    msg += `🕒 *Horário:* ${appointment.time}`;
    
    const phoneClean = settings.phone ? settings.phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem('selected_cut');
  };

  // STEP MANAGEMENT
  const nextStep = () => {
    if (step === 1) {
       if (appointment.services.length === 0) return alert("Selecione um serviço");
       // If products enabled, go to step 2 (Products), else skip to step 3 (Date)
       if (settings.productsEnabled) setStep(2);
       else setStep(3);
    } 
    else if (step === 2) setStep(3); // From Products to Date
    else if (step === 3) setStep(4); // From Date to Time (logic inside render handles substep)
    else if (step === 4) setStep(5); // From Time to Confirm
  };

  const prevStep = () => {
    if (step === 5) setStep(4);
    else if (step === 4) setStep(3);
    else if (step === 3) {
      // If products enabled, back to 2, else back to 1
      if (settings.productsEnabled) setStep(2);
      else setStep(1);
    }
    else if (step === 2) setStep(1);
  };

  // Stepper Visuals
  const totalSteps = settings.productsEnabled ? 5 : 4;
  
  const Stepper = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
       {Array.from({length: totalSteps}, (_, i) => i + 1).map(num => (
         <div key={num} className={`h-1 w-12 rounded-full transition-colors ${step >= num ? 'bg-[#C1121F]' : 'bg-white/10'}`}></div>
       ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen lg:max-w-2xl lg:mx-auto">
      <div className="text-center mb-8 animate-in">
        <h2 className="text-3xl font-bold text-white uppercase font-oswald">Agendamento</h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Passo {step} de {totalSteps}</p>
      </div>

      <Stepper />

      <div className="glass-card p-6 md:p-8 animate-in">
        
        {/* Step 1: Services */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-4">
                 <label className="text-sm font-bold text-gray-300 uppercase tracking-wide">Serviços</label>
                 <span className="text-[#C1121F] font-bold text-xl font-oswald">R$ {servicesTotal}</span>
            </div>
              
            <div className="space-y-3">
              {availableServices.map(service => {
                const isSelected = appointment.services.some(s => s.id === service.id);
                const hasOptions = service.options && service.options.filter(o => o.trim() !== '').length > 0;

                return (
                  <div key={service.id}>
                    <button
                        onClick={() => toggleService(service)}
                        className={`w-full p-4 flex justify-between items-center rounded-lg transition-all border ${
                        isSelected 
                            ? 'bg-[#0B1F3B] border-[#C1121F] text-white shadow-lg' 
                            : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-bold">{service.name}</span>
                            {service.isChild && (
                                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-wider font-bold">Infantil</span>
                            )}
                        </div>
                        <span className="text-sm font-bold font-oswald">R$ {service.price}</span>
                    </button>
                    
                    {/* Inline Sub-options Accordion */}
                    {isSelected && hasOptions && (
                        <div className="ml-4 mt-2 pl-4 border-l-2 border-[#C1121F]/30 space-y-2 animate-in">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Escolha uma opção:</p>
                            <div className="flex flex-wrap gap-2">
                                {service.options?.filter(o => o.trim() !== '').map((opt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setItemOption(service.id, opt)}
                                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                                            itemOptions[service.id] === opt 
                                            ? 'bg-[#C1121F] text-white border-[#C1121F]' 
                                            : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Adult Styles Selector */}
            {showAdultStyles && (
               <div className="mt-6 pt-4 border-t border-white/10">
                 <p className="text-[10px] text-gray-500 mb-3 uppercase font-bold tracking-widest">Estilos (Adulto) - Opcional</p>
                 <div className="grid grid-cols-2 gap-2">
                    {/* Explicit Decide Later Option - Always Present */}
                    <button 
                        onClick={() => selectAdultStyle(null)}
                        className={`col-span-2 text-xs p-3 rounded border transition-colors flex justify-center items-center gap-2 mb-2 ${selectedAdultCutId === null ? 'bg-white/10 border-white text-white font-bold' : 'border-dashed border-white/20 text-gray-500'}`}
                    >
                        {selectedAdultCutId === null && <i className="fas fa-check text-[#C1121F]"></i>}
                        Definir na hora / Escolher no local
                    </button>
                    {availableCuts.map(c => {
                        const isSelected = selectedAdultCutId === c.id;
                        const hasOptions = c.options && c.options.filter(o => o.trim() !== '').length > 0;
                        
                        return (
                            <div key={c.id} className="contents">
                                <button 
                                    onClick={() => selectAdultStyle(c.id)} 
                                    className={`text-xs p-2 rounded border transition-colors ${isSelected ? 'bg-[#C1121F] border-[#C1121F] text-white' : 'border-white/10 text-gray-400'}`}
                                >
                                    {c.name}
                                </button>
                                {isSelected && hasOptions && (
                                    <div className="col-span-2 pl-2 mb-2 flex flex-wrap gap-2 animate-in">
                                         {c.options?.filter(o => o.trim() !== '').map((opt, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedAdultOption(opt)}
                                                className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                                                    selectedAdultOption === opt 
                                                    ? 'bg-white/20 text-white border-white/30' 
                                                    : 'bg-transparent text-gray-500 border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                         ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
               </div>
            )}

            {/* Child Styles Selector - Only if child service is selected */}
            {showChildStyles && (
               <div className="mt-6 pt-4 border-t border-white/10">
                 <p className="text-[10px] text-gray-500 mb-3 uppercase font-bold tracking-widest">Estilos (Infantil) - Opcional</p>
                 <div className="grid grid-cols-2 gap-2">
                    {/* Explicit Decide Later Option - Always Present */}
                    <button 
                        onClick={() => selectChildStyle(null)}
                        className={`col-span-2 text-xs p-3 rounded border transition-colors flex justify-center items-center gap-2 mb-2 ${selectedChildCutId === null ? 'bg-white/10 border-white text-white font-bold' : 'border-dashed border-white/20 text-gray-500'}`}
                    >
                        {selectedChildCutId === null && <i className="fas fa-check text-[#C1121F]"></i>}
                        Definir na hora / Escolher no local
                    </button>
                    {availableCuts.map(c => {
                        const isSelected = selectedChildCutId === c.id;
                        const hasOptions = c.options && c.options.filter(o => o.trim() !== '').length > 0;
                        return (
                            <div key={`child-${c.id}`} className="contents">
                                <button onClick={() => selectChildStyle(c.id)} className={`text-xs p-2 rounded border transition-colors ${isSelected ? 'bg-[#C1121F] border-[#C1121F] text-white' : 'border-white/10 text-gray-400'}`}>
                                    {c.name}
                                </button>
                                {isSelected && hasOptions && (
                                    <div className="col-span-2 pl-2 mb-2 flex flex-wrap gap-2 animate-in">
                                         {c.options?.filter(o => o.trim() !== '').map((opt, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setSelectedChildOption(opt)}
                                                className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                                                    selectedChildOption === opt 
                                                    ? 'bg-white/20 text-white border-white/30' 
                                                    : 'bg-transparent text-gray-500 border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                         ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
               </div>
            )}

            <button onClick={nextStep} className="w-full py-4 mt-6 btn-primary tracking-widest">Continuar</button>
          </div>
        )}

        {/* Step 2: Products (Optional) - Only if enabled */}
        {settings.productsEnabled && step === 2 && (
          <div className="space-y-6">
             <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-white font-oswald uppercase">Quer levar algo?</h3>
                 <p className="text-gray-400 text-xs mt-1">Adicione produtos ao seu agendamento</p>
             </div>

             <div className="space-y-3">
               {availableProducts.length === 0 && <p className="text-center text-gray-500 text-xs">Nenhum produto disponível no momento.</p>}
               {availableProducts.map(prod => {
                 const qty = selectedProductQuantities[prod.id] || 0;
                 const isSelected = qty > 0;
                 const hasOptions = prod.options && prod.options.filter(o => o.trim() !== '').length > 0;

                 return (
                    <div key={prod.id}>
                        <div
                        className={`w-full p-3 flex justify-between items-center rounded-lg transition-all border cursor-pointer ${
                            isSelected 
                            ? 'bg-[#0B1F3B] border-[#C1121F] shadow-lg' 
                            : 'bg-transparent border-white/10 hover:bg-white/5'
                        }`}
                        >
                            <div className="flex-1 flex items-center gap-3 text-left" onClick={() => !isSelected && toggleProduct(prod.id)}>
                                <div className={`w-10 h-10 rounded bg-black/40 flex items-center justify-center overflow-hidden border border-white/10`}>
                                    {prod.imageUrl ? (
                                    <img src={prod.imageUrl} className="w-full h-full object-cover" />
                                    ) : <i className="fas fa-pump-soap text-gray-500"></i>}
                                </div>
                                <div>
                                    <span className={`font-bold block text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>{prod.name}</span>
                                    <span className="text-[10px] text-gray-500">{prod.description}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold font-oswald ${isSelected ? 'text-white' : 'text-gray-400'}`}>R$ {prod.price}</span>
                                
                                {/* Quantity Controls */}
                                {isSelected && (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => toggleProduct(prod.id)}
                                          className="w-6 h-6 rounded bg-red-900/30 text-red-400 flex items-center justify-center hover:bg-red-900/50 hover:text-red-300 transition-colors border border-red-900/50"
                                          aria-label="Remover"
                                        >
                                          <i className="fas fa-trash text-[10px]"></i>
                                        </button>

                                        <div className="flex items-center bg-black/30 rounded border border-white/10">
                                            <button 
                                            onClick={() => updateProductQty(prod.id, -1)}
                                            className="w-6 h-6 flex items-center justify-center text-xs text-white hover:bg-white/10"
                                            >
                                            <i className="fas fa-minus text-[8px]"></i>
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-white font-oswald">{qty}</span>
                                            <button 
                                            onClick={() => updateProductQty(prod.id, 1)}
                                            className="w-6 h-6 flex items-center justify-center text-xs text-white hover:bg-white/10"
                                            >
                                            <i className="fas fa-plus text-[8px]"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* Inline Sub-options Accordion for Products */}
                        {isSelected && hasOptions && (
                            <div className="ml-4 mt-2 pl-4 border-l-2 border-[#C1121F]/30 space-y-2 animate-in">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Escolha uma opção:</p>
                                <div className="flex flex-wrap gap-2">
                                    {prod.options?.filter(o => o.trim() !== '').map((opt, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setItemOption(prod.id, opt)}
                                            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                                                itemOptions[prod.id] === opt 
                                                ? 'bg-[#C1121F] text-white border-[#C1121F]' 
                                                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 );
               })}
             </div>
             
             <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center text-sm">
                <span className="text-gray-400">Total em Produtos:</span>
                <span className="text-[#C1121F] font-bold font-oswald">R$ {productsTotal}</span>
             </div>

             <button onClick={nextStep} className="w-full py-4 mt-6 btn-primary tracking-widest">
                {productsTotal > 0 ? 'Adicionar e Continuar' : 'Continuar sem produtos'}
             </button>
             <button onClick={prevStep} className="text-xs text-gray-500 block mx-auto mt-4 uppercase tracking-widest hover:text-white">Voltar</button>
          </div>
        )}

        {/* Step 3: Date */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <h3 className="text-xl font-bold text-white mb-4 font-oswald uppercase">Escolha o dia</h3>
            <div className="grid grid-cols-1 gap-3">
              {[DayType.HOJE, DayType.AMANHA, DayType.OUTRO].map(day => (
                <button
                  key={day}
                  onClick={() => {
                     setAppointment(prev => ({...prev, dayType: day}));
                     if (day === DayType.HOJE) setAppointment(p => ({...p, specificDate: new Date().toLocaleDateString()}));
                     if (day !== DayType.OUTRO) nextStep();
                  }}
                  className="p-5 rounded-lg bg-[#0B1F3B]/50 hover:bg-[#C1121F] hover:text-white transition-colors text-lg font-bold text-gray-300 border border-white/10 uppercase tracking-wider font-oswald"
                >
                  {day}
                </button>
              ))}
            </div>
            
            {appointment.dayType === DayType.OUTRO && (
              <input 
                type="date" 
                className="w-full p-4 mt-4 text-white text-center uppercase tracking-widest"
                onChange={(e) => {
                   if(e.target.value) {
                      setAppointment(p => ({...p, specificDate: e.target.value.split('-').reverse().join('/')}));
                      nextStep();
                   }
                }}
              />
            )}
             <button onClick={prevStep} className="text-xs text-gray-500 mt-4 uppercase tracking-widest hover:text-white">Voltar</button>
          </div>
        )}

        {/* Step 4: Time */}
        {step === 4 && (
          <div>
             <h3 className="text-xl font-bold text-center mb-6 text-white font-oswald uppercase">Escolha o horário</h3>
             <div className="grid grid-cols-3 gap-3 mb-8">
               {['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(time => (
                 <button
                   key={time}
                   onClick={() => {
                     setAppointment(p => ({...p, time}));
                     nextStep();
                   }}
                   className="py-3 rounded-lg bg-[#0B1F3B]/50 border border-white/10 text-sm font-bold text-gray-300 hover:bg-[#C1121F] hover:border-[#C1121F] hover:text-white transition-colors"
                 >
                   {time}
                 </button>
               ))}
             </div>
             <button onClick={prevStep} className="text-xs text-gray-500 block mx-auto uppercase tracking-widest hover:text-white">Voltar</button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white text-center font-oswald uppercase">Seus dados</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Seu Nome (Responsável)</label>
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  className={`w-full p-4 ${errors.clientName ? 'border-red-500' : ''}`}
                  value={appointment.clientName}
                  onChange={e => {
                    setAppointment({...appointment, clientName: e.target.value});
                    setErrors({...errors, clientName: false});
                  }}
                />
              </div>

              {/* Show Child Name ONLY if a child service is selected */}
              {hasChildService && (
                <div className="animate-in">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1 tracking-wider">Nome da Criança</label>
                   <input 
                     type="text" 
                     placeholder="Nome do pequeno"
                     className={`w-full p-4 ${errors.childName ? 'border-red-500' : ''}`}
                     value={childName}
                     onChange={e => {
                        setChildName(e.target.value);
                        setErrors({...errors, childName: false});
                     }}
                   />
                </div>
              )}
            </div>

            <div className="bg-[#0B1F3B]/50 p-5 rounded-lg border border-white/5 text-sm text-gray-400 space-y-2">
               <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-white font-bold uppercase text-xs tracking-wider">Data</span> 
                   <span className="text-xs">{appointment.specificDate || appointment.dayType} às {appointment.time}</span>
               </div>
               <div className="flex justify-between border-b border-white/5 pb-2">
                   <span className="text-white font-bold uppercase text-xs tracking-wider">Serviços</span> 
                   <span className="text-xs text-right">
                       {appointment.services.map(s => {
                           const opt = itemOptions[s.id];
                           return opt ? `${s.name} (${opt})` : s.name;
                       }).join(', ')}
                   </span>
               </div>

               {/* SHOW SELECTED STYLES SUMMARY */}
               {showAdultStyles && (
                   <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-white font-bold uppercase text-xs tracking-wider">Estilo (Adulto)</span> 
                       <span className="text-xs text-right text-gray-400">
                           {!selectedAdultCutId 
                             ? 'Definir na hora' 
                             : (() => {
                                 const cut = availableCuts.find(c => c.id === selectedAdultCutId);
                                 return cut ? `${cut.name}${selectedAdultOption ? ` (${selectedAdultOption})` : ''}` : '';
                               })()
                           }
                       </span>
                   </div>
               )}

               {showChildStyles && (
                   <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-white font-bold uppercase text-xs tracking-wider">Estilo (Infantil)</span> 
                       <span className="text-xs text-right text-gray-400">
                           {!selectedChildCutId 
                             ? 'Definir na hora' 
                             : (() => {
                                 const cut = availableCuts.find(c => c.id === selectedChildCutId);
                                 return cut ? `${cut.name}${selectedChildOption ? ` (${selectedChildOption})` : ''}` : '';
                               })()
                           }
                       </span>
                   </div>
               )}
               
               {productsTotal > 0 && (
                 <div className="flex justify-between border-b border-white/5 pb-2 text-blue-300/80">
                    <span className="font-bold uppercase text-xs tracking-wider">Produtos</span> 
                    <span className="text-xs text-right">
                       {Object.entries(selectedProductQuantities).map(([id, qty]) => {
                          const prod = availableProducts.find(p => p.id === id);
                          if (!prod) return null;
                          return (
                            <div key={id}>
                              {prod.name} (x{qty})
                            </div>
                          );
                       })}
                    </span>
                 </div>
               )}

               <div className="flex justify-between text-[#C1121F] font-bold text-lg pt-2">
                  <span className="uppercase font-oswald">Total Geral</span>
                  <span>R$ {totalValue},00</span>
               </div>
            </div>

            <button 
              onClick={confirmOnWhatsApp}
              className="w-full py-4 btn-primary tracking-widest"
            >
              <i className="fab fa-whatsapp text-lg"></i> Confirmar Agendamento
            </button>
            <button onClick={prevStep} className="text-xs text-gray-500 block mx-auto uppercase tracking-widest hover:text-white">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling;
