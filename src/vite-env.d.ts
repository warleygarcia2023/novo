/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARSE_APP_ID: string
  readonly VITE_PARSE_JS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}