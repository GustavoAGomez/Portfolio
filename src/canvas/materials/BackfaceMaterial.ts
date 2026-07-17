import { BackSide, ShaderMaterial } from "three"

/**
 * Ported VERBATIM from GUSGQ's diamonds/BackfaceMaterial.js — GLSL unchanged.
 * Renders the diamond's back-faces encoded as world-space normals into an FBO;
 * RefractionMaterial reads that to bend the scene behind the gem.
 */
export class BackfaceMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: /* glsl */ `varying vec3 worldNormal;
      void main() {
        vec4 transformedNormal = vec4(normal, 0.);
        vec4 transformedPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          transformedNormal = instanceMatrix * transformedNormal;
          transformedPosition = instanceMatrix * transformedPosition;
        #endif
        worldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
      }`,
      fragmentShader: /* glsl */ `varying vec3 worldNormal;
      void main() {
        gl_FragColor = vec4(worldNormal, 1.0);
      }`,
      side: BackSide
    })
  }
}
