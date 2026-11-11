import * as THREE from 'three';

// LUNA colour grade.
// Runs inside every material's final shading step through Three.js's CustomToneMapping hook,
// so it costs no extra rendering pass. Base: the same filmic ACES curve the game used before.
// On top of it, in display space:
//   1. shadows and mid-tones are lifted, so dark scenes stop looking muddy (blacks stay black);
//   2. a gentle S-curve adds contrast back, so the lifted image does not look flat;
//   3. saturation is raised 18% for richer, punchier colour;
//   4. a light split-tone: cool shadows, warm highlights (a cinematic look).
// Parameters are compiled in; GRADE below documents them for tests and tuning.
export const GRADE = { lift: 0.88, contrast: 0.26, saturation: 1.18, warmHighlights: [0.014, 0.005, -0.012], coolShadows: [-0.008, 0.0, 0.012] };

const v3 = a => 'vec3( ' + a.map(n => n.toFixed(4)).join(', ') + ' )';
const GRADE_GLSL = `vec3 CustomToneMapping( vec3 color ) {
	vec3 c = ACESFilmicToneMapping( color );
	vec3 p = pow( max( c, vec3( 0.0 ) ), vec3( 1.0 / 2.2 ) );
	p = pow( p, vec3( ${GRADE.lift.toFixed(4)} ) );
	p = mix( p, p * p * ( 3.0 - 2.0 * p ), ${GRADE.contrast.toFixed(4)} );
	float luma = dot( p, vec3( 0.2126, 0.7152, 0.0722 ) );
	p = mix( vec3( luma ), p, ${GRADE.saturation.toFixed(4)} );
	p += ${v3(GRADE.warmHighlights)} * luma + ${v3(GRADE.coolShadows)} * ( 1.0 - luma );
	return pow( clamp( p, 0.0, 1.0 ), vec3( 2.2 ) );
}`;

const STUB = 'vec3 CustomToneMapping( vec3 color ) { return color; }';

export function installColorGrade() {
  const chunk = THREE.ShaderChunk.tonemapping_pars_fragment;
  if (chunk.includes('LUNA colour grade')) return true;
  if (!chunk.includes(STUB)) return false;
  THREE.ShaderChunk.tonemapping_pars_fragment = chunk.replace(STUB, '// LUNA colour grade\n' + GRADE_GLSL);
  return true;
}

// Use for every WebGLRenderer the game draws with.
export function gradeRenderer(device) {
  if (installColorGrade() && device) device.toneMapping = THREE.CustomToneMapping;
  return device;
}
