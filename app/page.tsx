"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, UIEvent } from "react";

type Track = { name: string; url: string; startAt: number; fadeIn: number };
type IconName = "music" | "play" | "pause" | "minus" | "plus" | "upload" | "shuffle" | "previous" | "next" | "repeat" | "settings";

const musicLibrary: Track[] = [
  { name: "ฉากเปิด", url: "/music/opening.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 1", url: "/music/scene-1.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 2", url: "/music/scene-2.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 3", url: "/music/scene-3.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 4", url: "/music/scene-4.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 5", url: "/music/scene-5.mp3", startAt: 0, fadeIn: 2 },
  { name: "ฉาก 6", url: "/music/scene-6.mp3", startAt: 0, fadeIn: 2 },
];
const TRACK_SETTINGS_KEY = "room7-music-track-settings-v1";

function getTrackSettingsId(track: Track) {
  return track.url.startsWith("blob:") ? `file:${track.name}` : track.url;
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "play":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M8 5.8c0-.8.9-1.3 1.6-.9l9.2 5.4a2 2 0 0 1 0 3.4l-9.2 5.4c-.7.4-1.6-.1-1.6-.9V5.8Z" /></svg>;
    case "pause":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M7 5.5A1.5 1.5 0 0 1 8.5 4h1A1.5 1.5 0 0 1 11 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 7 18.5v-13Zm6 0A1.5 1.5 0 0 1 14.5 4h1A1.5 1.5 0 0 1 17 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-13Z" /></svg>;
    case "minus":
      return <svg {...common}><path d="M5 12h14" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 15V4m0 0L8 8m4-4 4 4" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>;
    case "shuffle":
      return <svg {...common}><path d="m17 3 4 4-4 4" /><path d="M3 7h2.5c4.8 0 8.2 10 13 10H21" /><path d="m17 13 4 4-4 4" /><path d="M3 17h2.5c1.7 0 3.2-1.8 4.6-3.8M14 8.8c1.4-1.1 2.7-1.8 4-1.8H21" /></svg>;
    case "previous":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M5 5h2v14H5zM20 5.8v12.4a1 1 0 0 1-1.6.8L9 12l9.4-7a1 1 0 0 1 1.6.8ZM9 12l-3.4 2.5V9.5L9 12Z" /></svg>;
    case "next":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M17 5h2v14h-2zM4 5.8v12.4a1 1 0 0 0 1.6.8L15 12 5.6 4A1 1 0 0 0 4 5.8ZM15 12l3.4 2.5V9.5L15 12Z" /></svg>;
    case "repeat":
      return <svg {...common}><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>;
    case "settings":
      return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="var(--color-surface)" /><circle cx="15" cy="12" r="2" fill="var(--color-surface)" /><circle cx="11" cy="18" r="2" fill="var(--color-surface)" /></svg>;
    default:
      return <svg {...common}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const autoplayRef = useRef(false);
  const fadeFrameRef = useRef<number | null>(null);
  const fadeProgressRef = useRef(1);
  const fadeDurationRef = useRef(0);
  const audioGraphRef = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const volumeRef = useRef(0.7);
  const playlistScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tracks, setTracks] = useState<Track[]>(musicLibrary);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState("");
  const [isPlaylistScrolling, setIsPlaylistScrolling] = useState(false);
  const [playlistScrollMetrics, setPlaylistScrollMetrics] = useState({ progress: 0, thumbSize: 100 });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const currentTrack = tracks[trackIndex];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TRACK_SETTINGS_KEY) ?? "{}") as Record<string, Partial<Pick<Track, "startAt" | "fadeIn">>>;
      setTracks((items) => items.map((track) => {
        const savedTrack = saved[getTrackSettingsId(track)];
        if (!savedTrack) return track;
        return {
          ...track,
          startAt: typeof savedTrack.startAt === "number" && Number.isFinite(savedTrack.startAt) ? Math.max(0, Math.min(3600, savedTrack.startAt)) : track.startAt,
          fadeIn: typeof savedTrack.fadeIn === "number" && Number.isFinite(savedTrack.fadeIn) ? Math.max(0, Math.min(10, savedTrack.fadeIn)) : track.fadeIn,
        };
      }));
    } catch {
      // Keep the built-in defaults if local storage is unavailable or invalid.
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const saved = Object.fromEntries(tracks.map((track) => [getTrackSettingsId(track), { startAt: track.startAt, fadeIn: track.fadeIn }]));
    try {
      localStorage.setItem(TRACK_SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      // Playback and in-memory settings continue to work if storage is full or unavailable.
    }
  }, [tracks, settingsLoaded]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    if (playlistScrollTimeoutRef.current) clearTimeout(playlistScrollTimeoutRef.current);
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    if (audioGraphRef.current?.context.state !== "closed") void audioGraphRef.current?.context.close();
  }, []);

  function showPlaylistScrollbar(event: UIEvent<HTMLOListElement>) {
    const list = event.currentTarget;
    const maxScroll = list.scrollHeight - list.clientHeight;
    const thumbSize = Math.min(100, (list.clientHeight / list.scrollHeight) * 100);
    setPlaylistScrollMetrics({
      progress: maxScroll > 0 ? list.scrollTop / maxScroll : 0,
      thumbSize,
    });
    setIsPlaylistScrolling(true);
    if (playlistScrollTimeoutRef.current) clearTimeout(playlistScrollTimeoutRef.current);
    playlistScrollTimeoutRef.current = setTimeout(() => setIsPlaylistScrolling(false), 700);
  }

  useEffect(() => {
    volumeRef.current = volume;
    const graph = audioGraphRef.current;
    if (!graph) return;
    const now = graph.context.currentTime;
    const progress = fadeProgressRef.current;
    graph.gain.gain.cancelScheduledValues(now);
    graph.gain.gain.setValueAtTime(volume * progress, now);
    const remaining = fadeDurationRef.current * (1 - progress);
    if (remaining > 0 && graph.gain.gain.linearRampToValueAtTime) {
      graph.gain.gain.linearRampToValueAtTime(volume, now + remaining);
    }
  }, [volume, currentTrack?.url]);

  function getAudioGraph(audio: HTMLAudioElement) {
    if (audioGraphRef.current) return audioGraphRef.current;
    const context = new AudioContext();
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    source.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(volumeRef.current, context.currentTime);
    audioGraphRef.current = { context, gain };
    return audioGraphRef.current;
  }

  function playTrackAudio(audio: HTMLAudioElement, track: Track, startAtConfiguredPosition: boolean) {
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    fadeFrameRef.current = null;

    if (startAtConfiguredPosition) {
      const lastPlayableSecond = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.05) : track.startAt;
      audio.currentTime = Math.min(track.startAt, lastPlayableSecond);
    }

    const shouldFadeIn = volumeRef.current > 0 && track.fadeIn > 0 && (startAtConfiguredPosition || fadeProgressRef.current < 1);
    const initialProgress = startAtConfiguredPosition ? 0 : fadeProgressRef.current;
    fadeProgressRef.current = shouldFadeIn ? initialProgress : 1;
    fadeDurationRef.current = track.fadeIn;

    try {
      const graph = getAudioGraph(audio);
      const context = graph.context;
      const resumePromise = context.state === "suspended" ? context.resume() : Promise.resolve();
      const now = context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(volumeRef.current * fadeProgressRef.current, now);
      const playPromise = audio.play();

      void Promise.all([resumePromise, playPromise]).then(() => {
        if (!shouldFadeIn) return;
        const startedAt = performance.now();
        const rampDuration = track.fadeIn * (1 - initialProgress);
        const fadeEnd = context.currentTime + rampDuration;
        if (graph.gain.gain.linearRampToValueAtTime) {
          graph.gain.gain.linearRampToValueAtTime(volumeRef.current, fadeEnd);
        }
        const ramp = (time: number) => {
          const progress = Math.max(initialProgress, Math.min(1, initialProgress + (time - startedAt) / (rampDuration * 1000)));
          fadeProgressRef.current = progress;
          if (!graph.gain.gain.linearRampToValueAtTime) {
            graph.gain.gain.setValueAtTime(volumeRef.current * progress, context.currentTime);
          }
          if (progress < 1) fadeFrameRef.current = requestAnimationFrame(ramp);
          else fadeFrameRef.current = null;
        };
        fadeFrameRef.current = requestAnimationFrame(ramp);
      }).catch(() => {
        fadeProgressRef.current = 1;
        setIsPlaying(false);
        setError("เล่นไฟล์นี้ไม่ได้ ลองเลือกไฟล์เสียงอื่น");
      });
    } catch {
      fadeProgressRef.current = 1;
      setIsPlaying(false);
      setError("เล่นไฟล์นี้ไม่ได้ ลองเลือกไฟล์เสียงอื่น");
    }
  }

  function pauseTrackAudio(audio: HTMLAudioElement) {
    audio.pause();
    const graph = audioGraphRef.current;
    if (graph) {
      const now = graph.context.currentTime;
      graph.gain.gain.cancelScheduledValues(now);
      graph.gain.gain.setValueAtTime(volumeRef.current * fadeProgressRef.current, now);
    }
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    fadeFrameRef.current = null;
  }

  function haptic() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(12);
    }
  }

  function chooseTracks(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    if (audioRef.current) pauseTrackAudio(audioRef.current);
    fadeProgressRef.current = 1;
    const graph = audioGraphRef.current;
    if (graph) graph.gain.gain.setValueAtTime(volumeRef.current, graph.context.currentTime);
    objectUrlsRef.current.forEach(URL.revokeObjectURL);
    const nextTracks = files.map((file) => ({
      name: file.name.replace(/\.[^.]+$/, ""),
      url: URL.createObjectURL(file),
      startAt: 0,
      fadeIn: 2,
    }));
    objectUrlsRef.current = nextTracks.map((track) => track.url);
    autoplayRef.current = false;
    setTracks(nextTracks);
    setTrackIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setError("");
    event.target.value = "";
  }

  function selectTrack(index: number, autoplay: boolean) {
    if (!tracks.length) return;
    const nextIndex = (index + tracks.length) % tracks.length;
    setError("");
    setCurrentTime(0);
    setDuration(0);
    autoplayRef.current = autoplay;
    setIsPlaying(autoplay);
    fadeProgressRef.current = 1;
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    fadeFrameRef.current = null;

    if (nextIndex === trackIndex && audioRef.current) {
      audioRef.current.currentTime = 0;
      if (autoplay) {
        playTrackAudio(audioRef.current, tracks[nextIndex], true);
      }
      return;
    }

    if (audioRef.current) pauseTrackAudio(audioRef.current);
    setTrackIndex(nextIndex);
  }

  function togglePlayback() {
    haptic();
    const audio = audioRef.current;
    if (!currentTrack || !audio) {
      setError("เลือกไฟล์เพลงก่อนเริ่มเล่น");
      return;
    }

    if (audio.paused) {
      setError("");
      const startsAtBeginning = audio.currentTime === 0 || audio.ended;
      playTrackAudio(audio, currentTrack, startsAtBeginning);
    } else {
      pauseTrackAudio(audio);
      setIsPlaying(false);
    }
  }

  function changeVolume(nextVolume: number) {
    haptic();
    setVolume(Math.max(0, Math.min(1, Math.round(nextVolume * 10) / 10)));
  }

  function updateTrackSetting(index: number, key: "startAt" | "fadeIn", value: number) {
    const maxValue = key === "startAt" ? 3600 : 10;
    const safeValue = Number.isFinite(value) ? Math.min(maxValue, Math.max(0, value)) : 0;
    setTracks((items) => items.map((track, itemIndex) => itemIndex === index ? { ...track, [key]: safeValue } : track));
  }

  function goToPreviousTrack() {
    haptic();
    if (!currentTrack) return;
    if (currentTime > 3 && audioRef.current) {
      selectTrack(trackIndex, true);
      return;
    }
    selectTrack(trackIndex - 1, true);
  }

  function goToNextTrack() {
    haptic();
    if (!currentTrack) return;
    const nextIndex = isShuffle && tracks.length > 1
      ? (trackIndex + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length
      : trackIndex + 1;
    selectTrack(nextIndex, true);
  }

  function playTrackFromList(index: number) {
    haptic();
    if (index !== trackIndex) {
      selectTrack(index, true);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setError("");
      const startsAtBeginning = audio.currentTime === 0 || audio.ended;
      playTrackAudio(audio, currentTrack, startsAtBeginning);
    } else {
      pauseTrackAudio(audio);
    }
  }

  function handleEnded() {
    if (isShuffle && tracks.length > 1) {
      const nextIndex = (trackIndex + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length;
      selectTrack(nextIndex, true);
    } else if (trackIndex < tracks.length - 1) {
      selectTrack(trackIndex + 1, true);
    } else if (isRepeat) {
      selectTrack(0, true);
    } else {
      setIsPlaying(false);
      setCurrentTime(duration);
    }
  }

  function seekTo(value: number) {
    if (!audioRef.current || !duration) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const remaining = Math.max(0, duration - currentTime);

  return (
    <main className="player-page">
      <section className="player-shell" aria-label="เครื่องเล่นเพลง">
        <div className="player-frame">
          <div className="player-card">
            <div className="track-header">
              <div className="album-art" aria-hidden="true"><Icon name="music" size={24} /></div>
              <div className="track-info" aria-live="polite">
                <h1 title={currentTrack?.name}>{currentTrack?.name ?? "ยังไม่ได้เลือกเพลง"}</h1>
                <p>{currentTrack ? `ไฟล์ในเครื่อง${tracks.length > 1 ? ` · ${trackIndex + 1}/${tracks.length}` : ""}` : "เลือกเพลงจากอุปกรณ์ของคุณ"}</p>
              </div>
              <div className="track-actions">
                <button className="small-control" type="button" onClick={() => { haptic(); fileInputRef.current?.click(); }} aria-label="เลือกไฟล์เพลง">
                  <Icon name="upload" size={18} />
                </button>
                <input ref={fileInputRef} className="sr-only" type="file" accept="audio/*" multiple onChange={chooseTracks} aria-label="เลือกไฟล์เพลงจากอุปกรณ์" />
              </div>
            </div>

            <div className="timeline">
              <label className="sr-only" htmlFor="track-progress">ตำแหน่งเพลง</label>
              <input
                id="track-progress"
                className="range-input progress-input"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(event) => seekTo(Number(event.target.value))}
                style={{ "--p": `${progress}%` } as CSSProperties}
                disabled={!currentTrack || !duration}
              />
              <div className="time-row"><span>{formatTime(currentTime)}</span><span>−{formatTime(remaining)}</span></div>
            </div>

            <div className="control-row">
              <div className="transport-controls" aria-label="ควบคุมเพลง">
                <button className="icon-control mode-control" type="button" onClick={() => { haptic(); setIsShuffle(!isShuffle); }} aria-label="สุ่มเพลง" aria-pressed={isShuffle} disabled={tracks.length < 2}>
                  <Icon name="shuffle" size={20} />
                </button>
                <button className="icon-control skip-control" type="button" onClick={goToPreviousTrack} disabled={!currentTrack} aria-label="เพลงก่อนหน้า">
                  <Icon name="previous" size={22} />
                </button>
                <button className="control-button play-control" type="button" onClick={togglePlayback} aria-label={isPlaying ? "หยุดชั่วคราว" : "เล่นเพลง"}>
                  <Icon name={isPlaying ? "pause" : "play"} size={22} />
                </button>
                <button className="icon-control skip-control" type="button" onClick={goToNextTrack} disabled={!currentTrack} aria-label="เพลงถัดไป">
                  <Icon name="next" size={22} />
                </button>
                <button className="icon-control mode-control" type="button" onClick={() => { haptic(); setIsRepeat(!isRepeat); }} aria-label="วนซ้ำเพลง" aria-pressed={isRepeat} disabled={!currentTrack}>
                  <Icon name="repeat" size={20} />
                </button>
              </div>

              <div className="volume-controls">
                <button className="volume-button" type="button" onClick={() => changeVolume(volume - 0.1)} disabled={volume <= 0} aria-label="ลดเสียง">
                  <Icon name="minus" size={17} />
                </button>
                <label className="sr-only" htmlFor="volume">ระดับเสียง</label>
                <input
                  id="volume"
                  className="range-input volume-input"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  style={{ "--p": `${volume * 100}%` } as CSSProperties}
                />
                <button className="volume-button" type="button" onClick={() => changeVolume(volume + 0.1)} disabled={volume >= 1} aria-label="เพิ่มเสียง">
                  <Icon name="plus" size={17} />
                </button>
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            {error && <p className="player-message" role="status">{error}</p>}
          </div>
        </div>

        {tracks.length > 1 && (
          <section className="playlist-frame" aria-labelledby="playlist-title">
            <div className="playlist-card">
              <header className="playlist-header">
                <h2 id="playlist-title">รายการเพลง</h2>
                <span>{tracks.length} เพลง</span>
              </header>
              <div className="playlist-scroll">
              <ol className="playlist-list" onScroll={showPlaylistScrollbar}>
                  {tracks.map((track, index) => {
                    const isCurrentTrack = index === trackIndex;
                    const label = isCurrentTrack && isPlaying ? `หยุดชั่วคราว ${track.name}` : `เล่น ${track.name}`;

                    return (
                    <li className="playlist-item" key={track.url}>
                        <button
                          className={`playlist-track${isCurrentTrack ? " is-current" : ""}`}
                          type="button"
                          onClick={() => playTrackFromList(index)}
                          aria-label={label}
                          aria-current={isCurrentTrack ? "true" : undefined}
                        >
                          <span className="playlist-art" aria-hidden="true"><Icon name="music" size={17} /></span>
                          <span className="playlist-track-copy">
                            <span className="playlist-track-name">{track.name}</span>
                            <span className="playlist-track-number">เพลงที่ {index + 1}</span>
                          </span>
                          <span className="playlist-track-action" aria-hidden="true">
                            <Icon name={isCurrentTrack && isPlaying ? "pause" : "play"} size={16} />
                          </span>
                        </button>
                      <details className="playlist-settings">
                        <summary aria-label={`ตั้งค่า ${track.name}`} title="ตั้งค่าเพลง">
                          <Icon name="settings" size={16} />
                        </summary>
                        <div className="playlist-settings-fields">
                          <label>
                            <span>เริ่มที่ (วินาที)</span>
                            <input
                              type="number"
                              min={0}
                              max={3600}
                              step={1}
                              value={track.startAt}
                              onChange={(event) => updateTrackSetting(index, "startAt", Number(event.target.value))}
                            />
                          </label>
                          <label>
                            <span>Fade in (วินาที)</span>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={track.fadeIn}
                              onChange={(event) => updateTrackSetting(index, "fadeIn", Number(event.target.value))}
                            />
                          </label>
                        </div>
                      </details>
                      </li>
                    );
                  })}
                </ol>
                {isPlaylistScrolling && tracks.length > 1 && (
                  <span className="playlist-scrollbar" aria-hidden="true">
                    <span
                      className="playlist-scrollbar-thumb"
                      style={{
                        height: `${playlistScrollMetrics.thumbSize}%`,
                        transform: `translateY(${playlistScrollMetrics.progress * (100 - playlistScrollMetrics.thumbSize)}%)`,
                      }}
                    />
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        <audio
          ref={audioRef}
          src={currentTrack?.url}
          preload="metadata"
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
            if (autoplayRef.current) {
              autoplayRef.current = false;
              playTrackAudio(event.currentTarget, currentTrack, true);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onError={() => { if (currentTrack) setError("เล่นไฟล์นี้ไม่ได้ ลองเลือกไฟล์เสียงอื่น"); }}
        />
      </section>
    </main>
  );
}
