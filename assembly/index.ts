/// <reference path="../node_modules/assemblyscript/dist/assemblyscript.d.ts" />

export const FLOAT64ARRAY_ID = idof<Float64Array>();
export const UINT32ARRAY_ID = idof<Uint32Array>();
export const UINT8ARRAY_ID = idof<Uint8Array>();

NativeMath.seedRandom(42);

export function coucou(): i32 {
  //memory.memory.grow(10);
  const toto = new Array<usize>(16);
  toto.fill(123);
  toto[3601] = 421;
  trace("log depuis as", 1, 123);
  return toto[3601];
}

let currentImageData: Uint8Array;
let currentWidth: u32;

export function shrinkWidth(srcImage: Uint8Array, width: u32): Uint8Array {
  currentImageData = srcImage;
  currentWidth = width;
  return shrink();
}

export function shrink(): Uint8Array {
  const seam = Seam.create(currentImageData, currentWidth);
  currentImageData = seam.shrinkWidth();
  currentWidth--;
  return currentImageData;
}

export function shrink100(): Uint8Array {
  for (let i = 0; i < 100; i++) {
    const seam = new Seam(currentImageData, currentWidth);
    currentImageData = seam.shrinkWidth();
    currentWidth--;
  }
  return currentImageData;
}

class Color {
  constructor(private data: Uint8Array, private ptr: usize) {}

  get red(): u8 {
    return this.data[this.ptr];
  }
  get green(): u8 {
    return this.data[this.ptr + 1];
  }
  get blue(): u8 {
    return this.data[this.ptr + 2];
  }

  move(ptr: usize): Color {
    this.ptr = ptr;
    return this;
  }
}
const whiteData = new Uint8Array(3);
whiteData[0] = 255;
whiteData[1] = 255;
whiteData[2] = 255;
const WHITE = new Color(whiteData, 0);

@inline
function delta(first: Color, second: Color): u32 {
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

  constructor(public data: Uint8Array, public width: u32, public height: u32) {
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
  }

  @inline
  toPtr(x: u32, y: u32): usize {
    return (x + y * this.width) * 4;
  }

  getColorAt(x: u32, y: u32): Color {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }
    return new Color(this.data, this.toPtr(x, y));
  }

  @inline
  isOut(x: u32, y: u32): bool {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  @inline
  energyAtOptimized(x: u32, y: u32): u32 {
    /*if (x < 0 || x >= this.width || y < 0 || y > this.height) {
      throw new Error("out of range");
    }*/

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

  energyAt(x: u32, y: u32): u32 {
    if (x < 0 || x >= this.width || y < 0 || y > this.height) {
      throw new Error("out of range");
    }

    // delta north / south

    const northColor = this.getColorAt(x, y - 1);
    const southColor = this.getColorAt(x, y + 1);
    const westColor = this.getColorAt(x - 1, y);
    const eastColor = this.getColorAt(x + 1, y);

    return delta(northColor, southColor) + delta(eastColor, westColor);
  }
}

class Seam {
  static instance: Seam;

  picture: Picture;
  energies: Uint32Array;
  backPtrWeights: Uint32Array;
  oddLineWeights: Uint32Array;
  evenLineWeights: Uint32Array;

  public static create(data: Uint8Array, width: u32): Seam {
    if (Seam.instance) {
      Seam.instance.init(data, width);
    } else {
      Seam.instance = new Seam(data, width);
    }
    return Seam.instance;
  }

  constructor(private data: Uint8Array, private width: u32) {
    this.init(data, width);
  }

  private init(data: Uint8Array, width: u32): void {
    this.picture = new Picture(data, width, data.length / (width * 4));
    this.initEnergies();
  }

  private initEnergies(): void {
    let energies: Uint32Array = this.energies;
    if (!this.energies || this.energies.length < this.data.length / 4) {
      energies = new Uint32Array(this.data.length / 4);
      this.backPtrWeights = new Uint32Array(this.data.length / 4);
      this.oddLineWeights = new Uint32Array(this.width);
      this.evenLineWeights = new Uint32Array(this.width);
    }
    for (let y: u32 = 0, w = 0; y < this.picture.height; y++) {
      for (let x: u32 = 0; x < this.picture.width; x++, w++) {
        energies[w] = this.picture.energyAtOptimized(x, y);
      }
    }
    this.energies = energies;
  }

  private weightFrom(line: Uint32Array, x: u32): u32 {
    if (x < 0 || x >= this.picture.width) {
      //trace("getWeightAt out x", 1, x);
      //trace("getWeightAt out y", 1, y);
      return u32.MAX_VALUE;
    }
    return line[x];
  }

  @inline
  private cumulateWeights(
    x: u32,
    ptr: u32,
    currentLineWeights: Uint32Array,
    previousLineWeights: Uint32Array
  ): void {
    let weight = this.weightFrom(previousLineWeights, x);
    let aboveXDelta = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1);
    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    }
    const weightRight = this.weightFrom(previousLineWeights, x + 1);
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }
    this.backPtrWeights[ptr] = aboveXDelta;

    currentLineWeights[x] = this.energies[ptr] + weight;
  }

  private findVerticalSeam(): usize[] {
    let weightIndex: usize = this.picture.width - 1;
    this.evenLineWeights.set(this.energies.subarray(0, this.picture.width));
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    for (let j: u32 = 1; j < this.picture.height; j++) {
      for (let i: u32 = 0; i < this.picture.width; i++, weightIndex++) {
        this.cumulateWeights(
          i,
          weightIndex,
          currentLineWeights,
          previousLineWeights
        );
        //trace("weight updated", 1, this.weights[weightIndex]);
      }
      let swapTmp = currentLineWeights;
      currentLineWeights = previousLineWeights;
      previousLineWeights = swapTmp;
    }

    // find index of last seam pixel
    let lastIndex = 0;
    let lastIndexWeight = u32.MAX_VALUE;
    //trace("coucou", 1, 432);
    for (let i: u32 = 0; i < this.picture.width; i++) {
      let weight = currentLineWeights[i];
      //trace("energy", 1, energy);
      //trace("index", 1, i);
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const seam = new Array<usize>(this.picture.height);
    seam[this.picture.height - 1] = lastIndex;
    for (let i: u32 = this.picture.height - 2; i + 1 > 0; i--) {
      seam[i] =
        seam[i + 1] + this.backPtrWeights[seam[i + 1] + i * this.picture.width];
    }

    return seam;
  }

  shrinkWidth(): Uint8Array {
    const seam = this.findVerticalSeam();
    const newWidth = this.picture.width - 1;
    const result = this.picture.data; //new Uint8Array(newWidth * this.picture.height * 4);

    for (let y: u32 = 0; y < this.picture.height; y++) {
      result.set(
        this.data.subarray(y * this.width * 4, (y * this.width + seam[y]) * 4),
        y * newWidth * 4
      );
      const rightSide = this.data.subarray(
        (y * this.width + seam[y] + 1) * 4,
        (y + 1) * this.width * 4
      );
      result.set(rightSide, (y * newWidth + seam[y]) * 4);
    }
    return result;
  }
}
