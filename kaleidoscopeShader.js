export const kaleidoscopeFragmentShader = `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uSegments;
uniform float uAngle;
uniform float uZoom;
uniform float uTime;
uniform float uKaleidoSpin;
uniform float uEnergy;
uniform vec3 uColorWash;

varying vec2 vUv;

const float PI = 3.14159265359;

// Glass front simulation functions
vec2 applyBarrelDistortion(vec2 uv, float strength) {
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = uv - center;
    float r = length(delta);
    float factor = 1.0 + strength * r * r;
    return center + delta * factor;
}

float calculateVignette(vec2 uv, float strength) {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    return 1.0 - smoothstep(0.4, 1.0, dist) * strength;
}

void main() {
    // Normalize UV to -1.0 to 1.0
    vec2 uv = vUv * 2.0 - 1.0;

    // Adjust for aspect ratio
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;

    // Convert to Polar Coordinates
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Apply Rotation (user interaction)
    a += uAngle;

    // Add independent kaleidoscope spin
    a += uKaleidoSpin;

    // Kaleidoscope Logic
    float segmentAngle = 2.0 * PI / uSegments;

    // Wrap angle
    a = mod(a, segmentAngle);

    // Mirroring (Fold)
    a = abs(a - segmentAngle / 2.0);

    // Audio-reactive ripple distortion
    float ripple = uEnergy * 0.15 * sin(r * 10.0 - uTime * 5.0);
    float distortedR = r + ripple;

    // Convert back to Cartesian with NON-LINEAR RADIAL COMPRESSION
    float radialFactor = pow(distortedR, 0.7);
    vec2 newUv = vec2(cos(a), sin(a)) * radialFactor;

    // Zoom
    newUv /= uZoom;

    // Pan/Offset to sample different parts of the texture based on time or other factors
    vec2 offset = vec2(0.5, 0.5); // Center of source texture

    // Add spiral sampling pattern to always hit texture content
    float spiralPhase = atan(newUv.y, newUv.x);
    float spiralRadius = length(newUv);
    vec2 spiralOffset = vec2(
        cos(spiralPhase + uTime * 0.1) * 0.15 * spiralRadius,
        sin(spiralPhase + uTime * 0.1) * 0.15 * spiralRadius
    );

    // Map back to 0.0 - 1.0 range for texture sampling
    float timeAngle = uTime * 0.05;
    mat2 rot = mat2(cos(timeAngle), -sin(timeAngle), sin(timeAngle), cos(timeAngle));
    newUv = rot * newUv;
    vec2 sampleUv = newUv + offset + spiralOffset;

    // Ensure wrapping for seamless tiling
    sampleUv = fract(sampleUv);

    // Apply lens distortion (barrel/pincushion) for glass front effect
    sampleUv = applyBarrelDistortion(sampleUv, 0.15);

    vec4 color = texture2D(tDiffuse, sampleUv);

    // Prismatic light dispersion -- rainbow fan at edges
    vec2 aberrationDir = normalize(uv);
    float basePrism = 0.008 * r * r;
    float energyBoost = 1.0 + uEnergy * 2.0; // 1x to 3x during loud passages
    float prism = basePrism * energyBoost;

    // 5-sample prismatic spread with spectral bleeding
    float r_ch = texture2D(tDiffuse, applyBarrelDistortion(sampleUv + aberrationDir * prism * 1.5, 0.15)).r;
    float g_ch = texture2D(tDiffuse, applyBarrelDistortion(sampleUv + aberrationDir * prism * 0.5, 0.15)).g;
    float b_ch = texture2D(tDiffuse, applyBarrelDistortion(sampleUv - aberrationDir * prism * 1.0, 0.15)).b;

    // Extra spectral color bleeding for rainbow effect
    float yellow = texture2D(tDiffuse, applyBarrelDistortion(sampleUv + aberrationDir * prism * 1.0, 0.15)).r * 0.25;
    float cyan   = texture2D(tDiffuse, applyBarrelDistortion(sampleUv - aberrationDir * prism * 0.3, 0.15)).g * 0.25;

    color.r = r_ch + yellow;
    color.g = g_ch + yellow + cyan;
    color.b = b_ch + cyan;

    // Apply vignette for tube effect
    float vignette = calculateVignette(sampleUv, 0.3);
    color.rgb *= vignette;

    // Fresnel-like edge glow
    float edgeGlow = pow(1.0 - vignette, 2.0) * 0.3;
    color.rgb += edgeGlow;

    // Simulate internal reflections (subtle ghosting)
    vec2 ghostUv = sampleUv * 0.98 + 0.01;
    vec4 ghost = texture2D(tDiffuse, ghostUv) * 0.15;
    color = mix(color, color + ghost, r * 0.3);

    // Color wash -- subtle tint overlay based on audio mode
    color.rgb = mix(color.rgb, color.rgb + uColorWash, 0.15);

    // Film grain -- analog texture
    float grain = fract(sin(dot(vUv * uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    grain = (grain - 0.5) * 2.0;
    float grainAmount = 0.03 + uEnergy * 0.05;
    color.rgb += grain * grainAmount;

    gl_FragColor = color;
}
`;

export const kaleidoscopeVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Feedback blend shader for trail/afterimage effect
export const feedbackFragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tPreviousFrame;
uniform float uFeedback;
varying vec2 vUv;

void main() {
    vec4 current = texture2D(tDiffuse, vUv);
    vec4 previous = texture2D(tPreviousFrame, vUv);
    gl_FragColor = mix(current, previous, uFeedback);
}
`;

export const feedbackVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
