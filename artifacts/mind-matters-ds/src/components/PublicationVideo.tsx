import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

/** Shared by teacher previews and published editions. Never autoplays. */
export function PublicationVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (ready || error) return;
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [ready, error, attempt]);

  const markReady = () => {
    setReady(true);
    setSlow(false);
    setError("");
  };

  return (
    <div className="space-y-2">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        src={`${src.split("#")[0]}#t=0.05`}
        onLoadedMetadata={(event) => {
          // Request an actual frame: Safari can otherwise leave a black preview
          // after metadata loads, particularly with phone-exported MP4 files.
          const video = event.currentTarget;
          if (Number.isFinite(video.duration) && video.duration > 0.1 && video.currentTime === 0) {
            try { video.currentTime = 0.05; } catch { /* Native play remains available. */ }
          }
        }}
        onLoadedData={markReady}
        onPlaying={markReady}
        onError={(event) => {
          const code = event.currentTarget.error?.code;
          setError(code === 2
            ? "The video connection was interrupted. Retry loading it."
            : code === 3 || code === 4
              ? "This browser could not decode the video. Try another browser or re-export it as an H.264 MP4 with AAC audio."
              : "The video could not be loaded. Retry, or download it to check the recording.");
        }}
      >
        Your browser does not support embedded video.
      </video>
      {!ready && !error && (
        <p role="status" className="text-sm text-muted-foreground">
          {slow ? "The video is taking longer to load. Press Play, retry, or download the recording below." : "Loading video preview…"}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {(error || slow) && (
        <Button type="button" variant="outline" size="sm" onClick={() => {
          setError("");
          setSlow(false);
          setReady(false);
          setAttempt((value) => value + 1);
          videoRef.current?.load();
        }}>Retry video</Button>
      )}
    </div>
  );
}
