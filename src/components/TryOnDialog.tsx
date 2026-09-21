"use client";
/* eslint-disable @next/next/no-img-element -- Local object URLs hold ephemeral customer photos. */
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Product } from "@/lib/types";
import { Close, Arrow } from "./Icons";

export default function TryOnDialog({
  product,
  initialVariantId,
  onClose,
}: {
  product: Product;
  initialVariantId?: number;
  onClose: () => void;
}) {
  const [variantId, setVariantId] = useState(
    initialVariantId ?? product.variants[0].id,
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [camera, setCamera] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(false);
  }
  useEffect(() => {
    alive.current = true;
    const abort = new AbortController();
    fetch("/api/try-on", { cache: "no-store", signal: abort.signal })
      .then((r) => r.json())
      .then((r) => setReady(r.ready === true))
      .catch(() => {
        if (!abort.signal.aborted) setReady(false);
      });
    return () => {
      alive.current = false;
      abort.abort();
      controller.current?.abort();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    const frame = requestAnimationFrame(() => setPreview(url));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [photo]);
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result);
    },
    [result],
  );
  useEffect(() => {
    if (camera && video.current && stream.current) {
      video.current.srcObject = stream.current;
      void video.current
        .play()
        .catch(() => setMessage("Tap the camera preview to start it."));
    }
  }, [camera]);
  function choose(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setMessage("Choose a JPG, PNG or WebP photo under 8 MB.");
      return;
    }
    stopCamera();
    setPhoto(file);
    setResult("");
    setMessage("");
    setConsent(false);
  }
  async function startCamera() {
    setCameraStarting(true);
    setMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Camera unavailable");
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1536 },
          height: { ideal: 2048 },
        },
        audio: false,
      });
      if (!alive.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = media;
      setCamera(true);
      setResult("");
    } catch {
      if (alive.current)
        setMessage(
          "Camera access is unavailable. Allow camera access in your browser, or upload a photo.",
        );
    } finally {
      if (alive.current) setCameraStarting(false);
    }
  }
  function capture() {
    const current = video.current;
    if (!current?.videoWidth) {
      setMessage("Wait for the camera to be ready.");
      return;
    }
    const scale = Math.min(
      1,
      1536 / Math.max(current.videoWidth, current.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(current.videoWidth * scale);
    canvas.height = Math.round(current.videoHeight * scale);
    canvas
      .getContext("2d")
      ?.drawImage(current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob && alive.current)
          choose(new File([blob], "camera.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  }
  async function generate() {
    if (!photo || !consent || busy) return;
    setBusy(true);
    setMessage("");
    setResult("");
    stopCamera();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const body = new FormData();
      body.set("photo", photo);
      body.set("productId", String(product.id));
      body.set("variantId", String(variantId));
      body.set("consent", "yes");
      const response = await fetch("/api/try-on", {
        method: "POST",
        body,
        signal: abort.signal,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "The preview could not be completed.");
      }
      if (!response.headers.get("content-type")?.startsWith("image/jpeg"))
        throw new Error("The preview could not be completed.");
      const blob = await response.blob();
      if (alive.current && !abort.signal.aborted)
        setResult(URL.createObjectURL(blob));
    } catch (error) {
      if (alive.current && !abort.signal.aborted)
        setMessage(
          error instanceof Error ? error.message : "Please try again.",
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay tryon-overlay" />
        <Dialog.Content className="tryon-dialog" data-lenis-prevent>
          <div className="tryon-heading">
            <div>
              <span className="eyebrow">YOUR PHOTO. YOUR EXPRESSION.</span>
              <Dialog.Title>
                THE FITTING ROOM<span>AI</span>
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="icon-button"
              aria-label="Close fitting room"
            >
              <Close />
            </Dialog.Close>
          </div>
          <Dialog.Description className="tryon-description">
            See this piece on you. A visual preview, not a size or fit
            measurement. AI may change garment details.
          </Dialog.Description>
          <div className="tryon-layout">
            <div className={`tryon-stage${busy ? " generating" : ""}`}>
              {camera ? (
                <video
                  ref={video}
                  autoPlay
                  playsInline
                  muted
                  aria-label="Live camera preview"
                  onClick={() => void video.current?.play()}
                />
              ) : result || preview ? (
                <img
                  src={result || preview}
                  alt={
                    result
                      ? "AI-generated preview of your selected piece"
                      : "Your selected photo"
                  }
                />
              ) : (
                <div className="tryon-placeholder">
                  <span>01 / STEP INTO FRAME</span>
                  <svg
                    viewBox="0 0 160 220"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <circle cx="80" cy="44" r="24" />
                    <path d="M26 194v-54c0-35 20-60 54-60s54 25 54 60v54M16 18V8h24M120 8h24v18M16 194v18h24M120 212h24v-18" />
                  </svg>
                  <p>
                    A clear, well-lit photo.
                    <br />
                    Keep your outfit in the frame.
                  </p>
                </div>
              )}
              {(result || busy) && (
                <span className="preview-label">
                  {busy ? "CREATING YOUR LOOK…" : "AI VISUAL PREVIEW"}
                </span>
              )}
              {camera && (
                <div className="camera-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={capture}
                  >
                    TAKE PHOTO
                  </button>
                  <button type="button" onClick={stopCamera}>
                    Cancel camera
                  </button>
                </div>
              )}
            </div>
            <div className="tryon-controls">
              <span className="eyebrow">02 / YOUR SELECTED PIECE</span>
              <h3>{product.name}</h3>
              <label className="field-label">
                COLOR / SIZE
                <select
                  value={variantId}
                  disabled={busy}
                  onChange={(event) => {
                    setVariantId(Number(event.target.value));
                    setResult("");
                  }}
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color} / {v.size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="tryon-photo-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy || cameraStarting}
                  onClick={() => fileInput.current?.click()}
                >
                  UPLOAD PHOTO ↗
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy || cameraStarting || camera}
                  onClick={startCamera}
                >
                  {cameraStarting ? "OPENING…" : "USE CAMERA ◉"}
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Upload try-on photo"
                disabled={busy}
                onChange={(e) => {
                  choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <p className="field-hint">
                JPG, PNG or WebP · Up to 8 MB. For best results, use one person,
                facing forward.
              </p>
              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I have permission to use this photo and agree to send it to
                  OpenAI to generate my preview.
                </span>
              </label>
              <p className="field-hint">
                We don’t save these photos to our store database. OpenAI’s
                processing and retention rules apply.{" "}
                <a
                  href="/privacy#try-on"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Photo privacy ↗
                </a>
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={generate}
                disabled={!photo || !consent || busy || !ready}
              >
                {busy ? "GENERATING YOUR LOOK…" : "GENERATE MY LOOK"}
                <Arrow />
              </button>
              <p className="form-message" role="status">
                {message ||
                  (ready === false
                    ? "The fitting room is being prepared. Photo generation will be available when the service is connected."
                    : busy
                      ? "This can take a couple of minutes. Closing the fitting room cancels your view; the generation may already be processing."
                      : ready === null
                        ? "Checking fitting-room availability…"
                        : "Up to 3 previews per browser each day, subject to availability.")}
              </p>
              {result && (
                <a
                  className="secondary-button download-preview"
                  href={result}
                  download="hustlerdior-ai-preview.jpg"
                >
                  DOWNLOAD AI PREVIEW ↓
                </a>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
