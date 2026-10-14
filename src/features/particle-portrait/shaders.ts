// GLSL sources for the Particle Portrait.
//
// LEGACY_VERTEX and LEGACY_FRAGMENT are verbatim copies of the strings in
// legacy/particle-portrait/portrait.js (enforced by tests/unit/shaders.test.ts). The maintained
// vertex shader is the legacy source plus two insertions, both limited to colour handling:
//   1. extra colour uniforms after `uniform vec2 uMouse;`
//   2. a botanical tone branch in front of the existing tone branches.
// Positions, pointer repulsion, ambient motion, scatter/reform and point size are untouched.

export const LEGACY_VERTEX = `attribute vec2 aPosition; attribute vec3 aColor; uniform vec2 uResolution; uniform float uScale,uPoint,uTime,uBurst,uForce,uTone; uniform vec2 uMouse; varying vec3 vColor; float rnd(vec2 v){return fract(sin(dot(v,vec2(12.9898,78.233)))*43758.5453);} void main(){vec2 p=aPosition;float seed=rnd(p);vec2 d=p-uMouse;float dist=length(d);float influence=exp(-dist*dist/0.025)*uForce;p+=d/max(dist,0.004)*influence*0.17;p+=vec2(sin(uTime*.7+seed*30.),cos(uTime*.6+seed*40.))*.0018;float angle=seed*6.28318;p+=vec2(cos(angle),sin(angle))*(.2+seed*.8)*uBurst;p+=aPosition*uBurst*.4;vec2 pixel=p*uScale;gl_Position=vec4(pixel/uResolution*2.,0.,1.);gl_PointSize=uPoint*(1.+uBurst*.25);float lum=dot(aColor,vec3(.2126,.7152,.0722));vColor=aColor;if(uTone>1.5)vColor=vec3(.52,1.,.63)*max(lum*1.6,.2);else if(uTone>.5)vColor=vec3(1.,.91,.75)*max(lum*1.5,.2);}`;

export const LEGACY_FRAGMENT = `precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.);}`;

export const UNIFORM_ANCHOR = 'uniform vec2 uMouse;';
export const TONE_ANCHOR = 'vColor=aColor;';

export const BOTANICAL_UNIFORMS = 'uniform vec3 uLow,uHigh,uAccLow,uAccHigh;';

// Fern-to-Linen luminance ramp. Strongly red source pixels (the tie in the portrait: measured
// green/red 0.17-0.31, versus 0.42+ for skin and jacket) take the Crimson-to-Rose accent ramp.
// `1.-smoothstep(a,b,x)` is used instead of smoothstep(b,a,x) because GLSL leaves
// smoothstep undefined when edge0 >= edge1.
export const BOTANICAL_BRANCH =
  'if(uTone>2.5){float gr=aColor.g/max(aColor.r,.001),br=aColor.b/max(aColor.r,.001);' +
  'float red=(1.-smoothstep(.27,.36,gr))*(1.-smoothstep(.18,.24,br))*step(.2,aColor.r);' +
  'vec3 base=mix(uLow,uHigh,pow(clamp(lum*1.3,0.,1.),1.15));' +
  'vec3 acc=mix(uAccLow,uAccHigh,clamp(lum*2.2,0.,1.));' +
  'vColor=mix(base,acc,red);}else ';

function insertAfter(source: string, anchor: string, insertion: string): string {
  const at = source.indexOf(anchor);
  if (at < 0 || source.indexOf(anchor, at + 1) >= 0) throw new Error(`shader anchor not unique: ${anchor}`);
  return source.slice(0, at + anchor.length) + insertion + source.slice(at + anchor.length);
}

export const VERTEX = insertAfter(
  insertAfter(LEGACY_VERTEX, UNIFORM_ANCHOR, BOTANICAL_UNIFORMS),
  TONE_ANCHOR,
  BOTANICAL_BRANCH,
);

export const FRAGMENT = LEGACY_FRAGMENT;
