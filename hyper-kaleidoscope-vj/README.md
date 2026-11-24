# Hyper-Kaleidoscope VJ Instrument

A standalone, dependency-free WebGL1/GLSL live visual study by Jennipher Laura Troup. Open `index.html` through a local HTTP server, or deploy this directory as a static Vercel project.

## Run locally

```sh
python3 -m http.server 8765 -d hyper-kaleidoscope-vj
```

Open `http://localhost:8765`. No external scripts, build step, or API keys are required.

## Play

- Drag the stage to steer the camera. Double click or press **Space** for a manual drop.
- Open **Controls** for kaleidoscope slices, tunnel speed, fractal fold, prism split, and four palettes.
- **Beat Synth** makes a 128 BPM test beat after a click. **Mic In** and **Tab Audio** require browser permission and a secure context. Tab capture supplies audio only if the chosen tab/browser offers an audio track. **Stop Audio** releases capture tracks.
- Mic and tab audio feed the analyzer only; they are not routed to speakers. Synth audio plays through speakers. The three meters reflect FFT energy in bass (20–160 Hz), mid (160–2000 Hz), and high (2000–12000 Hz) bands.

The fragment shader raymarches a kaleidoscopic, repeated crystalline tunnel. Desktop uses three scene samples for the chromatic split; small screens use one sample and capped pixel resolution. The stage adapts down after sustained slow frames. If WebGL is unavailable or its shader cannot start, an animated Canvas 2D mode keeps the instrument playable and labels the mode explicitly. Reduced-motion preference holds the tunnel and time animation still while controls remain interactive.

## Scope

This is an interactive browser demo, not a measured VJ production system. It has no MIDI, file import, recording/export, DAW sync, projection calibration, or guaranteed frame rate. Canvas mode uses a different 2D visual treatment from the GLSL scene. Permission behavior varies by browser.
