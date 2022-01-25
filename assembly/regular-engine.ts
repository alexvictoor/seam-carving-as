import { Engine } from ".";
import { findVerticalSeam } from "./find-seam";
import { computeEnergies, initEnergyPicture, removeSeamRGB } from "./energy";
import { removeSeam } from "./remove-seam";

export class RegularEngine implements Engine {

  private imageData: Uint8Array = new Uint8Array(0);
  private imageWidth: i32 = 0;
  private imageHeight: i32 = 0;

  private energies: StaticArray<i16> = new StaticArray<i16>(0);

  init(data: Uint8Array, width: i32): void {
    this.imageData = data;
    this.imageWidth = width;
    this.imageHeight = data.length / 4 / width;
    initEnergyPicture(data, this.imageWidth, this.imageHeight);
  }
  shrink(): Uint8Array {
    const numberOfPixels = this.imageData.length >> 2;

    if (this.energies.length < numberOfPixels) {
      this.energies = new StaticArray<i16>(numberOfPixels + 8);
    }

    this.energies = computeEnergies(this.imageWidth, this.imageHeight);

    const seam = findVerticalSeam(this.energies, this.imageWidth, numberOfPixels);

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
