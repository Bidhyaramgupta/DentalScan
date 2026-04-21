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

export default function ScanningFlow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camReady, setCamReady] = useState(false);
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
  const qualityChipClass = useMemo(() => {
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
  }, [qualityState]);

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCamReady(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    startCamera();
  }, []);

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
    <div className="flex flex-col items-center bg-black min-h-screen text-white">
      {/* Header */}
      <div className="p-4 w-full bg-zinc-900 border-b border-zinc-800 flex justify-between">
        <h1 className="font-bold text-blue-400">DentalScan AI</h1>
        {isScanComplete ? (
          <span className="text-xs text-emerald-400">Completed</span>
        ) : (
          <span className="text-xs text-zinc-500">Step {currentStep + 1}/{totalSteps}</span>
        )}
      </div>

      {/* Main Viewport */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-950 overflow-hidden flex items-center justify-center">
        {!isScanComplete ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover grayscale opacity-80" 
            />
            <div
              className={`absolute inset-0 z-30 pointer-events-none bg-white transition-opacity duration-200 ${
                showCaptureFlash ? "opacity-35" : "opacity-0"
              }`}
            />

            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] sm:text-xs font-medium tracking-wide backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.32)] ${qualityChipClass}`}
              >
                {qualityState}
              </span>
            </div>
             
            {/* Guidance Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-6">
              <div className="w-full h-full max-w-[18rem] max-h-[24rem] rounded-[2rem] border-2 border-dashed border-zinc-500/70 bg-gradient-to-b from-zinc-800/10 to-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] flex items-center justify-center">
                <div
                  className={`relative w-[52vw] h-[52vw] max-w-56 max-h-56 min-w-36 min-h-36 rounded-full border-[3px] border-cyan-200/75 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.35),inset_0_0_20px_rgba(255,255,255,0.16)] transition-transform duration-200 ${
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
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 max-w-[86%] px-3 py-2 rounded-full bg-black/55 border border-white/15 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
                <p className="text-[11px] sm:text-xs text-cyan-50 text-center font-medium tracking-wide">
                  {STEP_HELPERS[currentStep] ?? "Center your mouth in the guide"}
                </p>
              </div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-10 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent text-center">
              <p className="text-sm font-medium">{VIEWS[currentStep].instruction}</p>
            </div>
          </>
        ) : (
          <div className="text-center p-10">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Scan Complete</h2>
            <p className="text-zinc-400 mt-2">Uploading results...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-10 w-full flex justify-center">
        {!isScanComplete && (
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
               <Camera className="text-black" />
            </div>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-4 overflow-x-auto w-full">
        {VIEWS.map((v, i) => (
          <div 
            key={i} 
            className={`w-16 h-20 rounded border-2 shrink-0 ${i === currentStep ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800'}`}
          >
            {capturedImages[i] ? (
               <img src={capturedImages[i]} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700">{i+1}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
