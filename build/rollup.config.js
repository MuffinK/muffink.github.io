import VuePlugin from 'rollup-plugin-vue'
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble'; // Transpile/polyfill with reasonable browser support
import rollupPluginTypescriptPathMapping from 'rollup-plugin-typescript-path-mapping';
import replace from 'rollup-plugin-replace';

import alias from 'rollup-plugin-alias';
export default {
  input: 'src/wrapper.js',
  output: {
    name: 'singleNumberInput',
    exports: 'named',
    globals: ['Vue']
  },
  external: ['vue'],
  plugins: [
    VuePlugin({
      css: true, // Dynamically inject css as a <style> tag
      compileTemplate: true, // Explicitly convert template to render function
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    rollupPluginTypescriptPathMapping({
      baseUrl: './',
      paths: {
        'vue-class-component': ['vue-class-component/lib/index']
      },
      outDir: 'dist',
      rootDir: 'src'
    }),
    nodeResolve({
      jsnext: true,
      main: false
    }),
    typescript(),
    buble() // Transpile to ES5x
  ],
};