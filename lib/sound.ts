const STORAGE_KEY = "scruples-sound";
const VOLUME = 1;
const MUSIC_VOLUME = 0.14;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

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

export const unlock = () => {
	if (typeof window === "undefined") return;
	if (!ctx) {
		ctx = new AudioContext();
		master = ctx.createGain();
		master.gain.value = muted ? 0 : VOLUME;
		master.connect(ctx.destination);
		noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
		const data = noise.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		document.addEventListener("visibilitychange", () => {
			if (!ctx) return;
			if (document.hidden) ctx.suspend();
			else ctx.resume();
		});
	}
	if (ctx.state === "suspended") ctx.resume();
};

const ready = () => (ctx && master && !muted ? ctx : null);

const noiseSource = (audio: AudioContext) => {
	const source = audio.createBufferSource();
	source.buffer = noise;
	source.loop = true;
	return source;
};

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

export const thunder = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;

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

	const length = 3.5;
	const rumble = noiseSource(audio);
	const low = audio.createBiquadFilter();
	low.type = "lowpass";
	low.frequency.setValueAtTime(400, now);
	low.frequency.exponentialRampToValueAtTime(90, now + length);
	const rumbleGain = audio.createGain();
	rumbleGain.gain.setValueAtTime(0.0001, now);
	rumbleGain.gain.exponentialRampToValueAtTime(0.9, now + 0.08);
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

const BEAT = 60 / 64;
const BARS: { bass: number; pad: number[]; notes: number[] }[] = [
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
	const warm = audio.createBiquadFilter();
	warm.type = "lowpass";
	warm.frequency.value = 2200;
	warm.connect(bus);
	const echo = audio.createDelay(2);
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
		while (nextBar < audio.currentTime + 1.5) {
			const { bass, pad, notes } = BARS[bar % BARS.length];
			const barLength = BEAT * 4;
			tone(audio, warm, bass, nextBar, 0.45, 0.08, barLength * 1.1);
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
	const lfo = audio.createOscillator();
	lfo.frequency.value = 0.18;
	const lfoGain = audio.createGain();
	lfoGain.gain.value = 160;
	lfo.connect(lfoGain).connect(low.frequency);
	lfo.start(now);

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

export const shopBell = () => {
	const audio = ready();
	if (!audio || !master) return;
	[0, 0.16].forEach((offset, strike) => {
		const at = audio.currentTime + offset;
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

export const unbox = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;

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

export const drumroll = (ms = 1400) => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const end = ms / 1000;
	const tap = (at: number, level: number) => {
		const hit = noiseSource(audio);
		const band = audio.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.value = 2400;
		band.Q.value = 0.7;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(level, at + 0.004);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
		hit.connect(band).connect(gain).connect(master!);
		hit.start(at, Math.random() * 0.5);
		hit.stop(at + 0.08);
	};
	for (let t = 0; t < end; t += 0.035)
		tap(now + t, 0.05 + 0.2 * (t / end) * (0.8 + Math.random() * 0.4));
	tap(now + end, 0.4);
};

export const fanfare = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const note = (freq: number, at: number, length: number, level = 0.12) => {
		const osc = audio.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.value = freq;
		const soft = audio.createBiquadFilter();
		soft.type = "lowpass";
		soft.frequency.value = 2200;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, now + at);
		gain.gain.exponentialRampToValueAtTime(level, now + at + 0.02);
		gain.gain.setValueAtTime(level, now + at + length - 0.08);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
		osc.connect(soft).connect(gain).connect(master!);
		osc.start(now + at);
		osc.stop(now + at + length + 0.02);
	};
	note(392, 0, 0.14);
	note(392, 0.16, 0.14);
	for (const f of [523, 659, 784]) note(f, 0.32, 0.9, 0.08);
};

export const sadTrombone = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const steps = [
		[294, 0, 0.32],
		[277, 0.36, 0.32],
		[262, 0.72, 0.32],
		[247, 1.08, 1.1],
	] as const;
	for (const [freq, at, length] of steps) {
		const osc = audio.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(freq, now + at);
		if (length > 0.5) {
			const wobble = audio.createOscillator();
			wobble.frequency.value = 5;
			const depth = audio.createGain();
			depth.gain.value = 6;
			wobble.connect(depth).connect(osc.frequency);
			wobble.start(now + at);
			wobble.stop(now + at + length);
			osc.frequency.linearRampToValueAtTime(freq * 0.94, now + at + length);
		}
		const soft = audio.createBiquadFilter();
		soft.type = "lowpass";
		soft.frequency.value = 900;
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0.0001, now + at);
		gain.gain.exponentialRampToValueAtTime(0.14, now + at + 0.05);
		gain.gain.setValueAtTime(0.14, now + at + length - 0.1);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
		osc.connect(soft).connect(gain).connect(master!);
		osc.start(now + at);
		osc.stop(now + at + length + 0.02);
	}
};

export const click = () => {
	const audio = ready();
	if (!audio || !master) return;
	const now = audio.currentTime;
	const osc = audio.createOscillator();
	osc.type = "triangle";
	osc.frequency.setValueAtTime(1100, now);
	osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
	const gain = audio.createGain();
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.25, now + 0.004);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
	osc.connect(gain).connect(master);
	osc.start(now);
	osc.stop(now + 0.1);
};

const MURMUR_VOLUME = 0.5;
let murmur: { bus: GainNode; stop: () => void } | null = null;

export const startMurmur = () => {
	if (!ctx || !master || murmur) return;
	const audio = ctx;
	const now = audio.currentTime;
	const bus = audio.createGain();
	bus.gain.setValueAtTime(0.0001, now);
	bus.gain.exponentialRampToValueAtTime(MURMUR_VOLUME, now + 2);
	const room = audio.createBiquadFilter();
	room.type = "lowpass";
	room.frequency.value = 1800;
	room.connect(bus).connect(master);

	const sources: AudioBufferSourceNode[] = [];
	const hum = noiseSource(audio);
	const humFilter = audio.createBiquadFilter();
	humFilter.type = "lowpass";
	humFilter.frequency.value = 300;
	const humGain = audio.createGain();
	humGain.gain.value = 0.05;
	hum.connect(humFilter).connect(humGain).connect(room);
	hum.start(now);
	sources.push(hum);

	const voices = Array.from({ length: 9 }, () => {
		const source = noiseSource(audio);
		const mouth = audio.createBiquadFilter();
		mouth.type = "bandpass";
		mouth.Q.value = 4;
		mouth.frequency.value = 500;
		const gain = audio.createGain();
		gain.gain.value = 0.0001;
		source.connect(mouth).connect(gain).connect(room);
		source.start(now, Math.random());
		sources.push(source);
		return {
			mouth,
			gain,
			pitch: 0.7 + Math.random() * 0.6,
			chatty: 0.4 + Math.random() * 0.5,
			next: now + Math.random(),
		};
	});
	const schedule = () => {
		for (const v of voices) {
			while (v.next < audio.currentTime + 0.6) {
				const at = v.next;
				if (Math.random() > v.chatty) {
					v.next += 0.4 + Math.random() * 1.2;
					continue;
				}
				const length = 0.08 + Math.random() * 0.18;
				const level = (0.25 + Math.random() * 0.75) * 0.6;
				v.mouth.frequency.setTargetAtTime(
					(350 + Math.random() * 800) * v.pitch,
					at,
					0.03,
				);
				v.gain.gain.setTargetAtTime(level, at, 0.025);
				v.gain.gain.setTargetAtTime(0.0001, at + length, 0.04);
				v.next = at + length + 0.03 + Math.random() * 0.12;
			}
		}
	};
	schedule();
	const timer = setInterval(schedule, 200);

	murmur = {
		bus,
		stop: () => {
			clearInterval(timer);
			const end = audio.currentTime;
			sources.forEach((source) => source.stop(end + 0.1));
		},
	};
};

export const hushMurmur = (ms = 2200) => {
	if (!ctx || !murmur) return;
	const { bus, stop } = murmur;
	murmur = null;
	const now = ctx.currentTime;
	bus.gain.cancelScheduledValues(now);
	bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
	bus.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
	setTimeout(stop, ms + 100);
};

export const chime = () => {
	const audio = ready();
	if (!audio || !master) return;
	[
		[659, 0],
		[523, 0.55],
	].forEach(([note, offset]) => {
		const at = audio.currentTime + offset;
		[1, 2, 3.01].forEach((ratio, i) => {
			const osc = audio.createOscillator();
			osc.type = "sine";
			osc.frequency.value = note * ratio;
			const gain = audio.createGain();
			gain.gain.setValueAtTime(0.0001, at);
			gain.gain.exponentialRampToValueAtTime([0.22, 0.05, 0.02][i], at + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, at + [2.2, 1, 0.5][i]);
			osc.connect(gain).connect(master!);
			osc.start(at);
			osc.stop(at + 2.3);
		});
	});
};
