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
  let seam = Seam.recycle(currentImageData, currentWidth);
  currentImageData = seam.shrinkWidth();
  currentWidth--;
  return currentImageData;
}

class Color {
  @inline constructor(
    private data: Uint8Array,
    private ptr: i32
  ) {}

  @inline
  get red(): u8 {
    return unchecked(this.data[this.ptr]);
  }

  @inline
  get green(): u8 {
    return unchecked(this.data[this.ptr + 1]);
  }

  @inline
  get blue(): u8 {
    return unchecked(this.data[this.ptr + 2]);
  }

  @inline
  move(ptr: i32): Color {
    this.ptr = ptr;
    return this;
  }
}

const whiteData = new Uint8Array(3);
whiteData[0] = 0xFF;
whiteData[1] = 0xFF;
whiteData[2] = 0xFF;
const WHITE = new Color(whiteData, 0);

@inline
function delta(first: Color, second: Color): f32 {
  const deltaRed = (<i16>first.red - <i16>second.red);
  const deltaGreen = (<i16>first.green -<i16>second.green);
  const deltaBlue = (<i16>first.blue - <i16>second.blue);

  return Mathf.sqrt(
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
    public width: i32,
    public height: i32
  ) {
    this.northColor = new Color(data, 0);
    this.southColor = new Color(data, 0);
    this.westColor = new Color(data, 0);
    this.eastColor = new Color(data, 0);
    this.firstColor = new Color(data, 0);
    this.secondColor = new Color(data, 0);
  }

  @inline
  toPtr(x: i32, y: i32): i32 {
    return (x + y * this.width) << 2;
  }

  getColorAt(x: i32, y: i32): Color {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }
    return new Color(this.data, this.toPtr(x, y));
  }

  @inline
  isOut(x: i32, y: i32): bool {
    return x >= this.width || y >= this.height;
  }

  @inline
  energyAt(x: i32, y: i32): f32 {
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
  energyDelta(x1: i32, y1: i32, x2: i32, y2: i32): f32 {
    const firstColor = this.isOut(x1, y1)
      ? WHITE
      : this.firstColor.move(this.toPtr(x1, y1));
    const secondColor = this.isOut(x2, y2)
      ? WHITE
      : this.secondColor.move(this.toPtr(x2, y2));

    return delta(firstColor, secondColor);
  }
}
const emptyPicture = new Picture(new Uint8Array(0), 0, 0);

class Seam {
  static instance: Seam;

  picture: Picture = emptyPicture;
  energies: Float32Array = new Float32Array(0);
  backPtrWeights: Int8Array = new Int8Array(0);
  oddLineWeights: Float32Array = new Float32Array(0);
  evenLineWeights: Float32Array = new Float32Array(0);
  seam: StaticArray<i32> = StaticArray.fromArray(new Array<i32>());

  public static create(data: Uint8Array, width: i32): Seam {
    Seam.instance = new Seam(data, width, false);
    return Seam.instance;
  }

  public static createWithForwardEnergy(data: Uint8Array, width: i32): Seam {
    Seam.instance = new Seam(data, width, true);
    return Seam.instance;
  }

  public static recycle(data: Uint8Array, width: i32): Seam {
    Seam.instance.init(data, width);
    return Seam.instance;
  }

  constructor(
    private data: Uint8Array,
    private width: i32,
    private forwardEnergy: boolean
  ) {
    this.init(data, width);
  }

  @inline
  private init(data: Uint8Array, width: i32): void {
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
    for (let y: i32 = 0, w = 0, height = picture.height; y < height; y++) {
      for (let x: i32 = 0, width = picture.width; x < width; x++, w++) {
        energies[w] = picture.energyAt(x, y);
      }
    }

    this.energies = energies;
  }

  @inline
  private weightFrom(line: Float32Array, x: i32, width: i32): f32 {
    if (x < 0 || x >= width) {
      return f32.MAX_VALUE;
    }
    return unchecked(line[x]);
  }

  @inline
  private cumulateWeights(
    x: i32,
    ptr: i32,
    width: i32,
    currentLineWeights: Float32Array,
    previousLineWeights: Float32Array
  ): void {
    let weight = this.weightFrom(previousLineWeights, x, width);
    let aboveXDelta: i8 = 0;
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

    assert(<i32>x + aboveXDelta > -1);
    unchecked(this.backPtrWeights[ptr] = aboveXDelta);
    unchecked(currentLineWeights[x] = unchecked(this.energies[ptr]) + weight);
  }

  private findVerticalSeamWithoutForwardEnergy(): StaticArray<i32> {
    const picture = this.picture;
    const height = picture.height;
    const width = picture.width;
    let weightIndex = width;
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    unchecked(previousLineWeights.set(this.energies.subarray(0, width)));
    for (let j: i32 = 1; j < height; j++) {
      for (let i: i32 = 0; i < width; i++, weightIndex++) {
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
    let lastIndexWeight = f32.MAX_VALUE;

    for (let i: i32 = 0; i < width; i++) {
      let weight: f32 = unchecked(currentLineWeights[i]);
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new StaticArray<i32>(height);
    unchecked(seam[height - 1] = lastIndex);
    for (let i = height - 2; i + 1 > 0; i--) {
      let next = unchecked(seam[i + 1]);
      unchecked(seam[i] = next + weights[next + (i + 1) * width]); 
    }

    return seam;
  }

  //@inline
  private cumulateWeightsWithForwardEnergy(
    x: i32,
    y: i32,
    ptr: i32,
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
    let aboveXDelta: i8 = 0;
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

    assert(<i32>x + aboveXDelta > -1);
    unchecked(this.backPtrWeights[ptr] = aboveXDelta);
    //trace("backPtrWeights", 1, costLeft);

    unchecked(currentLineWeights[x] = weight);
  }

  private findVerticalSeamWithForwardEnergy(): StaticArray<i32> {
    const picture = this.picture;
    const height = picture.height;
    const width = picture.width;
    let weightIndex = width;
    this.evenLineWeights.fill(0);
    let previousLineWeights = this.evenLineWeights;
    let currentLineWeights = this.oddLineWeights;
    for (let j: i32 = 1; j < height; j++) {
      for (let i: i32 = 0; i < width; i++, weightIndex++) {
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

    for (let i: i32 = 0; i < width; i++) {
      let weight = unchecked(currentLineWeights[i]);
      if (weight < lastIndexWeight) {
        lastIndex = i;
        lastIndexWeight = weight;
      }
    }

    const weights = this.backPtrWeights;
    const seam = new StaticArray<i32>(height);
    unchecked(seam[height - 1] = lastIndex);
    for (let i: i32 = height - 2; i + 1 > 0; i--) {
      let next = unchecked(seam[i + 1]);
      let w = next + unchecked(weights[next + (i + 1) * width]);
      assert(w < <i32>width);
      unchecked(seam[i] = w);
    }

    return seam;
  }

  private findVerticalSeam(): StaticArray<i32> {
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
    const oldHeight = <i32>picture.height;
    const oldWidth = <i32>picture.width;
    const newWidth = oldWidth - 1;
    const oldPtrStep = oldWidth * 4;
    const newPtrStep = newWidth * 4;
    let oldPtr: i32 = 0;
    let newPtr: i32 = 0;
    for (
      let y: i32 = 0; y < oldHeight; y++, oldPtr += oldPtrStep, newPtr += newPtrStep
    ) {
      let sy: i32 = <i32>unchecked(seam[y]) << 2;
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
