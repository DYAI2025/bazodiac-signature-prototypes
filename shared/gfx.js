/**
 * gfx.js — small shared rendering helpers (glow sprites, starfield, renderer setup)
 * used by all three prototypes to get a consistent "Dark Luxury" look without
 * vendoring a full post-processing (bloom) pipeline.
 */
import * as THREE from '../lib/three/three.module.js';

/** Soft radial-gradient sprite texture, used for faux-bloom on points/markers. */
export function makeGlowTexture(hexColor = 0xffffff) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const c = new THREE.Color(hexColor);
    const r = Math.floor(c.r * 255), g = Math.floor(c.g * 255), b = Math.floor(c.b * 255);
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0.0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.25, `rgba(${r},${g},${b},0.6)`);
    grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

/** Configures a renderer for filmic, true-color output ("high graphical quality" baseline). */
export function configureRenderer(renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
}

/** Scattered point starfield for depth, sized to a bounding radius. */
export function makeStarfield(count = 1200, radius = 60) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = radius * (0.5 + Math.random() * 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.55 });
    return new THREE.Points(geo, mat);
}

/** Builds a glowing sprite mesh at a position with a given color + scale. */
export function makeGlowSprite(hexColor, scale = 1.5) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(hexColor),
        color: 0xffffff,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    sprite.scale.set(scale, scale, 1);
    return sprite;
}
