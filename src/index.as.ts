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
  const width = imageData.width - 10;
  const height = imageData.height;
  resultCanvas.width = width;
  resultCanvas.height = height;
  const resultCtx = resultCanvas.getContext("2d");
  const resultImageData = resultCtx.createImageData(width, height);
  resultImageData.data.set(wasmMemoryArray.subarray(0, width * height * 4));
  resultCtx.putImageData(resultImageData, 0, 0);
  return resultImageData;
};

const shrinkByHalf = (imageData: ImageData, wasm: any, useSimd: boolean) => {
  if (nextFrame) {
    cancelAnimationFrame(nextFrame);
  }

  const originalWidth = imageData.width;

  const { __pin, __unpin, __newArray, __getArray, __getArrayView, __getUint8ArrayView, UINT8ARRAY_ID, shrinkWidthWithForwardEnergy, shrinkWidth } = wasm.exports

  const ptrArr = __pin(
    __newArray(UINT8ARRAY_ID, imageData.data)
  );

  const resultPtr = useSimd
    ? shrinkWidth(ptrArr, originalWidth, true)
    : shrinkWidth(ptrArr, originalWidth, false);
  const resultArray = __getUint8ArrayView(resultPtr);
  imageData = displayResultImage(imageData, resultArray);
  __unpin(ptrArr);
  //__unpin(resultPtr);

  let frameDelta = 0;
  const canvasCaption = document.getElementById("canvasCaption");
  const start = Date.now();

  const shrink = (n: number) => {
    const shrinkOneSeam = () => {
      const resultPtr = wasm.exports.shrink();
      const resultArray = __getUint8ArrayView(resultPtr);
      imageData = displayResultImage(imageData, resultArray);
      //__unpin(resultPtr);
      frameDelta += 10;
      canvasCaption.innerHTML = `Width reduced by ${frameDelta}px`;
      if (frameDelta < n) {
        nextFrame = requestAnimationFrame(shrinkOneSeam);
      } else {
        console.log((Date.now() - start) + 'ms')
      }
    };
    nextFrame = requestAnimationFrame(shrinkOneSeam);
  };

  shrink(originalWidth / 2);
};

const run = async () => {
  await new Promise((resolve) => window.addEventListener("load", resolve));

  const wasm = (await initWasm()) as any;
  console.log(wasm)

  let imageData: ImageData;
  let useSimdFlag = false;

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
      shrinkByHalf(imageData, wasm, useSimdFlag);
    });

  document
    .getElementById("originalFile")
    .addEventListener("change", async (evt) => {
      const files = (evt.target as any).files;

      imageData = await loadImage(files[0]);
      shrinkByHalf(imageData, wasm, useSimdFlag);
    });

  document
    .getElementById("algo-as")
    .addEventListener("click", () => {
      useSimdFlag = false;
      shrinkByHalf(imageData, wasm, useSimdFlag);
    });
  document.getElementById("algo-as-simd").addEventListener("click", () => {
    useSimdFlag = true;
    shrinkByHalf(imageData, wasm, useSimdFlag);
  });
};
run();
