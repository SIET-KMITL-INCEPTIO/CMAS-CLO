# WebGL / Three.js / GLSL — Requirements Reference

## Extension Requirements Checklist

```
☐ GL_OES_standard_derivatives   → used for fwidth() in antialiasing
☐ OES_texture_float              → HDR / float textures
☐ WEBGL_depth_texture            → depth buffer access
☐ EXT_shader_texture_lod         → manual mip-map sampling
```

If extension is used without capability check, add requirement:
> **REQ-WGL-01**: Component must detect `GL_OES_standard_derivatives` support
> and fall back to fixed pixel-width AA when unavailable.

---

## Three.js Version Constraints

| Version | Breaking change |
|---|---|
| r128 | OrbitControls moved to examples; CapsuleGeometry unavailable (added r142) |
| r140+ | Material.needsUpdate deprecation warnings |
| r148+ | WebGPU backend available but not default |

Always document pinned version and reason in DEP register.

---

## WebGL Resource Lifecycle Requirements

For any component using WebGL, require:

```
✅ renderer.dispose()        — GPU buffer release
✅ geometry.dispose()        — VBO release
✅ material.dispose()        — Shader program release
✅ texture.dispose()         — Texture memory release
✅ renderer.forceContextLoss() — Explicit context release on unmount
✅ cancelAnimationFrame()    — Stop RAF loop
✅ ResizeObserver.disconnect() — Remove resize listener
✅ IntersectionObserver.disconnect() — Remove visibility listener
```

Missing any of these = **Memory Leak risk — P0 QA item**.

---

## Performance Tier Requirements

Define which tier the component must support:

| Tier | GPU | Target FPS | Max DPR | Notes |
|---|---|---|---|---|
| T1 High | Dedicated | 60 | 2.0 | Desktop/gaming |
| T2 Mid | Integrated | 45+ | 1.5 | MacBook Air, mid phones |
| T3 Low | Mobile GPU | 30+ | 1.0 | Budget Android, old iOS |

Adaptive DPR mechanism requirement:
> Component MUST implement adaptive DPR that reduces pixel ratio when
> measured FPS drops below threshold (suggested: <50fps → scale down).

---

## GLSL Uniform Documentation Template

Each uniform must be documented:

```glsl
// uniform float uWispDensity  — [0.0, 2.0]  — Controls wisp lane count (0=none, 1=normal, 2=dense)
// uniform float uFlowSpeed    — [0.1, 2.0]  — Vertical beam animation speed (DS default: 0.35)
// uniform vec3  uColor        — RGB [0,1]   — Beam colorization (DS token: C.periwinkle)
// uniform float uFade         — [0.0, 1.0]  — Master opacity, driven by mount animation
```

Flag any uniform without a range + semantic comment as `⚠️ UNDOCUMENTED UNIFORM`.

---

## Shader Compilation Requirements

> **REQ-WGL-02**: Shader must compile without errors in:
> - Chrome 90+ (WebGL 1.0)
> - Safari 15+ (WebGL 1.0, strict mode)
> - Firefox 90+ (WebGL 1.0)
> - Mobile Chrome (WebGL ES 2.0)

Test matrix required for shader-heavy components.