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
function delta(first: Color, second: Color): f32 {
  const deltaRed = <f32>first.red - <f32>second.red;
  const deltaGreen = <f32>first.green - <f32>second.green;
  const deltaBlue = <f32>first.blue - <f32>second.blue;

  return sqrt(
    deltaBlue * deltaBlue + deltaGreen * deltaGreen + deltaRed * deltaRed
  );
}

class Picture {
  northColor: Color;
  southColor: Color;
  westColor: Color;
  eastColor: Color;

  constructor(
    public data: Uint8Array,
    public width: usize,
    public height: usize
  ) {
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
  }

  @inline
  toPtr(x: usize, y: usize): usize {
    return (x + y * this.width) << 2;
  }

  getColorAt(x: usize, y: usize): Color {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }
    return new Color(this.data, this.toPtr(x, y));
  }

  @inline
  isOut(x: usize, y: usize): bool {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  @inline
  energyAt(x: usize, y: usize): f32 {
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
}

class Seam {
  static instance: Seam;

  picture: Picture;
  energies: Float32Array;
  backPtrWeights: Int8Array;
  oddLineWeights: Float32Array;
  evenLineWeights: Float32Array;
  seam: usize[];

  public static create(data: Uint8Array, width: usize): Seam {
    if (Seam.instance) {
      Seam.instance.init(data, width);
    } else {
      Seam.instance = new Seam(data, width);
    }
    return Seam.instance;
  }

  constructor(private data: Uint8Array, private width: usize) {
    this.init(data, width);
  }

  private init(data: Uint8Array, width: usize): void {
    this.picture = new Picture(data, width, data.length / (width * 4));
    this.initEnergies();
  }

  private initEnergies(): void {
    let energies: Float32Array = this.energies;
    if (!this.energies || this.energies.length < this.data.length >> 2) {
      energies = new Float32Array(this.data.length >> 2);
      this.backPtrWeights = new Int8Array(this.data.length >> 2);
      this.oddLineWeights = new Float32Array(this.width);
      this.evenLineWeights = new Float32Array(this.width);
    }

    for (let y: usize = 0, w = 0; y < this.picture.height; y++) {
      for (let x: usize = 0; x < this.picture.width; x++, w++) {
        energies[w] = this.picture.energyAt(x, y);
      }
    }

    this.energies = energies;
  }

  @inline
  private weightFrom(line: Float32Array, x: usize): f32 {
    if (x < 0 || x >= this.picture.width) {
      return f32.MAX_VALUE;
    }
    return line[x];
  }

  @inline
  private cumulateWeights(
    x: usize,
    ptr: usize,
    currentLineWeights: Float32Array,
    previousLineWeights: Float32Array
  ): void {
    let weight = this.weightFrom(previousLineWeights, x);
    let aboveXDelta: i8 = 0;
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

    assert(<i32>x + aboveXDelta > -1);
    this.backPtrWeights[ptr] = aboveXDelta;

    currentLineWeights[x] = this.energies[ptr] + weight;
  }

  private findVerticalSeam(): usize[] {
    let weightIndex: usize = this.picture.width;
    this.evenLineWeights.set(this.energies.subarray(0, this.picture.width));
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    for (let j: usize = 1; j < this.picture.height; j++) {
      for (let i: usize = 0; i < this.picture.width; i++, weightIndex++) {
        this.cumulateWeights(
          i,
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
    let lastIndexWeight = f32.MAX_VALUE;

    for (let i: usize = 0; i < this.picture.width; i++) {
      let weight = currentLineWeights[i];
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const seam = new Array<usize>(this.picture.height);
    seam[this.picture.height - 1] = lastIndex;
    for (let i: usize = this.picture.height - 2; i + 1 > 0; i--) {
      seam[i] =
        seam[i + 1] +
        this.backPtrWeights[seam[i + 1] + (i + 1) * this.picture.width];

      assert(seam[i] < this.picture.width);
    }

    return seam;
  }

  shrinkWidth(): Uint8Array {
    const seam = this.findVerticalSeam();
    this.seam = seam;
    const newWidth = this.picture.width - 1;
    const oldWidth = this.picture.width;
    const result = this.picture.data;

    let oldPtr: usize = 0;
    const oldPtrStep: usize = oldWidth * 4;
    let newPtr: usize = 0;
    const newPtrStep: usize = newWidth * 4;
    for (
      let y: usize = 0;
      y < this.picture.height;
      y++, oldPtr = oldPtr + oldPtrStep, newPtr = newPtr + newPtrStep
    ) {
      result.copyWithin(newPtr, oldPtr, oldPtr + (seam[y] << 2));

      result.copyWithin(
        newPtr + (seam[y] << 2),
        oldPtr + ((seam[y] + 1) << 2),
        oldPtr + oldPtrStep
      );
    }
    return result;
  }
}
