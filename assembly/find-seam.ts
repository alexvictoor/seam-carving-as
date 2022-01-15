let backPtrWeights: Int8Array = new Int8Array(0);

export function findVerticalSeam(
  energies: StaticArray<i16>,
  imageWidth: i32
): StaticArray<i32> {
  const numberOfPixels = energies.length;
  const imageHeight = numberOfPixels / imageWidth;
  if (backPtrWeights.length < numberOfPixels) {
    backPtrWeights = new Int8Array(numberOfPixels);
  }

  let weightIndex = imageWidth;

  const padding = StaticArray.fromArray([i32.MAX_VALUE]);
  let previousLineWeights: StaticArray<i32> = unchecked(
    StaticArray.concat(
      StaticArray.concat(
        padding,
        StaticArray.fromArray(
          StaticArray.slice(energies, 0, imageWidth).map<i32>((w) => <i32>w)
        )
      ),
      padding
    )
  );
  let currentLineWeights: StaticArray<i32> = new StaticArray<i32>(imageWidth + 2);
  
  // border padding
  currentLineWeights[0] = i32.MAX_VALUE;
  currentLineWeights[imageWidth + 1] = i32.MAX_VALUE;

  for (let j: i16 = 1; j < imageHeight; j++) {
    for (let i: i16 = 1; i <= imageWidth; i++, weightIndex++) {
      cumulateWeights(
        i,
        weightIndex,
        currentLineWeights,
        previousLineWeights,
        energies
      );
    }
    let swapTmp = currentLineWeights;
    currentLineWeights = previousLineWeights;
    previousLineWeights = swapTmp;
  }

  // find index of last seam pixel
  let lastIndex: i16 = 0;
  let lastIndexWeight = i32.MAX_VALUE;

  for (let i: i16 = 1; i <= imageWidth; i++) {
    let weight: i32 = unchecked(currentLineWeights[i]);
    if (weight < lastIndexWeight) {
      lastIndex = i - 1; // remove padding
      lastIndexWeight = weight;
    }
  }

  const weights = backPtrWeights;
  const seam = new StaticArray<i32>(imageHeight);
  unchecked((seam[imageHeight - 1] = lastIndex));
  //trace('seam', 2, imageHeight - 1, lastIndex);
  for (let i = imageHeight - 2; i + 1 > 0; i--) {
    let next = unchecked(seam[i + 1]);
    unchecked((seam[i] = next + weights[next + (i + 1) * imageWidth]));
    //trace('seam', 2, i, seam[i]);
  }

  return seam;
}

function cumulateWeights(
  x: i16,
  ptr: i32,
  currentLineWeights: StaticArray<i32>,
  previousLineWeights: StaticArray<i32>,
  energies: StaticArray<i16>
): void {
  let weight = unchecked(previousLineWeights[x]);
  let aboveXDelta: i8 = 0;
  const weightLeft = unchecked(previousLineWeights[x - 1]);
  if (weightLeft < weight) {
    /*if (this.forwardEnergy) {
      trace("weightLeft < weight", 2, weightLeft, weight);
    }*/
    weight = weightLeft;
    aboveXDelta = -1;
  }
  const weightRight = unchecked(previousLineWeights[x + 1]);
  if (weightRight < weight) {
    weight = weightRight;
    aboveXDelta = 1;
  }

  assert(<i16>x + aboveXDelta > -1);
  //trace("blabla", 2, ptr, this.backPtrWeights.length)
  unchecked(backPtrWeights[ptr] = aboveXDelta);
  //trace("blabla 2")
  unchecked((currentLineWeights[x] = unchecked(energies[ptr]) + weight));
}
