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
    return x >= this.width || y >= this.height;
  }

  @inline
  energyAt(x: i16, y: i16): i16 {
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


export function computeEnergiesWithSIMD(pictureData: Uint8Array, width: i32, energies: StaticArray<i16>): StaticArray<i16> {
    
    return energies;
}

