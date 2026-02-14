import * as THREE from 'three';
import { kaleidoscopeVertexShader, kaleidoscopeFragmentShader } from './kaleidoscopeShader.js';
import { ObjectChamber } from './ObjectChamber.js?v=104';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- Initialization ---
const container = document.getElementById('canvas-container');
if (!container) console.error('Canvas container not found!');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
renderer.toneMapping = THREE.ReinhardToneMapping;
container.appendChild(renderer.domElement);

// Main Scene (for the quad)
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Object Chamber (The Source)
const chamber = new ObjectChamber(renderer, window.innerWidth, window.innerHeight);
chamber.resize(window.innerWidth, window.innerHeight);

// Shader Material
const uniforms = {
    tDiffuse: { value: chamber.getTexture() },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uSegments: { value: 8.0 },
    uAngle: { value: 0.0 },
    uZoom: { value: 1.0 },
    uTime: { value: 0.0 },
    uKaleidoSpin: { value: 0.0 },
    uEnergy: { value: 0.0 },
    uColorWash: { value: new THREE.Vector3(0.0, 0.0, 0.0) }
};

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: kaleidoscopeVertexShader,
    fragmentShader: kaleidoscopeFragmentShader
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

// --- Post-Processing ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.6, 0.85);
bloomPass.threshold = 0.3;
bloomPass.strength = 0.45;
bloomPass.radius = 0.6;
composer.addPass(bloomPass);

// Expose bloom for audio reactivity
window.bloomPass = bloomPass;

// --- Feedback/Trail Effect ---
const FeedbackShader = {
    uniforms: {
        tDiffuse: { value: null },
        tPreviousFrame: { value: null },
        uFeedback: { value: 0.92 }
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tPreviousFrame;
        uniform float uFeedback;
        varying vec2 vUv;
        void main() {
            vec4 current = texture2D(tDiffuse, vUv);
            vec4 previous = texture2D(tPreviousFrame, vUv);
            gl_FragColor = mix(current, previous, uFeedback);
        }
    `
};

const feedbackPass = new ShaderPass(FeedbackShader);
composer.addPass(feedbackPass);

// Render target to store previous frame for feedback
const prevFrameTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
});

const outputPass = new OutputPass();
composer.addPass(outputPass);

// --- Interaction State ---
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let rotationVelocity = 0; // For inertia
let targetRotationVelocity = 0;
let lastInteractionTime = 0;
const IDLE_THRESHOLD = window.IDLE_THRESHOLD_OVERRIDE || 30.0; // Seconds

// Expose for debugging
window.chamber = chamber;

// Hook for audio mode changes to trigger camera randomization
window.onAudioModeChange = (newMode) => {
    // When audio mode changes, consider changing camera too (50% chance)
    if (Math.random() < 0.5) {
        const modes = ['inside', 'orbital', 'drift', 'figure8', 'follow'];
        const newCameraMode = modes[Math.floor(Math.random() * modes.length)];
        chamber.setCameraMode(newCameraMode);

        // Update dropdown
        if (selectCamera) {
            selectCamera.value = newCameraMode;
        }

        // Randomize Mirrors (Segments) - range 4 to 16
        const newSegments = 4 + Math.floor(Math.random() * 13);
        uniforms.uSegments.value = newSegments;
        // Update UI if available
        if (inputSegments) inputSegments.value = newSegments;
        if (valueSegments) valueSegments.innerText = newSegments;

        console.log(`Audio mode changed to ${newMode} - Camera: ${newCameraMode}, Segments: ${newSegments}`);
        updateStatusDisplay();

        // Flash status panel to show the change
        flashStatusPanel();

        // Randomize Speed Slider (if not manually locked - assuming fully random for now)
        if (speedSlider) {
            // Random speed between 0.5 (5) and 4.0 (40)
            const randomSpeed = 5 + Math.floor(Math.random() * 35);
            speedSlider.value = randomSpeed;
            if (valueSpeed) valueSpeed.innerText = randomSpeed;

            // Ensure the animation loop picks it up immediately reset time logic if needed
            lastInteractionTime = clock.getElapsedTime();
        }

        // Randomize Theme (Rebuild Chamber)
        // This syncs the visual theme with the new audio mood
        const count = checkChamber.checked ? parseInt(inputCount.value) : undefined;
        chamber.buildNew(count);
        // Update item count slider if random
        if (inputCount && chamber.objects) {
            inputCount.value = chamber.objects.length;
            if (valueCount) valueCount.innerText = chamber.objects.length;
        }

        // Update status display to show new theme immediately
        updateStatusDisplay();
    };
};

// --- Audio Engine ---
import { KaleidoscopeAudio } from './KaleidoscopeAudio.js';
const audio = new KaleidoscopeAudio();
window.audio = audio; // Expose for debugging
let btnAudio;

// Connect Collision Audio
chamber.setAudio(audio);


// --- UI Controls ---
let btnBuild, inputSegments, inputCount, groupMirrors, groupCount, checkChamber, valueSegments, valueCount, instructions, speedSlider, valueSpeed, btnFullscreen, selectCamera;

// Status update function
function updateStatusDisplay() {
    const themeEl = document.getElementById('status-theme');
    if (themeEl && chamber && chamber.currentTheme) {
        const themeName = chamber.currentTheme.charAt(0).toUpperCase() + chamber.currentTheme.slice(1);
        themeEl.textContent = themeName;
    }



    // Update audio status (show whether playing or not)
    const modeEl = document.getElementById('status-mode');
    const scaleEl = document.getElementById('status-scale');
    const tempoEl = document.getElementById('status-tempo');

    if (audio && audio.isInitialized) {
        if (audio.isPlaying) {
            if (modeEl) {
                const modeName = audio.beatMode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                modeEl.textContent = modeName;
            }
            if (scaleEl) scaleEl.textContent = audio.currentScaleName;
            if (tempoEl && window.Tone) tempoEl.textContent = `${Math.round(Tone.Transport.bpm.value)} BPM`;
        } else {
            // Audio initialized but not playing
            if (modeEl) modeEl.textContent = 'Stopped';
            if (scaleEl) scaleEl.textContent = '—';
            if (tempoEl) tempoEl.textContent = '—';
        }
    } else {
        // Audio not initialized yet
        if (modeEl) modeEl.textContent = 'Not Started';
        if (scaleEl) scaleEl.textContent = '—';
        if (tempoEl) tempoEl.textContent = '—';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    btnBuild = document.getElementById('btn-build');
    // ... existing ...
    inputSegments = document.getElementById('input-segments');
    inputCount = document.getElementById('input-count');
    groupMirrors = document.getElementById('group-mirrors');
    groupCount = document.getElementById('group-count');
    checkChamber = document.getElementById('check-chamber');
    valueSegments = document.getElementById('value-segments');
    valueCount = document.getElementById('value-count');
    instructions = document.querySelector('.instructions');
    speedSlider = document.getElementById('speedSlider');
    valueSpeed = document.getElementById('value-speed');

    // Initialize status display on load
    updateStatusDisplay();

    btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
        btnAudio.addEventListener('click', async () => {
            if (!audio.isPlaying) {
                await audio.init();
                audio.start();
                btnAudio.innerHTML = '<span class="icon">🔇</span> Stop Audio';
                btnAudio.classList.add('active');
                // Update status display after a short delay to ensure audio is fully started
                setTimeout(() => {
                    updateStatusDisplay();
                }, 100);
            } else {
                audio.stop();
                btnAudio.innerHTML = '<span class="icon">🔊</span> Start Audio';
                btnAudio.classList.remove('active');
                // Update status display immediately after stopping audio
                updateStatusDisplay();
            }
        });
    }

    // Fullscreen button
    btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    }

    if (btnBuild) {
        btnBuild.addEventListener('click', () => {
            // Pass current count value if in chamber mode, else undefined (random)
            const count = checkChamber.checked ? parseInt(inputCount.value) : undefined;
            chamber.buildNew(count);

            // Update item count slider if random
            if (!checkChamber.checked && inputCount && chamber.objects) {
                inputCount.value = chamber.objects.length;
                if (valueCount) valueCount.innerText = chamber.objects.length;
            }

            // Randomize camera mode with new build
            const modes = ['inside', 'orbital', 'drift', 'figure8', 'follow'];
            const newMode = modes[Math.floor(Math.random() * modes.length)];
            chamber.setCameraMode(newMode);

            // Update dropdown
            if (selectCamera) {
                selectCamera.value = newMode;
            }

            console.log("Build New Scope - Camera mode:", newMode);

            lastInteractionTime = clock.getElapsedTime();
            updateStatusDisplay(); // Update theme and camera immediately
            flashStatusPanel(); // Show status panel briefly
        });
    }

    if (inputSegments) {
        inputSegments.addEventListener('input', (e) => {
            uniforms.uSegments.value = parseFloat(e.target.value);
            valueSegments.innerText = e.target.value;
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            valueSpeed.innerText = e.target.value;
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    // Debounce buildNew for performance
    let buildTimeout;
    if (inputCount) {
        inputCount.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            valueCount.innerText = count;
            clearTimeout(buildTimeout);
            buildTimeout = setTimeout(() => {
                chamber.buildNew(count);
            }, 300);
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    if (checkChamber) {
        checkChamber.addEventListener('change', (e) => {
            if (e.target.checked) {
                groupMirrors.style.display = 'none';
                groupCount.style.display = 'flex';
                instructions.innerText = 'Drag to Rotate View • Scroll to Zoom';
            } else {
                groupMirrors.style.display = 'flex';
                groupCount.style.display = 'none';
                instructions.innerText = 'Drag to Rotate & Color • Scroll to Zoom';
            }
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    // Camera mode selector
    selectCamera = document.getElementById('select-camera');
    if (selectCamera) {
        // Set initial value
        selectCamera.value = chamber.cameraMode;

        selectCamera.addEventListener('change', (e) => {
            chamber.setCameraMode(e.target.value);
            updateStatusDisplay();
            lastInteractionTime = clock.getElapsedTime();
        });
    }
});

// --- Input Handling ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);

    // Resize feedback render target
    prevFrameTarget.setSize(window.innerWidth, window.innerHeight);
});

// Mouse / Touch for Rotation
const onStart = (x, y) => {
    isDragging = true;
    lastMouseX = x;
    lastMouseY = y;
    targetRotationVelocity = 0;
    lastInteractionTime = clock.getElapsedTime();

    // Audio feedback?
    // audio.triggerInteractionSound(); // Future
};

const onMove = (x, y) => {
    // Background Color Logic (Mouse Y)
    // Map Y to Hue (0-1) and Intensity (0.5 - 2.0)
    const hue = y / window.innerHeight;
    const intensity = (0.5 + (1.0 - (y / window.innerHeight)) * 1.5) * 0.75; // Top is brighter, 25% reduced
    chamber.updateEnvironment(hue, intensity);

    lastInteractionTime = clock.getElapsedTime();

    // Reset major idle timer on interaction
    if (window.lastMajorIdleTime) {
        window.lastMajorIdleTime = lastInteractionTime;
    }

    if (!isDragging) return;
    const deltaX = x - lastMouseX;
    const deltaY = y - lastMouseY;

    // Calculate angle change based on movement around center
    // Or simpler: just X movement rotates it
    const sensitivity = 0.005;
    uniforms.uAngle.value -= deltaX * sensitivity;

    // Add some "velocity" for inertia (increased multiplier for more momentum)
    targetRotationVelocity = -deltaX * sensitivity * 1.5;

    lastMouseX = x;
    lastMouseY = y;
};

const onEnd = () => {
    isDragging = false;
    lastInteractionTime = clock.getElapsedTime();
};

// Mouse Events
container.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
window.addEventListener('mouseup', onEnd);

// Touch Events
container.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
window.addEventListener('touchmove', e => {
    if (isDragging) e.preventDefault(); // Prevent scrolling
    onMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
window.addEventListener('touchend', onEnd);

// Wheel for Zoom
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    let newZoom = uniforms.uZoom.value + e.deltaY * -zoomSpeed;
    newZoom = Math.max(0.5, Math.min(3.0, newZoom));
    uniforms.uZoom.value = newZoom;
    lastInteractionTime = clock.getElapsedTime();
    // inputZoom.value = newZoom; // Sync UI
}, { passive: false });

// Pinch-to-zoom for mobile
let initialPinchDistance = null;
let initialZoom = 1.0;

container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        initialZoom = uniforms.uZoom.value;
    }
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialPinchDistance;
        let newZoom = initialZoom * scale;
        newZoom = Math.max(0.5, Math.min(3.0, newZoom));
        uniforms.uZoom.value = newZoom;
        lastInteractionTime = clock.getElapsedTime();
    }
}, { passive: false });

container.addEventListener('touchend', () => {
    initialPinchDistance = null;
}, { passive: true });


// --- UI Inactivity Fade ---
let inactivityTimer;
const uiElements = document.querySelectorAll('.ui-fade');
const urlParams = new URLSearchParams(window.location.search);
const uiDebug = urlParams.get('ui_debug') === 'true';

function resetInactivityTimer() {
    // Show UI
    uiElements.forEach(el => el.classList.remove('ui-hidden'));
    document.body.classList.remove('cursor-hidden');

    if (uiDebug) return; // Keep UI always visible in debug mode

    // Clear existing timer
    clearTimeout(inactivityTimer);

    // Set new timer for 5 seconds
    inactivityTimer = setTimeout(() => {
        uiElements.forEach(el => el.classList.add('ui-hidden'));
        document.body.classList.add('cursor-hidden');
    }, 5000);
}

// Flash just the status panel when mood/theme changes
function flashStatusPanel() {
    const statusPanel = document.querySelector('.status-panel');
    if (!statusPanel) return;

    // Show status panel
    statusPanel.classList.remove('ui-hidden');

    // Hide it after 3 seconds
    setTimeout(() => {
        statusPanel.classList.add('ui-hidden');
    }, 3000);
}

// Initialize timer
resetInactivityTimer();

// Hook into interactions
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('mousedown', resetInactivityTimer);
window.addEventListener('touchstart', resetInactivityTimer);
window.addEventListener('wheel', resetInactivityTimer);
window.addEventListener('keydown', resetInactivityTimer);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    // Don't trigger if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            if (btnBuild) btnBuild.click();
            break;
        case 'a':
            e.preventDefault();
            if (btnAudio) btnAudio.click();
            break;
        case 'f':
            e.preventDefault();
            if (btnFullscreen) btnFullscreen.click();
            break;
        case 'c':
            e.preventDefault();
            if (checkChamber) checkChamber.click();
            break;
    }
});


// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Determine Speed Multiplier
    let speedMult = 1.0;
    if (speedSlider) {
        speedMult = parseFloat(speedSlider.value) / 10.0;
    }

    // Update Audio
    if (audio.isPlaying) {
        audio.updateParams(speedMult, chamber.currentTheme);

        // Audio energy (used for multiple effects)
        const energy = audio.getEnergy();

        // Audio-reactive bloom
        bloomPass.strength = 0.45 + energy * 0.45;
        bloomPass.radius = 0.6 + energy * 0.3;

        // Audio-reactive shader uniforms
        uniforms.uEnergy.value += (energy - uniforms.uEnergy.value) * 0.15;

        // Color wash based on audio mode
        const washMap = {
            'ambient':       [0.05, 0.1, 0.2],
            'choral':        [0.1, 0.02, 0.15],
            'house':         [0.15, 0.08, 0.0],
            'algorave':      [0.0, 0.15, 0.05],
            'exotic_groove': [0.12, 0.0, 0.1],
            'tumbling':      [0.05, 0.05, 0.05],
            'dnb':           [0.15, 0.0, 0.0],
            'lofi':          [0.1, 0.08, 0.03]
        };
        const wash = washMap[audio.beatMode] || [0, 0, 0];
        const targetWash = new THREE.Vector3(wash[0], wash[1], wash[2]);
        uniforms.uColorWash.value.lerp(targetWash, 0.01);

        // Audio-reactive feedback amount (trails)
        let targetFB;
        if (['ambient', 'choral', 'lofi'].includes(audio.beatMode)) {
            targetFB = 0.95; // Heavy trails for chill modes
        } else if (['algorave', 'dnb'].includes(audio.beatMode)) {
            targetFB = 0.85; // Light trails for fast modes (clarity)
        } else {
            targetFB = 0.92; // Default
        }
        feedbackPass.uniforms.uFeedback.value += (targetFB - feedbackPass.uniforms.uFeedback.value) * 0.02;
    }

    // Update status display every second
    if (Math.floor(time) !== Math.floor(time - delta)) {
        updateStatusDisplay();
    }

    // Idle Animation Logic
    const timeSinceInteraction = time - lastInteractionTime;
    const isIdle = !isDragging && timeSinceInteraction > IDLE_THRESHOLD;

    // Notify Audio of Idle State
    if (audio && audio.isInitialized) {
        audio.setIdle(isIdle);
    }

    if (isIdle) {
        // Procedural "Wandering" Rotation
        // State: Move in a direction, slow down, stop, maybe reverse.

        // Randomly change "target" idle velocity every few seconds
        // Use a noise-like function or simple probability
        if (!window.idleNextStateTime || time > window.idleNextStateTime) {
            // Pick next state duration (2 to 7 seconds)
            window.idleNextStateTime = time + 2.0 + Math.random() * 5.0;

            // Pick next target velocity
            const chance = Math.random();
            if (chance < 0.3) {
                // Stop/Pause (30% chance)
                window.idleTargetVelocity = 0;
            } else {
                // Move (70% chance)
                // Random direction (+/- 1)
                const dir = Math.random() > 0.5 ? 1 : -1;
                // Random slow speed (0.0005 to 0.003)
                const magnitude = 0.0005 + Math.random() * 0.0025;
                window.idleTargetVelocity = dir * magnitude;
            }
        }

        // Initialize if undefined
        if (window.idleCurrentVelocity === undefined) window.idleCurrentVelocity = 0;

        // Smoothly lerp current velocity to target (Heavy damping for "easy does it")
        // Lerp factor 0.02 is very slow smoothing
        window.idleCurrentVelocity += (window.idleTargetVelocity - window.idleCurrentVelocity) * 0.01;

        // Apply
        uniforms.uAngle.value += window.idleCurrentVelocity * speedMult;

        // Breathing Zoom
        // Base 1.0, varies +/- 0.1, slow period
        const idleZoom = 1.0 + Math.sin(time * 0.5) * 0.1;
        // Lerp current zoom towards idle zoom
        uniforms.uZoom.value += (idleZoom - uniforms.uZoom.value) * 0.01;

        // Animate Background Hue
        // Cycle roughly every 60 seconds
        const idleHue = (time * 0.05) % 1.0;
        chamber.updateEnvironment(idleHue, 0.75); // Maintain high intensity (reduced 25%)

        // Dynamic Content Swapping
        // Every 2 seconds (approx), swap 1-2 objects
        if (Math.floor(time * 0.5) > Math.floor((time - delta) * 0.5)) {
            const swapCount = 1 + Math.floor(Math.random() * 2);
            const themes = ['christmas', 'halloween', 'industrial', 'fruity', 'gemstone'];
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];

            if (chamber.objects.length < 100) {
                chamber.swapObjects(swapCount, randomTheme);
            } else {
                chamber.removeRandomObject();
            }

            // Occasionally change camera during idle drift (every ~20 seconds)
            if (Math.floor(time * 0.05) > Math.floor((time - delta) * 0.05)) {
                if (Math.random() < 0.3) { // 30% chance
                    const modes = ['inside', 'orbital', 'drift', 'figure8', 'follow'];
                    const newMode = modes[Math.floor(Math.random() * modes.length)];
                    chamber.setCameraMode(newMode);

                    // Update dropdown
                    if (selectCamera) {
                        selectCamera.value = newMode;
                    }

                    updateStatusDisplay();
                    flashStatusPanel(); // Show status panel briefly
                    console.log("Idle camera shift:", newMode);
                }
            }
        }

        // --- Major Idle Reset (User Request) ---
        // Every 30 to 120 seconds, rebuild scope and reset audio
        if (!window.lastMajorIdleTime) {
            window.lastMajorIdleTime = time;
            window.nextMajorIdleInterval = 30 + Math.random() * 90;
        }

        if (time - window.lastMajorIdleTime > window.nextMajorIdleInterval) {
            console.log("Triggering Major Idle Reset");

            // 1. Rebuild Scope
            chamber.buildNew();
            // Update item count slider
            if (inputCount && chamber.objects) {
                inputCount.value = chamber.objects.length;
                if (valueCount) valueCount.innerText = chamber.objects.length;
            }

            // 2. Reset Audio (Fade & Restart)
            if (audio && audio.isInitialized) {
                audio.performTextureReset();
            }

            // 3. Randomize Mirrors (4-16)
            const newSegments = 4 + Math.floor(Math.random() * 13);
            uniforms.uSegments.value = newSegments;
            if (inputSegments) inputSegments.value = newSegments;
            if (valueSegments) valueSegments.innerText = newSegments;

            // 4. Change camera mode (experimental!)
            const modes = ['inside', 'orbital', 'drift', 'figure8', 'follow'];
            const newMode = modes[Math.floor(Math.random() * modes.length)];
            chamber.setCameraMode(newMode);

            // Update dropdown
            if (selectCamera) {
                selectCamera.value = newMode;
            }

            updateStatusDisplay();
            flashStatusPanel(); // Show status panel briefly
            console.log("Camera mode switched to:", newMode);

            // 5. Reset Timer
            window.lastMajorIdleTime = time;
            window.nextMajorIdleInterval = 30 + Math.random() * 90; // new random interval
        }

    } else if (!isDragging) {
        // Normal Inertia (slower decay for longer rotation)
        // Decay velocity - reduced from 0.95 to 0.98 for slower deceleration
        targetRotationVelocity *= 0.98;
        uniforms.uAngle.value += targetRotationVelocity * speedMult;
    }

    // Update Chamber (physics/movement)
    chamber.update(time, speedMult);

    // Render Chamber to Texture
    chamber.render();

    // Update Uniforms
    uniforms.uTime.value = time;

    // Independent kaleidoscope rotation (very slow, continuous)
    uniforms.uKaleidoSpin.value = time * 0.05;

    // Render Main Scene
    if (checkChamber && checkChamber.checked) {
        // Safety check for aspect ratio
        if (chamber.debugCamera && Math.abs(chamber.debugCamera.aspect - (window.innerWidth / window.innerHeight)) > 0.01) {
            chamber.resize(window.innerWidth, window.innerHeight);
        }
        // Debug view: render chamber directly to screen
        renderer.render(chamber.scene, chamber.debugCamera);
    } else {
        // Kaleidoscope view with Bloom + Feedback
        composer.render();

        // Copy current frame to previous frame buffer for next frame's feedback
        renderer.setRenderTarget(prevFrameTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        feedbackPass.uniforms.tPreviousFrame.value = prevFrameTarget.texture;
    }
}

animate();
