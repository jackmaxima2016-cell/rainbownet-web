// @ts-check
import { defineConfig } from 'astro/config';

const site = process.env.ASTRO_SITE || 'https://rainbownet.ch';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
