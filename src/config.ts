// src/config.ts

/**
 * Configurações de Branding para White-Label
 * Altere estes valores para personalizar a aparência da aplicação.
 */
const branding = {
  appName: "Nexor Admin",
  logo: "/branding/Nexor SF.png",
  logoCollapsed: "/branding/Nexor - SF2.png", // Logo compacta para a sidebar
};

/**
 * Feature Flags
 * Ative ou desative funcionalidades específicas da aplicação.
 * 'false' desativa a feature, 'true' ativa.
 */
const featureFlags = {
  multiCompany: false, // Exemplo: Habilita a seleção de múltiplas empresas
  advancedAnalytics: true, // Exemplo: Mostra a aba de Insights
};

/**
 * Configurações do React Query
 * Ajuste os tempos de cache para otimizar a performance.
 */
const queryClientConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  cacheTime: 1000 * 60 * 30, // 30 minutos
  refetchOnMount: false,
  refetchOnWindowFocus: false,
};

export const config = {
  branding,
  featureFlags,
  queryClientConfig,
};