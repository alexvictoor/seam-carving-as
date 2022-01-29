import { Engine } from "./seam-carving";
import { findVerticalSeam } from "./find-seam";
import { computeEnergies, initEnergyPicture, removeSeamRGB } from "./energy";
import { removeSeam } from "./remove-seam";

export class RegularEngine implements Engine {

  private imageData: Uint8ClampedArray = new Uint8ClampedArray(0);
  private imageWidth: number = 0;
  private imageHeight: number = 0;

  private energies: Int16Array = new Int16Array(0);

  init(data: Uint8ClampedArray, width: number): void {
    this.imageData = data;
    this.imageWidth = width;
    this.imageHeight = data.length / 4 / width;
    initEnergyPicture(data, this.imageWidth, this.imageHeight);
  }
  shrink(): Uint8ClampedArray {
    const numberOfPixels = this.imageData.length / 4;

    if (this.energies.length < numberOfPixels) {
      this.energies = new Int16Array(numberOfPixels + 8);
    }

    for (let index = 0; index < 10; index++) {
      
    this.energies = computeEnergies(this.imageWidth, this.imageHeight);

    //console.log({energies: this.energies})

    const seam = findVerticalSeam(this.energies, this.imageWidth, this.imageHeight, numberOfPixels);

    //log<string>("eng2 " + seam[0].toString());

    this.imageData = removeSeam(
      seam,
      this.imageData,
      this.imageWidth,
      this.imageHeight
    );

    removeSeamRGB(seam, this.imageWidth,
      this.imageHeight);

    
    this.imageWidth--;
    }

    return this.imageData;
  }



  /*
  @inline
  private weightFrom(line: StaticArray<number>, x: i16, width: number): number {
    if (x < 0 || x >= width) {
      return i32.MAX_VALUE >> 1;
    }
    return unchecked(line[x]);
  }*/


}
