import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { defineConfig, loadEnv, type Plugin, type HtmlTagDescriptor } from "vite";
import react from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * The home route is client-rendered behind a lazy() boundary, so without help the
 * browser can only discover the hero image after three serial steps: download
 * index.js -> execute it -> download the HomePage chunk -> render -> see the <img>.
 * These two <link>s move both resources onto the initial HTML parse instead, which
 * is where the LCP time was going. Filenames are content-hashed at build time, so
 * they are resolved from the bundle rather than hard-coded.
 *
 * The hero renders as <picture> with AVIF/WebP/JPEG sources, so the preload has to
 * describe the same choice the picture will make or it fetches bytes nobody uses.
 * It therefore emits imagesrcset/imagesizes rather than a single href, restricted
 * to AVIF: that is the first <source>, so any browser that supports it picks AVIF,
 * and any browser that does not ignores this link entirely because of `type`.
 *
 * The imagesizes value is read out of SIZES.hero rather than repeated here: if the
 * two disagree the preload scanner and the <picture> resolve to different candidates
 * and the hero is fetched twice, which is worse than not preloading at all.
 */
const LCP_IMAGE = "src/assets/collection.jpg";
const HOME_CHUNK = "src/pages/HomePage.tsx";

function heroSizesFromRegistry(): string {
  const registry = resolve(__dirname, "src/assets/images.ts");
  const source = readFileSync(registry, "utf8");
  const match = /\bhero:\s*"([^"]+)"/.exec(source);
  if (!match) {
    throw new Error(
      `critical-preloads: could not read SIZES.hero from ${registry}. ` +
        "The LCP preload derives imagesizes from it, so they cannot be allowed to drift."
    );
  }
  return match[1];
}

function criticalPreloads(): Plugin {
  return {
    name: "naturagloss:critical-preloads",
    apply: "build",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      async handler(_html, ctx) {
        const tags: HtmlTagDescriptor[] = [];
        if (!ctx.bundle) return { html: _html, tags };

        const endsWith = (value: string | null | undefined, suffix: string) =>
          typeof value === "string" && value.replace(/\\/g, "/").endsWith(suffix);

        const heroAvif: { fileName: string; source: Uint8Array }[] = [];
        let homeChunk: string | undefined;

        for (const output of Object.values(ctx.bundle)) {
          if (output.type === "asset") {
            const origins = [
              ...((output as { originalFileNames?: string[] }).originalFileNames ?? []),
              (output as { originalFileName?: string | null }).originalFileName ?? null,
            ];
            // Only the generated AVIF variants: the untouched original is also
            // emitted from this source file, for the Open Graph tags.
            if (origins.some((name) => endsWith(name, LCP_IMAGE)) && output.fileName.endsWith(".avif")) {
              heroAvif.push({
                fileName: output.fileName,
                source: output.source as Uint8Array,
              });
            }
          } else if (endsWith(output.facadeModuleId, HOME_CHUNK)) {
            homeChunk = output.fileName;
          }
        }

        // Widths come from the encoded bytes, so the descriptors cannot drift
        // from whatever ladder images.ts happens to request.
        const { default: sharp } = await import("sharp");
        const measured = await Promise.all(
          heroAvif.map(async (variant) => ({
            fileName: variant.fileName,
            width: (await sharp(Buffer.from(variant.source)).metadata()).width ?? 0,
          }))
        );
        const heroSrcset = measured
          .filter((variant) => variant.width > 0)
          .sort((a, b) => a.width - b.width)
          .map((variant) => `/${variant.fileName} ${variant.width}w`)
          .join(", ");

        // Spliced in by hand rather than injectTo: "head-prepend" because position
        // matters twice over. It must land after <meta charset> (which has to stay
        // in the first 1024 bytes) and, critically, after <meta name="viewport">:
        // the preload scanner evaluates imagesizes as soon as it reads this tag, so
        // if width=device-width is not known yet it resolves the media conditions
        // against the default viewport and preloads a different candidate than the
        // <picture> later picks -- downloading the hero twice.
        let html = _html;
        if (heroSrcset) {
          const link =
            `<link rel="preload" as="image" type="image/avif" fetchpriority="high"` +
            ` imagesrcset="${heroSrcset}" imagesizes="${heroSizesFromRegistry()}">`;
          const anchor =
            /<meta\s+name=["']viewport["'][^>]*>/i.exec(html) ??
            /<meta\s+charset=["']?[^>]*>/i.exec(html);
          html = anchor
            ? html.replace(anchor[0], `${anchor[0]}\n    ${link}`)
            : html.replace(/<head>/i, `<head>\n    ${link}`);
        } else {
          this.warn(`critical-preloads: no AVIF variants matched ${LCP_IMAGE}`);
        }

        if (homeChunk) {
          tags.push({
            tag: "link",
            attrs: { rel: "modulepreload", href: `/${homeChunk}`, crossorigin: "" },
            injectTo: "head",
          });
        } else {
          this.warn(`critical-preloads: no bundled chunk matched ${HOME_CHUNK}`);
        }

        return { html, tags };
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiPort = env.API_PORT || env.PORT || "3000";
  const apiTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${apiPort}`;

  return {
    plugins: [react(), imagetools(), criticalPreloads()],
    resolve: {
      alias: {
        "@/": `${resolve(__dirname, "src")}/`,
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
