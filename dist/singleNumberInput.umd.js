(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
    (factory((global.singleNumberInput = {}),global.Vue));
}(this, (function (exports,Vue) { 'use strict';

    Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") { r = Reflect.decorate(decorators, target, key, desc); }
        else { for (var i = decorators.length - 1; i >= 0; i--) { if (d = decorators[i]) { r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r; } } }
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    var hasProto = { __proto__: [] } instanceof Array;
    function createDecorator(factory) {
        return function (target, key, index) {
            var Ctor = typeof target === 'function'
                ? target
                : target.constructor;
            if (!Ctor.__decorators__) {
                Ctor.__decorators__ = [];
            }
            if (typeof index !== 'number') {
                index = undefined;
            }
            Ctor.__decorators__.push(function (options) { return factory(options, key, index); });
        };
    }
    function isPrimitive(value) {
        var type = typeof value;
        return value == null || (type !== "object" && type !== "function");
    }
    function warn(message) {
        if (typeof console !== 'undefined') {
            console.warn('[vue-class-component] ' + message);
        }
    }

    function collectDataFromConstructor(vm, Component) {
        // override _init to prevent to init as Vue instance
        var originalInit = Component.prototype._init;
        Component.prototype._init = function () {
            var _this = this;
            // proxy to actual vm
            var keys = Object.getOwnPropertyNames(vm);
            // 2.2.0 compat (props are no longer exposed as self properties)
            if (vm.$options.props) {
                for (var key in vm.$options.props) {
                    if (!vm.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
            }
            keys.forEach(function (key) {
                if (key.charAt(0) !== '_') {
                    Object.defineProperty(_this, key, {
                        get: function () { return vm[key]; },
                        set: function (value) { return vm[key] = value; },
                        configurable: true
                    });
                }
            });
        };
        // should be acquired class property values
        var data = new Component();
        // restore original _init to avoid memory leak (#209)
        Component.prototype._init = originalInit;
        // create plain data object
        var plainData = {};
        Object.keys(data).forEach(function (key) {
            if (data[key] !== undefined) {
                plainData[key] = data[key];
            }
        });
        if (process.env.NODE_ENV !== 'production') {
            if (!(Component.prototype instanceof Vue) && Object.keys(plainData).length > 0) {
                warn('Component class must inherit Vue or its descendant class ' +
                    'when class property is used.');
            }
        }
        return plainData;
    }

    var $internalHooks = [
        'data',
        'beforeCreate',
        'created',
        'beforeMount',
        'mounted',
        'beforeDestroy',
        'destroyed',
        'beforeUpdate',
        'updated',
        'activated',
        'deactivated',
        'render',
        'errorCaptured' // 2.5
    ];
    function componentFactory(Component, options) {
        if (options === void 0) { options = {}; }
        options.name = options.name || Component._componentTag || Component.name;
        // prototype props.
        var proto = Component.prototype;
        Object.getOwnPropertyNames(proto).forEach(function (key) {
            if (key === 'constructor') {
                return;
            }
            // hooks
            if ($internalHooks.indexOf(key) > -1) {
                options[key] = proto[key];
                return;
            }
            var descriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (typeof descriptor.value === 'function') {
                // methods
                (options.methods || (options.methods = {}))[key] = descriptor.value;
            }
            else if (descriptor.get || descriptor.set) {
                // computed properties
                (options.computed || (options.computed = {}))[key] = {
                    get: descriptor.get,
                    set: descriptor.set
                };
            }
        });
        (options.mixins || (options.mixins = [])).push({
            data: function () {
                return collectDataFromConstructor(this, Component);
            }
        });
        // decorate options
        var decorators = Component.__decorators__;
        if (decorators) {
            decorators.forEach(function (fn) { return fn(options); });
            delete Component.__decorators__;
        }
        // find super
        var superProto = Object.getPrototypeOf(Component.prototype);
        var Super = superProto instanceof Vue
            ? superProto.constructor
            : Vue;
        var Extended = Super.extend(options);
        forwardStaticMembers(Extended, Component, Super);
        return Extended;
    }
    var reservedPropertyNames = [
        // Unique id
        'cid',
        // Super Vue constructor
        'super',
        // Component options that will be used by the component
        'options',
        'superOptions',
        'extendOptions',
        'sealedOptions',
        // Private assets
        'component',
        'directive',
        'filter'
    ];
    function forwardStaticMembers(Extended, Original, Super) {
        // We have to use getOwnPropertyNames since Babel registers methods as non-enumerable
        Object.getOwnPropertyNames(Original).forEach(function (key) {
            // `prototype` should not be overwritten
            if (key === 'prototype') {
                return;
            }
            // Some browsers does not allow reconfigure built-in properties
            var extendedDescriptor = Object.getOwnPropertyDescriptor(Extended, key);
            if (extendedDescriptor && !extendedDescriptor.configurable) {
                return;
            }
            var descriptor = Object.getOwnPropertyDescriptor(Original, key);
            // If the user agent does not support `__proto__` or its family (IE <= 10),
            // the sub class properties may be inherited properties from the super class in TypeScript.
            // We need to exclude such properties to prevent to overwrite
            // the component options object which stored on the extended constructor (See #192).
            // If the value is a referenced value (object or function),
            // we can check equality of them and exclude it if they have the same reference.
            // If it is a primitive value, it will be forwarded for safety.
            if (!hasProto) {
                // Only `cid` is explicitly exluded from property forwarding
                // because we cannot detect whether it is a inherited property or not
                // on the no `__proto__` environment even though the property is reserved.
                if (key === 'cid') {
                    return;
                }
                var superDescriptor = Object.getOwnPropertyDescriptor(Super, key);
                if (!isPrimitive(descriptor.value)
                    && superDescriptor
                    && superDescriptor.value === descriptor.value) {
                    return;
                }
            }
            // Warn if the users manually declare reserved properties
            if (process.env.NODE_ENV !== 'production'
                && reservedPropertyNames.indexOf(key) >= 0) {
                warn("Static property name '" + key + "' declared on class '" + Original.name + "' " +
                    'conflicts with reserved property name of Vue internal. ' +
                    'It may cause unexpected behavior of the component. Consider renaming the property.');
            }
            Object.defineProperty(Extended, key, descriptor);
        });
    }

    function Component(options) {
        if (typeof options === 'function') {
            return componentFactory(options);
        }
        return function (Component) {
            return componentFactory(Component, options);
        };
    }
    (function (Component) {
        function registerHooks(keys) {
            $internalHooks.push.apply($internalHooks, keys);
        }
        Component.registerHooks = registerHooks;
    })(Component || (Component = {}));
    var Component$1 = Component;

    /** vue-property-decorator verson 7.0.0 MIT LICENSE copyright 2018 kaorun343 */
    /**
     * decorator of a prop
     * @param  options the options for the prop
     * @return PropertyDecorator | void
     */
    function Prop(options) {
        if (options === void 0) { options = {}; }
        return createDecorator(function (componentOptions, k) {
            (componentOptions.props || (componentOptions.props = {}))[k] = options;
        });
    }

    // import Component from 'vue-class-component';
    var NumberString = function NumberString(maxLength) {
        this.value = '';
        this.maxLength = maxLength || 4;
    };
    NumberString.prototype.push = function push (char) {
        if (this.value.length < this.maxLength && char.length === 1) {
            this.value = [this.value, char].join('');
        }
    };
    NumberString.prototype.pop = function pop () {
        if (this.value.length !== 0) {
            this.value = this.value.slice(0, -1);
        }
    };
    NumberString.prototype.getDisplayString = function getDisplayString () {
        return this.value.padEnd(this.maxLength, ' ').split('').join('|');
    };
    NumberString.prototype.setValue = function setValue (inputNumber) {
        if (inputNumber.length >= this.maxLength && !isNaN(parseInt(inputNumber))) {
            this.value = inputNumber;
        }
    };
    var SingleNumberInput = (function (Vue$$1) {
        function SingleNumberInput() {
            Vue$$1.apply(this, arguments);
            this.displayString = '';
            this.widthStyle = {
                width: '16ch'
            };
        }

        if ( Vue$$1 ) SingleNumberInput.__proto__ = Vue$$1;
        SingleNumberInput.prototype = Object.create( Vue$$1 && Vue$$1.prototype );
        SingleNumberInput.prototype.constructor = SingleNumberInput;
        SingleNumberInput.prototype.mounted = function mounted () {
            this.stringValue = new NumberString(Number(this.chNumber));
            this.stringValue.setValue(this.value);
            this.displayString = this.stringValue.getDisplayString();
            this.widthStyle.width = Number(this.chNumber) * 4 + 'ch';
        };
        SingleNumberInput.prototype.keydown = function keydown (event) {
            var numberValue = '0123456789'.indexOf(event.key);
            if (numberValue !== -1) {
                this.stringValue.push(event.key);
                this.displayString = this.stringValue.getDisplayString();
                this.$emit('input', this.stringValue.value);
            }
            else if (event.key === "Backspace") {
                this.stringValue.pop();
                this.displayString = this.stringValue.getDisplayString();
                this.$emit('input', this.stringValue.value);
            }
            event.cancelBubble = true;
            event.preventDefault();
        };

        return SingleNumberInput;
    }(Vue));
    __decorate([
        Prop()
    ], SingleNumberInput.prototype, "chNumber", void 0);
    __decorate([
        Prop()
    ], SingleNumberInput.prototype, "value", void 0);
    SingleNumberInput = __decorate([
        Component$1({})
    ], SingleNumberInput);
    var script = SingleNumberInput;

    /* script */
                var __vue_script__ = script;
                
    /* template */
    var __vue_render__ = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("div", [
        _c("input", {
          directives: [
            {
              name: "model",
              rawName: "v-model",
              value: _vm.displayString,
              expression: "displayString"
            }
          ],
          style: _vm.widthStyle,
          attrs: { type: "text" },
          domProps: { value: _vm.displayString },
          on: {
            keydown: _vm.keydown,
            input: function($event) {
              if ($event.target.composing) {
                return
              }
              _vm.displayString = $event.target.value;
            }
          }
        })
      ])
    };
    var __vue_staticRenderFns__ = [];
    __vue_render__._withStripped = true;

      /* style */
      var __vue_inject_styles__ = function (inject) {
        if (!inject) { return }
        inject("data-v-ceba03e8_0", { source: "\ninput[data-v-ceba03e8]{\n  background: transparent;\n  border: black solid 1px;\n  text-align: center;\n  border-radius: 5px;\n  font-size: xx-large;\n  letter-spacing: 1ch;\n  text-indent: 1ch;\n  font-family: monospace;\n  color: transparent;\n  text-shadow: 0 0 0 #000;\n}\n", map: {"version":3,"sources":["/Users/muffin/workspace/single-number-input-vue/src/singleNumberInput.vue"],"names":[],"mappings":";AAwEA;EACA,wBAAA;EACA,wBAAA;EACA,mBAAA;EACA,mBAAA;EACA,oBAAA;EACA,oBAAA;EACA,iBAAA;EACA,uBAAA;EACA,mBAAA;EACA,wBAAA;CACA","file":"singleNumberInput.vue","sourcesContent":["<template>\n  <div>\n    <input type=\"text\" v-model=\"displayString\" :style=\"widthStyle\" @keydown=\"keydown\">\n  </div>\n</template>\n\n<script lang=\"ts\">\n\nimport Vue from \"vue\";\nimport {Component, Prop, Watch} from 'vue-property-decorator';\n// import Component from 'vue-class-component';\n\nclass NumberString {\n  value = '';\n  maxLength: number;\n\n  constructor(maxLength: number){\n    this.maxLength = maxLength || 4;\n  }\n  push(char: string){\n    if(this.value.length < this.maxLength && char.length === 1){\n      this.value = [this.value, char].join('');\n    }\n  }\n  pop(){\n   if(this.value.length !== 0){\n     this.value = this.value.slice(0, -1);\n   } \n  }\n  getDisplayString(){\n    return this.value.padEnd(this.maxLength, ' ').split('').join('|');\n  }\n  setValue(inputNumber: string){\n    if(inputNumber.length>= this.maxLength && !isNaN(parseInt(inputNumber))){\n      this.value = inputNumber;\n    }\n  }\n}\n@Component({})\nexport default class SingleNumberInput extends Vue {\n  displayString = '';\n  widthStyle = {\n    width: '16ch'\n  }\n  @Prop() private chNumber!: string;\n  stringValue! : NumberString;\n  @Prop() value!: string;\n  mounted() {\n    this.stringValue = new NumberString(Number(this.chNumber));\n    this.stringValue.setValue(this.value);\n    this.displayString = this.stringValue.getDisplayString();\n    this.widthStyle.width = Number(this.chNumber) * 4 + 'ch';\n  }\n\n  keydown(event: KeyboardEvent){\n    let numberValue = '0123456789'.indexOf(event.key);\n    if(numberValue !== -1){\n      this.stringValue.push(event.key);\n      this.displayString = this.stringValue.getDisplayString();\n      this.$emit('input', this.stringValue.value);\n    }else if(event.key === \"Backspace\"){\n      this.stringValue.pop()\n      this.displayString = this.stringValue.getDisplayString();\n      this.$emit('input', this.stringValue.value);\n    }\n    event.cancelBubble = true;\n    event.preventDefault();\n  }\n}\n</script>\n\n<style scoped>\n  input{\n    background: transparent;\n    border: black solid 1px;\n    text-align: center;\n    border-radius: 5px;\n    font-size: xx-large;\n    letter-spacing: 1ch;\n    text-indent: 1ch;\n    font-family: monospace;\n    color: transparent;\n    text-shadow: 0 0 0 #000;\n  }\n</style>\n\n"]}, media: undefined });

      };
      /* scoped */
      var __vue_scope_id__ = "data-v-ceba03e8";
      /* module identifier */
      var __vue_module_identifier__ = undefined;
      /* functional template */
      var __vue_is_functional_template__ = false;
      /* component normalizer */
      function __vue_normalize__(
        template, style, script$$1,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        var component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/Users/muffin/workspace/single-number-input-vue/src/singleNumberInput.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) { component.functional = true; }
        }

        component._scopeId = scope;

        {
          var hook;
          if (style) {
            hook = function(context) {
              style.call(this, createInjector(context));
            };
          }

          if (hook !== undefined) {
            if (component.functional) {
              // register for functional component in vue file
              var originalRender = component.render;
              component.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context)
              };
            } else {
              // inject component registration as beforeCreate hook
              var existing = component.beforeCreate;
              component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
            }
          }
        }

        return component
      }
      /* style inject */
      function __vue_create_injector__() {
        var head = document.head || document.getElementsByTagName('head')[0];
        var styles = __vue_create_injector__.styles || (__vue_create_injector__.styles = {});
        var isOldIE =
          typeof navigator !== 'undefined' &&
          /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

        return function addStyle(id, css) {
          if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) { return } // SSR styles are present.

          var group = isOldIE ? css.media || 'default' : id;
          var style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });

          if (!style.ids.includes(id)) {
            var code = css.source;
            var index = style.ids.length;

            style.ids.push(id);

            if (isOldIE) {
              style.element = style.element || document.querySelector('style[data-group=' + group + ']');
            }

            if (!style.element) {
              var el = style.element = document.createElement('style');
              el.type = 'text/css';

              if (css.media) { el.setAttribute('media', css.media); }
              if (isOldIE) {
                el.setAttribute('data-group', group);
                el.setAttribute('data-next-index', '0');
              }

              head.appendChild(el);
            }

            if (isOldIE) {
              index = parseInt(style.element.getAttribute('data-next-index'));
              style.element.setAttribute('data-next-index', index + 1);
            }

            if (style.element.styleSheet) {
              style.parts.push(code);
              style.element.styleSheet.cssText = style.parts
                .filter(Boolean)
                .join('\n');
            } else {
              var textNode = document.createTextNode(code);
              var nodes = style.element.childNodes;
              if (nodes[index]) { style.element.removeChild(nodes[index]); }
              if (nodes.length) { style.element.insertBefore(textNode, nodes[index]); }
              else { style.element.appendChild(textNode); }
            }
          }
        }
      }
      /* style inject SSR */
      

      
      var SingleNumberInput$1 = __vue_normalize__(
        { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
        __vue_inject_styles__,
        __vue_script__,
        __vue_scope_id__,
        __vue_is_functional_template__,
        __vue_module_identifier__,
        __vue_create_injector__,
        undefined
      );

    // Import vue component

    // Declare install function executed by Vue.use()
    function install(Vue$$1) {
    	if (install.installed) { return; }
    	install.installed = true;
    	Vue$$1.component('single-number-input', SingleNumberInput$1);
    }

    // Create module definition for Vue.use()
    var plugin = {
    	install: install,
    };

    // Auto-install when vue is found (eg. in browser via <script> tag)
    var GlobalVue = null;
    if (typeof window !== 'undefined') {
    	GlobalVue = window.Vue;
    } else if (typeof global !== 'undefined') {
    	GlobalVue = global.Vue;
    }
    if (GlobalVue) {
    	GlobalVue.use(plugin);
    }

    exports.install = install;
    exports.default = component;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
