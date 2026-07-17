import { shaderMaterial } from "@react-three/drei"
import { extend, type Object3DNode } from "@react-three/fiber"
import { Color, ShaderMaterial, type Texture } from "three"

/**
 * Ported from GUSGQ's CustomMaterial.js (components/CustomMaterial.js) into a
 * clean, typed drei shaderMaterial. Keeps the three original ideas:
 *   1. Sinusoidal vertex wobble driven by uShift (scroll delta).
 *   2. RGB-split / chromatic aberration in the fragment: r/g/b sampled at
 *      p ± offset, offset scaled by uShift along a fixed angle.
 *   3. UV "zoom" by uScale (content pushes in/out with offset).
 *
 * uShift is a lerped scroll-velocity value set from the store by the consumer —
 * the decay back to rest comes from THAT lerp, not from the shader.
 */
export interface ChromaticUniforms {
  uMap: Texture | null
  uHasMap: number
  uShift: number
  uScale: number
  uColor: Color
  uOpacity: number
}

export const ChromaticPlaneMaterial = shaderMaterial(
  {
    uMap: null,
    uHasMap: 0,
    uShift: 0,
    uScale: 0,
    uColor: new Color("#ffffff"),
    uOpacity: 1
  } satisfies ChromaticUniforms,
  /* glsl */ `
    uniform float uShift;
    varying vec2 vUv;
    void main() {
      vec3 pos = position;
      pos.y += sin(uv.x * 3.141592653589793) * uShift * 2.0 * 0.125;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uShift;
    uniform float uScale;
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float angle = 1.55;
      vec2 p = (vUv - 0.5) * (1.0 - uScale) + 0.5;
      vec2 offset = uShift / 4.0 * vec2(cos(angle), sin(angle));
      vec4 cr = texture2D(uMap, p + offset);
      vec4 cga = texture2D(uMap, p);
      vec4 cb = texture2D(uMap, p - offset);
      if (uHasMap > 0.5) gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a * uOpacity);
      else gl_FragColor = vec4(uColor, uOpacity);
    }
  `
)

extend({ ChromaticPlaneMaterial })

// drei's shaderMaterial doesn't surface the uniform props on the instance type,
// so intersect them in explicitly for a fully-typed ref (no `any`).
export type ChromaticPlaneMaterialImpl = ShaderMaterial & ChromaticUniforms

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      chromaticPlaneMaterial: Object3DNode<ChromaticPlaneMaterialImpl, typeof ChromaticPlaneMaterial>
    }
  }
}
