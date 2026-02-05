import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { supabase, STORAGE_BUCKET, ADMIN_EMAIL } from '../services/supabaseClient';
import { BusinessSettings, ServiceItem, CutSuggestion, ProductItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SERVICES, DEFAULT_CUTS, DEFAULT_PRODUCTS } from '../constants';

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'business' | 'home' | 'cuts' | 'services' | 'products'>('business');
  
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [cuts, setCuts] = useState<CutSuggestion[]>(DEFAULT_CUTS);
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Mantém login persistente
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsLoggedIn(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    const [s, serv, c, p] = await Promise.all([
      dataProvider.getSettings(),
      dataProvider.getServices(),
      dataProvider.getCuts(),
      dataProvider.getProducts()
    ]);
    setSettings(s);
    setServices(serv);
    setCuts(c);
    setProducts(p);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_EMAIL) {
      alert('Faltou configurar o e-mail do admin no ambiente (VITE_ADMIN_EMAIL).');
      return;
    }
    setIsAuthenticating(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password
    });
    setIsAuthenticating(false);

    if (error) {
      alert('Senha incorreta');
      return;
    }
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPassword('');
    setIsLoggedIn(false);
  };

  const saveAll = async () => {
    setStatus('Salvando...');
    await Promise.all([
      dataProvider.saveSettings(settings),
      dataProvider.saveServices(services),
      dataProvider.saveCuts(cuts),
      dataProvider.saveProducts(products)
    ]);
    setStatus('Salvo!');
    setTimeout(() => setStatus(''), 2000);
  };

  const sanitizeFileName = (name: string) => {
    const base = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_.]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 80);
    return base || `file-${Date.now()}`;
  };

  const uploadToBucket = async (file: File, folder: string) => {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const safe = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ''));
    const path = `${folder}/${Date.now()}-${safe}.${ext}`;

    setUploading('Enviando imagem...');
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '31536000' });

    if (upErr) {
      setUploading(null);
      console.error(upErr);
      throw upErr;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setUploading(null);
    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof BusinessSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToBucket(file, 'branding');
      setSettings(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      alert('Falha ao enviar imagem. Verifique se você está logado como admin e as policies do Storage.');
    } finally {
      e.target.value = '';
    }
  };

  // ✅ NOVO: remover logo/ícone (só zera a URL)
  const clearBusinessImage = (field: keyof BusinessSettings) => {
    setSettings(prev => ({ ...prev, [field]: '' as any }));
  };

  const updateItemOptions = (type: 'service' | 'cut' | 'product', index: number, optionIndex: number, value: string) => {
    if (type === 'service') {
      const newItems = [...services];
      if (!newItems[index].options) newItems[index].options = [];
      const currentOptions = [...(newItems[index].options || [])];
      while(currentOptions.length < 4) currentOptions.push('');
      currentOptions[optionIndex] = value;
      newItems[index].options = currentOptions;
      setServices(newItems);
    } else if (type === 'cut') {
      const newItems = [...cuts];
      if (!newItems[index].options) newItems[index].options = [];
      const currentOptions = [...(newItems[index].options || [])];
      while(currentOptions.length < 4) currentOptions.push('');
      currentOptions[optionIndex] = value;
      newItems[index].options = currentOptions;
      setCuts(newItems);
    } else if (type === 'product') {
      const newItems = [...products];
      if (!newItems[index].options) newItems[index].options = [];
      const currentOptions = [...(newItems[index].options || [])];
      while(currentOptions.length < 4) currentOptions.push('');
      currentOptions[optionIndex] = value;
      newItems[index].options = currentOptions;
      setProducts(newItems);
    }
  };

  const handleCutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToBucket(file, 'cuts');
      const n = [...cuts];
      n[index].imageUrl = url;
      setCuts(n);
    } catch (err) {
      alert('Falha ao enviar imagem do corte.');
    } finally {
      e.target.value = '';
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToBucket(file, 'products');
      const n = [...products];
      n[index].imageUrl = url;
      setProducts(n);
    } catch (err) {
      alert('Falha ao enviar imagem do produto.');
    } finally {
      e.target.value = '';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C1A1D] p-6">
        <div className="bg-[#FDFBF7] p-8 max-w-sm w-full shadow-2xl border border-[#B8860B]">
          <h2 className="text-2xl font-serif text-center mb-6 text-[#2C1A1D]">Área Restrita</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Senha de Acesso"
              className="w-full p-3 border border-[#E5E0D8] mb-4 outline-none focus:border-[#B8860B]"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#2C1A1D] text-[#B8860B] py-3 font-bold uppercase tracking-widest hover:bg-black transition-colors">
              {isAuthenticating ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-[#E5E0D8] text-[#2C1A1D]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-serif font-bold">Painel de Controle</h1>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="bg-transparent border border-[#2C1A1D] text-[#2C1A1D] px-4 py-2 font-bold rounded hover:bg-[#2C1A1D] hover:text-[#FDFBF7] transition-colors">
              Sair
            </button>
            <button onClick={saveAll} className="bg-[#2C1A1D] text-[#FDFBF7] px-6 py-2 font-bold rounded shadow hover:bg-[#B8860B] transition-colors">
              {status || 'SALVAR ALTERAÇÕES'}
            </button>
          </div>
        </div>

        {uploading && (
          <div className="mb-4 bg-[#2C1A1D] text-[#B8860B] p-3 text-xs font-bold uppercase tracking-wider">{uploading}</div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {['business', 'home', 'cuts', 'services', 'products'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-6 py-3 font-bold uppercase text-xs tracking-wider transition-colors whitespace-nowrap ${activeTab === t ? 'bg-[#2C1A1D] text-[#B8860B]' : 'bg-[#FDFBF7] text-gray-500'}`}
            >
              {t === 'business'
                ? 'Configurações'
                : t === 'home'
                ? 'Home / Redes'
                : t === 'cuts'
                ? 'Cortes'
                : t === 'products'
                ? 'Produtos'
                : 'Serviços'}
            </button>
          ))}
        </div>

        <div className="bg-[#FDFBF7] p-6 shadow-sm border border-white">
          
          {/* BUSINESS SETTINGS */}
          {activeTab === 'business' && (
            <div className="grid md:grid-cols-2 gap-6">
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Nome da Barbearia</label>
                 <input className="admin-input" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
               </div>
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Subtítulo (Home)</label>
                 <input className="admin-input" value={settings.subtitle} onChange={e => setSettings({...settings, subtitle: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Telefone (Agendamento)</label>
                 <input className="admin-input" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
               </div>
               
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Endereço</label>
                 <input className="admin-input" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Link Google Maps (Ação)</label>
                 <input className="admin-input" value={settings.googleMapsUrl} onChange={e => setSettings({...settings, googleMapsUrl: e.target.value})} placeholder="https://goo.gl/maps/..." />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Texto de Horários</label>
                 <input className="admin-input" value={settings.openingHoursText} onChange={e => setSettings({...settings, openingHoursText: e.target.value})} />
               </div>

               {/* Identidade Visual Section */}
               <div className="col-span-2 mt-6 border-t border-[#E5E0D8] pt-6">
                 <h3 className="text-sm font-bold uppercase mb-4 bg-[#2C1A1D] text-[#B8860B] p-2 inline-block">Identidade Visual</h3>
                 
                 <div className="grid md:grid-cols-2 gap-8">
                   {/* Logo do Site */}
                   <div className="bg-white p-4 border border-[#E5E0D8]">
                     <label className="text-xs font-bold uppercase block mb-3 text-[#2C1A1D]">Logo do Site (Header)</label>
                     <div className="flex items-center gap-4">
                       <div className="w-20 h-20 bg-[#FDFBF7] border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                         {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                            <span className="text-[9px] text-gray-400">Sem Logo</span>
                         )}
                       </div>
                       <div className="flex-1">
                         <input 
                           type="file" 
                           accept="image/*"
                           id="upload-logo"
                           className="hidden"
                           onChange={(e) => handleImageUpload(e, 'logoUrl')}
                         />
                         <div className="flex gap-2 flex-wrap">
                           <label 
                             htmlFor="upload-logo"
                             className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-block hover:bg-[#B8860B] transition-colors"
                           >
                             Escolher Arquivo
                           </label>

                           {/* ✅ NOVO: Remover Logo */}
                           <button
                             type="button"
                             onClick={() => clearBusinessImage('logoUrl')}
                             className="bg-transparent border border-[#2C1A1D] text-[#2C1A1D] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#2C1A1D] hover:text-[#FDFBF7] transition-colors"
                           >
                             Remover
                           </button>
                         </div>

                         <p className="text-[10px] text-gray-400 mt-2">Formatos: PNG, JPG, WEBP. Visualização imediata.</p>
                       </div>
                     </div>
                   </div>

                   {/* Ícone do App */}
                   <div className="bg-white p-4 border border-[#E5E0D8]">
                     <label className="text-xs font-bold uppercase block mb-3 text-[#2C1A1D]">Ícone do App (PWA/Mobile)</label>
                     <div className="flex items-center gap-4">
                       <div className="w-20 h-20 bg-[#FDFBF7] border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative rounded-xl">
                          {settings.appIconUrl ? (
                            <img src={settings.appIconUrl} alt="Icon" className="w-full h-full object-cover" />
                         ) : (
                            <span className="text-[9px] text-gray-400">Sem Ícone</span>
                         )}
                       </div>
                       <div className="flex-1">
                         <input 
                           type="file" 
                           accept="image/*"
                           id="upload-icon"
                           className="hidden"
                           onChange={(e) => handleImageUpload(e, 'appIconUrl')}
                         />
                         <div className="flex gap-2 flex-wrap">
                           <label 
                             htmlFor="upload-icon"
                             className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-block hover:bg-[#B8860B] transition-colors"
                           >
                             Escolher Arquivo
                           </label>

                           {/* ✅ NOVO: Remover Ícone */}
                           <button
                             type="button"
                             onClick={() => clearBusinessImage('appIconUrl')}
                             className="bg-transparent border border-[#2C1A1D] text-[#2C1A1D] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#2C1A1D] hover:text-[#FDFBF7] transition-colors"
                           >
                             Remover
                           </button>
                         </div>

                         <p className="text-[10px] text-gray-400 mt-2">Usado para ícone de adicionar à tela inicial.</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* HOME & CONTACT SETTINGS */}
          {activeTab === 'home' && (
            <div className="space-y-8">
               {/* Contact Links */}
               <div>
                  <h3 className="text-sm font-bold uppercase mb-4 bg-[#E5E0D8] p-2">Redes Sociais & Contato</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">WhatsApp (Link Completo)</label>
                        <input className="admin-input" placeholder="https://wa.me/..." value={settings.whatsappLink || ''} onChange={e => setSettings({...settings, whatsappLink: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Instagram (Link Completo)</label>
                        <input className="admin-input" placeholder="https://instagram.com/..." value={settings.instagramLink || ''} onChange={e => setSettings({...settings, instagramLink: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Facebook (Link Completo)</label>
                        <input className="admin-input" placeholder="https://facebook.com/..." value={settings.facebookLink || ''} onChange={e => setSettings({...settings, facebookLink: e.target.value})} />
                    </div>
                  </div>
               </div>

               {/* PWA Settings */}
               <div>
                  <h3 className="text-sm font-bold uppercase mb-4 bg-[#E5E0D8] p-2">App & PWA</h3>
                  <div className="bg-white p-4 border border-[#E5E0D8]">
                     <div className="flex items-center gap-2 mb-4">
                        <input 
                           type="checkbox" 
                           id="pwa-enable"
                           checked={settings.enablePWABanner} 
                           onChange={e => setSettings({...settings, enablePWABanner: e.target.checked})} 
                        />
                        <label htmlFor="pwa-enable" className="text-xs font-bold uppercase">Ativar Banner "Adicionar à Tela Inicial"</label>
                     </div>
                     <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Nome do App (PWA)</label>
                          <input className="admin-input" value={settings.pwaName || ""} onChange={e => setSettings({...settings, pwaName: e.target.value})} placeholder="Ex: Barbearia Fio & Navalha" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1">Nome Curto (PWA)</label>
                          <input className="admin-input" value={settings.pwaShortName || ""} onChange={e => setSettings({...settings, pwaShortName: e.target.value})} placeholder="Ex: Fio & Navalha" />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Texto do Banner</label>
                        <input 
                           className="admin-input" 
                           value={settings.pwaBannerText} 
                           onChange={e => setSettings({...settings, pwaBannerText: e.target.value})} 
                           placeholder="Ex: Instale nosso App para agendar mais rápido!"
                        />
                     </div>
                  </div>
               </div>

               {/* Hero Section Texts */}
               <div>
                  <h3 className="text-sm font-bold uppercase mb-4 bg-[#E5E0D8] p-2">Conteúdo da Home</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                     <div className="col-span-2">
                       <label className="text-[10px] font-bold uppercase block mb-1">Imagem de Fundo (URL)</label>
                       <input className="admin-input" value={settings.heroImage} onChange={e => setSettings({...settings, heroImage: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase block mb-1">Botão 1 (Agendar)</label>
                       <input className="admin-input" value={settings.heroButtonTextSchedule} onChange={e => setSettings({...settings, heroButtonTextSchedule: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase block mb-1">Botão 2 (Cortes)</label>
                       <input className="admin-input" value={settings.heroButtonTextCuts} onChange={e => setSettings({...settings, heroButtonTextCuts: e.target.value})} />
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[1, 2, 3].map(num => (
                      <div key={num} className="border p-4 bg-white">
                        <span className="text-[10px] font-bold text-gray-400 block mb-2">CARD DESTAQUE {num}</span>
                        <input 
                           className="admin-input mb-2 font-bold" 
                           placeholder="Título"
                           value={(settings as any)[`feature${num}Title`] || ''} 
                           onChange={e => setSettings({...settings, [`feature${num}Title`]: e.target.value})} 
                        />
                        <textarea 
                           className="admin-input text-sm h-20" 
                           placeholder="Descrição"
                           value={(settings as any)[`feature${num}Description`] || ''} 
                           onChange={e => setSettings({...settings, [`feature${num}Description`]: e.target.value})} 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase block mb-1">Frase de Rodapé</label>
                    <input className="admin-input" value={settings.footerQuote} onChange={e => setSettings({...settings, footerQuote: e.target.value})} />
                  </div>
               </div>
            </div>
          )}

          {/* CUTS / PORTFOLIO */}
          {activeTab === 'cuts' && (
            <div className="space-y-8">
              <p className="text-sm bg-[#E5E0D8] p-3">Preencha os campos para exibir o corte no site. Deixe o "Nome" vazio para ocultar o card.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {cuts.map((cut, idx) => (
                  <div key={cut.id} className="border border-[#E5E0D8] p-4 bg-white">
                     <div className="flex justify-between mb-2">
                        <span className="font-bold text-xs text-gray-400">SLOT #{idx + 1} {cut.id.startsWith('extra') ? '(Extra)' : ''}</span>
                        <label className="text-xs flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={cut.active} onChange={e => {
                             const n = [...cuts]; n[idx].active = e.target.checked; setCuts(n);
                          }} /> Ativo
                        </label>
                     </div>
                     <input 
                       className="admin-input mb-2 font-bold" 
                       placeholder="Nome do Corte (Ex: Pompadour)"
                       value={cut.name} 
                       onChange={e => { const n = [...cuts]; n[idx].name = e.target.value; setCuts(n); }} 
                     />
                     <input 
                       className="admin-input mb-2 text-xs" 
                       placeholder="Subtítulo/Técnico"
                       value={cut.technicalName} 
                       onChange={e => { const n = [...cuts]; n[idx].technicalName = e.target.value; setCuts(n); }} 
                     />
                     <div className="flex gap-2 items-center">
                       <input 
                         className="admin-input text-xs flex-1" 
                         placeholder="URL da Imagem"
                         value={cut.imageUrl} 
                         onChange={e => { const n = [...cuts]; n[idx].imageUrl = e.target.value; setCuts(n); }} 
                       />
                       <input
                         type="file"
                         accept="image/*"
                         id={`cut-upload-${idx}`}
                         className="hidden"
                         onChange={(e) => handleCutImageUpload(e, idx)}
                       />
                       <label
                         htmlFor={`cut-upload-${idx}`}
                         className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                       >
                         Enviar
                       </label>

                       {/* ✅ NOVO: Remover imagem do corte */}
                       <button
                         type="button"
                         onClick={() => { const n = [...cuts]; n[idx].imageUrl = ''; setCuts(n); }}
                         className="bg-transparent border border-[#2C1A1D] text-[#2C1A1D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#2C1A1D] hover:text-[#FDFBF7] transition-colors whitespace-nowrap"
                       >
                         Remover
                       </button>
                     </div>
                     
                     <div className="mt-4 pt-3 border-t border-[#E5E0D8]">
                        <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Sub-opções (Ex: Alto, Baixo, Com Risco)</label>
                        <div className="grid grid-cols-2 gap-2">
                           {[0, 1, 2, 3].map(optIdx => (
                             <input 
                               key={optIdx}
                               className="admin-input text-xs"
                               placeholder={`Opção ${optIdx + 1}`}
                               value={cut.options?.[optIdx] || ''}
                               onChange={(e) => updateItemOptions('cut', idx, optIdx, e.target.value)}
                             />
                           ))}
                        </div>
                     </div>

                     {cut.imageUrl && <img src={cut.imageUrl} className="h-20 w-full object-cover mt-2 opacity-50" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCTS (NEW TAB) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
               {/* Global Products Toggle */}
               <div className="bg-[#2C1A1D] text-white p-4 flex items-center justify-between mb-4 border border-[#B8860B]">
                  <div>
                    <h3 className="font-bold uppercase text-sm">Aba Produtos no Site</h3>
                    <p className="text-[10px] text-gray-300">Desativado = aba some do menu e do agendamento.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.productsEnabled} onChange={e => setSettings({...settings, productsEnabled: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B8860B]"></div>
                  </label>
               </div>

              <div className="space-y-8">
                <p className="text-sm bg-[#E5E0D8] p-3">Gerencie os produtos à venda. Deixe o "Nome" vazio para ocultar o card.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {products.map((prod, idx) => (
                    <div key={prod.id} className="border border-[#E5E0D8] p-4 bg-white">
                      <div className="flex justify-between mb-2">
                          <span className="font-bold text-xs text-gray-400">SLOT #{idx + 1} {prod.id.startsWith('prod-extra') ? '(Extra)' : ''}</span>
                          <label className="text-xs flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={prod.active} onChange={e => {
                              const n = [...products]; n[idx].active = e.target.checked; setProducts(n);
                            }} /> Ativo
                          </label>
                      </div>
                      <input 
                        className="admin-input mb-2 font-bold" 
                        placeholder="Nome do Produto"
                        value={prod.name} 
                        onChange={e => { const n = [...products]; n[idx].name = e.target.value; setProducts(n); }} 
                      />
                      <input 
                        className="admin-input mb-2 text-xs" 
                        placeholder="Descrição Curta"
                        value={prod.description} 
                        onChange={e => { const n = [...products]; n[idx].description = e.target.value; setProducts(n); }} 
                      />
                      <div className="flex gap-2">
                          <div className="w-1/3">
                              <input 
                                type="number"
                                className="admin-input text-xs" 
                                placeholder="Preço (R$)"
                                value={prod.price} 
                                onChange={e => { const n = [...products]; n[idx].price = Number(e.target.value); setProducts(n); }} 
                              />
                          </div>
                          <div className="w-2/3">
                              <div className="flex gap-2 items-center">
                                <input 
                                  className="admin-input text-xs flex-1" 
                                  placeholder="URL da Imagem"
                                  value={prod.imageUrl} 
                                  onChange={e => { const n = [...products]; n[idx].imageUrl = e.target.value; setProducts(n); }} 
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`prod-upload-${idx}`}
                                  className="hidden"
                                  onChange={(e) => handleProductImageUpload(e, idx)}
                                />
                                <label
                                  htmlFor={`prod-upload-${idx}`}
                                  className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                                >
                                  Enviar
                                </label>

                                {/* ✅ NOVO: Remover imagem do produto */}
                                <button
                                  type="button"
                                  onClick={() => { const n = [...products]; n[idx].imageUrl = ''; setProducts(n); }}
                                  className="bg-transparent border border-[#2C1A1D] text-[#2C1A1D] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#2C1A1D] hover:text-[#FDFBF7] transition-colors whitespace-nowrap"
                                >
                                  Remover
                                </button>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[#E5E0D8]">
                        <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Sub-opções (Ex: Fragrância, Tamanho)</label>
                        <div className="grid grid-cols-2 gap-2">
                           {[0, 1, 2, 3].map(optIdx => (
                             <input 
                               key={optIdx}
                               className="admin-input text-xs"
                               placeholder={`Opção ${optIdx + 1}`}
                               value={prod.options?.[optIdx] || ''}
                               onChange={(e) => updateItemOptions('product', idx, optIdx, e.target.value)}
                             />
                           ))}
                        </div>
                     </div>

                      {prod.imageUrl && <img src={prod.imageUrl} className="h-20 w-full object-contain mt-2 opacity-80 bg-gray-100" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Global Child Cut Toggle */}
              <div className="bg-[#2C1A1D] text-white p-4 flex items-center justify-between mb-4 border border-[#B8860B]">
                  <div>
                    <h3 className="font-bold uppercase text-sm">Opção Corte Infantil</h3>
                    <p className="text-[10px] text-gray-300">Desativado = não aparece no agendamento.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.childCutEnabled} onChange={e => setSettings({...settings, childCutEnabled: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B8860B]"></div>
                  </label>
               </div>

              <p className="text-sm bg-[#E5E0D8] p-3">Deixe o nome vazio para ocultar o serviço da lista.</p>
              {services.map((svc, idx) => (
                <div key={svc.id} className="border border-[#E5E0D8] p-4 flex flex-col bg-white">
                   <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1">
                        <div className="flex justify-between mb-2 md:hidden">
                          <span className="font-bold text-xs text-gray-400">SLOT #{idx + 1} {svc.id.startsWith('extra') ? '(Extra)' : ''}</span>
                        </div>
                        <input 
                          className="admin-input mb-1 font-bold" 
                          placeholder="Nome do Serviço"
                          value={svc.name} 
                          onChange={e => { const n = [...services]; n[idx].name = e.target.value; setServices(n); }} 
                        />
                        <input 
                          className="admin-input text-xs" 
                          placeholder="Descrição curta"
                          value={svc.description} 
                          onChange={e => { const n = [...services]; n[idx].description = e.target.value; setServices(n); }} 
                        />
                    </div>
                    <div className="w-full md:w-24">
                        <label className="text-[10px] font-bold block">Preço</label>
                        <input 
                          type="number"
                          className="admin-input" 
                          value={svc.price} 
                          onChange={e => { const n = [...services]; n[idx].price = Number(e.target.value); setServices(n); }} 
                        />
                    </div>
                    <div className="flex items-center gap-2 md:flex-col md:items-center">
                        <label className="text-[10px] md:mb-1">Ativo</label>
                        <input type="checkbox" checked={svc.active} onChange={e => {
                          const n = [...services]; n[idx].active = e.target.checked; setServices(n);
                        }} />
                    </div>
                   </div>

                   <div className="mt-2 flex flex-col md:flex-row gap-4 pt-3 border-t border-[#E5E0D8]">
                        <div className="flex-1">
                             <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Sub-opções (Ex: Na Tesoura, Na Máquina)</label>
                             <div className="grid grid-cols-2 gap-2">
                                {[0, 1, 2, 3].map(optIdx => (
                                  <input 
                                    key={optIdx}
                                    className="admin-input text-xs"
                                    placeholder={`Opção ${optIdx + 1}`}
                                    value={svc.options?.[optIdx] || ''}
                                    onChange={(e) => updateItemOptions('service', idx, optIdx, e.target.value)}
                                  />
                                ))}
                             </div>
                        </div>
                        <div className="md:w-32 flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 p-2 rounded border border-blue-100 hover:bg-blue-100 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={!!svc.isChild}
                                  onChange={(e) => { const n = [...services]; n[idx].isChild = e.target.checked; setServices(n); }}
                                />
                                <span className="text-[10px] font-bold uppercase text-blue-800">É infantil?</span>
                            </label>
                        </div>
                   </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <style>{`
        .admin-input { width: 100%; padding: 8px; border: 1px solid #E5E0D8; outline: none; background: #FDFBF7; }
        .admin-input:focus { border-color: #B8860B; background: #FFF; }
      `}</style>
    </div>
  );
};

export default Admin;
