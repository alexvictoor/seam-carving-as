import { computeEnergies, emptyPicture, Picture } from "./picture";

export const FLOAT64ARRAY_ID = idof<Float64Array>();
export const UINT32ARRAY_ID = idof<Uint32Array>();
export const UINT8ARRAY_ID = idof<Uint8Array>();

let currentImageData: Uint8Array;
let currentWidth: i32;

export function shrinkWidth(srcImage: Uint8Array, width: i32): Uint8Array {
  currentImageData = srcImage;
  currentWidth = width;
  Seam.create(currentImageData, currentWidth);
  return shrink();
}
export function shrinkWidthWithForwardEnergy(
  srcImage: Uint8Array,
  width: i32
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



class Seam {
  static instance: Seam;

  picture: Picture = emptyPicture;
  energies: StaticArray<i16> = new StaticArray<i16>(0);
  backPtrWeights: Int8Array = new Int8Array(0);
  oddLineWeights: StaticArray<i32> = new StaticArray<i32>(0);
  evenLineWeights: StaticArray<i32> = new StaticArray<i32>(0);
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
      this.oddLineWeights = new StaticArray<i32>(this.width);
      this.evenLineWeights = new StaticArray<i32>(this.width);
    } else {
      this.initEnergies();
    }
  }

  private initEnergies(): void {
    let energies = this.energies;
    const size = this.data.length >> 2;
    if (!energies || energies.length < size) {
      energies = new StaticArray<i16>(size);
      this.backPtrWeights = new Int8Array(size);
      this.oddLineWeights = new StaticArray<i32>(this.width);
      this.evenLineWeights = new StaticArray<i32>(this.width);
    }
    const picture = this.picture;
    /*for (let y: i16 = 0, w = 0, height = picture.height; y < height; y++) {
      for (let x: i16 = 0, width = picture.width; x < width; x++, w++) {
        unchecked(energies[w] = picture.energyAt(x, y));
      }
    }*/

    this.energies = computeEnergies(picture.data, picture.width, energies);
  }

  @inline
  private weightFrom(line: StaticArray<i32>, x: i16, width: i32): i32 {
    if (x < 0 || x >= width) {
      return i32.MAX_VALUE >> 1;
    }
    return unchecked(line[x]);
  }

  @inline
  private cumulateWeights(
    x: i16,
    ptr: i32,
    width: i32,
    currentLineWeights: StaticArray<i32>,
    previousLineWeights: StaticArray<i32>
  ): void {
    let weight = this.weightFrom(previousLineWeights, x, width);
    let aboveXDelta: i8 = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1, width);
    if (weightLeft < weight) {
      /*if (this.forwardEnergy) {
        trace("weightLeft < weight", 2, weightLeft, weight);
      }*/
      weight = weightLeft;
      aboveXDelta = -1;
    }
    const weightRight = this.weightFrom(previousLineWeights, x + 1, width);
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }

    assert(<i16>x + aboveXDelta > -1);
    unchecked(this.backPtrWeights[ptr] = aboveXDelta);
    unchecked(currentLineWeights[x] = unchecked(this.energies[ptr]) + weight);
  }

  private findVerticalSeamWithoutForwardEnergy(): StaticArray<i32> {
    const picture = this.picture;
    const height = picture.height;
    const width = picture.width;
    let weightIndex = width;
    let previousLineWeights: StaticArray<i32> = unchecked(StaticArray.fromArray(StaticArray.slice(this.energies, 0, width).map<i32>(w => <i32>w)));
    let currentLineWeights: StaticArray<i32> = this.oddLineWeights;
    //unchecked(previousLineWeights.set(this.energies.subarray(0, width)));
    for (let j: i16 = 1; j < height; j++) {
      for (let i: i16 = 0; i < width; i++, weightIndex++) {
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
    let lastIndex: i16 = 0;
    let lastIndexWeight = i32.MAX_VALUE;

    for (let i: i16 = 0; i < width; i++) {
      let weight: i32 = unchecked(currentLineWeights[i]);
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
    x: i16,
    y: i16,
    ptr: i32,
    currentLineWeights: StaticArray<i32>,
    previousLineWeights: StaticArray<i32>
  ): void {
    //trace("cumulateWeightsWithForwardEnergy", 1, x);
    //trace("cumulateWeightsWithForwardEnergy", 1, y);
    //trace("coucou ptr: " + ptr.toString());
    const picture = this.picture;
    const width = picture.width;
    const costCenter = picture.energyDelta(x - 1, y, x + 1, y);
    const costLeft = costCenter + picture.energyDelta(x, y - 1, x - 1, y);
    const costRight = costCenter + picture.energyDelta(x, y - 1, x + 1, y);

    let weight = this.weightFrom(previousLineWeights, x, width) + costCenter;
    let aboveXDelta: i8 = 0;
    const weightLeft = this.weightFrom(previousLineWeights, x - 1, width) + costLeft;
    //trace("weight", 1, weight);
    //trace("weightLeft", 1, weightLeft);
    if (<f32>weightLeft < <f32>weight) {
      //trace("weightLeft < weight");
      /*if (this.forwardEnergy) {
        trace('max f32', 1, f32.MAX_VALUE);
        trace('max f32 + 1', 1, f32.MAX_VALUE + <f32>1);
        trace("weightLeft < weight", 4, weightLeft, weight, x, y);
      }*/
      weight = weightLeft;
      aboveXDelta = -1;
    }
    const weightRight = this.weightFrom(previousLineWeights, x + 1, width) + costRight;
    if (weightRight < weight) {
      weight = weightRight;
      aboveXDelta = 1;
    }

    //trace("x", 1, x);
    //trace("aboveXDelta", 1, aboveXDelta);
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
    for (let j: i16 = 1; j < height; j++) {
      for (let i: i16 = 0; i < width; i++, weightIndex++) {
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
    let lastIndex: i32 = 0;
    let lastIndexWeight = i32.MAX_VALUE;

    for (let i: i16 = 0; i < width; i++) {
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
      let w = next + unchecked(weights[<i32>next + (i + 1) * width]);
      assert(w < width, i.toString() + " w < width " + w.toString() + " " + width.toString());
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
    const oldHeight = <i16>picture.height;
    const oldWidth = <i16>picture.width;
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
}
