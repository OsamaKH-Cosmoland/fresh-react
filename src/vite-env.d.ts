/// <reference types="vite/client" />

/**
 * vite-imagetools@10 ships no client type declarations, so the shapes its query
 * suffixes resolve to are declared here. Wildcard module patterns allow a single
 * "*", which is enough to key off the trailing &as=... directive.
 */
declare module "*&as=picture" {
  const picture: {
    /** format key ("avif" | "webp" | "jpeg") -> full srcset string */
    sources: Record<string, string>;
    /** largest generated variant, used as the <img> fallback */
    img: { src: string; w: number; h: number };
  };
  export default picture;
}

declare module "*&as=srcset" {
  const srcset: string;
  export default srcset;
}

declare module "*&as=metadata" {
  const metadata: Record<string, unknown>;
  export default metadata;
}
