/// <reference path="../node_modules/assemblyscript/dist/assemblyscript.d.ts" />

export const FLOAT64ARRAY_ID = idof<Float64Array>();
export const UINT32ARRAY_ID = idof<Uint32Array>();
export const UINT8ARRAY_ID = idof<Uint8Array>();

let currentImageData: Uint8Array;
let currentWidth: u32;

export function shrinkWidth(srcImage: Uint8Array, width: u32): Uint8Array {
  currentImageData = srcImage;
  currentWidth = width;
  Seam.create(currentImageData, currentWidth);
  return shrink();
}
export function shrinkWidthWithForwardEnergy(
  srcImage: Uint8Array,
  width: u32
): Uint8Array {
  currentImageData = srcImage;
  currentWidth = width;
  Seam.createWithForwardEnergy(currentImageData, currentWidth);
  return shrink();
}

export function shrink(): Uint8Array {
  const seam = Seam.recycle(currentImageData, currentWidth);
  currentImageData = seam.shrinkWidth();
  currentWidth--;
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
  firstColor: Color;
  secondColor: Color;

  constructor(
    public data: Uint8Array,
    public width: usize,
    public height: usize
  ) {
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
    this.firstColor = new Color(data, 0);
    this.secondColor = new Color(data, 0);
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

  @inline
  energyDelta(x1: usize, y1: usize, x2: usize, y2: usize): f32 {
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
  seam: usize[];

  public static create(data: Uint8Array, width: usize): Seam {
    Seam.instance = new Seam(data, width, false);
    return Seam.instance;
  }

  public static createWithForwardEnergy(data: Uint8Array, width: usize): Seam {
    Seam.instance = new Seam(data, width, true);
    return Seam.instance;
  }

  public static recycle(data: Uint8Array, width: usize): Seam {
    Seam.instance.init(data, width);
    return Seam.instance;
  }

  constructor(
    private data: Uint8Array,
    private width: usize,
    private forwardEnergy: boolean
  ) {
    this.init(data, width);
  }

  private init(data: Uint8Array, width: usize): void {
    this.picture = new Picture(data, width, data.length / (width * 4));
    if (this.forwardEnergy) {
      this.backPtrWeights = new Int8Array(this.data.length >> 2);
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

    for (let y: usize = 0, w = 0, height = this.picture.height; y < height; y++) {
      for (let x: usize = 0, width = this.picture.width; x < width; x++, w++) {
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
    return unchecked(line[x]);
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
    unchecked(this.backPtrWeights[ptr] = aboveXDelta);
    unchecked(currentLineWeights[x] = unchecked(this.energies[ptr]) + weight);
  }

  private findVerticalSeamWithoutForwardEnergy(): usize[] {
    const picture = this.picture;
    const height = picture.height;
    const width = picture.width;
    let weightIndex = width;
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    previousLineWeights.set(this.energies.subarray(0, width));
    for (let j: usize = 1; j < height; j++) {
      for (let i: usize = 0; i < width; i++, weightIndex++) {
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

    for (let i: usize = 0; i < width; i++) {
      let weight = unchecked(currentLineWeights[i]);
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new Array<usize>(height);
    unchecked(seam[height - 1] = lastIndex);
    for (let i: usize = height - 2; i + 1 > 0; i--) {
      let next = unchecked(seam[i + 1]);
      let w = next + unchecked(weights[next + (i + 1) * width]);
      assert(w < width);
      seam[i] = w;
    }

    return seam;
  }

  //@inline
  private cumulateWeightsWithForwardEnergy(
    x: usize,
    y: usize,
    ptr: usize,
    currentLineWeights: Float32Array,
    previousLineWeights: Float32Array
  ): void {
    //trace("cumulateWeightsWithForwardEnergy", 1, x);
    //trace("cumulateWeightsWithForwardEnergy", 1, y);
    const picture = this.picture;
    const costCenter = picture.energyDelta(x - 1, y, x + 1, y);
    const costLeft = costCenter + picture.energyDelta(x, y - 1, x - 1, y);
    const costRight = costCenter + picture.energyDelta(x, y - 1, x + 1, y);
    //trace("energyDelta", 1, costLeft);

    let weight = this.weightFrom(previousLineWeights, x) + costCenter;
    let aboveXDelta: i8 = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1) + costLeft;
    if (weightLeft < weight) {
      weight = weightLeft;
      aboveXDelta = -1;
    }
    //trace("energyDelta left", 1, costLeft);
    const weightRight = this.weightFrom(previousLineWeights, x + 1) + costRight;
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }
    //trace("energyDelta right", 1, costLeft);

    assert(<i32>x + aboveXDelta > -1);
    unchecked(this.backPtrWeights[ptr] = aboveXDelta);
    //trace("backPtrWeights", 1, costLeft);

    unchecked(currentLineWeights[x] = weight);
  }

  private findVerticalSeamWithForwardEnergy(): usize[] {
    let weightIndex = this.picture.width;
    //trace("evenLineWeights", 1, 0);
    this.evenLineWeights.fill(0);
    //trace("evenLineWeights", 1, 1);
    const height = this.picture.height;
    const width = this.picture.width;
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    for (let j: usize = 1; j < height; j++) {
      for (let i: usize = 0; i < width; i++, weightIndex++) {
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
    let lastIndexWeight = f32.MAX_VALUE;

    for (let i: usize = 0; i < width; i++) {
      let weight = unchecked(currentLineWeights[i]);
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new Array<usize>(height);
    unchecked(seam[height - 1] = lastIndex);
    for (let i: usize = height - 2; i + 1 > 0; i--) {
      let next = unchecked(seam[i + 1]);
      let w = next + unchecked(weights[next + (i + 1) * width]);
      assert(w < width);
      unchecked(seam[i] = w);
    }

    return seam;
  }

  private findVerticalSeam(): usize[] {
    if (this.forwardEnergy) {
      return this.findVerticalSeamWithForwardEnergy();
    }
    return this.findVerticalSeamWithoutForwardEnergy();
  }

  shrinkWidth(): Uint8Array {
    const seam = this.findVerticalSeam();
    this.seam = seam;
    const picture = this.picture;
    const result = picture.data;
    const oldHeight = picture.height;
    const oldWidth = picture.width;
    const newWidth = oldWidth - 1;
    const oldPtrStep = oldWidth * 4;
    const newPtrStep = newWidth * 4;
    let oldPtr: usize = 0;
    let newPtr: usize = 0;
    for (
      let y: usize = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy: usize = unchecked(seam[y]) << 2;
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
