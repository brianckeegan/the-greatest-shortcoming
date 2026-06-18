# Shaders (GLSL) — ShaderMaterial, uniforms, onBeforeCompile

**Use when** writing custom GLSL effects, vertex displacement, or patching a
built-in material. (For the WebGPU backend use **TSL**, not GLSL — see
`webgpu-tsl.md`.)

**ALWAYS**
- Use `ShaderMaterial` (gets Three's built-in uniforms/attributes:
  `projectionMatrix`, `modelViewMatrix`, `position`, `uv`, `normal`) unless you
  truly need `RawShaderMaterial` (no built-ins, declare everything).
- Pass uniforms as `{ uName: { value } }`; mutate `.value` each frame (no
  `needsUpdate` needed for uniform values). Changing `defines` needs
  `material.needsUpdate = true`.
- Declare matching `varying`s in both stages; set `precision`/`#version 300 es`
  (`glslVersion: THREE.GLSL3`) consistently.

**NEVER**
- Re-create the material per frame to update a uniform — update `.value`.
- Expect lighting/fog for free in `ShaderMaterial` — you write it, or patch a
  lit material via `onBeforeCompile`.

## Core API
- `ShaderMaterial({ uniforms, vertexShader, fragmentShader, glslVersion })`,
  `RawShaderMaterial`, `THREE.UniformsLib`, `THREE.ShaderChunk`,
  `material.onBeforeCompile(shader)`, `THREE.UniformsUtils.clone`.

## Pattern — minimal ShaderMaterial
```javascript
const mat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xb0382a) } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
    void main(){ gl_FragColor = vec4(uColor * (0.5 + 0.5*sin(uTime + vUv.x*6.28)), 1.0); }`,
});
// loop: mat.uniforms.uTime.value = clock.getElapsedTime();
```

## Pattern — patch a built-in material
```javascript
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader
    .replace('#include <begin_vertex>',
      '#include <begin_vertex>\n transformed.y += sin(position.x*4.0 + uTime)*0.1;');
  material.userData.shader = shader; // keep a handle to update uTime
};
```

## Gotchas
- WebGPU backend ignores GLSL — porting a GLSL effect means rewriting in TSL.
- `onBeforeCompile` keeps PBR lighting/shadows; full `ShaderMaterial` does not.

## Docs
https://threejs.org/docs/#api/en/materials/ShaderMaterial ·
https://threejs.org/manual/#en/post-processing-3dlut (shader chunks)
