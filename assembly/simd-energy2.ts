let redData = new StaticArray<u8>(0);
let greenData = new StaticArray<u8>(0);
let blueData = new StaticArray<u8>(0);

let energies: StaticArray<i16> = new StaticArray<i16>(0);

export let latestSeam: StaticArray<i32> = new StaticArray<i32>(0);

let topPadding: i32 = 0;

export function initEnergyPicture(
  pictureData: Uint8Array,
  width: i32,
  height: i32,
): void {

  const dataWidth = width + 2;
  topPadding = dataWidth;
  const dataLength = dataWidth * (height + 2) + 8;

  if (redData.length < dataLength) {
    redData = new StaticArray<u8>(dataLength);
    greenData = new StaticArray<u8>(dataLength);
    blueData = new StaticArray<u8>(dataLength);
  }

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


export function computeEnergiesWithSIMD(
  width: i32,
  height: i32,
): StaticArray<i16> {

  const dataWidth = width + 2;

  let colorIndex: i32 = topPadding + 1;


  const redPtr = changetype<usize>(redData);
  const greenPtr = changetype<usize>(greenData);
  const bluePtr = changetype<usize>(blueData);

  const useLatestSeam = latestSeam.length == height;
  
  const energiesPtr = changetype<usize>(energies);
  let ptr = energiesPtr;
  let ptrBeginLine = energiesPtr - (width << 1);
  
  let colorIndexBeginLine = topPadding + 1 - dataWidth;

  const xMaxThreshold = width - 8;

  for (let y: i32 = 0; y < height; y++) {
    ptrBeginLine = ptrBeginLine + (width << 1);
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
      ptr += (xMin << 1);
    }

    for (let x: i32 = xMin; x < xMax; x += 8, ptr += 16) {
      const topOffset = colorIndex - dataWidth;
      const redTopVector = v128.load_ext<u8>(redPtr + topOffset);
      const greenTopVector = v128.load_ext<u8>(greenPtr + topOffset);
      const blueTopVector = v128.load_ext<u8>(bluePtr + topOffset);

      const belowOffset = colorIndex + dataWidth;
      const redBelowVector = v128.load_ext<u8>(redPtr + belowOffset);
      const greenBelowVector = v128.load_ext<u8>(greenPtr + belowOffset);
      const blueBelowVector = v128.load_ext<u8>(bluePtr + belowOffset);

      const leftOffset = colorIndex - 1;
      const redLeftVector = v128.load_ext<u8>(redPtr + leftOffset);
      const greenLeftVector = v128.load_ext<u8>(greenPtr + leftOffset);
      const blueLeftVector = v128.load_ext<u8>(bluePtr + leftOffset);

      const rightOffset = colorIndex + 1;
      const redRightVector = v128.load_ext<u8>(redPtr + rightOffset);
      const greenRightVector = v128.load_ext<u8>(greenPtr + rightOffset);
      const blueRightVector = v128.load_ext<u8>(bluePtr + rightOffset);

      const vDeltaRedVector = v128.abs<i16>(
        v128.sub<i16>(redTopVector, redBelowVector)
      );
      const vDeltaGreenVector = v128.abs<i16>(
        v128.sub<i16>(greenTopVector, greenBelowVector)
      );
      const vDeltaBlueVector = v128.abs<i16>(
        v128.sub<i16>(blueTopVector, blueBelowVector)
      );

      const hDeltaRedVector = v128.abs<i16>(
        v128.sub<i16>(redLeftVector, redRightVector)
      );
      const hDeltaGreenVector = v128.abs<i16>(
        v128.sub<i16>(greenLeftVector, greenRightVector)
      );
      const hDeltaBlueVector = v128.abs<i16>(
        v128.sub<i16>(blueLeftVector, blueRightVector)
      );

      const energyVector = v128.add<i16>(
        v128.add<i16>(
          v128.add<i16>(vDeltaRedVector, hDeltaRedVector),
          v128.add<i16>(vDeltaGreenVector, hDeltaGreenVector)
        ),
        v128.add<i16>(vDeltaBlueVector, hDeltaBlueVector)
      );

      //if (y < 495) {
      v128.store(ptr, energyVector);
      //} else {
      //log<string>("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());

      colorIndex += 8;
    }
  }
  //trace("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());
  return changetype<StaticArray<i16>>(energiesPtr);
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
      let y: i16 = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy: i16 = <i16>unchecked(seam[y]) + 1;
      redData.copyWithin(newPtr, oldPtr, oldPtr + sy);
      redData.copyWithin(
        newPtr + sy,
        oldPtr + sy + 1,
        oldPtr + oldPtrStep
      );
      greenData.copyWithin(newPtr, oldPtr, oldPtr + sy);
      greenData.copyWithin(
        newPtr + sy,
        oldPtr + sy + 1,
        oldPtr + oldPtrStep
      );
      blueData.copyWithin(newPtr, oldPtr, oldPtr + sy);
      blueData.copyWithin(
        newPtr + sy,
        oldPtr + sy + 1,
        oldPtr + oldPtrStep
      );
    }

    const oldEnergyPtrStep: i32 = oldWidth;
    const newEnergyPtrStep: i32 = newWidth;
    oldPtr = 0;
    newPtr = 0;

    for (
      let y: i16 = 0; y < oldHeight; y++, oldPtr += oldEnergyPtrStep, newPtr += newEnergyPtrStep
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
