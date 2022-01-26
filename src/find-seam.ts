let backPtrWeights: Int8Array = new Int8Array(0);

const i32_MAX_VALUE = Math.pow(2, 31) -1; 

export function findVerticalSeam(
  energies: Int16Array,
  imageWidth: number,
  imageHeight: number,
  numberOfPixels: number
): Int32Array {
  if (backPtrWeights.length < numberOfPixels) {
    backPtrWeights = new Int8Array(numberOfPixels);
  }

  let weightIndex = imageWidth;

  const padding = new Int32Array([i32_MAX_VALUE]);
  let previousLineWeights = new Int32Array(imageWidth + 2);
  previousLineWeights[0] = i32_MAX_VALUE;
  previousLineWeights[imageWidth + 1] = i32_MAX_VALUE;
  previousLineWeights.set(energies.slice(0, imageWidth), 1);

  let currentLineWeights = new Int32Array(imageWidth + 2);
  
  // border padding
  currentLineWeights[0] = i32_MAX_VALUE;
  currentLineWeights[imageWidth + 1] = i32_MAX_VALUE;

  for (let j: number = 1; j < imageHeight; j++) {
    for (let i: number = 1; i <= imageWidth; i++, weightIndex++) {
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
  let lastIndex = 0;
  let lastIndexWeight = i32_MAX_VALUE;

  for (let i = 1; i <= imageWidth; i++) {
    let weight = currentLineWeights[i];
    if (weight < lastIndexWeight) {
      lastIndex = i - 1; // remove padding
      lastIndexWeight = weight;
    }
  }

  const weights = backPtrWeights;
  const seam = new Int32Array(imageHeight);
  seam[imageHeight - 1] = lastIndex;
  //trace('seam', 2, imageHeight - 1, lastIndex);
  for (let i = imageHeight - 2; i + 1 > 0; i--) {
    let next = seam[i + 1];
    seam[i] = next + weights[next + (i + 1) * imageWidth];
    //trace('seam', 2, i, seam[i]);
  }

  return seam;
}

function cumulateWeights(
  x: number,
  ptr: number,
  currentLineWeights: Int32Array,
  previousLineWeights: Int32Array,
  energies: Int16Array
): void {
  let weight = previousLineWeights[x];
  let aboveXDelta = 0;
  const weightLeft = previousLineWeights[x - 1];
  if (weightLeft < weight) {
    /*if (this.forwardEnergy) {
      trace("weightLeft < weight", 2, weightLeft, weight;
    }*/
    weight = weightLeft;
    aboveXDelta = -1;
  }
  const weightRight = previousLineWeights[x + 1];
  if (weightRight < weight) {
    weight = weightRight;
    aboveXDelta = 1;
  }

  //trace("blabla", 2, ptr, this.backPtrWeights.length)
  backPtrWeights[ptr] = aboveXDelta;
  //trace("blabla 2")
  currentLineWeights[x] = energies[ptr] + weight;
}
