// All of the site's sounds, made live with the Web Audio API - no audio
// files to download. Browsers only allow sound after a click, so nothing
// plays until unlock() is called from one (the ticket). Everything goes
// through one master volume, which the sound button turns on and off
//
//   drop()      - a label landing on its strings: a soft wooden "tock"
//   whoosh(ms)  - the curtains sweeping open or shut
//   rip()       - the ticket tearing
//   menu(open)  - the "?" menu dropping down (and landing) or lifting away
//   thunder()   - a thunderclap, for the spotlight switching on
//   startMusic()- a quiet, slow lullaby in the background, on a loop

const STORAGE_KEY = "scruples-sound";
const VOLUME = 1;
const MUSIC_VOLUME = 0.14;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

// Whether sound was switched off last time (kept in this browser)
try {
	muted =
		typeof localStorage !== "undefined" &&
		localStorage.getItem(STORAGE_KEY) === "off";
} catch {}

export const isMuted = () => muted;

export const setMuted = (off: boolean) => {
	muted = off;
	try {
		localStorage.setItem(STORAGE_KEY, off ? "off" : "on");
	} catch {}
	if (ctx && master)
		master.gain.setTargetAtTime(off ? 0 : VOLUME, ctx.currentTime, 0.05);
	listeners.forEach((listener) => listener(off));
};

export const onMutedChange = (listener: (muted: boolean) => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

// Call from a click: creates (or wakes) the audio, so sounds can play
export const unlock = () => {
	if (typeof window === "undefined") return;
	if (!ctx) {
		ctx = new AudioContext();
		master = ctx.createGain();
		master.gain.value = muted ? 0 : VOLUME;
		master.connect(ctx.destination);
		// One second of white noise, reused for every noisy sound
		noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
		const data = noise.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		// Quiet while the tab is hidden
		document.addEventListener("visibilitychange", () => {
			if (!ctx) return;
			if (document.hidden) ctx.suspend();
			else ctx.resume();
		});
	}
	if (ctx.state === "suspended") ctx.resume();
};

// Ready to make a sound? (unlocked, and not switched off)
const ready = () => (ctx && master && !muted ? ctx : null);

const noiseSource = (audio: AudioContext) => {
	const source = audio.createBufferSource();
	source.buffer = noise;
	source.loop = true;
	return source;
};

// A label landing: a soft, low "pff" - a gentle thump with a slow-ish
// start and a little puff of air, like card settling on felt. Slightly
// different pitch each time, and never more than one every 60ms, so a row
// of labels landing together doesn't turn into a buzz
let lastDrop = 0;
export const drop = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	if (now - lastDrop < 0.06) return;
	lastDrop = now;
	const pitch = 0.9 + Math.random() * 0.2;

	const thump = audio.createOscillator();
	thump.type = "sine";
	thump.frequency.setValueAtTime(220 * pitch, now);
	thump.frequency.exponentialRampToValueAtTime(130 * pitch, now + 0.15);
	const thumpGain = audio.createGain();
	thumpGain.gain.setValueAtTime(0.0001, now);
	thumpGain.gain.exponentialRampToValueAtTime(0.5, now + 0.015);
	thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
	thump.connect(thumpGain).connect(master);
	thump.start(now);
	thump.stop(now + 0.28);

	const puff = noiseSource(audio);
	const low = audio.createBiquadFilter();
	low.type = "lowpass";
	low.frequency.value = 700 * pitch;
	const puffGain = audio.createGain();
	puffGain.gain.setValueAtTime(0.0001, now);
	puffGain.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
	puffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
	puff.connect(low).connect(puffGain).connect(master);
	puff.start(now, Math.random() * 0.5);
	puff.stop(now + 0.14);
};

// The menu: a quick swish as it drops, and a soft thump as it lands at the
// bottom of its bounce - or just the swish, going back up
export const menu = (open: boolean) => {
	const audio = ready();
	if (!audio || !master) return;
	whoosh(open ? 450 : 350);
	if (!open) return;
	const at = audio.currentTime + 0.32;
	const thump = audio.createOscillator();
	thump.type = "sine";
	thump.frequency.setValueAtTime(150, at);
	thump.frequency.exponentialRampToValueAtTime(80, at + 0.2);
	const gain = audio.createGain();
	gain.gain.setValueAtTime(0.0001, at);
	gain.gain.exponentialRampToValueAtTime(0.45, at + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
	thump.connect(gain).connect(master);
	thump.start(at);
	thump.stop(at + 0.32);
};

// Thunder: a sharp crack, then a long low rumble that rolls and fades over
// about three and a half seconds
export const thunder = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;

	// The crack - bright noise, very short
	const crack = noiseSource(audio);
	const crackFilter = audio.createBiquadFilter();
	crackFilter.type = "bandpass";
	crackFilter.frequency.value = 1800;
	crackFilter.Q.value = 0.6;
	const crackGain = audio.createGain();
	crackGain.gain.setValueAtTime(0.0001, now);
	crackGain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
	crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
	crack.connect(crackFilter).connect(crackGain).connect(master);
	crack.start(now, Math.random() * 0.5);
	crack.stop(now + 0.4);

	// The rumble - deep noise whose loudness wobbles as it rolls away
	const length = 3.5;
	const rumble = noiseSource(audio);
	const low = audio.createBiquadFilter();
	low.type = "lowpass";
	low.frequency.setValueAtTime(400, now);
	low.frequency.exponentialRampToValueAtTime(90, now + length);
	const rumbleGain = audio.createGain();
	rumbleGain.gain.setValueAtTime(0.0001, now);
	rumbleGain.gain.exponentialRampToValueAtTime(0.9, now + 0.08);
	// A few rolls, each a bit quieter
	let t = now + 0.08;
	let level = 0.9;
	while (t < now + length - 0.4) {
		t += 0.25 + Math.random() * 0.35;
		level *= 0.72;
		rumbleGain.gain.exponentialRampToValueAtTime(level * 0.55, t);
		rumbleGain.gain.exponentialRampToValueAtTime(level, t + 0.12);
	}
	rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
	rumble.connect(low).connect(rumbleGain).connect(master);
	rumble.start(now, Math.random() * 0.5);
	rumble.stop(now + length + 0.05);
};

// The curtains: a soft swish of fabric, rising then falling over `ms`
export const whoosh = (ms = 900) => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const length = ms / 1000;

	const source = noiseSource(audio);
	const band = audio.createBiquadFilter();
	band.type = "bandpass";
	band.Q.value = 0.8;
	band.frequency.setValueAtTime(350, now);
	band.frequency.exponentialRampToValueAtTime(1400, now + length * 0.45);
	band.frequency.exponentialRampToValueAtTime(500, now + length);
	const low = audio.createBiquadFilter();
	low.type = "lowpass";
	low.frequency.value = 2500;
	const gain = audio.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.3, now + length * 0.35);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
	source.connect(band).connect(low).connect(gain).connect(master);
	source.start(now, Math.random() * 0.5);
	source.stop(now + length + 0.05);
};

// The ticket tearing: a quick run of tiny crackles, made fresh each time
export const rip = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const length = 0.42;
	const buffer = audio.createBuffer(
		1,
		Math.round(audio.sampleRate * length),
		audio.sampleRate,
	);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		const t = i / data.length;
		// Fibres snapping: random clicks, denser in the middle of the tear
		const density = 0.08 + 0.3 * Math.sin(Math.PI * t);
		data[i] =
			Math.random() < density ? (Math.random() * 2 - 1) * (1 - t * 0.6) : 0;
	}
	const source = audio.createBufferSource();
	source.buffer = buffer;
	const high = audio.createBiquadFilter();
	high.type = "highpass";
	high.frequency.value = 1800;
	const gain = audio.createGain();
	gain.gain.value = 0.3;
	source.connect(high).connect(gain).connect(master);
	source.start(now);
};

// ---------- Background music ----------
// A slow, hushed lullaby in 4/4 (Dmaj7 - Bm7 - Gmaj7 - A): a soft pad holds
// each chord, a low note under it, and a few felt-piano notes drift over
// the top. Notes are scheduled a moment ahead on the audio clock, so the
// timing stays steady
const BEAT = 60 / 64;
const BARS: { bass: number; pad: number[]; notes: number[] }[] = [
	// MIDI note numbers; 8 eighth notes per bar (0 = rest)
	{ bass: 38, pad: [62, 66, 69, 73], notes: [74, 0, 69, 0, 73, 0, 0, 0] },
	{ bass: 35, pad: [59, 62, 66, 69], notes: [71, 0, 0, 69, 66, 0, 0, 0] },
	{ bass: 31, pad: [59, 62, 66, 67], notes: [67, 0, 71, 0, 74, 0, 73, 0] },
	{ bass: 33, pad: [57, 61, 64, 69], notes: [69, 0, 0, 0, 0, 0, 0, 0] },
	{ bass: 38, pad: [62, 66, 69, 73], notes: [78, 0, 76, 0, 74, 0, 0, 0] },
	{ bass: 35, pad: [59, 62, 66, 69], notes: [73, 0, 71, 0, 0, 66, 0, 0] },
	{ bass: 31, pad: [59, 62, 66, 67], notes: [71, 0, 0, 74, 0, 0, 71, 0] },
	{ bass: 33, pad: [57, 61, 64, 69], notes: [73, 0, 0, 0, 76, 0, 0, 0] },
];
const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let music: { bus: GainNode; timer: ReturnType<typeof setInterval> } | null =
	null;

// One soft note: a gentle attack (not a hard pluck) and a long fade
const tone = (
	audio: AudioContext,
	out: AudioNode,
	midi: number,
	at: number,
	volume: number,
	attack: number,
	length: number,
	detune = 0,
) => {
	const osc = audio.createOscillator();
	osc.type = "sine";
	osc.frequency.value = freq(midi);
	osc.detune.value = detune;
	const gain = audio.createGain();
	gain.gain.setValueAtTime(0.0001, at);
	gain.gain.exponentialRampToValueAtTime(volume, at + attack);
	gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
	osc.connect(gain).connect(out);
	osc.start(at);
	osc.stop(at + length + 0.05);
};

export const startMusic = () => {
	if (!ctx || !master || music) return;
	const audio = ctx;
	const bus = audio.createGain();
	bus.gain.setValueAtTime(0.0001, audio.currentTime);
	bus.gain.exponentialRampToValueAtTime(MUSIC_VOLUME, audio.currentTime + 6);
	// Warm it up: roll off the highs
	const warm = audio.createBiquadFilter();
	warm.type = "lowpass";
	warm.frequency.value = 2200;
	warm.connect(bus);
	// A soft echo on the melody, for a sleepy, roomy feel
	const echo = audio.createDelay();
	echo.delayTime.value = BEAT * 1.5;
	const feedback = audio.createGain();
	feedback.gain.value = 0.3;
	const wet = audio.createGain();
	wet.gain.value = 0.3;
	echo.connect(feedback).connect(echo);
	echo.connect(wet).connect(warm);
	bus.connect(master);

	let bar = 0;
	let nextBar = audio.currentTime + 0.3;
	const schedule = () => {
		// Fill in anything due in the next second and a half
		while (nextBar < audio.currentTime + 1.5) {
			const { bass, pad, notes } = BARS[bar % BARS.length];
			const barLength = BEAT * 4;
			tone(audio, warm, bass, nextBar, 0.45, 0.08, barLength * 1.1);
			// The pad: each chord note twice, slightly detuned, swelling in
			pad.forEach((note) => {
				tone(audio, warm, note, nextBar, 0.08, 0.9, barLength * 1.15, -6);
				tone(audio, warm, note, nextBar, 0.08, 0.9, barLength * 1.15, 6);
			});
			notes.forEach((note, i) => {
				if (!note) return;
				const at = nextBar + (i * BEAT) / 2;
				tone(audio, warm, note, at, 0.35, 0.02, 2.2);
				tone(audio, echo, note, at, 0.25, 0.02, 2.2);
			});
			nextBar += barLength;
			bar++;
		}
	};
	schedule();
	music = { bus, timer: setInterval(schedule, 300) };
};

// Fades the lullaby out (e.g. for the storm on Page 7) and back in again
export const pauseMusic = (paused: boolean) => {
	if (!ctx || !music) return;
	const now = ctx.currentTime;
	music.bus.gain.cancelScheduledValues(now);
	music.bus.gain.setValueAtTime(Math.max(music.bus.gain.value, 0.0001), now);
	music.bus.gain.exponentialRampToValueAtTime(
		paused ? 0.0001 : MUSIC_VOLUME,
		now + (paused ? 0.6 : 3),
	);
};

// ---------- Storm music ----------
// For Zhenya tweaking under the spotlight: a dark, uneasy drone - two low
// detuned notes a semitone apart, with a slow wobble - and distant thunder
// rolling in every few seconds. Starts and stops with a fade
const STORM_VOLUME = 0.22;
let storm: {
	bus: GainNode;
	stop: () => void;
} | null = null;

export const startStorm = () => {
	if (!ctx || !master || storm) return;
	const audio = ctx;
	const now = audio.currentTime;
	const bus = audio.createGain();
	bus.gain.setValueAtTime(0.0001, now);
	bus.gain.exponentialRampToValueAtTime(STORM_VOLUME, now + 1.2);
	const low = audio.createBiquadFilter();
	low.type = "lowpass";
	low.frequency.value = 420;
	low.connect(bus).connect(master);

	// The drone: D and E-flat, low down, each doubled slightly out of tune
	const oscs = [38, 39, 26].flatMap((midi) =>
		[-8, 8].map((detune) => {
			const osc = audio.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = freq(midi);
			osc.detune.value = detune;
			const gain = audio.createGain();
			gain.gain.value = midi === 26 ? 0.22 : 0.1;
			osc.connect(gain).connect(low);
			osc.start(now);
			return osc;
		}),
	);
	// A slow wobble in the filter, so it breathes uneasily
	const lfo = audio.createOscillator();
	lfo.frequency.value = 0.18;
	const lfoGain = audio.createGain();
	lfoGain.gain.value = 160;
	lfo.connect(lfoGain).connect(low.frequency);
	lfo.start(now);

	// Distant thunder every few seconds
	let rumbleTimer: ReturnType<typeof setTimeout>;
	const rumble = () => {
		if (!noise) return;
		const at = audio.currentTime;
		const source = audio.createBufferSource();
		source.buffer = noise;
		source.loop = true;
		const filter = audio.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 160;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(0.9, at + 0.4);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.8);
		source.connect(filter).connect(gain).connect(bus);
		source.start(at, Math.random() * 0.5);
		source.stop(at + 3);
		rumbleTimer = setTimeout(rumble, 3500 + Math.random() * 3500);
	};
	rumbleTimer = setTimeout(rumble, 2000);

	storm = {
		bus,
		stop: () => {
			clearTimeout(rumbleTimer);
			const end = audio.currentTime;
			bus.gain.cancelScheduledValues(end);
			bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), end);
			bus.gain.exponentialRampToValueAtTime(0.0001, end + 1.2);
			[...oscs, lfo].forEach((osc) => osc.stop(end + 1.3));
		},
	};
};

export const stopStorm = () => {
	storm?.stop();
	storm = null;
};

// The souvenir shop's door: a little shop bell, two quick dings with a
// shimmery ring
export const shopBell = () => {
	const audio = ready();
	if (!audio || !master) return;
	[0, 0.16].forEach((offset, strike) => {
		const at = audio.currentTime + offset;
		// A bell's partials aren't in tune with each other - that's the ring
		[1, 2.76, 5.4].forEach((ratio, i) => {
			const osc = audio.createOscillator();
			osc.type = "sine";
			osc.frequency.value = (strike ? 1480 : 1320) * ratio;
			const gain = audio.createGain();
			gain.gain.setValueAtTime(0.0001, at);
			gain.gain.exponentialRampToValueAtTime([0.18, 0.07, 0.03][i], at + 0.004);
			gain.gain.exponentialRampToValueAtTime(0.0001, at + [1.4, 0.8, 0.4][i]);
			osc.connect(gain).connect(master!);
			osc.start(at);
			osc.stop(at + 1.5);
		});
	});
};

// Opening a mystery box: a cardboard rustle as the flaps open, then a
// little rising "ta-da" of chimes
export const unbox = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;

	// Two quick scrapes of cardboard
	[0, 0.12].forEach((offset) => {
		const at = now + offset;
		const scrape = noiseSource(audio);
		const band = audio.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.value = 1800;
		band.Q.value = 0.8;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
		scrape.connect(band).connect(gain).connect(master!);
		scrape.start(at, Math.random() * 0.5);
		scrape.stop(at + 0.12);
	});

	// C, E, G, C - up, like something being revealed
	[523, 659, 784, 1047].forEach((freq, i) => {
		const at = now + 0.3 + i * 0.09;
		const osc = audio.createOscillator();
		osc.type = "triangle";
		osc.frequency.value = freq;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(0.16, at + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + (i === 3 ? 0.9 : 0.35));
		osc.connect(gain).connect(master!);
		osc.start(at);
		osc.stop(at + 1);
	});
};
