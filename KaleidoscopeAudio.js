
const Tone = window.Tone;

export class KaleidoscopeAudio {
    constructor() {
        this.isPlaying = false;
        this.isInitialized = false;

        // Instruments
        this.kick = null;
        this.hihat = null;
        this.snare = null;
        this.crash = null;
        this.bass = null;
        this.subBass = null;
        this.poly = null;
        this.aggroLead = null;
        this.glass = null;
        this.choir = null;
        this.pluck = null;

        // Effects
        this.masterFilter = null;
        this.delay = null;
        this.reverb = null;
        this.dist = null;
        this.chorus = null;
        this.crackle = null;
        this.crackleGain = null;

        // Loops
        this.kickLoop = null;
        this.hihatLoop = null;
        this.snareLoop = null;
        this.bassLoop = null;
        this.chordLoop = null;
        this.glassLoop = null;
        this.windChimeLoop = null;
        this.choirLoop = null;
        this.pluckLoop = null;
        this.pitchWarpLoop = null;
        this.schedulerLoop = null;

        // Scheduler
        this.nextSwitchId = null;

        // Timing tracking for monophonic instruments
        this.lastHihatTime = 0;

        // Journey State
        this.intensity = 0.5;
        this.beatMode = 'ambient';
        this.rootNote = "C";
        this.currentScaleName = "Major Pentatonic";

        // Arpeggiator
        this.arpPattern = 'up';
        this.arpIndex = 0;
        this.arpDirection = 1;

        // Drum pattern system
        this.drumStep = 0;
        this.currentPatternIndex = 0;
        this.drumPatterns = {
            house: {
                kick:  [[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                         [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,0,1,0],
                         [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0]],
                snare: [[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                         [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,1],
                         [0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0]],
                hihat: [[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                         [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                         [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1]]
            },
            algorave: {
                kick:  [[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                         [1,0,1,0, 0,0,1,0, 1,0,1,0, 0,0,1,0],
                         [1,0,0,1, 1,0,0,0, 1,0,0,1, 1,0,0,0]],
                snare: [[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                         [0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1],
                         [0,0,0,0, 1,0,1,0, 0,0,0,0, 1,0,1,0]],
                hihat: [[1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                         [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1],
                         [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1]]
            },
            dnb: {
                kick:  [[1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
                         [1,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
                         [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0]],
                snare: [[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                         [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
                         [0,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,1]],
                hihat: [[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                         [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0],
                         [1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0]]
            },
            lofi: {
                kick:  [[1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
                         [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
                         [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0]],
                snare: [[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                         [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
                         [0,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,0,0]],
                hihat: [[1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
                         [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                         [1,0,1,0, 0,0,1,0, 1,0,0,0, 0,0,1,0]]
            },
            exotic_groove: {
                kick:  [[1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
                         [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,1,0,0],
                         [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,0,1,0]],
                snare: [[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                         [0,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
                         [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0]],
                hihat: [[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                         [1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1],
                         [1,1,0,0, 1,0,1,0, 1,1,0,0, 1,0,1,0]]
            }
        };

        // Extended "Exotic" Scales
        this.scales = {
            "Major Pentatonic": ["C4", "D4", "E4", "G4", "A4", "C5", "E5"],
            "Minor Pentatonic": ["A3", "C4", "D4", "E4", "G4", "A4", "C5"],
            "Hirajoshi": ["C4", "Db4", "F4", "G4", "Ab4", "C5", "Db5"],
            "Phrygian Dominant": ["C3", "Db3", "E3", "F3", "G3", "Ab3", "Bb3", "C4"],
            "Lydian": ["C4", "D4", "E4", "F#4", "G4", "A4", "B4", "C5"],
            "Whole Tone": ["C4", "D4", "E4", "F#4", "Ab4", "Bb4", "C5"],
            "Enigmatic": ["C4", "Db4", "E4", "F#4", "Ab4", "Bb4", "B4", "C5"],
            "Byzantine": ["C4", "Db4", "E4", "F4", "G4", "Ab4", "B4", "C5"],
            "Hungarian Minor": ["C4", "D4", "Eb4", "F#4", "G4", "Ab4", "B4", "C5"],
            "Iwato": ["C4", "Db4", "F4", "Gb4", "Bb4", "C5", "Db5"],
            "Kumoi": ["C4", "D4", "Eb4", "G4", "A4", "C5", "D5"]
        };
        this.scaleKeys = Object.keys(this.scales);
    }

    getArpNote(scale) {
        if (!scale || scale.length === 0) return null;

        let note;
        switch (this.arpPattern) {
            case 'up':
                note = scale[this.arpIndex % scale.length];
                this.arpIndex++;
                break;
            case 'down':
                note = scale[scale.length - 1 - (this.arpIndex % scale.length)];
                this.arpIndex++;
                break;
            case 'updown':
                note = scale[Math.abs(this.arpIndex) % scale.length];
                this.arpIndex += this.arpDirection;
                if (this.arpIndex >= scale.length - 1) this.arpDirection = -1;
                if (this.arpIndex <= 0) this.arpDirection = 1;
                break;
            case 'skip':
                note = scale[(this.arpIndex * 2) % scale.length];
                this.arpIndex++;
                break;
            case 'random':
            default:
                note = scale[Math.floor(Math.random() * scale.length)];
                break;
        }
        return note;
    }

    async init() {
        if (this.isInitialized) return;

        console.log("Audio initializing...");
        await Tone.start();
        console.log("Audio Context Started");

        // --- Master Effects ---
        this.masterFilter = new Tone.Filter(2000, "lowpass").toDestination();

        // PitchShifter (Insert Effect)
        this.pitchShifter = new Tone.PitchShift({
            pitch: 0,
            windowSize: 0.1,
            delayTime: 0,
            feedback: 0
        }).connect(this.masterFilter);

        // Limiter feeds into PitchShifter -> MasterFilter
        const limiter = new Tone.Limiter(-2).connect(this.pitchShifter);

        this.reverb = new Tone.Reverb(6).connect(limiter);
        this.delay = new Tone.PingPongDelay("8n.", 0.25).connect(this.reverb);
        this.dist = new Tone.Distortion(0.0).connect(limiter);
        this.chorus = new Tone.Chorus(2.5, 3.5, 0.7).connect(this.reverb).start();

        // --- Analysis ---
        this.meter = new Tone.Meter({ smoothing: 0.8 });
        this.masterFilter.connect(this.meter);

        // --- Vinyl Crackle ---
        this.crackleGain = new Tone.Gain(0.0).connect(this.masterFilter);
        const crackleFilter = new Tone.Filter({
            frequency: 3000,
            type: 'bandpass',
            Q: 0.5
        }).connect(this.crackleGain);
        this.crackle = new Tone.Noise({
            type: 'brown',
            volume: -20
        }).connect(crackleFilter);
        this.crackle.start();

        // --- Instruments ---

        // 1. Kick
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
            }
        }).connect(limiter);
        this.kick.volume.value = 0;

        // 2. Snare
        this.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0
            }
        }).connect(this.reverb);

        // 3. Crash
        this.crash = new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 1.4,
                release: 0.2
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(this.reverb);
        this.crash.volume.value = -6;

        // 4. HiHat
        this.hihat = new Tone.MetalSynth({
            frequency: 250,
            envelope: {
                attack: 0.001,
                decay: 0.05,
                release: 0.01
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(this.reverb);
        this.hihat.volume.value = -8;

        // 5. Bass
        this.bass = new Tone.MonoSynth({
            oscillator: { type: "fmsawtooth", modulationType: "square", modulationIndex: 3 },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.4,
                release: 0.2
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.2,
                release: 0.2,
                baseFrequency: 80,
                octaves: 2.5
            }
        }).connect(this.dist);
        this.bass.volume.value = -3;

        // 5b. Sub-Bass / 808
        this.subBass = new Tone.MembraneSynth({
            pitchDecay: 0.08,
            octaves: 6,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.8,
                sustain: 0.2,
                release: 2.0
            }
        }).connect(limiter);
        this.subBass.volume.value = -3;

        // 6. Lead (Soft)
        this.poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fatsawtooth",
                count: 3,
                spread: 20
            },
            envelope: {
                attack: 0.2,
                decay: 0.1,
                sustain: 0.3,
                release: 1.5
            }
        }).connect(this.delay);
        this.poly.volume.value = -8;

        // 7. AggroLead - For Algorave
        this.aggroLead = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.5,
                release: 0.1
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.1,
                release: 0.5,
                baseFrequency: 500,
                octaves: 4
            }
        }).connect(this.dist);
        this.aggroLead.volume.value = -3;

        // 8. Glass
        this.glass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fmsine", modulationType: "sine", modulationIndex: 20, harmonicity: 3 },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.1,
                release: 2
            }
        }).connect(this.delay);
        this.glass.volume.value = -2;

        // 9. Choir
        this.choir = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "amtriangle",
            },
            envelope: {
                attack: 2.0,
                decay: 3.0,
                sustain: 0.8,
                release: 4.0
            }
        }).connect(this.chorus);
        this.choir.volume.value = -8;

        // 10. Pluck (Melodic Arpeggios)
        this.pluck = new Tone.MonoSynth({
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.005,
                decay: 0.3,
                sustain: 0.0,
                release: 0.8
            },
            filterEnvelope: {
                attack: 0.005,
                decay: 0.2,
                sustain: 0.0,
                release: 0.5,
                baseFrequency: 800,
                octaves: 3
            }
        }).connect(this.delay);
        this.pluck.volume.value = -6;

        // --- Sequencing ---
        Tone.Transport.bpm.value = 110;

        // Kick Logic (Pattern-based)
        this.kickLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;
            if (this.intensity < 0.1 && this.beatMode !== 'algorave') return;

            const patterns = this.drumPatterns[this.beatMode];
            if (patterns) {
                const pattern = patterns.kick[this.currentPatternIndex % patterns.kick.length];
                const step = this.drumStep % pattern.length;
                if (pattern[step]) {
                    this.kick.triggerAttackRelease("C1", "8n", time);
                    // Sidechain ducking for pumping modes
                    if (['house', 'algorave', 'dnb'].includes(this.beatMode)) {
                        this._duckInstruments(time);
                    }
                }
            } else if (this.beatMode === 'ambient') {
                // Ambient: sparse kick
                if (Math.random() < 0.3) {
                    this.kick.triggerAttackRelease("C1", "8n", time);
                }
            }
        }, "16n");

        // Snare Logic (Pattern-based)
        this.snareLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const patterns = this.drumPatterns[this.beatMode];
            if (patterns) {
                const pattern = patterns.snare[this.currentPatternIndex % patterns.snare.length];
                const step = this.drumStep % pattern.length;
                if (pattern[step]) {
                    const velocity = this.beatMode === 'lofi' ? 0.5 : 1.0;
                    this.snare.triggerAttackRelease("8n", time, velocity);
                }
            }

            // Random Crash in Algo/DnB mode
            if ((this.beatMode === 'algorave' || this.beatMode === 'dnb') && this.drumStep % 16 === 0) {
                if (Math.random() < 0.5) {
                    this.crash.triggerAttackRelease("C2", "1m", time + 0.03, 0.8);
                }
            }
        }, "16n");

        // HiHat (Pattern-based)
        this.hihatLoop = new Tone.Loop(time => {
            if (this.beatMode === 'ambient' || this.beatMode === 'choral') return;
            if (this.beatMode === 'tumbling') return;

            const safeTime = Math.max(time, this.lastHihatTime + 0.01);
            this.lastHihatTime = safeTime;

            const patterns = this.drumPatterns[this.beatMode];
            if (patterns) {
                const pattern = patterns.hihat[this.currentPatternIndex % patterns.hihat.length];
                const step = this.drumStep % pattern.length;
                if (pattern[step]) {
                    const velocity = this.beatMode === 'lofi' ? (0.2 + Math.random() * 0.3) :
                                     this.beatMode === 'algorave' ? (Math.random() * 0.5 + 0.5) :
                                     (0.4 + Math.random() * 0.4);
                    this.hihat.triggerAttackRelease(200, "32n", safeTime, velocity);
                }
            } else if (Math.random() < this.intensity) {
                this.hihat.triggerAttackRelease(200, "32n", safeTime);
            }

            // Advance drum step (shared counter for all pattern-based loops)
            this.drumStep++;
        }, "16n");

        // Bass - Melodic Variation (Pattern-based + sub-bass alternation)
        this.bassPatternIndex = 0;
        this.bassLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            // Pattern-based bass
            const bassPattern = [1, 0, 1, 1, 0, 1, 1, 0];
            const algoPattern = [1, 1, 0, 1, 1, 1, 0, 1];
            const dnbPattern  = [1, 0, 0, 1, 0, 1, 0, 0];
            const lofiPattern = [1, 0, 0, 0, 1, 0, 0, 1];

            let pattern;
            if (this.beatMode === 'algorave') pattern = algoPattern;
            else if (this.beatMode === 'dnb') pattern = dnbPattern;
            else if (this.beatMode === 'lofi') pattern = lofiPattern;
            else pattern = bassPattern;

            const shouldPlay = pattern[this.bassPatternIndex % pattern.length];
            this.bassPatternIndex++;

            if (!shouldPlay) return;

            // Sub-bass alternation for heavy modes
            if (['house', 'algorave', 'dnb'].includes(this.beatMode) && Math.random() < 0.3) {
                try {
                    this.subBass.triggerAttackRelease("C1", "4n", time);
                } catch (e) { }
                return;
            }

            // Pick a bass note from lower register of current scale
            const noteIndex = Math.floor(Math.random() * 3);
            const rootNoteStr = scale[noteIndex];
            const note = rootNoteStr.slice(0, -1) + (Math.random() > 0.7 ? "1" : "2");

            try {
                this.bass.triggerAttackRelease(note, "16n", time);
            } catch (e) { }
        }, "8n");

        // Chords / Melody (Lead)
        this.chordLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            if (this.beatMode === 'algorave') {
                // Aggressive arpeggiated notes
                if (Math.random() < 0.8) {
                    const note = this.getArpNote(scale);
                    if (!note) return;
                    try {
                        this.aggroLead.triggerAttackRelease(note, "16n", time);
                    } catch (e) { }
                }
            } else if (this.beatMode === 'dnb') {
                // Aggressive arp lead + stab chords on off-beats
                if (Math.random() < 0.8) {
                    const note = this.getArpNote(scale);
                    if (note) {
                        try {
                            this.aggroLead.triggerAttackRelease(note, "16n", time);
                        } catch (e) { }
                    }
                }
                if (Math.random() < 0.3 && scale.length > 3) {
                    const rootIdx = Math.floor(Math.random() * (scale.length - 3));
                    const chord = [scale[rootIdx], scale[rootIdx + 1], scale[rootIdx + 3]];
                    this.poly.triggerAttackRelease(chord, "16n", time, 0.6);
                }
            } else if (this.beatMode === 'lofi') {
                // Warm detuned pad chords, held long
                if (scale.length > 3) {
                    const rootIdx = Math.floor(Math.random() * (scale.length - 3));
                    const chord = [scale[rootIdx], scale[rootIdx + 2]];
                    this.poly.triggerAttackRelease(chord, "2m", time, 0.4);
                }
            } else {
                // Soft poly chords
                if (scale.length > 2) {
                    const rootIdx = Math.floor(Math.random() * (scale.length - 2));
                    const chord = [scale[rootIdx], scale[rootIdx + 2]];
                    this.poly.triggerAttackRelease(chord, "1m", time);
                }
            }
        }, "1m");

        // Choir Loop
        this.choirLoop = new Tone.Loop(time => {
            if (this.beatMode === 'algorave' || this.beatMode === 'tumbling' || this.beatMode === 'dnb') return;
            if (this.beatMode !== 'choral' && Math.random() > 0.3) return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            const notes = [];
            const rootIdx = Math.floor(Math.random() * (scale.length - 3));
            notes.push(scale[rootIdx]);
            notes.push(scale[rootIdx + 2]);
            if (Math.random() > 0.5) notes.push(scale[rootIdx + 4]);

            const duration = (this.beatMode === 'choral') ? "2m" : "1m";
            this.choir.triggerAttackRelease(notes, duration, time);
        }, "2m");

        // Glass: Collision-Like Melody
        this.glassLoop = new Tone.Loop(time => {
            // Special TUMBLING Logic: Chaotic Bursts
            if (this.beatMode === 'tumbling') {
                if (Math.random() < 0.6) {
                    const scale = this.scales[this.currentScaleName];
                    const count = 4 + Math.floor(Math.random() * 4);

                    const events = [];
                    for (let i = 0; i < count; i++) {
                        events.push({
                            note: scale[Math.floor(Math.random() * scale.length)],
                            offset: Math.random() * 0.25,
                            vel: 0.5 + Math.random() * 0.5
                        });
                    }

                    events.sort((a, b) => a.offset - b.offset);

                    events.forEach(ev => {
                        const baseScheduleTime = Math.max(time + ev.offset, Tone.now() + 0.01);
                        const playNote = (Math.random() > 0.5) ? Tone.Frequency(ev.note).transpose(12) : ev.note;
                        this.glass.triggerAttackRelease(playNote, "16n", baseScheduleTime, ev.vel);

                        if (this.hihat) {
                            const hihatTime = Math.max(baseScheduleTime, this.lastHihatTime + 0.01);
                            this.hihat.triggerAttackRelease(2000 + Math.random() * 3000, "64n", hihatTime, ev.vel * 0.7);
                            this.lastHihatTime = hihatTime;
                        }
                    });
                }
                return;
            }

            // Standard Logic
            if (Math.random() < 0.4) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "8n", time);
            }
        }, "8n");

        // Wind Chimes
        this.windChimeLoop = new Tone.Loop(time => {
            const quietModes = ['ambient', 'choral', 'tumbling', 'lofi'];
            if (!quietModes.includes(this.beatMode)) return;

            if (Math.random() < 0.25) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "32n", time, 0.3);
            }
        }, "4m");

        // Pluck Loop (Arpeggiated melodies)
        this.pluckLoop = new Tone.Loop(time => {
            if (!['ambient', 'lofi', 'exotic_groove', 'choral'].includes(this.beatMode)) return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            const note = this.getArpNote(scale);
            if (!note) return;

            // Probability gate
            if (Math.random() < 0.7) {
                try {
                    this.pluck.triggerAttackRelease(note, "16n", time);
                } catch (e) { }
            }
        }, "8n");

        this.isIdle = false;

        // Pitch Warp Loop - GLOBAL DETUNE (Only in IDLE)
        this.pitchWarpLoop = new Tone.Loop(time => {
            if (!this.isPlaying) return;
            if (!this.isIdle) return;

            if (Math.random() < 0.7) {
                const attackBars = 0.5 + Math.random() * 3.5;
                const holdBars = 1 + Math.random() * 2;
                const dir = Math.random() > 0.5 ? 1 : -1;
                const semitones = (Math.random() * 6 + 6) * dir;
                this.triggerGlobalPitchWarp(semitones, attackBars, holdBars);
            }
        }, "4m");

        // --- Scheduler (Countdown Loop) ---
        this.remainingBars = 4;

        this.schedulerLoop = new Tone.Loop(time => {
            if (!this.isPlaying) return;

            console.log(`Audio: Next mode switch in ${this.remainingBars} measures`);
            this.remainingBars--;

            if (this.remainingBars <= 0) {
                this.performModeSwitch(time);
                const bars = [4, 8, 12];
                this.remainingBars = bars[Math.floor(Math.random() * bars.length)];
                console.log(`(Timer Reset: Waiting ${this.remainingBars} bars)`);
            }
        }, "1m");

        // Schedule start
        this.kickLoop.start(0);
        this.snareLoop.start(0);
        this.hihatLoop.start(0);
        this.bassLoop.start(0);
        this.chordLoop.start(0);
        this.glassLoop.start(0);
        this.choirLoop.start(0);
        this.windChimeLoop.start(0);
        this.pluckLoop.start(0);
        this.pitchWarpLoop.start(1);
        this.schedulerLoop.start(0);

        this.isInitialized = true;
    }

    _duckInstruments(time) {
        const duckTargets = [this.poly, this.choir, this.pluck];
        duckTargets.forEach(inst => {
            if (inst && inst.volume) {
                try {
                    const baseVol = inst.volume.value;
                    inst.volume.setValueAtTime(baseVol - 10, time);
                    inst.volume.rampTo(baseVol, 0.15, time + 0.01);
                } catch (e) { }
            }
        });
    }

    setIdle(state) {
        if (this.isIdle !== state) {
            this.isIdle = state;
            console.log(`Audio: Idle State Changed to ${state}`);

            if (state && this.isPlaying) {
                this.triggerGlobalPitchWarp(-12, 1, 2);
            }
        }
    }

    start() {
        if (!this.isInitialized) return;
        if (this.isPlaying) return;

        this.randomizeSession();

        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }

        this.lastHihatTime = Tone.now();
        this.isPlaying = true;
    }

    randomizeSession() {
        const keys = this.scaleKeys;
        this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
        this.rootNote = Math.random() > 0.5 ? "C" : "A";

        const modes = ['ambient', 'choral', 'house', 'exotic_groove', 'tumbling', 'algorave', 'dnb', 'lofi'];
        this.beatMode = modes[Math.floor(Math.random() * modes.length)];

        this.intensity = 0.3 + Math.random() * 0.4;

        // Set arp pattern for mode
        this._setArpForMode();

        // Select random drum pattern
        this._selectDrumPattern();

        console.log(`Audio Started with Mode: ${this.beatMode}, Scale: ${this.currentScaleName}`);

        this._applyModeParams();

        if (window.onAudioModeChange) {
            window.onAudioModeChange(this.beatMode);
        }
    }

    _setArpForMode() {
        const arpPatterns = {
            'ambient': 'updown',
            'choral': 'up',
            'house': 'skip',
            'algorave': 'random',
            'exotic_groove': 'updown',
            'tumbling': 'random',
            'dnb': 'skip',
            'lofi': 'up'
        };
        this.arpPattern = arpPatterns[this.beatMode] || 'random';
        this.arpIndex = 0;
        this.arpDirection = 1;
    }

    _selectDrumPattern() {
        if (this.drumPatterns[this.beatMode]) {
            const patterns = this.drumPatterns[this.beatMode].kick;
            this.currentPatternIndex = Math.floor(Math.random() * patterns.length);
            this.drumStep = 0;
        }
    }

    _applyModeParams() {
        if (this.beatMode === 'algorave') {
            this.dist.wet.rampTo(0.8, 1);
            Tone.Transport.bpm.rampTo(135 + Math.random() * 10, 2);
            if (this.reverb) this.reverb.decay = 2;
            if (this.delay) this.delay.delayTime.value = "16n";
        } else if (this.beatMode === 'house') {
            this.dist.wet.rampTo(0.3, 1);
            Tone.Transport.bpm.rampTo(122 + Math.random() * 6, 3);
            if (this.reverb) this.reverb.decay = 4;
            if (this.delay) this.delay.delayTime.value = "8n";
        } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(80, 5);
            if (this.reverb) this.reverb.decay = 12;
            if (this.delay) this.delay.delayTime.value = "4n";
        } else if (this.beatMode === 'exotic_groove') {
            this.dist.wet.rampTo(0.1, 1);
            Tone.Transport.bpm.rampTo(95 + Math.random() * 10, 4);
            if (this.reverb) this.reverb.decay = 5;
            if (this.delay) this.delay.delayTime.value = "8n.";
        } else if (this.beatMode === 'dnb') {
            this.dist.wet.rampTo(0.4, 1);
            Tone.Transport.bpm.rampTo(170 + Math.random() * 10, 2);
            if (this.reverb) this.reverb.decay = 1.5;
            if (this.delay) this.delay.delayTime.value = "16n";
        } else if (this.beatMode === 'lofi') {
            this.dist.wet.rampTo(0.05, 1);
            Tone.Transport.bpm.rampTo(70 + Math.random() * 15, 3);
            if (this.reverb) this.reverb.decay = 6;
            if (this.delay) this.delay.delayTime.value = "4n";
        } else { // ambient
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(110, 4);
            if (this.reverb) this.reverb.decay = 8;
            if (this.delay) this.delay.delayTime.value = "4n";
        }

        // Update crackle level per mode
        if (this.crackleGain) {
            let crackleLevel;
            switch (this.beatMode) {
                case 'lofi':          crackleLevel = 0.4; break;
                case 'ambient':       crackleLevel = 0.2; break;
                case 'choral':        crackleLevel = 0.15; break;
                case 'exotic_groove': crackleLevel = 0.1; break;
                case 'house':         crackleLevel = 0.05; break;
                case 'algorave':      crackleLevel = 0.0; break;
                case 'dnb':           crackleLevel = 0.0; break;
                default:              crackleLevel = 0.1;
            }
            this.crackleGain.gain.rampTo(crackleLevel, 2);
        }
    }

    stop() {
        this.isPlaying = false;
        Tone.Transport.stop();

        if (this.poly) this.poly.releaseAll();
        if (this.glass) this.glass.releaseAll();
        if (this.choir) this.choir.releaseAll();
    }

    performModeSwitch(time) {
        // 1. Drum fill before switch (crescendo snare roll)
        if (this.snare) {
            const fillSteps = 8;
            for (let i = 0; i < fillSteps; i++) {
                const fillTime = time + (i * Tone.Time("16n").toSeconds());
                const velocity = 0.3 + (i / fillSteps) * 0.7;
                try {
                    this.snare.triggerAttackRelease("32n", fillTime, velocity);
                } catch (e) { }
            }
        }

        // 2. Cycle Marker Sound
        if (this.crash && this.glass) {
            this.crash.triggerAttackRelease("C2", "2n", time, 0.5);
            const scale = this.scales["Major Pentatonic"];
            if (scale && scale.length >= 5) {
                this.glass.triggerAttackRelease([scale[0], scale[2], scale[4]], "8n", time, 0.4);
            }
        }

        // 3. Logic Update
        let newMode = this.beatMode;
        let attempts = 0;

        while (newMode === this.beatMode && attempts < 5) {
            attempts++;
            const r = Math.random();
            if (this.intensity > 0.6) {
                if (r < 0.35) newMode = 'algorave';
                else if (r < 0.55) newMode = 'dnb';
                else if (r < 0.75) newMode = 'house';
                else newMode = 'exotic_groove';
            } else {
                if (r < 0.2) newMode = 'choral';
                else if (r < 0.35) newMode = 'tumbling';
                else if (r < 0.5) newMode = 'ambient';
                else if (r < 0.6) newMode = 'lofi';
                else if (r < 0.7) newMode = 'algorave';
                else if (r < 0.8) newMode = 'dnb';
                else newMode = 'exotic_groove';
            }
        }

        // Failsafe
        if (newMode === this.beatMode) {
            const allModes = ['ambient', 'choral', 'tumbling', 'algorave', 'house', 'exotic_groove', 'dnb', 'lofi'];
            const others = allModes.filter(m => m !== this.beatMode);
            newMode = others[Math.floor(Math.random() * others.length)];
        }

        // Exotic Scale Rotation
        if (Math.random() > 0.4) {
            const keys = this.scaleKeys;
            this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
        }

        this.beatMode = newMode;
        console.log(`Audio Mode Switch: ${newMode} | Scale: ${this.currentScaleName} | Int: ${this.intensity.toFixed(2)}`);

        // Set arp pattern for new mode
        this._setArpForMode();

        // Select new drum pattern
        this._selectDrumPattern();

        if (window.onAudioModeChange) {
            window.onAudioModeChange(newMode);
        }

        // Apply mode parameters
        this._applyModeParams();
    }

    updateParams(speedMult, currentTheme) {
        if (!this.isInitialized || !this.isPlaying) return;
        const targetIntensity = Math.min(1.0, speedMult * 0.25);
        this.intensity += (targetIntensity - this.intensity) * 0.05;
        const cutoff = 400 + (Math.pow(this.intensity, 3) * 15000);
        this.masterFilter.frequency.rampTo(cutoff, 0.1);
        const feedback = 0.5 - (this.intensity * 0.3);
        this.delay.feedback.value = Math.max(0.1, feedback);
    }

    triggerInteractionSound() {
        if (!this.isInitialized) return;
        if (this.glass) {
            const scale = this.scales[this.currentScaleName];
            const n1 = scale[Math.floor(Math.random() * scale.length)];
            const n2 = scale[Math.floor(Math.random() * scale.length)];
            this.glass.triggerAttackRelease([n1, n2], "16n");
        }
    }

    triggerCollisionSound(velocity) {
        if (!this.isInitialized || !this.isPlaying) return;

        if (velocity < 0.003) return;

        if (this.glass) {
            const scale = this.scales[this.currentScaleName];
            if (!scale) return;
            const noteIndex = Math.floor(Math.random() * scale.length);
            const note = scale[noteIndex];
            const vel = Math.min(1.0, Math.max(0.5, velocity * 100));
            const dur = Math.random() > 0.5 ? "32n" : "16n";
            this.glass.triggerAttackRelease(note, dur, undefined, vel);
        }
    }

    async performTextureReset() {
        if (!this.isInitialized || !this.isPlaying) return;
        console.log("Audio: Performing Texture Reset (Fade & Params)");

        this.remainingBars = 4;

        // 1. Fade Out
        Tone.Destination.volume.rampTo(-60, 2);

        return new Promise(resolve => {
            setTimeout(() => {
                if (!this.isPlaying) {
                    resolve();
                    return;
                }

                // 2. Randomize State WITHOUT stopping transport
                const keys = this.scaleKeys;
                this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
                this.rootNote = Math.random() > 0.5 ? "C" : "A";

                const modes = ['ambient', 'choral', 'house', 'exotic_groove', 'tumbling', 'dnb', 'lofi'];
                this.beatMode = modes[Math.floor(Math.random() * modes.length)];

                this.intensity = 0.3 + Math.random() * 0.4;

                // Set arp + drum pattern for new mode
                this._setArpForMode();
                this._selectDrumPattern();

                // Apply mode params
                this._applyModeParams();

                console.log(`Audio Reset Complete. New Mode: ${this.beatMode}, Scale: ${this.currentScaleName}`);

                // 3. Fade In
                Tone.Destination.volume.rampTo(0, 4);

                if (this.nextSwitchId) Tone.Transport.clear(this.nextSwitchId);
                this.remainingBars = 4;

                if (window.onAudioModeChange) {
                    window.onAudioModeChange(this.beatMode);
                }

                resolve();
            }, 2100);
        });
    }

    triggerGlobalPitchWarp(semitones, attackBars, holdBars) {
        if (!this.isInitialized || !this.isPlaying) return;

        const bpm = Tone.Transport.bpm.value;
        const spm = (60 / Math.max(1, bpm)) * 4;

        const attackDur = attackBars * spm;
        const holdDur = holdBars * spm;

        const now = Tone.now();

        console.log(`Audio: Pitch Warp! ${semitones.toFixed(1)}st over ${attackBars.toFixed(1)} bars`);

        if (this.pitchShifter) {
            try {
                const p = this.pitchShifter.pitch;

                if (p && typeof p.rampTo === 'function') {
                    p.rampTo(semitones, attackDur, now);
                    p.rampTo(0, holdDur, now + attackDur);
                } else {
                    this.pitchShifter.pitch = semitones;
                }
            } catch (e) {
                console.warn("PitchWarp automation failed:", e);
            }
        }
    }

    getEnergy() {
        if (!this.isInitialized || !this.meter) return 0;
        const db = this.meter.getValue();
        let energy = (db + 60) / 60;
        energy = Math.max(0, Math.min(1, energy));
        return energy;
    }
}
