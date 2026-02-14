# Lumina Scope: A Real-Time 3D Kaleidoscope

An immersive digital kaleidoscope that actually simulates a physical object chamber. Not just colorful noise—this is a fully-realized 3D physics simulation rendered through mathematically accurate kaleidoscope optics, complete with dynamic camera movement, glass front effects, and a generative audio engine that responds to everything happening in the scene.

<video src="preview.mp4" poster="preview.png" controls autoplay loop muted style="width: 100%; max-width: 800px; border-radius: 8px;"></video>

## What Makes This Different

Most digital kaleidoscopes are just 2D patterns with rotation. This one simulates the actual physics:

**3D Object Chamber** → **Real-Time Physics** → **Render to Texture** → **Kaleidoscope Shader** → **Post-Processing**

The objects you see aren't just visuals—they have mass, velocity, collisions, and audio feedback. The camera moves *through* the chamber, inside the tumbling objects. The kaleidoscope pattern rotates independently from your view. Everything is audio-reactive and constantly evolving.

## Recent Major Improvements

### Audio Engine v2 — Pattern-Based Drum Sequencer & New Modes
- **8 beat modes** (up from 6): Added **DnB** (170-180 BPM) and **Lo-fi** (70-85 BPM)
- **Pattern-based drum sequencer**: 16-step patterns with 3 variations per mode for kick, snare, and hihat — replaces random probability triggers with real rhythm
- **Arpeggiator system**: 5 arp patterns (up, down, updown, skip, random) assigned per mode
- **New instruments**: Sub-bass 808, pluck synth for melodic arpeggios
- **Sidechain ducking**: Pumping compression effect in house, algorave, and DnB
- **Drum fill transitions**: Crescendo snare roll before every mode switch
- **Vinyl crackle**: Brown noise through bandpass filter, intensity varies per mode (heaviest in lo-fi)
- **Smooth BPM transitions**: Tempo ramps instead of hard jumps between modes
- **Mode parameters consolidated** into `_applyModeParams()` for DRY code

### Shader — Prismatic Optics & Audio-Reactive Distortion
- **Audio-reactive ripple distortion**: Radial waves pulse through the kaleidoscope pattern with audio energy
- **Prismatic light dispersion**: 5-sample spectral spread with rainbow color bleeding at edges (replaces simple chromatic aberration)
- **Color wash overlay**: Subtle mode-specific tint (warm amber for house, cool blue for ambient, red for DnB, etc.)
- **Film grain**: Analog texture overlay, intensity scales with audio energy
- **Feedback/trail effect**: Frame-blending post-processing creates ghostly afterimages — heavy trails for ambient/choral/lo-fi, light trails for algorave/DnB

### Previous Visual Enhancements
- **Non-linear radial compression** in shader eliminates empty background issues
- **Glass front simulation**: barrel distortion, chromatic aberration, vignetting, fresnel edge glow
- **Balanced bloom system**: no more center hot spots, subtle sparkle without overwhelming
- **Enhanced materials**: 80% glass with proper IOR (1.8-2.2), emissive properties tuned for elegance
- **High-resolution rendering**: 2048x2048 render target with 4x MSAA antialiasing
- **Independent kaleidoscope rotation**: pattern slowly evolves even when static

### Dynamic Camera System
Six camera modes that fundamentally change the viewing experience:

1. **Inside** - Camera weaves *through* the tumbling objects, creating immersive depth
2. **Orbital** - Classic circular sweep with vertical bobbing
3. **Drift** - Organic random walk with soft boundaries and momentum
4. **Figure-8** - Lissajous curve pattern for hypnotic mathematical movement
5. **Follow** - Tracks the nearest object like a chase cam
6. **Static** - Traditional fixed viewpoint for purists

Camera mode randomizes on scope rebuilds and idle resets, ensuring constant visual evolution.

### UI/UX Polish
- **Status panel**: Real-time display of theme, camera mode, audio mode, scale, tempo
- **Flash notifications**: Status panel briefly appears when moods/themes change, then fades
- **Cursor hiding**: Mouse disappears with UI after 5 seconds of inactivity
- **Smooth rotation inertia**: Reduced deceleration (0.98 decay) and increased momentum (1.5x multiplier)
- **Keyboard shortcuts**: Space (audio toggle), A (audio mode cycle), F (fullscreen), C (camera cycle)
- **Mobile support**: Touch controls, pinch-to-zoom, responsive layout
- **Accessibility**: ARIA labels, focus indicators, semantic HTML

## Technical Architecture

### Core Technologies
- **Three.js** - 3D rendering engine with WebGL
- **GLSL Shaders** - Custom fragment shader for kaleidoscope effect
- **Tone.js** - Web Audio API wrapper for generative synthesis
- **EffectComposer** - Post-processing pipeline with bloom

### Rendering Pipeline

```
ObjectChamber.js (3D Scene)
├── 30-60 physics-simulated objects
├── PerspectiveCamera (FOV 60°, dynamic positioning)
├── Enhanced lighting (backlight + 4 accent lights)
└── Renders to 2048x2048 WebGLRenderTarget

↓

kaleidoscopeShader.js (GLSL)
├── Polar coordinate transformation
├── Kaleidoscope mirroring (4-16 segments)
├── Non-linear radial compression
├── Spiral sampling pattern
├── Prismatic light dispersion (5-sample spectral spread)
├── Audio-reactive ripple distortion
├── Color wash overlay (mode-specific tint)
├── Film grain (energy-reactive)
└── Independent rotation animation

↓

Post-Processing
├── UnrealBloomPass (threshold 0.3, audio-reactive strength)
├── Feedback pass (frame blending for trail/afterimage effect)
└── OutputPass to screen
```

### Physics Simulation
- **Collision detection**: O(N²) with velocity-based audio triggers
- **Object distribution**: 4×4×3 unit box for dense, interesting composition
- **Material properties**: Glass (IOR 1.8-2.2, transmission, roughness) and metal (metalness, emissive)
- **Dynamic scaling**: Objects pulse with audio energy in real-time

### Audio Architecture

```javascript
KaleidoscopeAudio.js
├── Drum Sequencer (16-step patterns, 3 variations per mode)
│   ├── Kick, Snare, HiHat patterns for house/algorave/dnb/lofi/exotic
│   ├── Sidechain ducking on kick hits
│   └── Snare fill transitions between mode switches
│
├── Sequenced Instruments
│   ├── Bass (MonoSynth) - pattern-based with mode-specific density
│   ├── Sub-Bass (MembraneSynth 808) - alternates with bass in heavy modes
│   ├── Chords (PolySynth) - probabilistic with scale locking
│   ├── Lead/AggroLead (MonoSynth) - arpeggiator-driven
│   ├── Pluck (MonoSynth) - melodic arpeggios in ambient/lofi/choral
│   └── Choir (PolySynth) - sustained pads
│
├── Arpeggiator
│   ├── 5 patterns: up, down, updown, skip, random
│   └── Pattern assigned per beat mode
│
├── Collision-Triggered Sounds
│   ├── Glass chimes (velocity-sensitive)
│   └── Tight coupling to visual collisions (threshold 0.003)
│
├── Effects Chain
│   ├── Reverb (adaptive decay 1.5-12s)
│   ├── Delay (adaptive timing 16n-4n)
│   ├── PitchShift (idle warp effect)
│   ├── Vinyl crackle (brown noise bandpass, per-mode intensity)
│   ├── Chorus
│   └── Limiter (master output protection)
│
└── Analysis
    ├── Meter (time domain energy)
    └── Normalized output (0-1) drives shader + bloom + feedback
```

### Idle Behavior System

The kaleidoscope evolves automatically during inactivity:

- **5 seconds**: UI fades out, cursor hides
- **Every ~20 seconds**: 30% chance of camera mode shift
- **Every 30-120 seconds**: Major reset
  - Rebuild entire object chamber
  - Randomize mirror count (4-16)
  - Change camera mode
  - Audio texture reset (fade + restart)
  - Flash status panel with new settings

This ensures the experience never becomes stale during ambient display.

## Key Features

### Visual
- 4-16 adjustable mirror segments
- 30-60 simulated 3D objects with real-time physics
- Glass and metal materials with proper refractive properties
- Prismatic light dispersion with rainbow spectral bleeding
- Audio-reactive ripple distortion and film grain
- Feedback/trail post-processing (ghostly afterimages)
- Mode-specific color wash tinting
- Balanced bloom with audio-reactive intensity
- 6 dynamic camera modes including "inside chamber" view
- Glass front effects (barrel distortion, vignetting)

### Audio
- 8 generative music modes (House, Exotic Groove, Algorave, Choral, Tumbling, Ambient, DnB, Lo-fi)
- 16-step pattern-based drum sequencer with 3 variations per mode
- Arpeggiator with 5 movement patterns
- Sub-bass 808 and pluck synth instruments
- Sidechain ducking for pumping compression
- Drum fill transitions between mode switches
- Vinyl crackle effect (per-mode intensity)
- Velocity-sensitive collision sounds
- Eastern and western scale systems (11 exotic scales)
- Adaptive reverb and delay per mode
- Smooth BPM transitions via rampTo
- Pitch warp effect during idle periods

### Interaction
- Mouse drag to rotate kaleidoscope view
- Mouse wheel to zoom
- Touch controls with pinch-to-zoom
- Keyboard shortcuts (Space, A, F, C)
- Theme selector (multiple themed object sets)
- Camera mode selector
- Build New Scope button for instant variation
- Debug chamber view toggle

### Polish
- Status panel with real-time state display
- Flash notifications on mood changes
- Auto-hiding UI with cursor fade
- Smooth rotation inertia
- Mobile responsive design
- Accessibility features

## How It Actually Works

### The Shader Math

The kaleidoscope effect uses polar coordinate transformation with a twist:

1. **Normalize UV** coordinates to -1.0 to 1.0 range
2. **Convert to polar**: `r = length(uv)`, `a = atan(uv.y, uv.x)`
3. **Apply rotations**: User drag + independent kaleidoscope spin
4. **Wrap angle**: `a = mod(a, segmentAngle)` divides space into segments
5. **Mirror**: `a = abs(a - segmentAngle/2)` creates symmetry
6. **Non-linear compression**: `radialFactor = pow(r, 0.7)` compresses outer regions more than inner, eliminating empty background
7. **Spiral sampling**: Adds rotating offset based on angle and time to ensure texture content is always sampled
8. **Audio-reactive ripple**: `uEnergy * 0.15 * sin(r * 10.0 - uTime * 5.0)` distorts the radial coordinate
9. **Prismatic dispersion**: 5-sample spectral spread with yellow and cyan bleeding channels
10. **Glass effects**: Barrel distortion, vignette, edge glow, ghosting
11. **Color wash**: Mode-specific tint mixed at 15% opacity
12. **Film grain**: Hash-based noise scaled by `0.03 + uEnergy * 0.05`

This creates seamless, full-coverage kaleidoscope patterns with realistic optical effects and audio-responsive behavior.

### The Camera System

Each mode uses parametric equations to define movement:

- **Inside**: Sinusoidal weaving with independent look target
  ```javascript
  x = sin(t * 0.3) * 2.0 + cos(t * 0.7) * 0.5
  y = cos(t * 0.5) * 2.0 + sin(t * 0.9) * 0.5
  z = sin(t * 0.2) * 1.5
  ```

- **Orbital**: Circular path with vertical oscillation
  ```javascript
  x = cos(t * 0.2) * 5.0
  z = sin(t * 0.2) * 5.0
  y = sin(t * 0.3) * 2.0
  ```

- **Drift**: Random walk with velocity dampening and soft boundaries

- **Figure-8**: Lissajous curve (different frequency ratios on X/Y)
  ```javascript
  x = sin(t * 0.3) * 3.5
  y = sin(t * 0.5) * 3.5
  z = cos(t * 0.25) * 2.0
  ```

- **Follow**: Lerp toward nearest object position with offset

### The Drum Sequencer

Every rhythmic mode has a bank of 16-step patterns (3 variations each for kick, snare, hihat). On mode switch, a random pattern variant is selected:

```javascript
house: {
    kick:  [[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],   // four-on-the-floor
             [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,1,0],   // offbeat variation
             [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0]],  // syncopated
    // ... snare and hihat patterns similarly
}
```

A shared `drumStep` counter advances on every 16th note, indexing into the active pattern. This replaces random probability triggers with real grooves while maintaining variety through pattern rotation and mode switching. Bass and sub-bass follow their own density patterns, with the 808 sub alternating in on 30% of hits in heavy modes.

## What Makes This Special

1. **True 3D simulation**: Not just visual trickery—actual physics with mass, velocity, collisions
2. **Render-to-texture architecture**: The chamber is a real 3D scene, not a flat pattern
3. **Mathematical accuracy**: Polar coordinate transformation mimics real kaleidoscope optics
4. **Dynamic camera**: You're not locked to one viewpoint—the observer moves through the space
5. **Generative audio**: Never the same twice, 8 distinct modes from lo-fi chill to 170 BPM DnB
6. **Real drum patterns**: 16-step sequencer with sidechain ducking and fill transitions — not random probability
7. **Audio-visual coupling**: Energy ripples through the shader, mode tints the color wash, beats pump the bloom
8. **Prismatic optics**: 5-sample spectral dispersion creates rainbow light spreading at edges
9. **Feedback trails**: Frame blending creates ghostly afterimages that vary with the music's intensity
10. **Continuous evolution**: Idle behavior ensures ambient display never gets boring
11. **Glass front simulation**: Barrel distortion, vignetting, and film grain mimic analog optics

## Future Possibilities

### Audio Enhancements
- Collision camera shake (intensity based on impact velocity)
- Spatial audio (panning based on object position in 3D space)
- More beat modes (breakbeat, trip-hop, glitch)

### Visual Extensions
- Depth of field with focus tracking
- Multiple nested kaleidoscope layers with Moiré interference
- Particle systems for added complexity
- More themes (Cyberpunk, Underwater, Crystalline)

### Interaction Improvements
- Gyroscope control on mobile (tilt to tumble)
- Snapshot/export high-resolution captures
- Camera preset system with smooth transitions
- URL parameter sharing for specific configurations

### Technical Deep Dives
- WebGPU migration for better performance
- VR mode (step inside the kaleidoscope)
- Real-time ray tracing for more accurate glass refraction
- GPU-accelerated collision detection for 200+ objects

---

**Built with Three.js, GLSL, Tone.js, and an obsessive attention to detail.**

*2025-2026*
