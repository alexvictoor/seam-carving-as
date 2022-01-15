@final
@unmanaged
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

const blackData = new Uint8Array(3);
whiteData[0] = 0;
whiteData[1] = 0;
whiteData[2] = 0;
const BLACK = new Color(blackData, 0);

@inline
export function oldDelta(first: Color, second: Color): f32 {
  const deltaRed = (<i16>first.red - <i16>second.red);
  const deltaGreen = (<i16>first.green -<i16>second.green);
  const deltaBlue = (<i16>first.blue - <i16>second.blue);

  return Mathf.sqrt(
    deltaBlue * deltaBlue + deltaGreen * deltaGreen + deltaRed * deltaRed
  );
}

@inline
export function delta(first: Color, second: Color): i16 {
  
    const deltaRed = (<i16>first.red - <i16>second.red);
    const deltaGreen = (<i16>first.green -<i16>second.green);
    const deltaBlue = (<i16>first.blue - <i16>second.blue);
  
    /*return Mathf.sqrt(
      deltaBlue * deltaBlue + deltaGreen * deltaGreen + deltaRed * deltaRed
    );*/
    return <i16>(Math.abs(deltaBlue) + Math.abs(deltaGreen) + Math.abs(deltaRed));
}

@final
export class Picture {
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
  toPtr(x: i16, y: i16): i32 {
    return (x + y * this.width) << 2;
  }

  getColorAt(x: i16, y: i16): Color {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return WHITE;
    }
    return new Color(this.data, this.toPtr(x, y));
  }

  @inline
  isOut(x: i16, y: i16): bool {
    return x >= this.width || y >= this.height || x < 0 || y < 0;
  }

  @inline
  energyAt(x: i16, y: i16): i16 {
    const northColor = this.isOut(x, y - 1)
      ? BLACK
      : this.northColor.move(this.toPtr(x, y - 1));
    const southColor = this.isOut(x, y + 1)
      ? BLACK
      : this.southColor.move(this.toPtr(x, y + 1));
    const westColor = this.isOut(x - 1, y)
      ? BLACK
      : this.westColor.move(this.toPtr(x - 1, y));
    const eastColor = this.isOut(x + 1, y)
      ? BLACK
      : this.eastColor.move(this.toPtr(x + 1, y));

    return delta(northColor, southColor) + delta(eastColor, westColor);
  }

  @inline
  energyDelta(x1: i16, y1: i16, x2: i16, y2: i16): i16 {
    const firstColor = this.isOut(x1, y1)
      ? WHITE
      : this.firstColor.move(this.toPtr(x1, y1));
    const secondColor = this.isOut(x2, y2)
      ? WHITE
      : this.secondColor.move(this.toPtr(x2, y2));

    return delta(firstColor, secondColor);
  }
}
export const emptyPicture = new Picture(new Uint8Array(0), 0, 0);

export function computeEnergies(pictureData: Uint8Array, width: i32, energies: StaticArray<i16>): StaticArray<i16> {
    const picture = new Picture(pictureData, width, pictureData.length / (width * 4));
    //const size = pictureData.length >> 2;
    //const energies = new StaticArray<i16>(size);
    for (let y: i16 = 0, w = 0, height = picture.height; y < height; y++) {
      for (let x: i16 = 0, width = picture.width; x < width; x++, w++) {
        unchecked(energies[w] = picture.energyAt(x, y));
      }
    }
    return energies;
}

let redData = new StaticArray<u8>(0);
let greenData = new StaticArray<u8>(0);
let blueData = new StaticArray<u8>(0);

export function computeEnergiesWithSIMD(pictureData: Uint8Array, width: i32, energies: StaticArray<i16>): StaticArray<i16> {

    const height = pictureData.length / 4 / width;
    //const padding = (8 - ((width + 2) % 8)) % 8;
    
    const dataWidth = width + 2;

    const dataLength = dataWidth * (height + 2) + 8;

    if (redData.length < dataLength) {
      redData = new StaticArray<u8>(dataLength);
      greenData = new StaticArray<u8>(dataLength);
      blueData = new StaticArray<u8>(dataLength);
  
    }

    
    let srcIndex: i32 = 0;
    let dstIndex: i32 = dataWidth + 1;

    const start = Date.now();
    for (let y: i32 = 0; y < height; y++) {
      for (let x: i32 = 0; x < width; x++) {
        unchecked(redData[dstIndex] = pictureData[srcIndex]);
        unchecked(greenData[dstIndex] = pictureData[srcIndex + 1]);
        unchecked(blueData[dstIndex] = pictureData[srcIndex + 2]);
        
        srcIndex += 4;
        dstIndex++;
      }
      dstIndex += 2;
    }
    const time = <f64>(Date.now() - start)
    //trace('Init color', 1, time);

    const redPtr = changetype<usize>(redData);
    const greenPtr = changetype<usize>(greenData);
    const bluePtr = changetype<usize>(blueData);

    dstIndex = dataWidth + 1;

    const energiesPtr = changetype<usize>(energies);
    let ptr = energiesPtr;
    let ptrBeginLine = energiesPtr - (width << 1);

    for (let y: i32 = 0; y < height; y++) {
      
      ptrBeginLine = ptrBeginLine + (width << 1);
      ptr = ptrBeginLine;

      for (let x: i32 = 0; x < width; x += 8, ptr += 16) {
       
        const topOffset = dstIndex - dataWidth;
        const redTopVector = v128.load_ext<u8>(redPtr + topOffset);
        const greenTopVector = v128.load_ext<u8>(greenPtr + topOffset);
        const blueTopVector = v128.load_ext<u8>(bluePtr + topOffset);

        const belowOffset = dstIndex + dataWidth;
        const redBelowVector = v128.load_ext<u8>(redPtr + belowOffset);
        const greenBelowVector = v128.load_ext<u8>(greenPtr + belowOffset);
        const blueBelowVector = v128.load_ext<u8>(bluePtr + belowOffset);

        const leftOffset = dstIndex - 1;
        const redLeftVector = v128.load_ext<u8>(redPtr + leftOffset);
        const greenLeftVector = v128.load_ext<u8>(greenPtr + leftOffset);
        const blueLeftVector = v128.load_ext<u8>(bluePtr + leftOffset);

        const rightOffset = dstIndex + 1;
        const redRightVector = v128.load_ext<u8>(redPtr + rightOffset);
        const greenRightVector = v128.load_ext<u8>(greenPtr + rightOffset);
        const blueRightVector = v128.load_ext<u8>(bluePtr + rightOffset);

        const vDeltaRedVector = v128.abs<i16>(v128.sub<i16>(redTopVector, redBelowVector));
        const vDeltaGreenVector = v128.abs<i16>(v128.sub<i16>(greenTopVector, greenBelowVector));
        const vDeltaBlueVector = v128.abs<i16>(v128.sub<i16>(blueTopVector, blueBelowVector));

        const hDeltaRedVector = v128.abs<i16>(v128.sub<i16>(redLeftVector, redRightVector));
        const hDeltaGreenVector = v128.abs<i16>(v128.sub<i16>(greenLeftVector, greenRightVector));
        const hDeltaBlueVector = v128.abs<i16>(v128.sub<i16>(blueLeftVector, blueRightVector));
        
        const energyVector = v128.add<i16>(
          v128.add<i16>(
            v128.add<i16>(vDeltaRedVector, hDeltaRedVector),
            v128.add<i16>(vDeltaGreenVector, hDeltaGreenVector)
          ),
          v128.add<i16>(vDeltaBlueVector, hDeltaBlueVector)
        );

        //if (y < 495) {
          v128.store(ptr, energyVector);
        //} else {
          //log<string>("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());
        

        dstIndex += 8;
      }
      dstIndex += 2;
    }
    //trace("ptr " + ptr.toString() + " " + energiesPtr.toString() + " " + energies.length.toString());
    return changetype<StaticArray<i16>>(energiesPtr);
}

