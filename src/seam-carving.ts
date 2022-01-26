import { RegularEngine } from "./engine";


let currentImageData: Uint8ClampedArray;
let currentWidth: number;

export interface Engine {
  init(data: Uint8ClampedArray, width: number): void,
  shrink(): Uint8ClampedArray
}


let engine: Engine = new RegularEngine();

export function shrinkWidth(srcImage: Uint8ClampedArray, width: number) {
  /*currentImageData = srcImage;
  currentWidth = width;
  Seam.create(currentImageData, currentWidth);*/
  //return shrinkImage();

  engine.init(srcImage, width);
  return engine.shrink();
}
export function shrinkWidthWithForwardEnergy(
  srcImage: Uint8ClampedArray,
  width: number
) {
  currentImageData = srcImage;
  currentWidth = width;
  Seam.createWithForwardEnergy(currentImageData, currentWidth);
  //return shrinkImage();
}

export function shrinkImage(): Uint8ClampedArray {
  /*const seam = Seam.recycle(currentImageData, currentWidth);
  currentImageData = seam.shrinkWidth();
  currentWidth--;
  return currentImageData;*/
  return engine.shrink();
}

class Color {
   constructor(
    private data: Uint8ClampedArray,
    private ptr: number
  ) {}

  
  get red(): number {
    return this.data[this.ptr];
  }

  
  get green(): number {
    return this.data[this.ptr + 1];
  }

  
  get blue(): number {
    return this.data[this.ptr + 2];
  }

  
  move(ptr: number): Color {
    this.ptr = ptr;
    return this;
  }
}

const whiteData = new Uint8ClampedArray(3);
whiteData[0] = 0xFF;
whiteData[1] = 0xFF;
whiteData[2] = 0xFF;
const WHITE = new Color(whiteData, 0);


function delta(first: Color, second: Color) {
  const deltaRed = first.red - second.red;
  const deltaGreen = first.green - second.green;
  const deltaBlue = first.blue - second.blue;

  return deltaBlue * deltaBlue + deltaGreen * deltaGreen + deltaRed * deltaRed;
}

class Picture {
  northColor: Color;
  southColor: Color;
  westColor: Color;
  eastColor: Color;
  firstColor: Color;
  secondColor: Color;

  constructor(
    public data: Uint8ClampedArray,
    public width: number,
    public height: number
  ) {
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
    this.firstColor = new Color(data, 0);
    this.secondColor = new Color(data, 0);
  }

  
  toPtr(x: number, y: number): number {
    return (x + y * this.width) << 2;
  }

  getColorAt(x: number, y: number): Color {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }
    return new Color(this.data, this.toPtr(x, y));
  }

  
  isOut(x: number, y: number) {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  
  energyAt(x: number, y: number): number {
    const northColor = this.isOut(x, y - 1)
      ? WHITE
      : this.northColor.move(this.toPtr(x, y - 1));
    const southColor = this.isOut(x, y + 1)
      ? WHITE
      : this.southColor.move(this.toPtr(x, y + 1));
    const westColor = this.isOut(x - 1, y)
      ? WHITE
      : this.westColor.move(this.toPtr(x - 1, y));
    const eastColor = this.isOut(x + 1, y)
      ? WHITE
      : this.eastColor.move(this.toPtr(x + 1, y));

    return delta(northColor, southColor) + delta(eastColor, westColor);
  }

  
  energyDelta(x1: number, y1: number, x2: number, y2: number): number {
    const firstColor = this.isOut(x1, y1)
      ? WHITE
      : this.firstColor.move(this.toPtr(x1, y1));
    const secondColor = this.isOut(x2, y2)
      ? WHITE
      : this.secondColor.move(this.toPtr(x2, y2));

    return delta(firstColor, secondColor);
  }
}

class Seam {
  static instance: Seam;

  picture: Picture;
  energies: Float32Array;
  backPtrWeights: Int8Array;
  oddLineWeights: Float32Array;
  evenLineWeights: Float32Array;
  seam: number[];

  public static create(data: Uint8ClampedArray, width: number): Seam {
    Seam.instance = new Seam(data, width, false);
    return Seam.instance;
  }

  public static createWithForwardEnergy(data: Uint8ClampedArray, width: number): Seam {
    Seam.instance = new Seam(data, width, true);
    return Seam.instance;
  }

  public static recycle(data: Uint8ClampedArray, width: number): Seam {
    Seam.instance.init(data, width);
    return Seam.instance;
  }

  constructor(
    private data: Uint8ClampedArray,
    private width: number,
    private forwardEnergy: boolean
  ) {
    this.init(data, width);
  }

  private init(data: Uint8ClampedArray, width: number): void {
    this.picture = new Picture(data, width, data.length / (width * 4));
    if (this.forwardEnergy) {
      this.backPtrWeights = new Int8Array(data.length >> 2);
      this.oddLineWeights = new Float32Array(this.width);
      this.evenLineWeights = new Float32Array(this.width);
    } else {
      this.initEnergies();
    }
  }

  private initEnergies(): void {
    let energies = this.energies;
    const size = this.data.length >> 2;
    if (!energies || energies.length < size) {
      energies = new Float32Array(size);
      this.backPtrWeights = new Int8Array(size);
      this.oddLineWeights = new Float32Array(this.width);
      this.evenLineWeights = new Float32Array(this.width);
    }
    const picture = this.picture;
    for (let y: number = 0, w = 0, height = picture.height; y < height; y++) {
      for (let x: number = 0, width = picture.width; x < width; x++, w++) {
        energies[w] = picture.energyAt(x, y);
      }
    }

    this.energies = energies;
  }

  
  private weightFrom(line: Float32Array, x: number, width: number): number {
    if (x < 0 || x >= width) {
      return Number.MAX_VALUE;
    }
    return line[x];
  }

  
  private cumulateWeights(
    x: number,
    ptr: number,
    width: number,
    currentLineWeights: Float32Array,
    previousLineWeights: Float32Array
  ): void {
    let weight = this.weightFrom(previousLineWeights, x, width);
    let aboveXDelta: number = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1, width);
    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    }
    const weightRight = this.weightFrom(previousLineWeights, x + 1, width);
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }

    this.backPtrWeights[ptr] = aboveXDelta;
    currentLineWeights[x] = this.energies[ptr] + weight;
  }

  private findVerticalSeamWithoutForwardEnergy(): number[] {
    const picture = this.picture;
    const height = Math.floor(picture.height);
    const width = Math.floor(picture.width);
    let weightIndex = width;
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    previousLineWeights.set(this.energies.subarray(0, width));
    for (let j: number = 1; j < height; j++) {
      for (let i: number = 0; i < width; i++, weightIndex++) {
        this.cumulateWeights(
          i,
          weightIndex,
          width,
          currentLineWeights,
          previousLineWeights
        );
      }
      let swapTmp = currentLineWeights;
      currentLineWeights = previousLineWeights;
      previousLineWeights = swapTmp;
    }

    // find index of last seam pixel
    let lastIndex = 0;
    let lastIndexWeight = Number.MAX_VALUE;

    for (let i: number = 0; i < width; i++) {
      let weight = currentLineWeights[i];
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new Array(height);
    seam[height - 1] = lastIndex;
    for (let i = height - 2; i + 1 > 0; i--) {
      let next = seam[i + 1];
      let w = next + weights[next + (i + 1) * width];
      seam[i] = w;
    }

    return seam;
  }

  //
  private cumulateWeightsWithForwardEnergy(
    x: number,
    y: number,
    ptr: number,
    currentLineWeights: Float32Array,
    previousLineWeights: Float32Array
  ): void {
    //trace("cumulateWeightsWithForwardEnergy", 1, x);
    //trace("cumulateWeightsWithForwardEnergy", 1, y);
    const picture = this.picture;
    const width = picture.width;
    const costCenter = picture.energyDelta(x - 1, y, x + 1, y);
    const costLeft = costCenter + picture.energyDelta(x, y - 1, x - 1, y);
    const costRight = costCenter + picture.energyDelta(x, y - 1, x + 1, y);
    //trace("energyDelta", 1, costLeft);

    let weight = this.weightFrom(previousLineWeights, x, width) + costCenter;
    let aboveXDelta: number = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1, width) + costLeft;
    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    }
    //trace("energyDelta left", 1, costLeft);
    const weightRight = this.weightFrom(previousLineWeights, x + 1, width) + costRight;
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }
    //trace("energyDelta right", 1, costLeft);

    this.backPtrWeights[ptr] = aboveXDelta;
    //trace("backPtrWeights", 1, costLeft);

    currentLineWeights[x] = weight;
  }

  private findVerticalSeamWithForwardEnergy(): number[] {
    const picture = this.picture;
    const height = Math.floor(picture.height);
    const width = Math.floor(picture.width);
    let weightIndex = width;
    this.evenLineWeights.fill(0);
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    for (let j: number = 1; j < height; j++) {
      for (let i: number = 0; i < width; i++, weightIndex++) {
        //trace("i j", 1, j);
        this.cumulateWeightsWithForwardEnergy(
          i,
          j,
          weightIndex,
          currentLineWeights,
          previousLineWeights
        );
      }
      let swapTmp = currentLineWeights;
      currentLineWeights = previousLineWeights;
      previousLineWeights = swapTmp;
    }

    // find index of last seam pixel
    let lastIndex = 0;
    let lastIndexWeight = Number.MAX_VALUE;

    for (let i: number = 0; i < width; i++) {
      let weight = currentLineWeights[i];
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new Array<number>(height);
    seam[height - 1] = lastIndex;
    for (let i: number = height - 2; i + 1 > 0; i--) {
      let next = seam[i + 1];
      let w = next + weights[next + (i + 1) * width];
      seam[i] = w;
    }

    return seam;
  }

  private findVerticalSeam(): number[] {
    if (this.forwardEnergy) {
      return this.findVerticalSeamWithForwardEnergy();
    }
    return this.findVerticalSeamWithoutForwardEnergy();
  }

  shrinkWidth(): Uint8ClampedArray {
    const seam = this.findVerticalSeam();
    this.seam = seam;
    const picture = this.picture;
    const result = picture.data;
    const oldHeight = Math.floor(picture.height);
    const oldWidth = Math.floor(picture.width);
    const newWidth = oldWidth - 1;
    const oldPtrStep = oldWidth * 4;
    const newPtrStep = newWidth * 4;
    let oldPtr: number = 0;
    let newPtr: number = 0;
    for (
      let y: number = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy: number = seam[y] * 4;
      result.copyWithin(newPtr, oldPtr, oldPtr + sy);
      result.copyWithin(
        newPtr + sy,
        oldPtr + sy + (1 << 2),
        oldPtr + oldPtrStep
      );
    }
    return result;
  }
}
