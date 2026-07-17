import { ShaderMaterial, type IUniform, type Texture, type Vector2 } from "three"

export interface RefractionMaterialOptions {
  envMap: Texture
  backfaceMap: Texture
  resolution: Vector2
}

interface RefractionUniforms {
  envMap: IUniform<Texture>
  backfaceMap: IUniform<Texture>
  resolution: IUniform<Vector2>
  [key: string]: IUniform
}

/**
 * Ported VERBATIM from GUSGQ's diamonds/RefractionMaterial.js — GLSL unchanged
 * (including the commented alternative line). This is the effect: it samples the
 * scene FBO (envMap) at the fragment's screen UV displaced by refract() through
 * the gem's front/back normals — so the diamond acts as a LENS that warps the
 * titles behind it, not merely an environment reflection.
 */
export class RefractionMaterial extends ShaderMaterial {
  declare uniforms: RefractionUniforms

  constructor(options: RefractionMaterialOptions) {
    super({
      vertexShader: /* glsl */ `varying vec3 worldNormal;
      varying vec3 viewDirection;
      void main() {
        vec4 transformedNormal = vec4(normal, 0.);
        vec4 transformedPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          transformedNormal = instanceMatrix * transformedNormal;
          transformedPosition = instanceMatrix * transformedPosition;
        #endif
        worldNormal = normalize( modelViewMatrix * transformedNormal).xyz;
        viewDirection = normalize((modelMatrix * vec4( position, 1.0)).xyz - cameraPosition);;
        gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
      }`,
      fragmentShader: /* glsl */ `uniform sampler2D envMap;
      uniform sampler2D backfaceMap;
      uniform vec2 resolution;
      varying vec3 worldNormal;
      varying vec3 viewDirection;
      float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
        return pow(1.05 + dot(viewDirection, worldNormal), 100.0);
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec3 normal = worldNormal * (1.0 - 0.7) - texture2D(backfaceMap, uv).rgb * 0.7;
        vec4 color = texture2D(envMap, uv += refract(viewDirection, normal, 1.0/1.5).xy);
        //gl_FragColor = vec4(mix(color.rgb, vec3(0.15), fresnelFunc(viewDirection, normal)), 1.0);
        gl_FragColor = vec4(mix(color.rgb, vec3(0.4), fresnelFunc(viewDirection, normal)), 1.0);
      }`,
      uniforms: {
        envMap: { value: options.envMap },
        backfaceMap: { value: options.backfaceMap },
        resolution: { value: options.resolution }
      }
    })
  }
}
