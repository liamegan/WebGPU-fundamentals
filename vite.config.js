import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import { buildProjectStructure } from './scripts/paths.js';

export default defineConfig({
  plugins: [
    glsl(),
    {
      name: 'structure',
      watchChange: async() => await buildProjectStructure()
    }
  ],
  root: "./src"
})