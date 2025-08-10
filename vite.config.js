import glsl from 'vite-plugin-glsl';
import pug from 'vite-plugin-pug';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    glsl(),
    pug()
  ],
  root: "./src"
})