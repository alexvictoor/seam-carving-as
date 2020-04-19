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

const dataUrl2ImageData = (url: string): Promise<ImageData> =>
  new Promise((resolve) => {
    const newimage = new Image();
    newimage.src = url;
    newimage.onload = () => {
      const canvas = new OffscreenCanvas(newimage.width, newimage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(newimage, 0, 0);
      const imageData = ctx.getImageData(0, 0, newimage.width, newimage.height);
      resolve(imageData);
    };
  });

const loadImage = (file: any): Promise<ImageData> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = dataUrl2ImageData((event.currentTarget as any).result);
      resolve(imageData);
    };
    reader.readAsDataURL(file);
  });

let nextFrame: number | void = undefined;

const displayResultImage = (
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

const shrinkByHalf = (imageData: ImageData, wasm: any, fwdEnergy: boolean) => {
  if (nextFrame) {
    cancelAnimationFrame(nextFrame);
  }

  const originalWidth = imageData.width;

  const ptrArr = wasm.__retain(
    wasm.__allocArray(wasm.UINT8ARRAY_ID, imageData.data)
  );
  const resultPtr = fwdEnergy
    ? wasm.shrinkWidthWithForwardEnergy(ptrArr, imageData.width)
    : wasm.shrinkWidth(ptrArr, imageData.width);
  const resultArray = wasm.__getUint8Array(resultPtr);
  imageData = displayResultImage(imageData, resultArray);
  wasm.__release(ptrArr);
  wasm.__release(resultPtr);

  const animationState = {
    frame: 0,
  };
  const shrink = (n: number) => {
    const shrinkOneSeam = () => {
      const resultPtr = wasm.shrink();
      const resultArray = wasm.__getUint8Array(resultPtr);
      imageData = displayResultImage(imageData, resultArray);
      wasm.__release(resultPtr);
      animationState.frame = animationState.frame + 1;
      document.getElementById(
        "canvasCaption"
      ).innerHTML = `Width reduced by ${animationState.frame}px`;
      if (animationState.frame < n) {
        nextFrame = requestAnimationFrame(shrinkOneSeam);
      }
    };
    nextFrame = requestAnimationFrame(shrinkOneSeam);
  };

  shrink(originalWidth / 2);
};

const run = async () => {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const wasm = (await initWasm()) as any;

  console.log("coucou", wasm.coucou());

  let imageData: ImageData = undefined;
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
      shrinkByHalf(imageData, wasm, fwdEnergyFlag);
    });

  document
    .getElementById("originalFile")
    .addEventListener("change", async (evt) => {
      const files = (evt.target as any).files;

      imageData = await loadImage(files[0]);
      shrinkByHalf(imageData, wasm, fwdEnergyFlag);
    });

  document
    .getElementById("algo-classic")
    .addEventListener("click", async (evt) => {
      fwdEnergyFlag = false;
      shrinkByHalf(imageData, wasm, fwdEnergyFlag);
    });
  document.getElementById("algo-fwd").addEventListener("click", async (evt) => {
    fwdEnergyFlag = true;
    shrinkByHalf(imageData, wasm, fwdEnergyFlag);
  });
};
run();
