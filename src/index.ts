import loader from "@assemblyscript/loader";

//
// OffscreenCanvas polyfill
// https://gist.github.com/n1ru4l/9c7eff52fe084d67ff15ae6b0af5f171
//
if (!window.OffscreenCanvas) {
  (window as any).OffscreenCanvas = class OffscreenCanvas {
    canvas: any;
    constructor(width: number, height: number) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.convertToBlob = () => new Promise((resolve) => { this.canvas.toBlob(resolve) });
      return this.canvas;
    }
  };
}

const initWasm = async () => await loader.instantiate(fetch("optimized.wasm"));

const dataUrl2ImageData = (url: string): Promise<ImageData> =>
  new Promise((resolve) => {
    const newimage = new Image();
    newimage.src = url;
    newimage.onload = () => {
      const canvas = new OffscreenCanvas(newimage.width, newimage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(newimage, 0, 0);
      resolve(ctx.getImageData(0, 0, newimage.width, newimage.height));
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
  const resultCanvas = document.getElementById("canvas") as HTMLCanvasElement;
  const width = imageData.width - 1;
  const height = imageData.height;
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resultCtx = resultCanvas.getContext("2d");
  const resultImageData = resultCtx.createImageData(width, height);
  resultImageData.data.set(wasmMemoryArray.subarray(0, width * height * 4));
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
    ? wasm.shrinkWidthWithForwardEnergy(ptrArr, originalWidth)
    : wasm.shrinkWidth(ptrArr, originalWidth);
  const resultArray = wasm.__getUint8Array(resultPtr);
  imageData = displayResultImage(imageData, resultArray);
  wasm.__release(ptrArr);
  wasm.__release(resultPtr);

  let frameDelta = 0;
  const canvasCaption = document.getElementById("canvasCaption");

  const shrink = (n: number) => {
    const shrinkOneSeam = () => {
      const resultPtr = wasm.shrink();
      const resultArray = wasm.__getUint8Array(resultPtr);
      imageData = displayResultImage(imageData, resultArray);
      wasm.__release(resultPtr);
      canvasCaption.innerHTML = `Width reduced by ${frameDelta++}px`;
      if (frameDelta < n) {
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
    .addEventListener("click", () => {
      fwdEnergyFlag = false;
      shrinkByHalf(imageData, wasm, fwdEnergyFlag);
    });
  document.getElementById("algo-fwd").addEventListener("click", () => {
    fwdEnergyFlag = true;
    shrinkByHalf(imageData, wasm, fwdEnergyFlag);
  });
};
run();
