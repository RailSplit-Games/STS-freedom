/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_LLM_PROVIDER?: 'openai' | 'anthropic' | 'local' | 'none';
  readonly VITE_LOCAL_LLM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
