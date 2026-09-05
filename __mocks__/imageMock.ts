/**
 * Stands in for vite-imagetools query imports (`./x.jpg?...&as=picture`), which
 * Jest cannot run through Vite. Shaped like the real `as=picture` output so
 * components that read `.sources` / `.img` behave the same under test.
 */
export default {
  sources: {
    avif: "test-image-stub.avif 320w, test-image-stub.avif 640w",
    webp: "test-image-stub.webp 320w, test-image-stub.webp 640w",
    jpeg: "test-image-stub.jpg 320w, test-image-stub.jpg 640w",
  },
  img: { src: "test-image-stub.jpg", w: 320, h: 180 },
};
