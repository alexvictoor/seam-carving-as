let backPtrWeights: StaticArray<i32> = new StaticArray<i32>(0);
let backPtrWeightsPtr = changetype<usize>(backPtrWeights);

export function findVerticalSeam(
  energies: StaticArray<i16>,
  imageWidth: i32,
  numberOfPixels: i32
): StaticArray<i32> {

  const imageHeight = numberOfPixels / imageWidth;
  if (backPtrWeights.length < numberOfPixels) {
    backPtrWeights = new StaticArray<i32>(numberOfPixels + 8);
    backPtrWeightsPtr = changetype<usize>(backPtrWeights);
  }

  let weightIndex = imageWidth;

  const paddingLeft = StaticArray.fromArray([i32.MAX_VALUE]);
  const paddingRight = StaticArray.fromArray([
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE, 
    i32.MAX_VALUE
  ]);
  let previousLineWeights: StaticArray<i32> = unchecked(
    StaticArray.concat(
      StaticArray.concat(
        paddingLeft,
        StaticArray.fromArray(
          StaticArray.slice(energies, 0, imageWidth).map<i32>((w) => <i32>w)
        )
      ),
      paddingRight
    )
  );
  let currentLineWeights: StaticArray<i32> = new StaticArray<i32>(imageWidth + 1 + 8);

  for (let j: i16 = 1; j < imageHeight; j++) {
    weightIndex = imageWidth * j;
    for (let i: i16 = 1; i <= imageWidth; i = i + 4, weightIndex = weightIndex + 4) {
      cumulateWeightsSIMD(
        i,
        weightIndex,
        currentLineWeights,
        previousLineWeights,
        energies
      );
    }
    addBorderPadding(currentLineWeights);
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

@inline
function addBorderPadding(lineWeights: StaticArray<i32>): void {
  unchecked(lineWeights[0] = i32.MAX_VALUE);
  const length = lineWeights.length;
  for (let i: i16 = 1; i <= 8; i++) {
    unchecked(lineWeights[length - i] = i32.MAX_VALUE);
  }
}

@inline
function cumulateWeightsSIMD(
  x: i16,
  energyIndex: i32,
  currentLineWeights: StaticArray<i32>,
  previousLineWeights: StaticArray<i32>,
  energies: StaticArray<i16>
): void {

  //log<string>('coucou');

  const previousWeightsPtr = changetype<usize>(previousLineWeights);

  const centerWeightVector = v128.load(previousWeightsPtr + (x << 2));
  const leftWeightVector = v128.load(previousWeightsPtr + ((x - 1) << 2));
  const rightWeightVector = v128.load(previousWeightsPtr + ((x + 1) << 2));

  const minWeightVector = v128.min<i32>(v128.min<i32>(leftWeightVector, centerWeightVector), rightWeightVector);
  
  const energiesPtr = changetype<usize>(energies);
  const energyVector = v128.load_ext<i16>(energiesPtr + (energyIndex << 1));
  
  const newWeightsVector = v128.add<i32>(minWeightVector, energyVector);

  //log<string>('coucou2');
  
  const currentLineWeightsPtr = changetype<usize>(currentLineWeights);
  v128.store(currentLineWeightsPtr + (x << 2), newWeightsVector);

  //log<string>('coucou3');
  //const backPtrWeightsPtr = changetype<usize>(backPtrWeights);
  const aboveXDeltaVector = v128.or(
    v128.le<i32>(leftWeightVector, minWeightVector),
    v128.neg<i32>(v128.le<i32>(rightWeightVector, minWeightVector))
  );

  /*log<string>(
    v128.extract_lane<i32>(aboveXDeltaVector, 0).toString() + ' ' +
    v128.extract_lane<i32>(aboveXDeltaVector, 1).toString() + ' ' +
    v128.extract_lane<i32>(aboveXDeltaVector, 2).toString() + ' ' +
    v128.extract_lane<i32>(aboveXDeltaVector, 3).toString() 
  );*/
  //trace("backPtrWeights", 2, energyIndex, backPtrWeights.length);

  /*unchecked(backPtrWeights[energyIndex] = v128.extract_lane<i32>(aboveXDeltaVector, 0));
  unchecked(backPtrWeights[energyIndex + 1] = v128.extract_lane<i32>(aboveXDeltaVector, 1));
  unchecked(backPtrWeights[energyIndex + 2] = v128.extract_lane<i32>(aboveXDeltaVector, 2));
  unchecked(backPtrWeights[energyIndex + 3] = v128.extract_lane<i32>(aboveXDeltaVector, 3));*/

  //const backPtrWeightsPtr = changetype<usize>(backPtrWeights);
  v128.store(backPtrWeightsPtr, aboveXDeltaVector);

  /*const aboveXDeltaVectorI8 = v128.swizzle(aboveXDeltaVector, v128(0, 4, 8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));
  const ptr = backPtrWeightsPtr + energyIndex;
  v128.store(ptr, aboveXDeltaVectorI8);*/


  /*v128.store8_lane(ptr, aboveXDeltaVectorI8, 0, 0);
  v128.store8_lane(ptr, aboveXDeltaVectorI8, 1, 1);
  v128.store8_lane(ptr, aboveXDeltaVectorI8, 2, 2);
  v128.store8_lane(ptr, aboveXDeltaVectorI8, 3, 3);*/
  
  //const aboveXDeltaVectorI8 = v128.swizzle(aboveXDeltaVector, v128(0, 4, 8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));
  
  /*const backPtrWeightsPtr = changetype<usize>(backPtrWeights);
  const ptr = backPtrWeightsPtr + energyIndex;
  v128.store8_lane(ptr, aboveXDeltaVector, 0, 0);
  v128.store8_lane(ptr, aboveXDeltaVector, 4, 1);
  v128.store8_lane(ptr, aboveXDeltaVector, 8, 2);
  v128.store8_lane(ptr, aboveXDeltaVector, 12, 3);*/
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
