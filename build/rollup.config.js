import VuePlugin from 'rollup-plugin-vue'
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble'; // Transpile/polyfill with reasonable browser support


import alias from 'rollup-plugin-alias';
export default {
    input: 'src/wrapper.js',
    output: {
      name: 'singleNumberInput',
      exports: 'named',
    },
    external: [ 'vue' ],
    plugins: [
      VuePlugin({
        css: true, // Dynamically inject css as a <style> tag
        compileTemplate: true, // Explicitly convert template to render function
      }),
          alias({
            resolve: ['.js'],
            "vue-class-component": 'vue-class-component/lib/index'
          }),
      nodeResolve({
        jsnext: true,
        main: false,
        // jail: '/node_modules/vue-property-decorator', // Default: '/'
      }),
      commonjs({
        // non-CommonJS modules will be ignored, but you can also
        // specifically include/exclude files
        include: ['node_modules/vue-property-decorator', 'node_modules/vue-class-component'],  // Default: undefined
        // exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined
        // these values can also be regular expressions
        // include: /node_modules/
  
        // search for files other than .js files (must already
        // be transpiled by a previous plugin!)
        extensions: [ '.js', '.vue' ],  // Default: [ '.js' ]
  
        // if true then uses of `global` won't be dealt with by this plugin
        ignoreGlobal: false,  // Default: false
  
        // if false then skip sourceMap generation for CommonJS modules
        sourceMap: false,  // Default: true
  
        // explicitly specify unresolvable named exports
        // (see below for more details)
        // namedExports: { './node_modules/vue-class-component/dist/vue-class-component.common.js': ['Component'] },  // Default: undefined
  
        // sometimes you have to leave require statements
        // unconverted. Pass an array containing the IDs
        // or a `id => boolean` function. Only use this
        // option if you know what you're doing!
        // ignore: [ 'conditional-runtime-dependency' ]
      }),
      typescript(),
      buble() // Transpile to ES5x
    ],
};