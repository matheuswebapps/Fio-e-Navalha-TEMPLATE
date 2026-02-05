import { DataProviderInterface } from "./interfaces";
import { supabase } from "../services/supabaseClient";
import {
  BusinessSettings,
  CutSuggestion,
  PortfolioItem,
  ProductItem,
  ServiceItem,
  Testimonial,
} from "../types";
import {
  DEFAULT_CUTS,
  DEFAULT_PORTFOLIO,
  DEFAULT_PRODUCTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
} from "../constants";


async function getRow() {
  const { data, error } = await supabase
    .from("site_data")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("[Supabase] Erro ao buscar site_data:", error);
    return null;
  }

  return data;
}

async function updateRow(patch: any) {
  const { error } = await supabase
    .from("site_data")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("[Supabase] Erro ao salvar site_data:", error);
    throw error;
  }
}

export const supabaseProvider: DataProviderInterface = {
  getSettings: async (): Promise<BusinessSettings> => {
    const row = await getRow();
    return (row?.settings ?? DEFAULT_SETTINGS) as BusinessSettings;
  },

  saveSettings: async (settings: BusinessSettings): Promise<void> => {
    await updateRow({ settings });
  },

  getServices: async (): Promise<ServiceItem[]> => {
    const row = await getRow();
    return (row?.services ?? DEFAULT_SERVICES) as ServiceItem[];
  },

  saveServices: async (services: ServiceItem[]): Promise<void> => {
    await updateRow({ services });
  },

  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const row = await getRow();
    return (row?.portfolio ?? DEFAULT_PORTFOLIO) as PortfolioItem[];
  },

  savePortfolio: async (items: PortfolioItem[]): Promise<void> => {
    await updateRow({ portfolio: items });
  },

  getCuts: async (): Promise<CutSuggestion[]> => {
    const row = await getRow();
    return (row?.cuts ?? DEFAULT_CUTS) as CutSuggestion[];
  },

  saveCuts: async (items: CutSuggestion[]): Promise<void> => {
    await updateRow({ cuts: items });
  },

  getProducts: async (): Promise<ProductItem[]> => {
    const row = await getRow();
    return (row?.products ?? DEFAULT_PRODUCTS) as ProductItem[];
  },

  saveProducts: async (items: ProductItem[]): Promise<void> => {
    await updateRow({ products: items });
  },

  getTestimonials: async (): Promise<Testimonial[]> => {
    const row = await getRow();
    return (row?.testimonials ?? []) as Testimonial[];
  },

  saveTestimonials: async (items: Testimonial[]): Promise<void> => {
    await updateRow({ testimonials: items });
  },
};