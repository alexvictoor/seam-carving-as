import { Engine } from ".";
import { findVerticalSeam } from "./find-seam";
import { removeSeam } from "./remove-seam";
import { computeEnergiesWithSIMD } from "./simd-energy";

export class SimdEngineFull implements Engine {

  private imageData: Uint8Array = new Uint8Array(0);
  private imageWidth: i32 = 0;
  private imageHeight: i32 = 0;

  private energies: StaticArray<i16> = new StaticArray<i16>(0);

  init(data: Uint8Array, width: i32): void {
    this.imageData = data;
    this.imageWidth = width;
    this.imageHeight = data.length / 4 / width;
  }
  shrink(): Uint8Array {
    const numberOfPixels = this.imageData.length >> 2;

    if (this.energies.length < numberOfPixels) {
      this.energies = new StaticArray<i16>(numberOfPixels);
    }

    this.energies = computeEnergiesWithSIMD(this.imageData, this.imageWidth, this.imageHeight, this.energies);

    const seam = findVerticalSeam(this.energies, this.imageWidth, numberOfPixels)

    this.imageData = removeSeam(
      seam,
      this.imageData,
      <i16>this.imageWidth,
      <i16>this.imageHeight
    );
    
    this.imageWidth--;

    return this.imageData;
  }



  /*
  @inline
  private weightFrom(line: StaticArray<i32>, x: i16, width: i32): i32 {
    if (x < 0 || x >= width) {
      return i32.MAX_VALUE >> 1;
    }
    return unchecked(line[x]);
  }*/


}
