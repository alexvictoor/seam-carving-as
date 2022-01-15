export function removeSeam(
  seam: StaticArray<i32>,
  pictureData: Uint8Array,
  width: i16,
  height: i16
): Uint8Array {

    const result = pictureData;
    const oldHeight = height;
    const oldWidth = width;
    const newWidth = oldWidth - 1;
    const oldPtrStep: i32 = oldWidth * 4;
    const newPtrStep: i32 = newWidth * 4;
    let oldPtr: i32 = 0;
    let newPtr: i32 = 0;
    for (
      let y: i16 = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy: i16 = <i16>unchecked(seam[y]) << 2;
      result.copyWithin(newPtr, oldPtr, oldPtr + sy);
      result.copyWithin(
        newPtr + sy,
        oldPtr + sy + (1 << 2),
        oldPtr + oldPtrStep
      );
    }
    return result;
}
