/*
 * This is a AssemblyScript port of the original Java version, which was written by
 * Gil Tene as described in
 * https://github.com/HdrHistogram/HdrHistogram
 * and released to the public domain, as explained at
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

describe("simd experimentation", () => {
  xit("should...", () => {
    const firstPtr = heap.alloc(1);
    const secondPtr = heap.alloc(1);
    store<u8>(firstPtr, 200);
    store<u8>(firstPtr + 1, 1);
    store<u8>(firstPtr + 2, 1);

    store<u8>(secondPtr, 1);
    store<u8>(secondPtr + 1, 1);
    store<u8>(secondPtr + 2, 200);
    const firstColorVec = v128.load_ext<u8>(firstPtr);
    const secondColorVec = v128.load_ext<u8>(secondPtr);

    /*log<i16>(v128.extract_lane<i16>(firstColorVec, 0));
    log<i16>(v128.extract_lane<i16>(firstColorVec, 1));
    log<i16>(v128.extract_lane<i16>(firstColorVec, 2));*/

    const deltaVector = v128.sub<i16>(firstColorVec, secondColorVec);
    log<i16>(v128.extract_lane<i16>(deltaVector, 0));
    log<i16>(v128.extract_lane<i16>(deltaVector, 1));
    log<i16>(v128.extract_lane<i16>(deltaVector, 2));
    const deltaSqVector = v128.mul<i16>(deltaVector, deltaVector);

    log<i32>(v128.extract_lane<i32>(deltaSqVector, 0));

    const result = Mathf.sqrt(
      <f32>v128.extract_lane<i32>(deltaSqVector, 0) +
      <f32>v128.extract_lane<i32>(deltaSqVector, 1) +
      <f32>v128.extract_lane<i32>(deltaSqVector, 2)
    );

    log<f32>(result);

    const d = v128.convert<i32>(deltaSqVector);
    

    const result2 = Mathf.sqrt(
        v128.extract_lane<f32>(d, 0) +
        v128.extract_lane<f32>(d, 1) +
        v128.extract_lane<f32>(d, 2)
      );
  
      log<f32>(result2);

      v128.store(firstPtr, d);
      const result3 = Mathf.sqrt(
          load<f32>(firstPtr) + load<f32>(firstPtr + 4) + load<f32>(firstPtr + 8)
      );
  
      log<f32>(result3);


  });
  xit("should 2...", () => {
    const firstPtr = heap.alloc(16);
    store<u8>(firstPtr, 1);
    store<u8>(firstPtr + 1, 2);
    store<u8>(firstPtr + 2, 3);
    store<u8>(firstPtr + 3, 4);
    store<u8>(firstPtr + 4, 5);
    store<u8>(firstPtr + 5, 6);
    store<u8>(firstPtr + 6, 7);
    store<u8>(firstPtr + 7, 8);
    store<u8>(firstPtr + 8, 9);
    store<u8>(firstPtr + 9, 10);
    store<u8>(firstPtr + 10, 11);
    store<u8>(firstPtr + 11, 12);
    store<u8>(firstPtr + 12, 13);
    store<u8>(firstPtr + 13, 14);
    store<u8>(firstPtr + 14, 15);
    store<u8>(firstPtr + 15, 16);

    const firstColorVec = v128.load(firstPtr);

    log<u8>(v128.extract_lane<u8>(firstColorVec, 10));

    const deltaSqVector = v128.mul<i16>(firstColorVec, firstColorVec);

    log<i32>(v128.extract_lane<i32>(deltaSqVector, 0));

  });
  xit("should extend...", () => {
    const firstPtr = heap.alloc(16);
    store<u8>(firstPtr, 1);
    store<u8>(firstPtr + 1, 2);
    store<u8>(firstPtr + 2, 3);
    store<u8>(firstPtr + 3, 4);
    store<u8>(firstPtr + 4, 5);
    store<u8>(firstPtr + 5, 6);
    store<u8>(firstPtr + 6, 7);
    store<u8>(firstPtr + 7, 8);
    store<u8>(firstPtr + 8, 9);
    store<u8>(firstPtr + 9, 10);
    store<u8>(firstPtr + 10, 11);
  

    const firstColorVec = v128.load(firstPtr);
    const exFirstColorVec = v128.extend_low<u8>(firstColorVec);

    /*log<u16>(v128.extract_lane<u16>(exFirstColorVec, 0));
    log<u16>(v128.extract_lane<u16>(exFirstColorVec, 1));
    log<u16>(v128.extract_lane<u16>(exFirstColorVec, 2));
    log<u16>(v128.extract_lane<u16>(exFirstColorVec, 3));
    log<u16>(v128.extract_lane<u16>(exFirstColorVec, 4));*/

    /*log<i16>(v128.extract_lane<i16>(firstColorVec, 0));
    log<i16>(v128.extract_lane<i16>(firstColorVec, 1));
    log<i16>(v128.extract_lane<i16>(firstColorVec, 2));
    log<i16>(v128.extract_lane<i16>(firstColorVec, 7));*/

    const squareVector = v128.mul<i16>(exFirstColorVec, exFirstColorVec);

    log<i16>(v128.extract_lane<i16>(squareVector, 1));
    log<i16>(v128.extract_lane<i16>(squareVector, 2));
    log<i16>(v128.extract_lane<i16>(squareVector, 3));
    log<i16>(v128.extract_lane<i16>(squareVector, 7));

    //const result = v128.convert<i32>(squareVector);


    //log<f32>(v128.extract_lane<f32>(result, 1));
    const resultPtr = heap.alloc(16);
    v128.store(resultPtr, squareVector);
    log<i16>(load<i16>(resultPtr + 14));

  });

  xit("should typed array...", () => {
    const data = new StaticArray<u8>(128);
    data[0] = 42;
    data[1] = 12;
    data[2] = 36;
    log<u8>(data[1]);
    const ptr = changetype<usize>(data);
    log<usize>(ptr);
    const vec = v128.load(ptr);
    log<u8>(v128.extract_lane<u8>(vec, 2))
  });

  xit("should typed array bis...", () => {
    const data = new StaticArray<i16>(128);
    data[0] = 42;
    data[1] = 12;
    data[2] = 36;
    log<i16>(data[1]);
    const ptr = changetype<usize>(data);
    log<usize>(ptr);
    const vec = v128.load(ptr);
    const vec2 = v128.mul<i16>(vec, vec)
    v128.store(ptr, vec2)
    log<i16>(data[1]);
    log<i16>(v128.extract_lane<i16>(vec, 1))
  });

  xit("should abs", () => {
    const data = new StaticArray<i8>(128);
    data[0] = 42;
    data[1] = -12;
    data[2] = 36;
    data[3] = 36;
   
    const ptr = changetype<usize>(data);
    
    const vec = v128.load_ext<i8>(ptr);
    log<i16>(v128.extract_lane<i16>(vec, 0))
    log<i16>(v128.extract_lane<i16>(vec, 1))
    const abVec = v128.abs<i16>(vec);
    log<i16>(v128.extract_lane<i16>(abVec, 1))
  });

  xit("should compare", () => {
      const centerData = new StaticArray<i8>(128);
      centerData[0] = 10;
      centerData[1] = 1;
      centerData[2] = 12;
      centerData[3] = 3;
      centerData[4] = 4;
      centerData[5] = 15;
      centerData[6] = 16;
      centerData[7] = 17;
     
      const centerPtr = changetype<usize>(centerData);
      
      const centerVec = v128.load_ext<i8>(centerPtr);

      const leftData = new StaticArray<i8>(128);
      leftData[0] = 0;
      leftData[1] = 1;
      leftData[2] = 2;
      leftData[3] = 3;
      leftData[4] = 14;
      leftData[5] = 15;
      leftData[6] = 16;
      leftData[7] = 7;
     
      const leftPtr = changetype<usize>(leftData);
      
      const leftVec = v128.load_ext<i8>(leftPtr);

      const rightData = new StaticArray<i8>(128);
      rightData[0] = 10;
      rightData[1] = 11;
      rightData[2] = 12;
      rightData[3] = 13;
      rightData[4] = 14;
      rightData[5] = 5;
      rightData[6] = 6;
      rightData[7] = 7;
     
      const rightPtr = changetype<usize>(rightData);
      
      const rightVec = v128.load_ext<i8>(rightPtr);
      
      const result = v128.min<i16>(v128.min<i16>(leftVec, centerVec), rightVec);

      log<string>(
        v128.extract_lane<i16>(result, 0).toString() + ' ' +
        v128.extract_lane<i16>(result, 1).toString() + ' ' +
        v128.extract_lane<i16>(result, 2).toString() + ' ' +
        v128.extract_lane<i16>(result, 3).toString() + ' ' +
        v128.extract_lane<i16>(result, 4).toString() + ' ' +
        v128.extract_lane<i16>(result, 5).toString() + ' ' +
        v128.extract_lane<i16>(result, 6).toString() + ' ' +
        v128.extract_lane<i16>(result, 7).toString()
      );

      //const result2 = v128.le<i16>(leftVec, result);
      //const result2 = v128.not(v128.le<i16>(rightVec, result));
      const result2 = v128.or(
        v128.le<i16>(leftVec, result),
        v128.neg<i16>(v128.le<i16>(rightVec, result))
      );

      log<string>(
        v128.extract_lane<i16>(result2, 0).toString() + ' ' +
        v128.extract_lane<i16>(result2, 1).toString() + ' ' +
        v128.extract_lane<i16>(result2, 2).toString() + ' ' +
        v128.extract_lane<i16>(result2, 3).toString() + ' ' +
        v128.extract_lane<i16>(result2, 4).toString() + ' ' +
        v128.extract_lane<i16>(result2, 5).toString() + ' ' +
        v128.extract_lane<i16>(result2, 6).toString() + ' ' +
        v128.extract_lane<i16>(result2, 7).toString()
      );

      /*const result = v128.lt<i16>(vec2, vec);
      log<i16>(v128.extract_lane<i16>(result, 0))
      log<i16>(v128.extract_lane<i16>(result, 1))
      log<i16>(v128.extract_lane<i16>(result, 2))
      log<i16>(v128.extract_lane<i16>(result, 3))*/

      const result3 =  v128.swizzle(i32x4(-1, 0, 1, -1), v128(0, 4, 8, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));

      log<string>(
        v128.extract_lane<i8>(result3, 0).toString() + ' ' +
        v128.extract_lane<i8>(result3, 1).toString() + ' ' +
        v128.extract_lane<i8>(result3, 2).toString() + ' ' +
        v128.extract_lane<i8>(result3, 3).toString() + ' ' +
        v128.extract_lane<i8>(result3, 4).toString() + ' ' +
        v128.extract_lane<i8>(result3, 5).toString() + ' ' +
        v128.extract_lane<i8>(result3, 6).toString() + ' ' +
        v128.extract_lane<i8>(result3, 7).toString()
      );

  });

  xit("should load offset", () => {
    const data = new StaticArray<i8>(128);
    data[0] = 10;
    data[1] = 11;
    data[2] = 12;
    data[3] = 13;
    data[4] = 14;
    data[5] = 15;
   
    const ptr = changetype<usize>(data);
    
    const vec = v128.load(ptr, 3);
    log<i16>(v128.extract_lane<i8>(vec, 0))
   
  });
});
