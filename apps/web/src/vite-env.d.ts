/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_SCRIPT_URL: string | undefined;
  readonly VITE_UMAMI_WEBSITE_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface UmamiTracker {
  track: {
    (): void;
    (event: string, data?: Record<string, string | number | boolean>): void;
    (eventOrProps: Record<string, unknown>): void;
    (propsMapper: (defaults: Record<string, unknown>) => Record<string, unknown>): void;
  };
}

interface Window {
  umami?: UmamiTracker;
}
