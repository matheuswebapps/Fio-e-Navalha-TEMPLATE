
import { ServiceItem, BusinessSettings, PortfolioItem, CutSuggestion, ProductItem } from './types';

export const LOGO_FALLBACK = 'https://cdn-icons-png.flaticon.com/512/3504/3504018.png';
export const BARBERSHOP_PHONE = '5511999999999';

export const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'Fio & Navalha',
  subtitle: 'Barbearia de bairro com atendimento individual. Sem frescura, só respeito.',
  phone: '5511999999999',
  instagram: 'fioenavalha',
  address: 'Rua do Comércio, 123 - Centro',
  mapLink: 'https://www.google.com/maps', 
  googleMapsUrl: 'https://goo.gl/maps/example',
  logoUrl: '',
  appIconUrl: '',
  heroImage: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=1600',
  openingHoursText: 'Seg–Sex: 09:00 – 20:00\nSábado: 09:00 – 18:00\nDomingo: Fechado',
  
  // Feature Toggles
  productsEnabled: true,
  childCutEnabled: true,

  // Social Links defaults
  whatsappLink: 'https://wa.me/5511999999999',
  instagramLink: 'https://instagram.com/',
  facebookLink: 'https://facebook.com/',

  // Home Content defaults (Dark Premium Style)
  heroButtonTextSchedule: 'Agendar',
  heroButtonTextCuts: 'Sugestão de Cortes',
  
  feature1Title: 'Com Prioridade',
  feature1Description: 'Quem agenda tem preferência. Respeitamos seu tempo.',
  
  feature2Title: 'Preço Justo',
  feature2Description: 'Valores simples para um serviço de primeira.',
  
  feature3Title: 'Ambiente Tranquilo',
  feature3Description: 'Lugar para relaxar. Cerveja gelada e boa conversa.',
  
  footerQuote: '"Estilo é para quem tem."',

  // PWA Defaults
  enablePWABanner: true,
  pwaBannerText: 'Instale nosso App para agendar mais rápido!'
};

// Utility to generate URL-friendly slugs from business names
export const generateSlug = (text: string): string => {
  if (!text) return 'agendamento-barbearia';
  
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Split accents from letters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s*&\s*/g, '-e-') // Replace '&' with '-e-'
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    || 'barbearia';
};

// Main Services + Populated Extras + More Invisible Slots (Total 20 invisible slots now)
// Added isChild: true to ID 4 (Corte Infantil)
export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Corte de Cabelo', price: 40, durationMinutes: 40, description: 'Degradê, social ou na tesoura.', icon: 'hair', active: true, options: [], isChild: false },
  { id: '2', name: 'Barba Completa', price: 30, durationMinutes: 30, description: 'Toalha quente e navalha.', icon: 'beard', active: true, options: [], isChild: false },
  { id: '3', name: 'Combo (Cabelo + Barba)', price: 60, durationMinutes: 60, description: 'O pacote completo.', icon: 'combo', active: true, options: [], isChild: false },
  { id: '4', name: 'Corte Infantil', price: 35, durationMinutes: 30, description: 'Com paciência e jeito.', icon: 'hair', active: true, options: [], isChild: true },
  { id: '5', name: 'Sobrancelha', price: 15, durationMinutes: 10, description: 'Acabamento na navalha.', icon: 'eyebrow', active: true, options: [], isChild: false },
  
  // Previous Invisible slots
  { id: 'extra-1', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-2', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-3', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-4', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-5', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-6', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-7', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-8', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-9', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-10', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-11', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-12', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-13', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-14', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-15', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  
  // +5 requested
  { id: 'extra-16', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-17', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-18', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-19', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-20', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
];

export const DEFAULT_PORTFOLIO: PortfolioItem[] = [];

// Main Cuts + Populated Extras + More Invisible Slots (Total 20 invisible slots now)
export const DEFAULT_CUTS: CutSuggestion[] = [
  { id: '1', name: 'Low Fade', technicalName: 'Degradê Baixo', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '2', name: 'Mid Fade', technicalName: 'Degradê Médio', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '3', name: 'High Fade', technicalName: 'Degradê Alto', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '4', name: 'Americano', technicalName: 'Taper Fade', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '5', name: 'Mullet', technicalName: 'Modern Mullet', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1512690196236-4074256637b5?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '6', name: 'Crop Top', technicalName: 'Franja Texturizada', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '7', name: 'Militar', technicalName: 'Buzz Cut', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1634316427356-324c65e5e406?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '8', name: 'Afro Fade', technicalName: 'Crespo c/ Degradê', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1514059074073-677a284e937d?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  
  // Previous Invisible slots
  { id: 'extra-c1', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c2', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c3', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c4', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c5', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c6', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c7', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c8', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c9', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c10', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c11', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c12', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c13', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c14', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c15', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },

  // +5 requested
  { id: 'extra-c16', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c17', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c18', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c19', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c20', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
];

// PRODUCTS (New Section) - (5 visible placeholders + 10 invisible slots)
export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'prod-1', name: 'Pomada Modeladora', description: 'Efeito seco, alta fixação.', price: 35, imageUrl: 'https://images.unsplash.com/photo-1626895360662-79b8377742d4?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-2', name: 'Óleo para Barba', description: 'Hidratação e brilho.', price: 25, imageUrl: 'https://images.unsplash.com/photo-1626219358249-16637397e504?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-3', name: 'Shampoo 2 em 1', description: 'Para cabelo e barba.', price: 30, imageUrl: 'https://images.unsplash.com/photo-1631729371254-42c2a89e0e18?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-4', name: 'Minoxidil', description: 'Loção para crescimento.', price: 60, imageUrl: '', active: false, options: [] }, // Inactive example
  { id: 'prod-5', name: 'Pente de Madeira', description: 'Antiestático.', price: 15, imageUrl: '', active: false, options: [] }, // Inactive example
  
  // Previous 5 Invisible Slots
  { id: 'prod-extra-1', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-2', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-3', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-4', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-5', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },

  // +5 requested
  { id: 'prod-extra-6', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-7', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-8', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-9', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-extra-10', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
];
