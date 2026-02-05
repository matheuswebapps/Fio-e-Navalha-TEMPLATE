
import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { ProductItem, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedProducts, fetchedSettings] = await Promise.all([
        dataProvider.getProducts(),
        dataProvider.getSettings()
      ]);
      // Only show active products with a name
      setProducts(fetchedProducts.filter(p => p.active && p.name));
      setSettings(fetchedSettings);
    };
    fetchData();
  }, []);

  const handleInterest = (productName: string) => {
    const message = encodeURIComponent(`Olá! Tenho interesse no produto: ${productName}`);
    if (settings.whatsappLink) {
        window.open(settings.whatsappLink, '_blank');
    } else {
        const cleanPhone = settings.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 min-h-screen">
      <div className="mb-10 animate-in pt-4 border-l-4 border-[#C1121F] pl-4">
        <h2 className="text-3xl font-bold text-white uppercase font-oswald">Produtos</h2>
        <p className="text-gray-400 text-sm mt-1">Cuidados essenciais para o seu dia a dia.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.length === 0 && <p className="col-span-2 text-gray-500">Carregando catálogo...</p>}

        {products.map((product, idx) => (
          <div 
            key={product.id} 
            className="glass-card p-3 pb-4 group animate-in flex flex-col hover:border-[#C1121F]/40 transition-all"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Image Container */}
            <div className="aspect-square overflow-hidden rounded-lg mb-3 bg-[#04080F] relative flex items-center justify-center border border-white/5">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              ) : (
                <i className="fas fa-pump-soap text-3xl text-gray-600"></i>
              )}
            </div>
            
            <div className="px-1 flex-1 flex flex-col">
              <h3 className="font-bold text-white text-sm leading-tight font-oswald uppercase mb-1">{product.name}</h3>
              <p className="text-[10px] text-gray-400 font-light leading-snug mb-2 line-clamp-2">{product.description}</p>
              
              <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[#C1121F] font-bold font-oswald text-sm">
                    {product.price > 0 ? `R$ ${product.price}` : 'Consulte'}
                  </span>
                  <button 
                    onClick={() => handleInterest(product.name)}
                    className="p-2 rounded bg-[#0B1F3B] border border-white/10 text-white text-[10px] uppercase hover:bg-[#25D366] hover:border-[#25D366] transition-colors"
                    aria-label="Tenho interesse"
                  >
                    <i className="fab fa-whatsapp text-sm"></i>
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
