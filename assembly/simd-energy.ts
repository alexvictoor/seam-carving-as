let redData = new StaticArray<u8>(0);
let greenData = new StaticArray<u8>(0);
let blueData = new StaticArray<u8>(0);

export function computeEnergiesWithSIMD(
  pictureData: Uint8Array,
  width: i32,
  height: i32,
  energies: StaticArray<i16>
): StaticArray<i16> {

  const dataWidth = width + 2;
  const dataLength = dataWidth * (height + 2) + 8;

  if (redData.length < dataLength) {
    redData = new StaticArray<u8>(dataLength);
    greenData = new StaticArray<u8>(dataLength);
    blueData = new StaticArray<u8>(dataLength);
  }

  let srcIndex: i32 = 0;
  let dstIndex: i32 = dataWidth + 1;

  const start = Date.now();
  for (let y: i32 = 0; y < height; y++) {
    for (let x: i32 = 0; x < width; x++) {
      unchecked((redData[dstIndex] = pictureData[srcIndex]));
      unchecked((greenData[dstIndex] = pictureData[srcIndex + 1]));
      unchecked((blueData[dstIndex] = pictureData[srcIndex + 2]));

      srcIndex += 4;
      dstIndex++;
    }
    dstIndex += 2;
  }
  const time = <f64>(Date.now() - start);
  //trace("Init color", 1, time);

  const redPtr = changetype<usize>(redData);
  const greenPtr = changetype<usize>(greenData);
  const bluePtr = changetype<usize>(blueData);

  dstIndex = dataWidth + 1;

  const energiesPtr = changetype<usize>(energies);
  let ptr = energiesPtr;
  let ptrBeginLine = energiesPtr - (width << 1);

  for (let y: i32 = 0; y < height; y++) {
    ptrBeginLine = ptrBeginLine + (width << 1);
    ptr = ptrBeginLine;

    for (let x: i32 = 0; x < width; x += 8, ptr += 16) {
      const topOffset = dstIndex - dataWidth;
      const redTopVector = v128.load_ext<u8>(redPtr + topOffset);
      const greenTopVector = v128.load_ext<u8>(greenPtr + topOffset);
      const blueTopVector = v128.load_ext<u8>(bluePtr + topOffset);

      const belowOffset = dstIndex + dataWidth;
      const redBelowVector = v128.load_ext<u8>(redPtr + belowOffset);
      const greenBelowVector = v128.load_ext<u8>(greenPtr + belowOffset);
      const blueBelowVector = v128.load_ext<u8>(bluePtr + belowOffset);

      const leftOffset = dstIndex - 1;
      const redLeftVector = v128.load_ext<u8>(redPtr + leftOffset);
      const greenLeftVector = v128.load_ext<u8>(greenPtr + leftOffset);
      const blueLeftVector = v128.load_ext<u8>(bluePtr + leftOffset);

      const rightOffset = dstIndex + 1;
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

      dstIndex += 8;
    }
    dstIndex += 2;
  }
  //trace("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());
  return changetype<StaticArray<i16>>(energiesPtr);
}
