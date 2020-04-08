import loader from "@assemblyscript/loader";

console.log(loader);

const initWasm = async () => {
  const initial = 1;
  const memory = new WebAssembly.Memory({ initial });

  let logRef = { log: console.log };

  const importObject = {
    env: {
      memory,
      abort: () => console.log("Abort!"),
      trace: (msg: any, nb: number, value: number) => logRef.log(msg, value),
    },
  };

  const myModule = await loader.instantiate(
    fetch("optimized.wasm"),
    importObject
  );
  logRef.log = (msg: any, value: number) =>
    console.log(myModule.__getString(msg), value);
  console.log(myModule);
  return myModule;
};

const initWasmOld = async () => {
  const initial = 1;
  const memory = new WebAssembly.Memory({ initial });
  const importObject = {
    env: {
      memory,
      abort: () => console.log("Abort!"),
      trace: (msg: any, nb: number, value: number) => console.log(msg, value),
    },
  };
  //const wasmResponse = await fetch("optimized.wasm");
  const wasmResponse = await fetch("optimized.wasm");
  const wasmBuffer = await wasmResponse.arrayBuffer();
  const wasmInstance = await WebAssembly.instantiate(wasmBuffer, importObject);
  return { wasm: wasmInstance.instance.exports as any, memory };
};

const loadImage = (file: any): Promise<ImageData> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const newimage = new Image();
      newimage.src = (event.currentTarget as any).result;
      newimage.onload = () => {
        const canvas = new OffscreenCanvas(newimage.width, newimage.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(newimage, 0, 0);
        const imageData = ctx.getImageData(
          0,
          0,
          newimage.width,
          newimage.height
        );
        resolve(imageData);
      };
    };
    reader.readAsDataURL(file);
  });

const displayResultImage = (
  imageData: ImageData,
  wasmMemoryArray: Uint8Array,
  originalImageByteSize: number
) => {
  const resultCanvas: HTMLCanvasElement = document.getElementById(
    "canvas"
  ) as any;
  resultCanvas.width = imageData.width;
  resultCanvas.height = imageData.height;
  const resultCtx = resultCanvas.getContext("2d");
  const resultImageData = resultCtx.createImageData(imageData);
  resultImageData.data.set(
    wasmMemoryArray.subarray(originalImageByteSize, originalImageByteSize * 2)
  );
  resultCtx.putImageData(resultImageData, 0, 0);
};

const displayResultImage2 = (
  imageData: ImageData,
  wasmMemoryArray: Uint8Array
) => {
  const resultCanvas: HTMLCanvasElement = document.getElementById(
    "canvas"
  ) as any;
  resultCanvas.width = imageData.width - 1;
  resultCanvas.height = imageData.height;
  const resultCtx = resultCanvas.getContext("2d");
  const resultImageData = resultCtx.createImageData(
    resultCanvas.width,
    resultCanvas.height
  );
  resultImageData.data.set(
    wasmMemoryArray.subarray(0, resultCanvas.width * resultCanvas.height * 4)
  );
  resultCtx.putImageData(resultImageData, 0, 0);
  return resultImageData;
};

const displayResultImage100 = (
  imageData: ImageData,
  wasmMemoryArray: Uint8Array
) => {
  const resultCanvas: HTMLCanvasElement = document.getElementById(
    "canvas"
  ) as any;
  resultCanvas.width = imageData.width - 100;
  resultCanvas.height = imageData.height;
  const resultCtx = resultCanvas.getContext("2d");
  const resultImageData = resultCtx.createImageData(
    resultCanvas.width,
    resultCanvas.height
  );
  resultImageData.data.set(
    wasmMemoryArray.subarray(0, resultCanvas.width * resultCanvas.height * 4)
  );
  resultCtx.putImageData(resultImageData, 0, 0);
  return resultImageData;
};

const run = async () => {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const wasm = (await initWasm()) as any;

  console.log("coucou", wasm.coucou());
  //var ptrArr = wasm.__retain(wasm.__allocArray(wasm.UINT32ARRAY_ID, [1, 2, 0]));
  //console.log({ ptrArr });

  document
    .getElementById("originalFile")
    .addEventListener("change", async (evt) => {
      const files = (evt.target as any).files;

      let imageData = await loadImage(files[0]);
      // https://stackoverflow.com/questions/60255133/whats-the-correct-way-to-share-memory-between-my-assemblyscript-module-and-my-j
      //memory.grow(imageData.data.length / 64000 * 1.5)
      //const mem = new Uint8Array(memory.buffer);
      //mem.set(imageData.data);
      console.log("--------");
      console.log("coucou", wasm.coucou());

      const ptrArr = wasm.__retain(
        wasm.__allocArray(wasm.UINT8ARRAY_ID, imageData.data)
      );
      //console.log({ ptrArr, width: imageData.width });
      const resultPtr = wasm.shrinkWidth(ptrArr, imageData.width);
      const resultArray = wasm.__getUint8Array(resultPtr);
      //console.log({ resultArray });
      //resultArray.fill(42);
      //imageData.data.fill(0);
      imageData = displayResultImage2(imageData, resultArray);
      wasm.__release(ptrArr);
      wasm.__release(resultPtr);
      //wasm.shrinkWidth(byteSize, imageData.width);
      const start = Date.now();
      for (let i = 0; i < 2; i++) {
        const resultPtr = wasm.shrink100();
        const resultArray = wasm.__getUint8Array(resultPtr);
        imageData = displayResultImage100(imageData, resultArray);
        wasm.__release(resultPtr);
      }
      console.log((Date.now() - start) / 200);
    });
};
run();
