import { RegularEngine } from "./regular-engine";
import { SimdEngine } from "./simd-engine";

export const FLOAT64ARRAY_ID = idof<Float64Array>();
export const UINT32ARRAY_ID = idof<Uint32Array>();
export const UINT8ARRAY_ID = idof<Uint8Array>();

export interface Engine {
  init(data: Uint8Array, width: i32): void,
  shrink(): Uint8Array
}


let engine: Engine;

export function shrinkWidth(srcImage: Uint8Array, width: i32, useSimd: bool): Uint8Array {
  
  engine = new RegularEngine();
  if (useSimd) {
    engine = new SimdEngine();
  }
  
  engine.init(srcImage, width);
  return engine.shrink();
}
export function shrink(): Uint8Array {
  return engine.shrink();
}