import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import { villas } from './src/data/villas.js';

export default defineConfig({
  site: 'https://therainvillas.com',
  redirects: {
    ...Object.fromEntries(
      villas.map((villa) => [`/villas/${villa.id}`, `/${villa.slug}`]),
    ),
    ...Object.fromEntries(
      villas.map((villa) => [`/villas/${villa.slug}`, `/${villa.slug}`]),
    ),
  },
  integrations: [
    vue(),
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/villas/'),
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
