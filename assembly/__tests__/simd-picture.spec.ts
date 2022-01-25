/*
 * This is a AssemblyScript port of the original Java version, which was written by
 * Gil Tene as described in
 * https://github.com/HdrHistogram/HdrHistogram
 * and released to the public domain, as explained at
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

import { computeEnergies } from "../picture";
import { computeEnergiesWithSIMD, initEnergyPicture, latestSeam } from "../simd-energy2";
//import { computeEnergiesWithSIMD } from "../simd-energy";
import { SimdEngine } from "../simd-engine";
import { SimdEngine as SimEngine2 } from "../simd-engine2";
import { SimdEngineFull } from "../simd-engine-full";
import { RegularEngine } from "../regular-engine";

describe("simd picture", () => {
  

  /*it("should compute same energy data with or without SIMD", () => {
    const pictureData = new Uint8Array(4096);
    for (let index: i16 = 0; index < 4096; index++) {
      pictureData[index] = <i8>(index % 255)
    }

    const energiesWithoutSIMD = new StaticArray<i16>(1000);
    const energiesWithSIMD = new StaticArray<i16>(1000);

    computeEnergies(pictureData, 100, energiesWithoutSIMD);
    computeEnergiesWithSIMD(pictureData, 100, 10, energiesWithSIMD);


    for (let index: i16 = 0; index < 1000; index++) {
      expect(energiesWithSIMD[index]).toStrictEqual(energiesWithoutSIMD[index], 'energies not equal at index ' + index.toString());
    }
  });*/

  xit("should compute same energy data with or without SIMD BIS", () => {
    const pictureData = new Uint8Array(4096);
    for (let index: i16 = 0; index < 4096; index++) {
      pictureData[index] = <i8>(index % 255)
    }
    
    const energiesWithoutSIMD = new StaticArray<i16>(1000);
    //const energiesWithSIMD = new StaticArray<i16>(1000);

    computeEnergies(pictureData, 100, energiesWithoutSIMD);
    initEnergyPicture(pictureData, 100, 10);
    const energiesWithSIMD = computeEnergiesWithSIMD(100, 10);

    /*log<i16>(energiesWithoutSIMD[1]);
    log<i16>(energiesWithSIMD[1]);
    log<i16>(energiesWithoutSIMD[2]);
    log<i16>(energiesWithSIMD[2]);*/

    for (let index: i16 = 0; index < 1000; index++) {
      expect(energiesWithSIMD[index]).toStrictEqual(energiesWithoutSIMD[index], 'energies not equal at index ' + index.toString());
    }
  });

  it("should shrink an image with or without SIMD", () => {
    const pictureData1 = new Uint8Array(4096);
    const pictureData2 = new Uint8Array(4096);
    for (let index: i16 = 0; index < 4096; index++) {
      pictureData1[index] = <i8>(index % 255)
      pictureData2[index] = <i8>(index % 255)
    }

    const engine1 = new SimdEngine();
    const engine2 = new RegularEngine();

    engine1.init(pictureData1, 128);
    engine2.init(pictureData2, 128);

    engine1.shrink();
    engine2.shrink();

    /*engine1.shrink();
    engine2.shrink();
    
    engine1.shrink();
    engine2.shrink();
    
    engine1.shrink();
    engine2.shrink();*/

    for (let index: i16 = 0; index < 1024 - 8; index++) {
      expect(pictureData1[index]).toStrictEqual(pictureData2[index], 'colors not equal at index ' + index.toString());
    }
  });
});
