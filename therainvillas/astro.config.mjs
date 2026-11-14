import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import { villas } from './src/data/villas.js';

export default defineConfig({
  site: 'https://therainvillas.com',
  trailingSlash: 'always',
  build: {
    // Hasil build: /villa-agave/index.html → URL kanonik /villa-agave/
    format: 'directory',
  },
  redirects: {
    ...Object.fromEntries(
      villas.map((villa) => [`/villas/${villa.id}`, `/${villa.slug}/`]),
    ),
    ...Object.fromEntries(
      villas.map((villa) => [`/villas/${villa.slug}`, `/${villa.slug}/`]),
    ),
  },
  integrations: [
    vue(),
    sitemap({
      // Sitemap hanya boleh berisi URL kanonik yang bisa diindeks:
      // keluarkan /admin/ (noindex + X-Robots-Tag), /villas/ (redirect 301),
      // dan halaman konfirmasi/terima kasih.
      filter: (page) =>
        !page.includes('/admin/') &&
        !page.includes('/villas/') &&
        !/\/(terima-kasih|thank-you|konfirmasi)(\/|$)/i.test(page),
      serialize(item) {
        item.lastmod = new Date().toISOString();
        return item;
      },
    }),
  ],
  image: {
    domains: ['assets.zyrosite.com'],
  },
  vite: {
    build: {
      cssMinify: 'esbuild',
    },
  },
});
