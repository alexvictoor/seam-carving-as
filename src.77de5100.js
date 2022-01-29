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
})({"../node_modules/@assemblyscript/loader/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.demangle = demangle;
exports.instantiate = instantiate;
exports.instantiateStreaming = instantiateStreaming;
exports.instantiateSync = instantiateSync;
// Runtime header offsets
const ID_OFFSET = -8;
const SIZE_OFFSET = -4; // Runtime ids

const ARRAYBUFFER_ID = 0;
const STRING_ID = 1; // const ARRAYBUFFERVIEW_ID = 2;
// Runtime type information

const ARRAYBUFFERVIEW = 1 << 0;
const ARRAY = 1 << 1;
const STATICARRAY = 1 << 2; // const SET = 1 << 3;
// const MAP = 1 << 4;

const VAL_ALIGN_OFFSET = 6; // const VAL_ALIGN = 1 << VAL_ALIGN_OFFSET;

const VAL_SIGNED = 1 << 11;
const VAL_FLOAT = 1 << 12; // const VAL_NULLABLE = 1 << 13;

const VAL_MANAGED = 1 << 14; // const KEY_ALIGN_OFFSET = 15;
// const KEY_ALIGN = 1 << KEY_ALIGN_OFFSET;
// const KEY_SIGNED = 1 << 20;
// const KEY_FLOAT = 1 << 21;
// const KEY_NULLABLE = 1 << 22;
// const KEY_MANAGED = 1 << 23;
// Array(BufferView) layout

const ARRAYBUFFERVIEW_BUFFER_OFFSET = 0;
const ARRAYBUFFERVIEW_DATASTART_OFFSET = 4;
const ARRAYBUFFERVIEW_BYTELENGTH_OFFSET = 8;
const ARRAYBUFFERVIEW_SIZE = 12;
const ARRAY_LENGTH_OFFSET = 12;
const ARRAY_SIZE = 16;
const E_NO_EXPORT_TABLE = "Operation requires compiling with --exportTable";
const E_NO_EXPORT_RUNTIME = "Operation requires compiling with --exportRuntime";

const F_NO_EXPORT_RUNTIME = () => {
  throw Error(E_NO_EXPORT_RUNTIME);
};

const BIGINT = typeof BigUint64Array !== "undefined";
const THIS = Symbol();
const STRING_SMALLSIZE = 192; // break-even point in V8

const STRING_CHUNKSIZE = 1024; // mitigate stack overflow

const utf16 = new TextDecoder("utf-16le", {
  fatal: true
}); // != wtf16

/** polyfill for Object.hasOwn */

Object.hasOwn = Object.hasOwn || function (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
/** Gets a string from memory. */


function getStringImpl(buffer, ptr) {
  let len = new Uint32Array(buffer)[ptr + SIZE_OFFSET >>> 2] >>> 1;
  const wtf16 = new Uint16Array(buffer, ptr, len);
  if (len <= STRING_SMALLSIZE) return String.fromCharCode(...wtf16);

  try {
    return utf16.decode(wtf16);
  } catch {
    let str = "",
        off = 0;

    while (len - off > STRING_CHUNKSIZE) {
      str += String.fromCharCode(...wtf16.subarray(off, off += STRING_CHUNKSIZE));
    }

    return str + String.fromCharCode(...wtf16.subarray(off));
  }
}
/** Prepares the base module prior to instantiation. */


function preInstantiate(imports) {
  const extendedExports = {};

  function getString(memory, ptr) {
    if (!memory) return "<yet unknown>";
    return getStringImpl(memory.buffer, ptr);
  } // add common imports used by stdlib for convenience


  const env = imports.env = imports.env || {};

  env.abort = env.abort || function abort(msg, file, line, colm) {
    const memory = extendedExports.memory || env.memory; // prefer exported, otherwise try imported

    throw Error(`abort: ${getString(memory, msg)} at ${getString(memory, file)}:${line}:${colm}`);
  };

  env.trace = env.trace || function trace(msg, n, ...args) {
    const memory = extendedExports.memory || env.memory;
    console.log(`trace: ${getString(memory, msg)}${n ? " " : ""}${args.slice(0, n).join(", ")}`);
  };

  env.seed = env.seed || Date.now;
  imports.Math = imports.Math || Math;
  imports.Date = imports.Date || Date;
  return extendedExports;
}
/** Prepares the final module once instantiation is complete. */


function postInstantiate(extendedExports, instance) {
  const exports = instance.exports;
  const memory = exports.memory;
  const table = exports.table;

  const __new = exports.__new || F_NO_EXPORT_RUNTIME;

  const __pin = exports.__pin || F_NO_EXPORT_RUNTIME;

  const __unpin = exports.__unpin || F_NO_EXPORT_RUNTIME;

  const __collect = exports.__collect || F_NO_EXPORT_RUNTIME;

  const __rtti_base = exports.__rtti_base;
  const getRttiCount = __rtti_base ? arr => arr[__rtti_base >>> 2] : F_NO_EXPORT_RUNTIME;
  extendedExports.__new = __new;
  extendedExports.__pin = __pin;
  extendedExports.__unpin = __unpin;
  extendedExports.__collect = __collect;
  /** Gets the runtime type info for the given id. */

  function getRttInfo(id) {
    const U32 = new Uint32Array(memory.buffer);
    if ((id >>>= 0) >= getRttiCount(U32)) throw Error(`invalid id: ${id}`);
    return U32[(__rtti_base + 4 >>> 2) + (id << 1)];
  }
  /** Gets the runtime base id for the given id. */


  function getRttBase(id) {
    const U32 = new Uint32Array(memory.buffer);
    if ((id >>>= 0) >= getRttiCount(U32)) throw Error(`invalid id: ${id}`);
    return U32[(__rtti_base + 4 >>> 2) + (id << 1) + 1];
  }
  /** Gets and validate runtime type info for the given id for array like objects */


  function getArrayInfo(id) {
    const info = getRttInfo(id);
    if (!(info & (ARRAYBUFFERVIEW | ARRAY | STATICARRAY))) throw Error(`not an array: ${id}, flags=${info}`);
    return info;
  }
  /** Gets the runtime alignment of a collection's values. */


  function getValueAlign(info) {
    return 31 - Math.clz32(info >>> VAL_ALIGN_OFFSET & 31); // -1 if none
  }
  /** Gets the runtime alignment of a collection's keys. */
  // function getKeyAlign(info) {
  //   return 31 - Math.clz32((info >>> KEY_ALIGN_OFFSET) & 31); // -1 if none
  // }

  /** Allocates a new string in the module's memory and returns its pointer. */


  function __newString(str) {
    if (str == null) return 0;
    const length = str.length;

    const ptr = __new(length << 1, STRING_ID);

    const U16 = new Uint16Array(memory.buffer);

    for (var i = 0, p = ptr >>> 1; i < length; ++i) U16[p + i] = str.charCodeAt(i);

    return ptr;
  }

  extendedExports.__newString = __newString;
  /** Allocates a new ArrayBuffer in the module's memory and returns its pointer. */

  function __newArrayBuffer(buf) {
    if (buf == null) return 0;
    const bufview = new Uint8Array(buf);

    const ptr = __new(bufview.length, ARRAYBUFFER_ID);

    const U8 = new Uint8Array(memory.buffer);
    U8.set(bufview, ptr);
    return ptr;
  }

  extendedExports.__newArrayBuffer = __newArrayBuffer;
  /** Reads a string from the module's memory by its pointer. */

  function __getString(ptr) {
    if (!ptr) return null;
    const buffer = memory.buffer;
    const id = new Uint32Array(buffer)[ptr + ID_OFFSET >>> 2];
    if (id !== STRING_ID) throw Error(`not a string: ${ptr}`);
    return getStringImpl(buffer, ptr);
  }

  extendedExports.__getString = __getString;
  /** Gets the view matching the specified alignment, signedness and floatness. */

  function getView(alignLog2, signed, float) {
    const buffer = memory.buffer;

    if (float) {
      switch (alignLog2) {
        case 2:
          return new Float32Array(buffer);

        case 3:
          return new Float64Array(buffer);
      }
    } else {
      switch (alignLog2) {
        case 0:
          return new (signed ? Int8Array : Uint8Array)(buffer);

        case 1:
          return new (signed ? Int16Array : Uint16Array)(buffer);

        case 2:
          return new (signed ? Int32Array : Uint32Array)(buffer);

        case 3:
          return new (signed ? BigInt64Array : BigUint64Array)(buffer);
      }
    }

    throw Error(`unsupported align: ${alignLog2}`);
  }
  /** Allocates a new array in the module's memory and returns its pointer. */


  function __newArray(id, valuesOrCapacity = 0) {
    const input = valuesOrCapacity;
    const info = getArrayInfo(id);
    const align = getValueAlign(info);
    const isArrayLike = typeof input !== "number";
    const length = isArrayLike ? input.length : input;

    const buf = __new(length << align, info & STATICARRAY ? id : ARRAYBUFFER_ID);

    let result;

    if (info & STATICARRAY) {
      result = buf;
    } else {
      __pin(buf);

      const arr = __new(info & ARRAY ? ARRAY_SIZE : ARRAYBUFFERVIEW_SIZE, id);

      __unpin(buf);

      const U32 = new Uint32Array(memory.buffer);
      U32[arr + ARRAYBUFFERVIEW_BUFFER_OFFSET >>> 2] = buf;
      U32[arr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2] = buf;
      U32[arr + ARRAYBUFFERVIEW_BYTELENGTH_OFFSET >>> 2] = length << align;
      if (info & ARRAY) U32[arr + ARRAY_LENGTH_OFFSET >>> 2] = length;
      result = arr;
    }

    if (isArrayLike) {
      const view = getView(align, info & VAL_SIGNED, info & VAL_FLOAT);
      const start = buf >>> align;

      if (info & VAL_MANAGED) {
        for (let i = 0; i < length; ++i) {
          view[start + i] = input[i];
        }
      } else {
        view.set(input, start);
      }
    }

    return result;
  }

  extendedExports.__newArray = __newArray;
  /** Gets a live view on an array's values in the module's memory. Infers the array type from RTTI. */

  function __getArrayView(arr) {
    const U32 = new Uint32Array(memory.buffer);
    const id = U32[arr + ID_OFFSET >>> 2];
    const info = getArrayInfo(id);
    const align = getValueAlign(info);
    let buf = info & STATICARRAY ? arr : U32[arr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2];
    const length = info & ARRAY ? U32[arr + ARRAY_LENGTH_OFFSET >>> 2] : U32[buf + SIZE_OFFSET >>> 2] >>> align;
    return getView(align, info & VAL_SIGNED, info & VAL_FLOAT).subarray(buf >>>= align, buf + length);
  }

  extendedExports.__getArrayView = __getArrayView;
  /** Copies an array's values from the module's memory. Infers the array type from RTTI. */

  function __getArray(arr) {
    const input = __getArrayView(arr);

    const len = input.length;
    const out = new Array(len);

    for (let i = 0; i < len; i++) out[i] = input[i];

    return out;
  }

  extendedExports.__getArray = __getArray;
  /** Copies an ArrayBuffer's value from the module's memory. */

  function __getArrayBuffer(ptr) {
    const buffer = memory.buffer;
    const length = new Uint32Array(buffer)[ptr + SIZE_OFFSET >>> 2];
    return buffer.slice(ptr, ptr + length);
  }

  extendedExports.__getArrayBuffer = __getArrayBuffer;
  /** Gets a function from poiner which contain table's index. */

  function __getFunction(ptr) {
    if (!table) throw Error(E_NO_EXPORT_TABLE);
    const index = new Uint32Array(memory.buffer)[ptr >>> 2];
    return table.get(index);
  }

  extendedExports.__getFunction = __getFunction;
  /** Copies a typed array's values from the module's memory. */

  function getTypedArray(Type, alignLog2, ptr) {
    return new Type(getTypedArrayView(Type, alignLog2, ptr));
  }
  /** Gets a live view on a typed array's values in the module's memory. */


  function getTypedArrayView(Type, alignLog2, ptr) {
    const buffer = memory.buffer;
    const U32 = new Uint32Array(buffer);
    return new Type(buffer, U32[ptr + ARRAYBUFFERVIEW_DATASTART_OFFSET >>> 2], U32[ptr + ARRAYBUFFERVIEW_BYTELENGTH_OFFSET >>> 2] >>> alignLog2);
  }
  /** Attach a set of get TypedArray and View functions to the exports. */


  function attachTypedArrayFunctions(ctor, name, align) {
    extendedExports[`__get${name}`] = getTypedArray.bind(null, ctor, align);
    extendedExports[`__get${name}View`] = getTypedArrayView.bind(null, ctor, align);
  }

  [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array].forEach(ctor => {
    attachTypedArrayFunctions(ctor, ctor.name, 31 - Math.clz32(ctor.BYTES_PER_ELEMENT));
  });

  if (BIGINT) {
    [BigUint64Array, BigInt64Array].forEach(ctor => {
      attachTypedArrayFunctions(ctor, ctor.name.slice(3), 3);
    });
  }
  /** Tests whether an object is an instance of the class represented by the specified base id. */


  function __instanceof(ptr, baseId) {
    const U32 = new Uint32Array(memory.buffer);
    let id = U32[ptr + ID_OFFSET >>> 2];

    if (id <= getRttiCount(U32)) {
      do {
        if (id == baseId) return true;
        id = getRttBase(id);
      } while (id);
    }

    return false;
  }

  extendedExports.__instanceof = __instanceof; // Pull basic exports to extendedExports so code in preInstantiate can use them

  extendedExports.memory = extendedExports.memory || memory;
  extendedExports.table = extendedExports.table || table; // Demangle exports and provide the usual utility on the prototype

  return demangle(exports, extendedExports);
}

function isResponse(src) {
  return typeof Response !== "undefined" && src instanceof Response;
}

function isModule(src) {
  return src instanceof WebAssembly.Module;
}
/** Asynchronously instantiates an AssemblyScript module from anything that can be instantiated. */


async function instantiate(source, imports = {}) {
  if (isResponse(source = await source)) return instantiateStreaming(source, imports);
  const module = isModule(source) ? source : await WebAssembly.compile(source);
  const extended = preInstantiate(imports);
  const instance = await WebAssembly.instantiate(module, imports);
  const exports = postInstantiate(extended, instance);
  return {
    module,
    instance,
    exports
  };
}
/** Synchronously instantiates an AssemblyScript module from a WebAssembly.Module or binary buffer. */


function instantiateSync(source, imports = {}) {
  const module = isModule(source) ? source : new WebAssembly.Module(source);
  const extended = preInstantiate(imports);
  const instance = new WebAssembly.Instance(module, imports);
  const exports = postInstantiate(extended, instance);
  return {
    module,
    instance,
    exports
  };
}
/** Asynchronously instantiates an AssemblyScript module from a response, i.e. as obtained by `fetch`. */


async function instantiateStreaming(source, imports = {}) {
  if (!WebAssembly.instantiateStreaming) {
    return instantiate(isResponse(source = await source) ? source.arrayBuffer() : source, imports);
  }

  const extended = preInstantiate(imports);
  const result = await WebAssembly.instantiateStreaming(source, imports);
  const exports = postInstantiate(extended, result.instance);
  return { ...result,
    exports
  };
}
/** Demangles an AssemblyScript module's exports to a friendly object structure. */


function demangle(exports, extendedExports = {}) {
  const setArgumentsLength = exports["__argumentsLength"] ? length => {
    exports["__argumentsLength"].value = length;
  } : exports["__setArgumentsLength"] || exports["__setargc"] || (() => {
    /* nop */
  });

  for (let internalName of Object.keys(exports)) {
    const elem = exports[internalName];
    let parts = internalName.split(".");
    let curr = extendedExports;

    while (parts.length > 1) {
      let part = parts.shift();
      if (!Object.hasOwn(curr, part)) curr[part] = {};
      curr = curr[part];
    }

    let name = parts[0];
    let hash = name.indexOf("#");

    if (hash >= 0) {
      const className = name.substring(0, hash);
      const classElem = curr[className];

      if (typeof classElem === "undefined" || !classElem.prototype) {
        const ctor = function (...args) {
          return ctor.wrap(ctor.prototype.constructor(0, ...args));
        };

        ctor.prototype = {
          valueOf() {
            return this[THIS];
          }

        };

        ctor.wrap = function (thisValue) {
          return Object.create(ctor.prototype, {
            [THIS]: {
              value: thisValue,
              writable: false
            }
          });
        };

        if (classElem) Object.getOwnPropertyNames(classElem).forEach(name => Object.defineProperty(ctor, name, Object.getOwnPropertyDescriptor(classElem, name)));
        curr[className] = ctor;
      }

      name = name.substring(hash + 1);
      curr = curr[className].prototype;

      if (/^(get|set):/.test(name)) {
        if (!Object.hasOwn(curr, name = name.substring(4))) {
          let getter = exports[internalName.replace("set:", "get:")];
          let setter = exports[internalName.replace("get:", "set:")];
          Object.defineProperty(curr, name, {
            get() {
              return getter(this[THIS]);
            },

            set(value) {
              setter(this[THIS], value);
            },

            enumerable: true
          });
        }
      } else {
        if (name === 'constructor') {
          (curr[name] = function (...args) {
            setArgumentsLength(args.length);
            return elem(...args);
          }).original = elem;
        } else {
          // instance method
          (curr[name] = function (...args) {
            // !
            setArgumentsLength(args.length);
            return elem(this[THIS], ...args);
          }).original = elem;
        }
      }
    } else {
      if (/^(get|set):/.test(name)) {
        if (!Object.hasOwn(curr, name = name.substring(4))) {
          Object.defineProperty(curr, name, {
            get: exports[internalName.replace("set:", "get:")],
            set: exports[internalName.replace("get:", "set:")],
            enumerable: true
          });
        }
      } else if (typeof elem === "function" && elem !== setArgumentsLength) {
        (curr[name] = (...args) => {
          setArgumentsLength(args.length);
          return elem(...args);
        }).original = elem;
      } else {
        curr[name] = elem;
      }
    }
  }

  return extendedExports;
}

var _default = {
  instantiate,
  instantiateSync,
  instantiateStreaming,
  demangle
};
exports.default = _default;
},{}],"find-seam.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findVerticalSeam = void 0;
var backPtrWeights = new Int8Array(0);
var i32_MAX_VALUE = Math.pow(2, 31) - 1;

function findVerticalSeam(energies, imageWidth, imageHeight, numberOfPixels) {
  if (backPtrWeights.length < numberOfPixels) {
    backPtrWeights = new Int8Array(numberOfPixels);
  }

  var weightIndex = imageWidth;
  var padding = new Int32Array([i32_MAX_VALUE]);
  var previousLineWeights = new Int32Array(imageWidth + 2);
  previousLineWeights[0] = i32_MAX_VALUE;
  previousLineWeights[imageWidth + 1] = i32_MAX_VALUE;
  previousLineWeights.set(energies.slice(0, imageWidth), 1);
  var currentLineWeights = new Int32Array(imageWidth + 2); // border padding

  currentLineWeights[0] = i32_MAX_VALUE;
  currentLineWeights[imageWidth + 1] = i32_MAX_VALUE;

  for (var j = 1; j < imageHeight; j++) {
    for (var i = 1; i <= imageWidth; i++, weightIndex++) {
      cumulateWeights(i, weightIndex, currentLineWeights, previousLineWeights, energies);
    }

    var swapTmp = currentLineWeights;
    currentLineWeights = previousLineWeights;
    previousLineWeights = swapTmp;
  } // find index of last seam pixel


  var lastIndex = 0;
  var lastIndexWeight = i32_MAX_VALUE;

  for (var i = 1; i <= imageWidth; i++) {
    var weight = currentLineWeights[i];

    if (weight < lastIndexWeight) {
      lastIndex = i - 1; // remove padding

      lastIndexWeight = weight;
    }
  }

  var weights = backPtrWeights;
  var seam = new Int32Array(imageHeight);
  seam[imageHeight - 1] = lastIndex; //trace('seam', 2, imageHeight - 1, lastIndex);

  for (var i = imageHeight - 2; i + 1 > 0; i--) {
    var next = seam[i + 1];
    seam[i] = next + weights[next + (i + 1) * imageWidth]; //trace('seam', 2, i, seam[i]);
  }

  return seam;
}

exports.findVerticalSeam = findVerticalSeam;

function cumulateWeights(x, ptr, currentLineWeights, previousLineWeights, energies) {
  var weight = previousLineWeights[x];
  var aboveXDelta = 0;
  var weightLeft = previousLineWeights[x - 1];

  if (weightLeft < weight) {
    /*if (this.forwardEnergy) {
      trace("weightLeft < weight", 2, weightLeft, weight;
    }*/
    weight = weightLeft;
    aboveXDelta = -1;
  }

  var weightRight = previousLineWeights[x + 1];

  if (weightRight < weight) {
    weight = weightRight;
    aboveXDelta = 1;
  } //trace("blabla", 2, ptr, this.backPtrWeights.length)


  backPtrWeights[ptr] = aboveXDelta; //trace("blabla 2")

  currentLineWeights[x] = energies[ptr] + weight;
}
},{}],"energy.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeSeamRGB = exports.computeEnergies = exports.initEnergyPicture = exports.latestSeam = void 0;
var redData = new Uint8Array(0);
var greenData = new Uint8Array(0);
var blueData = new Uint8Array(0);
var energies = new Int16Array(0);
exports.latestSeam = new Int32Array(0);
var topPadding = 0;

function initEnergyPicture(pictureData, width, height) {
  var dataWidth = width + 2;
  topPadding = dataWidth;
  var dataLength = dataWidth * (height + 2) + 8;

  if (redData.length < dataLength) {
    redData = new Uint8Array(dataLength);
    greenData = new Uint8Array(dataLength);
    blueData = new Uint8Array(dataLength);
  }

  var numberOfPixels = pictureData.length >> 2;

  if (energies.length < numberOfPixels) {
    energies = new Int16Array(numberOfPixels + 8);
  }

  var srcIndex = 0;
  var colorIndex = dataWidth + 1; //const start = Date.now();

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      redData[colorIndex] = pictureData[srcIndex];
      greenData[colorIndex] = pictureData[srcIndex + 1];
      blueData[colorIndex] = pictureData[srcIndex + 2];
      srcIndex += 4;
      colorIndex++;
    }

    colorIndex += 2;
  }
}

exports.initEnergyPicture = initEnergyPicture;

function computeEnergies(width, height) {
  var dataWidth = width + 2;
  var colorIndex = topPadding + 1;
  var useLatestSeam = exports.latestSeam.length === height;
  var ptr = 0;
  var ptrBeginLine = 0 - width;
  var colorIndexBeginLine = topPadding + 1 - dataWidth;

  for (var y = 0; y < height; y++) {
    ptrBeginLine = ptrBeginLine + width;
    ptr = ptrBeginLine;
    colorIndexBeginLine += dataWidth;
    colorIndex = colorIndexBeginLine;
    var xMin = 0;
    var xMax = width;

    if (useLatestSeam) {
      var sy = exports.latestSeam[y];
      xMin = Math.min(Math.max(0, sy - 2), width - 8);
      xMax = Math.min(width, sy + 2);
      colorIndex = colorIndexBeginLine + xMin;
      ptr += xMin;
    }

    for (var x = xMin; x < xMax; x += 1, ptr += 1) {
      var topOffset = colorIndex - dataWidth;
      var belowOffset = colorIndex + dataWidth;
      var leftOffset = colorIndex - 1;
      var rightOffset = colorIndex + 1; //trace('offset', 4, topOffset, rightOffset, belowOffset, leftOffset);

      var energy = Math.abs(redData[topOffset] - redData[belowOffset]) + Math.abs(redData[leftOffset] - redData[rightOffset]) + Math.abs(greenData[topOffset] - greenData[belowOffset]) + Math.abs(greenData[leftOffset] - greenData[rightOffset]) + Math.abs(blueData[topOffset] - blueData[belowOffset]) + Math.abs(blueData[leftOffset] - blueData[rightOffset]);
      energies[ptr] = energy;
      colorIndex += 1;
    }
  } //trace("ptr " + ptr.toString( + " " + energiesPtr.toString() + " " + energies.length.toString());


  return energies;
}

exports.computeEnergies = computeEnergies;

function removeSeamRGB(seam, width, height) {
  //latestSeam = seam;
  var oldHeight = height;
  var oldWidth = width;
  var newWidth = oldWidth - 1;
  var oldPtrStep = (oldWidth + 2) * 1;
  var newPtrStep = (newWidth + 2) * 1;
  var oldPtr = topPadding;
  var newPtr = oldPtr;

  for (var y = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep) {
    var sy = seam[y] + 1;
    redData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    redData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    greenData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    greenData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    blueData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    blueData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
  }

  var oldEnergyPtrStep = oldWidth;
  var newEnergyPtrStep = newWidth;
  oldPtr = 0;
  newPtr = 0;

  for (var y = 0; y < oldHeight; y++, oldPtr += oldEnergyPtrStep, newPtr += newEnergyPtrStep) {
    var sy = seam[y];
    energies.copyWithin(newPtr, oldPtr, oldPtr + sy);
    energies.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldEnergyPtrStep);
  }
}

exports.removeSeamRGB = removeSeamRGB;
},{}],"remove-seam.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeSeam = void 0;

function removeSeam(seam, pictureData, width, height) {
  var result = pictureData;
  var oldHeight = Math.floor(height);
  var oldWidth = Math.floor(width);
  var newWidth = oldWidth - 1;
  var oldPtrStep = oldWidth * 4;
  var newPtrStep = newWidth * 4;
  var oldPtr = 0;
  var newPtr = 0;

  for (var y = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep) {
    var sy = seam[y] * 4;
    result.copyWithin(newPtr, oldPtr, oldPtr + sy);
    result.copyWithin(newPtr + sy, oldPtr + sy + 4, oldPtr + oldPtrStep);
  }

  return result;
}

exports.removeSeam = removeSeam;
},{}],"engine.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RegularEngine = void 0;

var find_seam_1 = require("./find-seam");

var energy_1 = require("./energy");

var remove_seam_1 = require("./remove-seam");

var RegularEngine =
/** @class */
function () {
  function RegularEngine() {
    this.imageData = new Uint8ClampedArray(0);
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.energies = new Int16Array(0);
    /*
    @inline
    private weightFrom(line: StaticArray<number>, x: i16, width: number): number {
      if (x < 0 || x >= width) {
        return i32.MAX_VALUE >> 1;
      }
      return unchecked(line[x]);
    }*/
  }

  RegularEngine.prototype.init = function (data, width) {
    this.imageData = data;
    this.imageWidth = width;
    this.imageHeight = data.length / 4 / width;
    energy_1.initEnergyPicture(data, this.imageWidth, this.imageHeight);
  };

  RegularEngine.prototype.shrink = function () {
    var numberOfPixels = this.imageData.length / 4;

    if (this.energies.length < numberOfPixels) {
      this.energies = new Int16Array(numberOfPixels + 8);
    }

    for (var index = 0; index < 10; index++) {
      this.energies = energy_1.computeEnergies(this.imageWidth, this.imageHeight); //console.log({energies: this.energies})

      var seam = find_seam_1.findVerticalSeam(this.energies, this.imageWidth, this.imageHeight, numberOfPixels); //log<string>("eng2 " + seam[0].toString());

      this.imageData = remove_seam_1.removeSeam(seam, this.imageData, this.imageWidth, this.imageHeight);
      energy_1.removeSeamRGB(seam, this.imageWidth, this.imageHeight);
      this.imageWidth--;
    }

    return this.imageData;
  };

  return RegularEngine;
}();

exports.RegularEngine = RegularEngine;
},{"./find-seam":"find-seam.ts","./energy":"energy.ts","./remove-seam":"remove-seam.ts"}],"seam-carving.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shrinkImage = exports.shrinkWidthWithForwardEnergy = exports.shrinkWidth = void 0;

var engine_1 = require("./engine");

var currentImageData;
var currentWidth;
var engine = new engine_1.RegularEngine();

function shrinkWidth(srcImage, width) {
  /*currentImageData = srcImage;
  currentWidth = width;
  Seam.create(currentImageData, currentWidth);*/
  //return shrinkImage();
  engine.init(srcImage, width);
  return engine.shrink();
}

exports.shrinkWidth = shrinkWidth;

function shrinkWidthWithForwardEnergy(srcImage, width) {
  currentImageData = srcImage;
  currentWidth = width;
  Seam.createWithForwardEnergy(currentImageData, currentWidth); //return shrinkImage();
}

exports.shrinkWidthWithForwardEnergy = shrinkWidthWithForwardEnergy;

function shrinkImage() {
  /*const seam = Seam.recycle(currentImageData, currentWidth);
  currentImageData = seam.shrinkWidth();
  currentWidth--;
  return currentImageData;*/
  return engine.shrink();
}

exports.shrinkImage = shrinkImage;

var Color =
/** @class */
function () {
  function Color(data, ptr) {
    this.data = data;
    this.ptr = ptr;
  }

  Object.defineProperty(Color.prototype, "red", {
    get: function get() {
      return this.data[this.ptr];
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Color.prototype, "green", {
    get: function get() {
      return this.data[this.ptr + 1];
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Color.prototype, "blue", {
    get: function get() {
      return this.data[this.ptr + 2];
    },
    enumerable: false,
    configurable: true
  });

  Color.prototype.move = function (ptr) {
    this.ptr = ptr;
    return this;
  };

  return Color;
}();

var whiteData = new Uint8ClampedArray(3);
whiteData[0] = 0xFF;
whiteData[1] = 0xFF;
whiteData[2] = 0xFF;
var WHITE = new Color(whiteData, 0);

function delta(first, second) {
  var deltaRed = first.red - second.red;
  var deltaGreen = first.green - second.green;
  var deltaBlue = first.blue - second.blue;
  return deltaBlue * deltaBlue + deltaGreen * deltaGreen + deltaRed * deltaRed;
}

var Picture =
/** @class */
function () {
  function Picture(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
    this.firstColor = new Color(data, 0);
    this.secondColor = new Color(data, 0);
  }

  Picture.prototype.toPtr = function (x, y) {
    return x + y * this.width << 2;
  };

  Picture.prototype.getColorAt = function (x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }

    return new Color(this.data, this.toPtr(x, y));
  };

  Picture.prototype.isOut = function (x, y) {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  };

  Picture.prototype.energyAt = function (x, y) {
    var northColor = this.isOut(x, y - 1) ? WHITE : this.northColor.move(this.toPtr(x, y - 1));
    var southColor = this.isOut(x, y + 1) ? WHITE : this.southColor.move(this.toPtr(x, y + 1));
    var westColor = this.isOut(x - 1, y) ? WHITE : this.westColor.move(this.toPtr(x - 1, y));
    var eastColor = this.isOut(x + 1, y) ? WHITE : this.eastColor.move(this.toPtr(x + 1, y));
    return delta(northColor, southColor) + delta(eastColor, westColor);
  };

  Picture.prototype.energyDelta = function (x1, y1, x2, y2) {
    var firstColor = this.isOut(x1, y1) ? WHITE : this.firstColor.move(this.toPtr(x1, y1));
    var secondColor = this.isOut(x2, y2) ? WHITE : this.secondColor.move(this.toPtr(x2, y2));
    return delta(firstColor, secondColor);
  };

  return Picture;
}();

var Seam =
/** @class */
function () {
  function Seam(data, width, forwardEnergy) {
    this.data = data;
    this.width = width;
    this.forwardEnergy = forwardEnergy;
    this.init(data, width);
  }

  Seam.create = function (data, width) {
    Seam.instance = new Seam(data, width, false);
    return Seam.instance;
  };

  Seam.createWithForwardEnergy = function (data, width) {
    Seam.instance = new Seam(data, width, true);
    return Seam.instance;
  };

  Seam.recycle = function (data, width) {
    Seam.instance.init(data, width);
    return Seam.instance;
  };

  Seam.prototype.init = function (data, width) {
    this.picture = new Picture(data, width, data.length / (width * 4));

    if (this.forwardEnergy) {
      this.backPtrWeights = new Int8Array(data.length >> 2);
      this.oddLineWeights = new Float32Array(this.width);
      this.evenLineWeights = new Float32Array(this.width);
    } else {
      this.initEnergies();
    }
  };

  Seam.prototype.initEnergies = function () {
    var energies = this.energies;
    var size = this.data.length >> 2;

    if (!energies || energies.length < size) {
      energies = new Float32Array(size);
      this.backPtrWeights = new Int8Array(size);
      this.oddLineWeights = new Float32Array(this.width);
      this.evenLineWeights = new Float32Array(this.width);
    }

    var picture = this.picture;

    for (var y = 0, w = 0, height = picture.height; y < height; y++) {
      for (var x = 0, width = picture.width; x < width; x++, w++) {
        energies[w] = picture.energyAt(x, y);
      }
    }

    this.energies = energies;
  };

  Seam.prototype.weightFrom = function (line, x, width) {
    if (x < 0 || x >= width) {
      return Number.MAX_VALUE;
    }

    return line[x];
  };

  Seam.prototype.cumulateWeights = function (x, ptr, width, currentLineWeights, previousLineWeights) {
    var weight = this.weightFrom(previousLineWeights, x, width);
    var aboveXDelta = 0;
    var weightLeft = this.weightFrom(previousLineWeights, x - 1, width);

    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    }

    var weightRight = this.weightFrom(previousLineWeights, x + 1, width);

    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }

    this.backPtrWeights[ptr] = aboveXDelta;
    currentLineWeights[x] = this.energies[ptr] + weight;
  };

  Seam.prototype.findVerticalSeamWithoutForwardEnergy = function () {
    var picture = this.picture;
    var height = Math.floor(picture.height);
    var width = Math.floor(picture.width);
    var weightIndex = width;
    var previousLineWeights = this.evenLineWeights;
    var currentLineWeights = this.oddLineWeights;
    previousLineWeights.set(this.energies.subarray(0, width));

    for (var j = 1; j < height; j++) {
      for (var i = 0; i < width; i++, weightIndex++) {
        this.cumulateWeights(i, weightIndex, width, currentLineWeights, previousLineWeights);
      }

      var swapTmp = currentLineWeights;
      currentLineWeights = previousLineWeights;
      previousLineWeights = swapTmp;
    } // find index of last seam pixel


    var lastIndex = 0;
    var lastIndexWeight = Number.MAX_VALUE;

    for (var i = 0; i < width; i++) {
      var weight = currentLineWeights[i];

      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    var weights = this.backPtrWeights;
    var seam = new Array(height);
    seam[height - 1] = lastIndex;

    for (var i = height - 2; i + 1 > 0; i--) {
      var next = seam[i + 1];
      var w = next + weights[next + (i + 1) * width];
      seam[i] = w;
    }

    return seam;
  }; //


  Seam.prototype.cumulateWeightsWithForwardEnergy = function (x, y, ptr, currentLineWeights, previousLineWeights) {
    //trace("cumulateWeightsWithForwardEnergy", 1, x);
    //trace("cumulateWeightsWithForwardEnergy", 1, y);
    var picture = this.picture;
    var width = picture.width;
    var costCenter = picture.energyDelta(x - 1, y, x + 1, y);
    var costLeft = costCenter + picture.energyDelta(x, y - 1, x - 1, y);
    var costRight = costCenter + picture.energyDelta(x, y - 1, x + 1, y); //trace("energyDelta", 1, costLeft);

    var weight = this.weightFrom(previousLineWeights, x, width) + costCenter;
    var aboveXDelta = 0;
    var weightLeft = this.weightFrom(previousLineWeights, x - 1, width) + costLeft;

    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    } //trace("energyDelta left", 1, costLeft);


    var weightRight = this.weightFrom(previousLineWeights, x + 1, width) + costRight;

    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    } //trace("energyDelta right", 1, costLeft);


    this.backPtrWeights[ptr] = aboveXDelta; //trace("backPtrWeights", 1, costLeft);

    currentLineWeights[x] = weight;
  };

  Seam.prototype.findVerticalSeamWithForwardEnergy = function () {
    var picture = this.picture;
    var height = Math.floor(picture.height);
    var width = Math.floor(picture.width);
    var weightIndex = width;
    this.evenLineWeights.fill(0);
    var previousLineWeights = this.evenLineWeights;
    var currentLineWeights = this.oddLineWeights;

    for (var j = 1; j < height; j++) {
      for (var i = 0; i < width; i++, weightIndex++) {
        //trace("i j", 1, j);
        this.cumulateWeightsWithForwardEnergy(i, j, weightIndex, currentLineWeights, previousLineWeights);
      }

      var swapTmp = currentLineWeights;
      currentLineWeights = previousLineWeights;
      previousLineWeights = swapTmp;
    } // find index of last seam pixel


    var lastIndex = 0;
    var lastIndexWeight = Number.MAX_VALUE;

    for (var i = 0; i < width; i++) {
      var weight = currentLineWeights[i];

      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    var weights = this.backPtrWeights;
    var seam = new Array(height);
    seam[height - 1] = lastIndex;

    for (var i = height - 2; i + 1 > 0; i--) {
      var next = seam[i + 1];
      var w = next + weights[next + (i + 1) * width];
      seam[i] = w;
    }

    return seam;
  };

  Seam.prototype.findVerticalSeam = function () {
    if (this.forwardEnergy) {
      return this.findVerticalSeamWithForwardEnergy();
    }

    return this.findVerticalSeamWithoutForwardEnergy();
  };

  Seam.prototype.shrinkWidth = function () {
    var seam = this.findVerticalSeam();
    this.seam = seam;
    var picture = this.picture;
    var result = picture.data;
    var oldHeight = Math.floor(picture.height);
    var oldWidth = Math.floor(picture.width);
    var newWidth = oldWidth - 1;
    var oldPtrStep = oldWidth * 4;
    var newPtrStep = newWidth * 4;
    var oldPtr = 0;
    var newPtr = 0;

    for (var y = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep) {
      var sy = seam[y] * 4;
      result.copyWithin(newPtr, oldPtr, oldPtr + sy);
      result.copyWithin(newPtr + sy, oldPtr + sy + (1 << 2), oldPtr + oldPtrStep);
    }

    return result;
  };

  return Seam;
}();
},{"./engine":"engine.ts"}],"index.js.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.jsShrinkByHalf = void 0;

var seam_carving_1 = require("./seam-carving"); //
// OffscreenCanvas polyfill
// https://gist.github.com/n1ru4l/9c7eff52fe084d67ff15ae6b0af5f171
//


if (!window.OffscreenCanvas) {
  window.OffscreenCanvas =
  /** @class */
  function () {
    function OffscreenCanvas(width, height) {
      var _this = this;

      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;

      this.canvas.convertToBlob = function () {
        return new Promise(function (resolve) {
          _this.canvas.toBlob(resolve);
        });
      };

      return this.canvas;
    }

    return OffscreenCanvas;
  }();
}

var dataUrl2ImageData = function dataUrl2ImageData(url) {
  return new Promise(function (resolve) {
    var newimage = new Image();
    newimage.src = url;

    newimage.onload = function () {
      var canvas = new OffscreenCanvas(newimage.width, newimage.height);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(newimage, 0, 0);
      resolve(ctx.getImageData(0, 0, newimage.width, newimage.height));
    };
  });
};

var loadImage = function loadImage(file) {
  return new Promise(function (resolve) {
    var reader = new FileReader();

    reader.onload = function (event) {
      var imageData = dataUrl2ImageData(event.currentTarget.result);
      resolve(imageData);
    };

    reader.readAsDataURL(file);
  });
};

var nextFrame = undefined;

var displayResultImage = function displayResultImage(imageData, wasmMemoryArray) {
  var resultCanvas = document.getElementById("canvas");
  var width = imageData.width - 10;
  var height = imageData.height;
  resultCanvas.width = width;
  resultCanvas.height = height;
  var resultCtx = resultCanvas.getContext("2d");
  var resultImageData = resultCtx.createImageData(width, height);
  resultImageData.data.set(wasmMemoryArray.subarray(0, width * height * 4));
  resultCtx.putImageData(resultImageData, 0, 0);
  return resultImageData;
};

var shrinkByHalf = function shrinkByHalf(imageData) {
  if (nextFrame) {
    cancelAnimationFrame(nextFrame);
  }

  var originalWidth = imageData.width;
  /*const ptrArr = wasm.__retain(
    wasm.__allocArray(wasm.UINT8ARRAY_ID, imageData.data)
  );
  const resultPtr = fwdEnergy
    ? wasm.shrinkWidthWithForwardEnergy(ptrArr, originalWidth)
    : wasm.shrinkWidth(ptrArr, originalWidth);
  const resultArray = wasm.__getUint8Array(resultPtr);
  imageData = displayResultImage(imageData, resultArray);
  wasm.__release(ptrArr);
  wasm.__release(resultPtr);*/

  var dataCopy = new Uint8ClampedArray(imageData.data);
  /*const result = fwdEnergy
  ? shrinkWidthWithForwardEnergy(dataCopy, originalWidth)
  : shrinkWidth(dataCopy, originalWidth);*/

  var result = seam_carving_1.shrinkWidth(dataCopy, originalWidth);
  imageData = displayResultImage(imageData, result);
  var frameDelta = 0;
  var canvasCaption = document.getElementById("canvasCaption");
  var start = Date.now();

  var shrink = function shrink(n) {
    var shrinkOneSeam = function shrinkOneSeam() {
      var result = seam_carving_1.shrinkImage();
      imageData = displayResultImage(imageData, result);
      frameDelta += 10;
      var processingTime = Date.now() - start;
      canvasCaption.innerHTML = "Width reduced by " + frameDelta + "px after " + processingTime + "ms";

      if (frameDelta < n) {
        nextFrame = requestAnimationFrame(shrinkOneSeam);
      }
    };

    nextFrame = requestAnimationFrame(shrinkOneSeam);
  };

  shrink(originalWidth / 2);
};
/*
const run = async () => {
  await new Promise((resolve) => window.addEventListener("load", resolve));


  let imageData: ImageData;
  let fwdEnergyFlag = false;

  fetch("surfer-web.jpg")
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const arrayBufferView = new Uint8Array(buffer);
      const blob = new Blob([arrayBufferView], { type: "image/jpeg" });
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      return dataUrl2ImageData(imageUrl);
    })
    .then((data) => {
      imageData = data;
      shrinkByHalf(imageData, fwdEnergyFlag);
    });

  document
    .getElementById("originalFile")
    .addEventListener("change", async (evt) => {
      const files = (evt.target as any).files;

      imageData = await loadImage(files[0]);
      shrinkByHalf(imageData, fwdEnergyFlag);
    });

  document
    .getElementById("algo-classic")
    .addEventListener("click", () => {
      fwdEnergyFlag = false;
      shrinkByHalf(imageData, fwdEnergyFlag);
    });
  document.getElementById("algo-fwd").addEventListener("click", () => {
    fwdEnergyFlag = true;
    shrinkByHalf(imageData, fwdEnergyFlag);
  });
};
run();*/


exports.jsShrinkByHalf = shrinkByHalf;
},{"./seam-carving":"seam-carving.ts"}],"index.ts":[function(require,module,exports) {
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var loader_1 = __importDefault(require("@assemblyscript/loader"));

var index_js_1 = require("./index.js"); //
// OffscreenCanvas polyfill
// https://gist.github.com/n1ru4l/9c7eff52fe084d67ff15ae6b0af5f171
//


if (!window.OffscreenCanvas) {
  window.OffscreenCanvas =
  /** @class */
  function () {
    function OffscreenCanvas(width, height) {
      var _this = this;

      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;

      this.canvas.convertToBlob = function () {
        return new Promise(function (resolve) {
          _this.canvas.toBlob(resolve);
        });
      };

      return this.canvas;
    }

    return OffscreenCanvas;
  }();
}

var initWasm = function initWasm() {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4
          /*yield*/
          , loader_1.default.instantiate(fetch("optimized.wasm"))];

        case 1:
          return [2
          /*return*/
          , _a.sent()];
      }
    });
  });
};

var dataUrl2ImageData = function dataUrl2ImageData(url) {
  return new Promise(function (resolve) {
    var newimage = new Image();
    newimage.src = url;

    newimage.onload = function () {
      var canvas = new OffscreenCanvas(newimage.width, newimage.height);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(newimage, 0, 0);
      resolve(ctx.getImageData(0, 0, newimage.width, newimage.height));
    };
  });
};

var loadImage = function loadImage(file) {
  return new Promise(function (resolve) {
    var reader = new FileReader();

    reader.onload = function (event) {
      var imageData = dataUrl2ImageData(event.currentTarget.result);
      resolve(imageData);
    };

    reader.readAsDataURL(file);
  });
};

var nextFrame = undefined;

var displayResultImage = function displayResultImage(imageData, wasmMemoryArray) {
  var resultCanvas = document.getElementById("canvas");
  var width = imageData.width - 10;
  var height = imageData.height;
  resultCanvas.width = width;
  resultCanvas.height = height;
  var resultCtx = resultCanvas.getContext("2d");
  var resultImageData = resultCtx.createImageData(width, height);
  resultImageData.data.set(wasmMemoryArray.subarray(0, width * height * 4));
  resultCtx.putImageData(resultImageData, 0, 0);
  return resultImageData;
};

var asShrinkByHalf = function asShrinkByHalf(imageData, wasm, useSimd) {
  if (nextFrame) {
    cancelAnimationFrame(nextFrame);
  }

  var originalWidth = imageData.width;
  var _a = wasm.exports,
      __pin = _a.__pin,
      __unpin = _a.__unpin,
      __newArray = _a.__newArray,
      __getArray = _a.__getArray,
      __getArrayView = _a.__getArrayView,
      __getUint8ArrayView = _a.__getUint8ArrayView,
      UINT8ARRAY_ID = _a.UINT8ARRAY_ID,
      shrinkWidthWithForwardEnergy = _a.shrinkWidthWithForwardEnergy,
      shrinkWidth = _a.shrinkWidth;

  var ptrArr = __pin(__newArray(UINT8ARRAY_ID, imageData.data));

  var resultPtr = useSimd ? shrinkWidth(ptrArr, originalWidth, true) : shrinkWidth(ptrArr, originalWidth, false);

  var resultArray = __getUint8ArrayView(resultPtr);

  imageData = displayResultImage(imageData, resultArray);

  __unpin(ptrArr); //__unpin(resultPtr);


  var frameDelta = 0;
  var canvasCaption = document.getElementById("canvasCaption");
  var start = Date.now();

  var shrink = function shrink(n) {
    var shrinkOneSeam = function shrinkOneSeam() {
      var resultPtr = wasm.exports.shrink();

      var resultArray = __getUint8ArrayView(resultPtr);

      imageData = displayResultImage(imageData, resultArray); //__unpin(resultPtr);

      frameDelta += 10;
      var processingTime = Date.now() - start;
      canvasCaption.innerHTML = "Width reduced by " + frameDelta + "px after " + processingTime + "ms";

      if (frameDelta < n) {
        nextFrame = requestAnimationFrame(shrinkOneSeam);
      }
    };

    nextFrame = requestAnimationFrame(shrinkOneSeam);
  };

  shrink(originalWidth / 2);
};

var run = function run() {
  return __awaiter(void 0, void 0, void 0, function () {
    var wasm, imageData, useWasmFlag, useSimdFlag, shrinkByHalf;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4
          /*yield*/
          , new Promise(function (resolve) {
            return window.addEventListener("load", resolve);
          })];

        case 1:
          _a.sent();

          return [4
          /*yield*/
          , initWasm()];

        case 2:
          wasm = _a.sent();
          console.log(wasm);
          useWasmFlag = false;
          useSimdFlag = false;

          shrinkByHalf = function shrinkByHalf(imageData) {
            if (useWasmFlag) {
              asShrinkByHalf(imageData, wasm, useSimdFlag);
            } else {
              index_js_1.jsShrinkByHalf(imageData);
            }
          };

          fetch("surfer-web.jpg").then(function (response) {
            return response.arrayBuffer();
          }).then(function (buffer) {
            var arrayBufferView = new Uint8Array(buffer);
            var blob = new Blob([arrayBufferView], {
              type: "image/jpeg"
            });
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(blob);
            return dataUrl2ImageData(imageUrl);
          }).then(function (data) {
            imageData = data;
            shrinkByHalf(imageData);
          });
          document.getElementById("originalFile").addEventListener("change", function (evt) {
            return __awaiter(void 0, void 0, void 0, function () {
              var files;
              return __generator(this, function (_a) {
                switch (_a.label) {
                  case 0:
                    files = evt.target.files;
                    return [4
                    /*yield*/
                    , loadImage(files[0])];

                  case 1:
                    imageData = _a.sent();
                    shrinkByHalf(imageData);
                    return [2
                    /*return*/
                    ];
                }
              });
            });
          });
          document.getElementById("implem-js").addEventListener("click", function () {
            useWasmFlag = false;
            useSimdFlag = false;
            shrinkByHalf(imageData);
          });
          document.getElementById("implem-as").addEventListener("click", function () {
            useWasmFlag = true;
            useSimdFlag = false;
            shrinkByHalf(imageData);
          });
          document.getElementById("implem-as-simd").addEventListener("click", function () {
            useWasmFlag = true;
            useSimdFlag = true;
            shrinkByHalf(imageData);
          });
          return [2
          /*return*/
          ];
      }
    });
  });
};

run();
},{"@assemblyscript/loader":"../node_modules/@assemblyscript/loader/index.js","./index.js":"index.js.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "49608" + '/');

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
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.ts"], null)
//# sourceMappingURL=/src.77de5100.js.map