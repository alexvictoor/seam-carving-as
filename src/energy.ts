let redData = new Uint8Array(0);
let greenData = new Uint8Array(0);
let blueData = new Uint8Array(0);

let energies: Int16Array = new Int16Array(0);

export let latestSeam: Int32Array = new Int32Array(0);

let topPadding: number = 0;

export function initEnergyPicture(
  pictureData: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const dataWidth = width + 2;
  topPadding = dataWidth;
  const dataLength = dataWidth * (height + 2) + 8;

  if (redData.length < dataLength) {
    redData = new Uint8Array(dataLength);
    greenData = new Uint8Array(dataLength);
    blueData = new Uint8Array(dataLength);
  }

  const numberOfPixels = pictureData.length >> 2;

  if (energies.length < numberOfPixels) {
    energies = new Int16Array(numberOfPixels + 8);
  }

  let srcIndex: number = 0;
  let colorIndex: number = dataWidth + 1;

  //const start = Date.now();
  for (let y: number = 0; y < height; y++) {
    for (let x: number = 0; x < width; x++) {
      redData[colorIndex] = pictureData[srcIndex];
      greenData[colorIndex] = pictureData[srcIndex + 1];
      blueData[colorIndex] = pictureData[srcIndex + 2];

      srcIndex += 4;
      colorIndex++;
    }
    colorIndex += 2;
  }
}

export function computeEnergies(
  width: number,
  height: number
): Int16Array {
  const dataWidth = width + 2;

  let colorIndex: number = topPadding + 1;

  const useLatestSeam = latestSeam.length === height;

  let ptr = 0;
  let ptrBeginLine = 0 - (width);

  let colorIndexBeginLine = topPadding + 1 - dataWidth;

  for (let y: number = 0; y < height; y++) {
    ptrBeginLine = ptrBeginLine + (width);
    ptr = ptrBeginLine;

    colorIndexBeginLine += dataWidth;
    colorIndex = colorIndexBeginLine;

    let xMin: number = 0;
    let xMax: number = width;
    if (useLatestSeam) {
      const sy = latestSeam[y];
      xMin = Math.min(Math.max(0, sy - 2), width - 8);
      xMax = Math.min(width, sy + 2);
      colorIndex = colorIndexBeginLine + xMin;
      ptr += xMin;
    }

    for (let x: number = xMin; x < xMax; x += 1, ptr += 1) {
      const topOffset = colorIndex - dataWidth;
      const belowOffset = colorIndex + dataWidth;
      const leftOffset = colorIndex - 1;
      const rightOffset = colorIndex + 1;

      //trace('offset', 4, topOffset, rightOffset, belowOffset, leftOffset);

      const energy = (
        Math.abs(redData[topOffset] - redData[belowOffset]) +
        Math.abs(redData[leftOffset] - redData[rightOffset]) +
        Math.abs(greenData[topOffset] - greenData[belowOffset]) +
        Math.abs(greenData[leftOffset] - greenData[rightOffset]) +
        Math.abs(blueData[topOffset] - blueData[belowOffset]) +
        Math.abs(blueData[leftOffset] - blueData[rightOffset]));

        
      energies[ptr] = energy;
      colorIndex += 1;
    }
  }
  //trace("ptr " + ptr.toString( + " " + energiesPtr.toString() + " " + energies.length.toString());
  return energies;
}

export function removeSeamRGB(
  seam: Int32Array,
  width: number,
  height: number
): void {
  //latestSeam = seam;

  const oldHeight = height;
  const oldWidth = width;
  const newWidth = oldWidth - 1;
  const oldPtrStep: number = (oldWidth + 2) * 1;
  const newPtrStep: number = (newWidth + 2) * 1;
  let oldPtr: number = topPadding;
  let newPtr: number = oldPtr;
  for (
    let y = 0;
    y < oldHeight;
    y++, oldPtr += oldPtrStep, newPtr += newPtrStep
  ) {
    let sy = seam[y] + 1;
    redData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    redData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    greenData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    greenData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    blueData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    blueData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
  }

  const oldEnergyPtrStep: number = oldWidth;
  const newEnergyPtrStep: number = newWidth;
  oldPtr = 0;
  newPtr = 0;

  for (
    let y = 0;
    y < oldHeight;
    y++, oldPtr += oldEnergyPtrStep, newPtr += newEnergyPtrStep
  ) {
    let sy = seam[y];
    energies.copyWithin(newPtr, oldPtr, oldPtr + sy);
    energies.copyWithin(
      newPtr + sy,
      oldPtr + sy + 1,
      oldPtr + oldEnergyPtrStep
    );
  }
}
