import React from "react";
import { pictureFor } from "@/assets/images";

/**
 * Renders a bundled image as <picture> with AVIF/WebP/JPEG sources and an
 * explicit width/height taken from the generated variant, so the browser can
 * reserve the correct box before the bytes arrive.
 *
 * `src` is the plain URL string the app already passes around (see
 * assets/images.ts). Anything not in the registry -- an API-supplied review
 * photo, for instance -- still renders as a plain <img> with the same loading
 * behaviour, just without a srcset.
 */
export interface PictureProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "sizes"> {
  src: string;
  alt: string;
  /**
   * Viewport-relative rendered width, e.g. "(max-width: 700px) 60vw, 320px".
   * Required for registry images: without it the browser assumes 100vw and
   * over-fetches.
   */
  sizes?: string;
  /**
   * Set on the LCP image only. Loads eagerly at high priority instead of lazily.
   */
  priority?: boolean;
}

const MIME: Record<string, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
};

export function Picture({ src, alt, sizes, priority = false, ...rest }: PictureProps) {
  const picture = pictureFor(src);

  const loadingProps = priority
    ? ({ loading: "eager", fetchPriority: "high" } as const)
    : ({ loading: "lazy" } as const);

  if (!picture) {
    return <img src={src} alt={alt} decoding="async" {...loadingProps} {...rest} />;
  }

  return (
    <picture>
      {Object.entries(picture.sources).map(([format, srcSet]) => (
        <source key={format} type={MIME[format] ?? `image/${format}`} srcSet={srcSet} sizes={sizes} />
      ))}
      <img
        src={picture.img.src}
        alt={alt}
        width={picture.img.w}
        height={picture.img.h}
        sizes={sizes}
        decoding="async"
        {...loadingProps}
        {...rest}
      />
    </picture>
  );
}
