/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BASEURL: string;
    readonly VITE_PROTOCOL: string;
    readonly VITE_APIPATH: string;
    readonly VITE_WS_PROTOCOl: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}