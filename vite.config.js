import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import { buildProjectStructure } from './scripts/paths.js';
import path from "path"

export default defineConfig({
  plugins: [
    glsl(),
    {
      name: 'structure',
      watchChange: async() => await buildProjectStructure()
    }
  ],
  root: "./src",
  resolve: {
    alias: {
      "@/public": path.resolve(__dirname, "public"),
    }
  }
})