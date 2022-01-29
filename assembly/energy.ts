let redData = new StaticArray<u8>(0);
let greenData = new StaticArray<u8>(0);
let blueData = new StaticArray<u8>(0);

let energies: StaticArray<i16> = new StaticArray<i16>(0);

export let latestSeam: StaticArray<i32> = new StaticArray<i32>(0);

let topPadding: i32 = 0;

export function initEnergyPicture(
  pictureData: Uint8Array,
  width: i32,
  height: i32
): void {
  const dataWidth = width + 2;
  topPadding = dataWidth;
  const dataLength = dataWidth * (height + 2) + 8;

  redData = new StaticArray<u8>(dataLength);
  greenData = new StaticArray<u8>(dataLength);
  blueData = new StaticArray<u8>(dataLength);

  latestSeam = new StaticArray<i32>(0);

  const numberOfPixels = pictureData.length >> 2;

  if (energies.length < numberOfPixels) {
    energies = new StaticArray<i16>(numberOfPixels + 8);
  }

  let srcIndex: i32 = 0;
  let colorIndex: i32 = dataWidth + 1;

  //const start = Date.now();
  for (let y: i32 = 0; y < height; y++) {
    for (let x: i32 = 0; x < width; x++) {
      unchecked((redData[colorIndex] = pictureData[srcIndex]));
      unchecked((greenData[colorIndex] = pictureData[srcIndex + 1]));
      unchecked((blueData[colorIndex] = pictureData[srcIndex + 2]));

      srcIndex += 4;
      colorIndex++;
    }
    colorIndex += 2;
  }
}

export function computeEnergies(width: i32, height: i32): StaticArray<i16> {
  const dataWidth = width + 2;

  let colorIndex: i32 = topPadding + 1;

  const useLatestSeam = latestSeam.length == height;

  let ptr = 0;
  let ptrBeginLine = 0 - width;

  let colorIndexBeginLine = topPadding + 1 - dataWidth;

  for (let y: i32 = 0; y < height; y++) {
    ptrBeginLine = ptrBeginLine + width;
    ptr = ptrBeginLine;

    colorIndexBeginLine += dataWidth;
    colorIndex = colorIndexBeginLine;

    let xMin: i32 = 0;
    let xMax: i32 = width;
    if (useLatestSeam) {
      const sy = latestSeam[y];
      xMin = <i32>Math.min(<i32>Math.max(0, sy - 2), width - 8);
      xMax = <i32>Math.min(width, sy + 2);
      colorIndex = colorIndexBeginLine + xMin;
      ptr += xMin;
    }

    for (let x: i32 = xMin; x < xMax; x += 1, ptr += 1) {
      const topOffset = colorIndex - dataWidth;
      const belowOffset = colorIndex + dataWidth;
      const leftOffset = colorIndex - 1;
      const rightOffset = colorIndex + 1;

      //trace('offset', 4, topOffset, rightOffset, belowOffset, leftOffset);

      const energy =
        <i32>(
          Math.abs(
            <i16>unchecked(redData[topOffset]) -
              <i16>unchecked(redData[belowOffset])
          )
        ) +
        <i32>(
          Math.abs(
            <i16>unchecked(redData[leftOffset]) -
              <i16>unchecked(redData[rightOffset])
          )
        ) +
        <i32>(
          Math.abs(
            <i16>unchecked(greenData[topOffset]) -
              <i16>unchecked(greenData[belowOffset])
          )
        ) +
        <i32>(
          Math.abs(
            <i16>unchecked(greenData[leftOffset]) -
              <i16>unchecked(greenData[rightOffset])
          )
        ) +
        <i32>(
          Math.abs(
            <i16>unchecked(blueData[topOffset]) -
              <i16>unchecked(blueData[belowOffset])
          )
        ) +
        <i32>(
          Math.abs(
            <i16>unchecked(blueData[leftOffset]) -
              <i16>unchecked(blueData[rightOffset])
          )
        );

      unchecked((energies[ptr] = <i16>energy));
      colorIndex += 1;
    }
  }
  //trace("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());
  return energies;
}

export function removeSeamRGB(
  seam: StaticArray<i32>,
  width: i16,
  height: i16
): void {
  latestSeam = seam;

  const oldHeight = height;
  const oldWidth = width;
  const newWidth = oldWidth - 1;
  const oldPtrStep: i32 = (oldWidth + 2) * 1;
  const newPtrStep: i32 = (newWidth + 2) * 1;
  let oldPtr: i32 = topPadding;
  let newPtr: i32 = oldPtr;
  for (
    let y: i16 = 0;
    y < oldHeight;
    y++, oldPtr += oldPtrStep, newPtr += newPtrStep
  ) {
    let sy: i16 = <i16>unchecked(seam[y]) + 1;
    redData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    redData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    greenData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    greenData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
    blueData.copyWithin(newPtr, oldPtr, oldPtr + sy);
    blueData.copyWithin(newPtr + sy, oldPtr + sy + 1, oldPtr + oldPtrStep);
  }

  const oldEnergyPtrStep: i32 = oldWidth;
  const newEnergyPtrStep: i32 = newWidth;
  oldPtr = 0;
  newPtr = 0;

  for (
    let y: i16 = 0;
    y < oldHeight;
    y++, oldPtr += oldEnergyPtrStep, newPtr += newEnergyPtrStep
  ) {
    let sy: i16 = <i16>unchecked(seam[y]);
    energies.copyWithin(newPtr, oldPtr, oldPtr + sy);
    energies.copyWithin(
      newPtr + sy,
      oldPtr + sy + 1,
      oldPtr + oldEnergyPtrStep
    );
  }
}
