# Brand masters

Full-resolution source artwork. Nothing imports these, so Vite never bundles them
and they are not deployed — they live here purely as the master to regenerate from.

`o-master.png` (1024x1024) is the source for the favicons in `public/icons/o-*.png`.
It used to sit in `public/icons/o.png` and be served directly as the favicon, which
shipped 1.25 MB on every page load to render a 16px icon.

Regenerate with:

    node -e "const s=require('sharp');[32,64].forEach(n=>s('src/assets/brand/o-master.png').resize(n,n,{fit:'cover'}).png({compressionLevel:9,palette:true}).toFile('public/icons/o-'+n+'.png'))"
