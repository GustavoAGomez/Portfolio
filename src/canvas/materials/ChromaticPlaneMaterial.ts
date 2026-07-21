import { shaderMaterial } from "@react-three/drei"
import { extend, type Object3DNode } from "@react-three/fiber"
import { Color, ShaderMaterial, type Texture } from "three"
import { BRAND } from "../../config/tokens"

/**
 * Ported from GUSGQ's CustomMaterial.js (components/CustomMaterial.js) into a
 * clean, typed drei shaderMaterial. Keeps the three original ideas:
 *   1. Sinusoidal vertex wobble driven by uShift (scroll delta).
 *   2. Chromatic split in the fragment: the ±offset samples (offset scaled by
 *      uShift along a fixed angle) are tinted by the two PALETTE accents
 *      (uSplitA / uSplitB) instead of the classic red/blue channel fringe — the
 *      media decomposes into the brand's two colours on fast scroll. Reduces to
 *      the plain image at rest (offset → 0).
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
  /** Split-fringe tints — the two palette accents (default accentA / accentB). */
  uSplitA: Color
  uSplitB: Color
  uOpacity: number
}

export const ChromaticPlaneMaterial = shaderMaterial(
  {
    uMap: null,
    uHasMap: 0,
    uShift: 0,
    uScale: 0,
    uColor: new Color("#ffffff"),
    uSplitA: new Color(BRAND.accentA),
    uSplitB: new Color(BRAND.accentB),
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
    uniform vec3 uSplitA;
    uniform vec3 uSplitB;
    varying vec2 vUv;
    void main() {
      float angle = 1.55;
      vec2 p = (vUv - 0.5) * (1.0 - uScale) + 0.5;
      vec2 offset = uShift / 4.0 * vec2(cos(angle), sin(angle));
      if (uHasMap > 0.5) {
        // Chromatic split, but tinted by the two palette accents instead of the
        // R/B channel fringe. The ±offset samples add coloured fringes weighted by
        // how their luminance deviates from the centre — zero at rest (offset→0),
        // so the plain image is untouched until you scroll.
        vec3 W = vec3(0.299, 0.587, 0.114);
        float S = 1.5; // fringe strength
        vec4 base = texture2D(uMap, p);
        float lb = dot(base.rgb, W);
        float lp = dot(texture2D(uMap, p + offset).rgb, W);
        float lm = dot(texture2D(uMap, p - offset).rgb, W);
        vec3 col = base.rgb + (uSplitA * (lp - lb) + uSplitB * (lm - lb)) * S;
        gl_FragColor = vec4(col, base.a * uOpacity);
      } else {
        gl_FragColor = vec4(uColor, uOpacity);
      }
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
