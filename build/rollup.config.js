import VuePlugin from 'rollup-plugin-vue'
import typescript from 'rollup-plugin-typescript2';

import buble from 'rollup-plugin-buble'; // Transpile/polyfill with reasonable browser support
export default {
    entry: 'src/wrapper.js',
    output: {
        name: 'singleNumberInput',
        exports: 'named',
    },
    plugins: [
      VuePlugin({
            css: true, // Dynamically inject css as a <style> tag
            compileTemplate: true, // Explicitly convert template to render function
        }),
        typescript(),
        buble() // Transpile to ES5x
    ],
};