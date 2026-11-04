/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_IS_CAPACITOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
