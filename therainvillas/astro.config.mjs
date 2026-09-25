import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
  image: {
    domains: ['assets.zyrosite.com'],
  },
  vite: {
    build: {
      cssMinify: 'esbuild',
    },
  },
});
