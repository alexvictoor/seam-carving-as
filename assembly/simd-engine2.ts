import { Engine } from ".";
import { findVerticalSeam } from "./find-seam";
import { removeSeam } from "./remove-seam";
import { initEnergyPicture, removeSeamRGB, computeEnergiesWithSIMD } from "./simd-energy2";

export class SimdEngine implements Engine {

  private imageData: Uint8Array = new Uint8Array(0);
  private imageWidth: i32 = 0;
  private imageHeight: i32 = 0;

  init(data: Uint8Array, width: i32): void {
    this.imageData = data;
    this.imageWidth = width;
    this.imageHeight = data.length / 4 / width;
    initEnergyPicture(data, this.imageWidth, this.imageHeight);
  }
  shrink(): Uint8Array {
    const numberOfPixels = this.imageData.length >> 2;


    const energies = computeEnergiesWithSIMD(this.imageWidth, this.imageHeight);

    const seam = findVerticalSeam(energies, this.imageWidth, numberOfPixels);

    //log<string>("eng2 " + seam[0].toString());

    this.imageData = removeSeam(
      seam,
      this.imageData,
      <i16>this.imageWidth,
      <i16>this.imageHeight
    );

    removeSeamRGB(seam, <i16>this.imageWidth,
      <i16>this.imageHeight);

    
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
