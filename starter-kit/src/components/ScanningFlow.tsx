"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Camera, RefreshCw, CheckCircle2 } from "lucide-react";

/**
 * CHALLENGE: SCAN ENHANCEMENT
 * 
 * Your goal is to improve the User Experience of the Scanning Flow.
 * 1. Implement a Visual Guidance Overlay (e.g., a circle or mouth outline) on the video feed.
 * 2. Add real-time feedback to the user (e.g., "Face not centered", "Move closer").
 * 3. Ensure the UI feels premium and responsive.
 */

type ScanOverlayProps = {
  helperText: string;
  qualityState: string;
  pulseGuide: boolean;
};

function ScanOverlay({ helperText, qualityState, pulseGuide }: ScanOverlayProps) {
  const qualityChipClass = (() => {
    switch (qualityState) {
      case "Good Capture":
        return "bg-emerald-500/20 text-emerald-100 border-emerald-300/40";
      case "Ready":
        return "bg-cyan-500/20 text-cyan-100 border-cyan-300/40";
      case "Hold Steady":
        return "bg-amber-500/20 text-amber-100 border-amber-300/40";
      default:
        return "bg-zinc-500/25 text-zinc-100 border-zinc-300/35";
    }
  })();

  return (
    <>
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] sm:text-xs font-medium tracking-wide backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.32)] ${qualityChipClass}`}
        >
          {qualityState}
        </span>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-6">
        <div className="flex h-full w-full max-h-[24rem] max-w-[18rem] items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-500/70 bg-gradient-to-b from-zinc-900/10 via-transparent to-zinc-950/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <div
            className={`relative h-[52vw] w-[52vw] min-h-36 min-w-36 max-h-56 max-w-56 rounded-full border-[3px] border-cyan-200/75 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.35),inset_0_0_20px_rgba(255,255,255,0.16)] transition-transform duration-200 ${
              pulseGuide ? "scale-105" : "scale-100"
            }`}
          >
            <div className="absolute inset-3 rounded-full border border-white/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-cyan-100/90 uppercase tracking-[0.2em]">
                Align Mouth
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 left-1/2 max-w-[86%] -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-3 py-2 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
          <p className="text-center text-[11px] font-medium tracking-wide text-cyan-50 sm:text-xs">
            {helperText}
          </p>
        </div>
      </div>
    </>
  );
}

export default function ScanningFlow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGoodCapture, setShowGoodCapture] = useState(false);
  const [showCaptureFlash, setShowCaptureFlash] = useState(false);
  const [pulseGuide, setPulseGuide] = useState(false);

  const VIEWS = [
    { label: "Front View", instruction: "Smile and look straight at the camera." },
    { label: "Left View", instruction: "Turn your head to the left." },
    { label: "Right View", instruction: "Turn your head to the right." },
    { label: "Upper Teeth", instruction: "Tilt your head back and open wide." },
    { label: "Lower Teeth", instruction: "Tilt your head down and open wide." },
  ];
  const STEP_HELPERS = [
    "Center your mouth in the guide",
    "Hold steady and turn slightly left",
    "Hold steady and turn slightly right",
    "Move slightly closer and tilt up",
    "Move slightly closer and tilt down",
  ];
  const totalSteps = VIEWS.length;
  const isScanComplete = currentStep >= totalSteps;
  const qualityState = useMemo(() => {
    if (showGoodCapture) return "Good Capture";
    if (!camReady) return "Adjust Position";
    if (currentStep === 0) return "Ready";
    return "Hold Steady";
  }, [camReady, currentStep, showGoodCapture]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCamReady(false);
    stopCameraStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this browser or device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCamReady(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setCamReady(false);
      const errorName = err instanceof DOMException ? err.name : "";
      if (errorName === "NotAllowedError") {
        setCameraError("Camera access is blocked. Please allow camera permission and try again.");
      } else if (errorName === "NotFoundError") {
        setCameraError("No camera was found on this device. Connect a camera and retry.");
      } else {
        setCameraError("We couldn't start your camera. Please check permissions and try again.");
      }
    }
  }, [stopCameraStream]);

  // Initialize Camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  const handleCapture = useCallback(() => {
    // Boilerplate logic for capturing a frame from the video feed
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImages((prev) => [...prev, dataUrl]);
      setCurrentStep((prev) => prev + 1);
      setShowGoodCapture(true);
      setShowCaptureFlash(true);
      setPulseGuide(true);
      window.setTimeout(() => {
        setShowCaptureFlash(false);
      }, 180);
      window.setTimeout(() => {
        setPulseGuide(false);
      }, 260);
      window.setTimeout(() => {
        setShowGoodCapture(false);
      }, 1200);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col">
      {/* Header */}
      <div className="w-full px-4 pt-5 pb-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold tracking-wide text-cyan-300">DentalScan AI</h1>
            {isScanComplete ? (
              <span className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                Completed
              </span>
            ) : (
              <span className="text-xs font-medium text-zinc-400">Step {currentStep + 1}/{totalSteps}</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {!isScanComplete ? "Follow the guide and capture each angle clearly." : "All scan views captured successfully."}
          </p>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative mx-4 aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-zinc-800/80 bg-zinc-950 shadow-[0_24px_50px_rgba(0,0,0,0.45)] flex items-center justify-center">
        {!isScanComplete ? (
          cameraError ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                <h3 className="text-base font-semibold text-white">Camera access needed</h3>
                <p className="mt-2 text-sm text-zinc-300">{cameraError}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  Allow camera permission in your browser settings, then retry.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-500/25"
                >
                  <RefreshCw size={14} />
                  Retry Camera
                </button>
              </div>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover opacity-85" 
              />
              <div
                className={`absolute inset-0 z-30 pointer-events-none bg-white transition-opacity duration-200 ${
                  showCaptureFlash ? "opacity-35" : "opacity-0"
                }`}
              />
              <ScanOverlay
                helperText={STEP_HELPERS[currentStep] ?? "Center your mouth in the guide"}
                qualityState={qualityState}
                pulseGuide={pulseGuide}
              />

              {/* Instruction Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent px-5 pb-5 pt-14 text-center">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">{VIEWS[currentStep].label}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-100">{VIEWS[currentStep].instruction}</p>
              </div>
            </>
          )
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/35 bg-emerald-500/15 shadow-[0_12px_24px_rgba(16,185,129,0.25)]">
              <CheckCircle2 size={34} className="text-emerald-300" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Scan Complete</h2>
            <p className="mt-2 text-sm text-zinc-300">Uploading your results securely...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full justify-center px-4 pb-5 pt-6">
        {!isScanComplete && !cameraError && (
          <button
            onClick={handleCapture}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/90 bg-zinc-900/75 shadow-[0_14px_30px_rgba(0,0,0,0.45)] transition-transform active:scale-90"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
               <Camera className="text-black" size={19} />
            </div>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="w-full border-t border-zinc-800/70 bg-zinc-950/55 px-4 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Captured Views</p>
          <p className="text-[11px] text-zinc-500">{capturedImages.length}/{totalSteps}</p>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v, i) => (
          <div 
            key={i} 
            className={`w-16 h-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
              i === currentStep ? "border-cyan-400 bg-cyan-500/10" : capturedImages[i] ? "border-emerald-400/50" : "border-zinc-800"
            }`}
          >
            {capturedImages[i] ? (
               <img src={capturedImages[i]} alt={`${v.label} capture`} className="h-full w-full object-cover" />
            ) : (
               <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-700">{i+1}</div>
            )}
          </div>
        ))}
        </div>
      </div>
      </div>
    </div>
  );
}
