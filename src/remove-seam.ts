export function removeSeam(
  seam: Int32Array,
  pictureData: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {

    const result = pictureData;
    const oldHeight = Math.floor(height);
    const oldWidth =  Math.floor(width);
    const newWidth = oldWidth - 1;
    const oldPtrStep = oldWidth * 4;
    const newPtrStep = newWidth * 4;
    let oldPtr = 0;
    let newPtr = 0;
    for (
      let y = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy = seam[y] * 4;
      result.copyWithin(newPtr, oldPtr, oldPtr + sy);
      result.copyWithin(
        newPtr + sy,
        oldPtr + sy + 4,
        oldPtr + oldPtrStep
      );
    }
    return result;
}
