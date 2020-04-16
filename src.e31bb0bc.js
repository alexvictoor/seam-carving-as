// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/as-bind/dist/as-bind.iife.js":[function(require,module,exports) {
'use strict';var asbuild=function(t){function x(a,b){var d=new Uint32Array(a);a=new Uint16Array(a);d=d[b+-4>>>2]>>>1;b>>>=1;if(1024>=d)return String.fromCharCode.apply(String,a.subarray(b,b+d));let c=[];do{var f=a[b+1024-1];f=55296<=f&&56320>f?1023:1024;c.push(String.fromCharCode.apply(String,a.subarray(b,b+=f)));d-=f}while(1024<d);return c.join("")+String.fromCharCode.apply(String,a.subarray(b,b+d))}function u(a){function b(a,b){return a?x(a.buffer,b):"<yet unknown>"}let d={},c=a.env=a.env||{};c.abort=
c.abort||function(a,h,g,e){let f=d.memory||c.memory;throw Error("abort: "+b(f,a)+" at "+b(f,h)+":"+g+":"+e);};c.trace=c.trace||function(a,h){console.log("trace: "+b(d.memory||c.memory,a)+(h?" ":"")+Array.prototype.slice.call(arguments,2,2+h).join(", "))};a.Math=a.Math||Math;a.Date=a.Date||Date;return d}function v(a,b){function d(a){let b=new Uint32Array(m.buffer),d=b[p>>>2];if((a>>>=0)>=d)throw Error("invalid id: "+a);return b[(p+4>>>2)+2*a]}function c(a){let b=new Uint32Array(m.buffer),d=b[p>>>2];
if((a>>>=0)>=d)throw Error("invalid id: "+a);return b[(p+4>>>2)+2*a+1]}function f(a,b,d){let c=m.buffer;if(d)switch(a){case 2:return new Float32Array(c);case 3:return new Float64Array(c)}else switch(a){case 0:return new (b?Int8Array:Uint8Array)(c);case 1:return new (b?Int16Array:Uint16Array)(c);case 2:return new (b?Int32Array:Uint32Array)(c);case 3:return new (b?BigInt64Array:BigUint64Array)(c)}throw Error("unsupported align: "+a);}function h(a){let b=new Uint32Array(m.buffer);var c=b[a+-8>>>2];let e=
d(c);if(!(e&1))throw Error("not an array: "+c);c=31-Math.clz32(e>>>5&31);var n=b[a+4>>>2];a=e&2?b[a+12>>>2]:b[n+-4>>>2]>>>c;return f(c,e&1024,e&2048).subarray(n>>>=c,n+a)}function g(a,b,c){return new a(e(a,b,c))}function e(a,b,c){let d=m.buffer,e=new Uint32Array(d);c=e[c+4>>>2];return new a(d,c,e[c+-4>>>2]>>>b)}b=b.exports;let m=b.memory,k=b.table,w=b.__alloc,y=b.__retain,p=b.__rtti_base||-1;a.__allocString=function(a){let b=a.length,c=w(b<<1,1),d=new Uint16Array(m.buffer);for(var e=0,f=c>>>1;e<b;++e)d[f+
e]=a.charCodeAt(e);return c};a.__getString=function(a){let b=m.buffer;if(1!==(new Uint32Array(b))[a+-8>>>2])throw Error("not a string: "+a);return x(b,a)};a.__allocArray=function(a,b){var c=d(a);if(!(c&3))throw Error("not an array: "+a+" @ "+c);let e=31-Math.clz32(c>>>5&31),g=b.length,h=w(g<<e,0);a=w(c&2?16:12,a);var n=new Uint32Array(m.buffer);n[a+0>>>2]=y(h);n[a+4>>>2]=h;n[a+8>>>2]=g<<e;c&2&&(n[a+12>>>2]=g);n=f(e,c&1024,c&2048);if(c&8192)for(c=0;c<g;++c)n[(h>>>e)+c]=y(b[c]);else n.set(b,h>>>e);
return a};a.__getArrayView=h;a.__getArray=function(a){a=h(a);let b=a.length,c=Array(b);for(let d=0;d<b;d++)c[d]=a[d];return c};a.__getArrayBuffer=function(a){let b=m.buffer,c=(new Uint32Array(b))[a+-4>>>2];return b.slice(a,a+c)};a.__getInt8Array=g.bind(null,Int8Array,0);a.__getInt8ArrayView=e.bind(null,Int8Array,0);a.__getUint8Array=g.bind(null,Uint8Array,0);a.__getUint8ArrayView=e.bind(null,Uint8Array,0);a.__getUint8ClampedArray=g.bind(null,Uint8ClampedArray,0);a.__getUint8ClampedArrayView=e.bind(null,
Uint8ClampedArray,0);a.__getInt16Array=g.bind(null,Int16Array,1);a.__getInt16ArrayView=e.bind(null,Int16Array,1);a.__getUint16Array=g.bind(null,Uint16Array,1);a.__getUint16ArrayView=e.bind(null,Uint16Array,1);a.__getInt32Array=g.bind(null,Int32Array,2);a.__getInt32ArrayView=e.bind(null,Int32Array,2);a.__getUint32Array=g.bind(null,Uint32Array,2);a.__getUint32ArrayView=e.bind(null,Uint32Array,2);F&&(a.__getInt64Array=g.bind(null,BigInt64Array,3),a.__getInt64ArrayView=e.bind(null,BigInt64Array,3),a.__getUint64Array=
g.bind(null,BigUint64Array,3),a.__getUint64ArrayView=e.bind(null,BigUint64Array,3));a.__getFloat32Array=g.bind(null,Float32Array,2);a.__getFloat32ArrayView=e.bind(null,Float32Array,2);a.__getFloat64Array=g.bind(null,Float64Array,3);a.__getFloat64ArrayView=e.bind(null,Float64Array,3);a.__instanceof=function(a,b){let d=new Uint32Array(m.buffer);a=d[a+-8>>>2];if(a<=d[p>>>2]){do if(a==b)return!0;while(a=c(a))}return!1};a.memory=a.memory||m;a.table=a.table||k;return G(b,a)}function z(a){return"undefined"!==
typeof Response&&a instanceof Response}async function A(a,b){return z(a=await a)?B(a,b):v(u(b||(b={})),await WebAssembly.instantiate(a instanceof WebAssembly.Module?a:await WebAssembly.compile(a),b))}async function B(a,b){return WebAssembly.instantiateStreaming?v(u(b||(b={})),(await WebAssembly.instantiateStreaming(a,b)).instance):A(z(a=await a)?a.arrayBuffer():a,b)}function G(a,b){b=b?Object.create(b):{};var d=a.__argumentsLength?function(b){a.__argumentsLength.value=b}:a.__setArgumentsLength||a.__setargc||
function(){};for(let h in a){if(!Object.prototype.hasOwnProperty.call(a,h))continue;let g=a[h];var c=h.split(".");let e=b;for(;1<c.length;){var f=c.shift();Object.prototype.hasOwnProperty.call(e,f)||(e[f]={});e=e[f]}c=c[0];f=c.indexOf("#");if(0<=f){let b=c.substring(0,f),k=e[b];if("undefined"===typeof k||!k.prototype){let a=function(...b){return a.wrap(a.prototype.constructor(0,...b))};a.prototype={valueOf:function(){return this[q]}};a.wrap=function(b){return Object.create(a.prototype,{[q]:{value:b,
writable:!1}})};k&&Object.getOwnPropertyNames(k).forEach(b=>Object.defineProperty(a,b,Object.getOwnPropertyDescriptor(k,b)));e[b]=a}c=c.substring(f+1);e=e[b].prototype;if(/^(get|set):/.test(c)){if(!Object.prototype.hasOwnProperty.call(e,c=c.substring(4))){let b=a[h.replace("set:","get:")],d=a[h.replace("get:","set:")];Object.defineProperty(e,c,{get:function(){return b(this[q])},set:function(a){d(this[q],a)},enumerable:!0})}}else"constructor"===c?(e[c]=(...a)=>{d(a.length);return g(...a)}).original=
g:(e[c]=function(...a){d(a.length);return g(this[q],...a)}).original=g}else/^(get|set):/.test(c)?Object.prototype.hasOwnProperty.call(e,c=c.substring(4))||Object.defineProperty(e,c,{get:a[h.replace("set:","get:")],set:a[h.replace("get:","set:")],enumerable:!0}):"function"===typeof g&&g!==d?(e[c]=(...a)=>{d(a.length);return g(...a)}).original=g:e[c]=g}return b}async function H(a,b){let d=a instanceof Promise;d&&(a=await a);return d?await I(a,b):await J(a,b)}function K(a,b){if("object"!==typeof a)throw Error("Did not pass a valid exports object of the WebAssembly Instance");
if("function"!==typeof b)throw Error("Did not pass a valid exported function of the WebAssembly Instance");C.forEach(b=>{if(!a[b])throw Error('Required Exported AssemblyScript Runtime functions are not present. Runtime must be set to "full" or "stub"');})}function L(a,b,d){let c=(a,b)=>{a=a[b[0]];b.shift();return 0<b.length?c(a,b):a},f=c(b,[...d]),h=b,g=function(){const e=a.unboundExports;h===b&&(h=c(b,[...d]));const g=[];Array.prototype.slice.call(arguments).forEach((a,b)=>{let c=void 0;h.shouldCacheTypes&&
h.cachedArgTypes[b]&&"ref"===h.cachedArgTypes[b].type?c=l[h.cachedArgTypes[b].key]:Object.keys(l).some(d=>l[d].isTypeFromReference(e,a)?(c=l[d],h.shouldCacheTypes&&(h.cachedArgTypes[b]={type:"ref",key:d}),!0):!1);c?g.push(c.getValueFromRef(e,a)):g.push(a)});return f.apply(null,g)};g.shouldCacheTypes=!0;g.cachedArgTypes=[];return g}function M(a,b){let d=a.unboundExports,c=d[b];K(d,c);let f=a.exports,h=function(){var g=Array.prototype.slice.call(arguments);f===a.exports&&(f=a.exports[b]);const e=[],
h=[];g.forEach((a,b)=>{if("number"===typeof a)e.push(a),f.shouldCacheTypes&&(f.cachedArgTypes[b]={type:"number"});else{var c=void 0;if(f.shouldCacheTypes&&f.cachedArgTypes[b]&&"ref"===f.cachedArgTypes[b].type)c=l[f.cachedArgTypes[b].key];else if(Object.keys(l).some(d=>l[d].isTypeFromArgument(a)?(c=l[d],f.shouldCacheTypes&&(f.cachedArgTypes[b]={type:"ref",key:d}),!0):!1),!c)throw Error(`The argument, ${a}, is not a supported type by asbind`);e.push(c.getRef(d,a));h.push(b)}});const k=c.apply(null,
e);h.forEach(a=>{d.__release(e[a])});g=void 0;if(void 0!==k){let a=void 0;f.shouldCacheTypes&&f.cachedReturnTypes[0]?"ref"===f.cachedReturnTypes[0].type&&(a=a=l[f.cachedReturnTypes[0].key]):Object.keys(l).some(b=>l[b].isTypeFromReference(d,k)?(a=l[b],f.shouldCacheTypes&&(f.cachedReturnTypes[0]={type:"ref",key:b}),!0):!1);a?g=a.getValueFromRef(d,k):"number"===typeof k&&(g=k,f.shouldCacheTypes&&(f.cachedReturnTypes[0]={type:"number"}))}return g};h.shouldCacheTypes=!0;h.cachedArgTypes=[];h.cachedReturnTypes=
[];return h}let F="undefined"!==typeof BigUint64Array,q=Symbol();var J=A,I=B;let C=["__alloc","__allocString","__retain","__release"],l={STRING:{isTypeFromArgument:a=>"string"===typeof a,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_String_ID),getRef:(a,b)=>a.__retain(a.__allocString(b)),getValueFromRef:(a,b)=>a.__getString(b)},INT8ARRAY:{isTypeFromArgument:a=>a instanceof Int8Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Int8Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Int8Array_ID,
b)),getValueFromRef:(a,b)=>a.__getInt8Array(b).slice()},UINT8ARRAY:{isTypeFromArgument:a=>a instanceof Uint8Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Uint8Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Uint8Array_ID,b)),getValueFromRef:(a,b)=>a.__getUint8Array(b).slice()},INT16ARRAY:{isTypeFromArgument:a=>a instanceof Int16Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Int16Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Int16Array_ID,b)),
getValueFromRef:(a,b)=>a.__getInt16Array(b).slice()},UINT16ARRAY:{isTypeFromArgument:a=>a instanceof Uint16Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Uint16Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Uint16Array_ID,b)),getValueFromRef:(a,b)=>a.__getUint16Array(b).slice()},INT32ARRAY:{isTypeFromArgument:a=>a instanceof Int32Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Int32Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Int32Array_ID,
b)),getValueFromRef:(a,b)=>a.__getInt32Array(b).slice()},UINT32ARRAY:{isTypeFromArgument:a=>a instanceof Uint32Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Uint32Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Uint32Array_ID,b)),getValueFromRef:(a,b)=>a.__getUint32Array(b).slice()},FLOAT32ARRAY:{isTypeFromArgument:a=>a instanceof Float32Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Float32Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Float32Array_ID,
b)),getValueFromRef:(a,b)=>a.__getFloat32Array(b).slice()},FLOAT64ARRAY:{isTypeFromArgument:a=>a instanceof Float64Array,isTypeFromReference:(a,b)=>a.__instanceof(b,a.__asbind_Float64Array_ID),getRef:(a,b)=>a.__retain(a.__allocArray(a.__asbind_Float64Array_ID,b)),getValueFromRef:(a,b)=>a.__getFloat64Array(b).slice()}},r=(a,b,d)=>{a&&Object.keys(a).forEach(c=>{"function"===typeof a[c]?d(a,b,c):"object"===typeof a[c]&&r(a[c],[...b,c],d)})};class D{constructor(){this.unboundExports={};this.exports={};
this.importObject={}}async _instantiate(a,b){this._instantiateBindImportFunctions(b);a=await H(a,this.importObject);this._instantiateBindUnboundExports(a)}_instantiateSync(a,b){this._instantiateBindImportFunctions(b);b=this.importObject;a=v(u(b||(b={})),new WebAssembly.Instance(a instanceof WebAssembly.Module?a:new WebAssembly.Module(a),b));this._instantiateBindUnboundExports(a)}_instantiateBindImportFunctions(a){this.importObject=a;r(this.importObject,[],(a,d,c)=>{a[`__asbind_unbound_${c}`]=a[c];
a[c]=L(this,this.importObject,[...d,c])})}_instantiateBindUnboundExports(a){this.unboundExports=a;this.exports={};Object.keys(this.unboundExports).forEach(a=>{var b;if(b="function"===typeof this.unboundExports[a])b=a.startsWith("__asbind")?!0:C.includes(a)?!0:!1,b=!b;this.exports[a]=b?M(this,a):this.unboundExports[a]})}enableExportFunctionTypeCaching(){Object.keys(this.exports).forEach(a=>{this.exports[a].shouldCacheTypes=!0})}disableExportFunctionTypeCaching(){Object.keys(this.exports).forEach(a=>
{this.exports[a].shouldCacheTypes=!1})}enableImportFunctionTypeCaching(){r(this.importObject,[],(a,b,d)=>{a[d].shouldCacheTypes=!0})}disableImportFunctionTypeCaching(){r(this.importObject,[],(a,b,d)=>{a[d].shouldCacheTypes=!1})}}let E={version:"0.1.4",instantiate:async(a,b)=>{let d=new D;await d._instantiate(a,b);return d},instantiateSync:(a,b)=>{let d=new D;d._instantiateSync(a,b);return d}};t.AsBind=E;t.default=E;return t}({});

},{}],"index.js":[function(require,module,exports) {
var AsBind = require("as-bind");

var initWasm = function initWasm() {
  console.log(AsBind);
  return AsBind.instantiate(fetch("untouched.wasm"));
};

var run = function run() {
  //await new Promise(resolve => window.addEventListener("load", resolve));
  initWasm().then(function (as) {
    console.log("coucou", as.exports.coucou());
  });
  /*
  document
    .getElementById("originalFile")
    .addEventListener("change", async evt => {
      const files = (evt.target as any).files;
       const imageData = await loadImage(files[0]);
      //memory.grow(imageData.data.length / 64000 * 1.5)
      //const mem = new Uint8Array(memory.buffer);
      //mem.set(imageData.data);
      const byteSize = imageData.data.length;
      console.log('--------')
      console.log('coucou', wasm.coucou());
      wasm.shrinkWidth(byteSize, imageData.width);
      //displayResultImage(imageData, mem, byteSize);
    });*/
};

run();
},{"as-bind":"../node_modules/as-bind/dist/as-bind.iife.js"}],"../node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "57558" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/src.e31bb0bc.js.map