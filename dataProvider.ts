
import { PROVIDER_MODE } from "./config";
import { DataProviderInterface } from "./providers/interfaces";
import { localStorageProvider } from "./providers/localStorageProvider";
import { supabaseProvider } from "./providers/supabaseProvider";

// Factory to select the active provider
const getProvider = (): DataProviderInterface => {
  if (PROVIDER_MODE === 'supabase') {
    return supabaseProvider;
  }
  return localStorageProvider;
};

// Export the singleton instance
export const dataProvider = getProvider();
