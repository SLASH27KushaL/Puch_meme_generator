import React, { useEffect, useState, useRef } from "react";
import { Type, Download, Copy, ArrowLeft, Star, Sun, Moon, ImagePlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface TextPosition {
  id: string;
  text: string;
  x: number; // percent
  y: number; // percent
  fontSize: number;
  color: string;
  fontWeight: string;
  textShadow: boolean;
}

interface OverlayImage {
  id: string;
  src: string; // object URL or remote URL
  x: number; // percent
  y: number; // percent
  width: number; // percent of container width
  height: number; // percent of container height (auto if 0)
  aspect?: number; // natural height/width ratio (height/width)
  rotation?: number; // degrees
}

const Selected: React.FC = () => {
  // local theme (single-file; persisted to localStorage so page stays consistent)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("maymay-theme");
      if (stored) return stored === "dark";
    } catch {}
    return true;
  });
  useEffect(() => {
    try {
      localStorage.setItem("maymay-theme", isDark ? "dark" : "light");
    } catch {}
  }, [isDark]);
  const toggleTheme = () => setIsDark((s) => !s);

  const [textPositions, setTextPositions] = useState<TextPosition[]>([
    { id: "1", text: "TOP TEXT", x: 50, y: 12, fontSize: 36, color: "#ffffff", fontWeight: "bold", textShadow: true },
    { id: "2", text: "BOTTOM TEXT", x: 50, y: 88, fontSize: 36, color: "#ffffff", fontWeight: "bold", textShadow: true },
  ]);
  const [activeTextId, setActiveTextId] = useState<string>("1");

  const updateText = (id: string, text: string) => {
    setTextPositions((prev) => prev.map((pos) => (pos.id === id ? { ...pos, text } : pos)));
  };

  const updateTextStyle = (property: keyof TextPosition, value: any) => {
    setTextPositions((prev) => prev.map((pos) => (pos.id === activeTextId ? { ...pos, [property]: value } : pos)));
  };

  const addNewText = () => {
    const newId = (textPositions.length + 1).toString();
    setTextPositions((prev) => [
      ...prev,
      { id: newId, text: "", x: 50, y: 50, fontSize: 28, color: "#ffffff", fontWeight: "bold", textShadow: true },
    ]);
    setActiveTextId((textPositions.length + 1).toString());
  };

  const activeText = textPositions.find((p) => p.id === activeTextId);

  // overlay images state
  const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const activeImage = overlayImages.find((p) => p.id === activeImageId);

  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  // drag state kept in ref to avoid excessive rerenders
  const dragRef = useRef<{
    dragging: boolean;
    pointerId?: number;
    imageId?: string | null;
    startPointerX: number;
    startPointerY: number;
    startImageX: number;
    startImageY: number;
    containerRect?: DOMRect;
  }>({ dragging: false, startPointerX: 0, startPointerY: 0, startImageX: 0, startImageY: 0, imageId: null });

  // theme tokens (single-file)
  const rootBg = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const panelBg = isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-gray-200";
  const controlBg = isDark ? "bg-neutral-700" : "bg-gray-100";
  const subtleText = isDark ? "text-neutral-300" : "text-neutral-600";

  // ----------------------------
  // read template passed by router (preferred via location.state) or fallback to query params
  // ----------------------------
  const location = useLocation();
  const navigate = useNavigate();
  const stateTemplate = (location.state && (location.state as any).template) ?? null;
  const params = new URLSearchParams(location.search);
  const fallbackUrl = params.get("url") ?? "";
  const fallbackName = params.get("name") ?? "Selected";
  const templateUrl = stateTemplate?.url ?? fallbackUrl;
  const templateName = stateTemplate?.name ?? fallbackName;

  // Helper to load image (ensures we have naturalWidth/height and uses CORS if possible)
  const loadImageElement = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous"; // attempt to avoid tainting the canvas
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      } catch (err) {
        reject(err);
      }
    });

  // Download handler (also draws overlay images)
  const handleDownload = async () => {
    const container = containerRef.current;
    if (!container) return;

    const baseImgElement = container.querySelector("img.base-template") as HTMLImageElement | null;
    if (!baseImgElement || !baseImgElement.src) {
      alert("Image not available for download");
      return;
    }

    try {
      const baseImg = await loadImageElement(baseImgElement.src);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Use natural size for high quality
      canvas.width = baseImg.naturalWidth || baseImg.width;
      canvas.height = baseImg.naturalHeight || baseImg.height;

      // Draw base image
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Draw overlay images in order
      for (const ov of overlayImages) {
        try {
          const img = await loadImageElement(ov.src);
          // compute pixel positions
          const imgW = (ov.width / 100) * canvas.width;
          // maintain aspect ratio if height is 0
          const imgH = ov.height > 0 ? (ov.height / 100) * canvas.height : (img.naturalHeight / img.naturalWidth) * imgW;

          // draw with rotation around center
          const cx = (ov.x / 100) * canvas.width;
          const cy = (ov.y / 100) * canvas.height;
          ctx.save();
          ctx.translate(cx, cy);
          if (ov.rotation) ctx.rotate((ov.rotation * Math.PI) / 180);
          ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
          ctx.restore();
        } catch (err) {
          console.warn("Failed to draw overlay image", ov.src, err);
        }
      }

      // Configure text styles
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw text overlays
      textPositions.forEach((t) => {
        if (!t.text || !t.text.trim()) return;
        const x = (t.x / 100) * canvas.width;
        const y = (t.y / 100) * canvas.height;

        // Configure font
        ctx.font = `${t.fontWeight} ${t.fontSize}px Impact, Arial Black, sans-serif`;
        ctx.fillStyle = t.color;

        // Apply shadow if enabled
        if (t.textShadow) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Draw text
        ctx.fillText(t.text.toUpperCase(), x, y);
      });

      // Create download link
      const link = document.createElement("a");
      const filename = `maymay-${templateName.replace(/[^a-z0-9]/gi, "_")}.png`;
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate image. This may be caused by cross-origin restrictions on the source image. Try using an image served with CORS enabled or uploaded images.");
    }
  };

  // Image upload handler
  const onAddImageClick = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newId = `img_${Date.now()}`;

    try {
      const loaded = await loadImageElement(url);
      const aspect = loaded.naturalHeight / loaded.naturalWidth;
      // add centered with 30% width and auto height
      setOverlayImages((prev) => [
        ...prev,
        { id: newId, src: url, x: 50, y: 50, width: 30, height: 0, aspect, rotation: 0 },
      ]);
      setActiveImageId(newId);
    } catch (err) {
      // fallback if load fails
      setOverlayImages((prev) => [
        ...prev,
        { id: newId, src: url, x: 50, y: 50, width: 30, height: 0, rotation: 0 },
      ]);
      setActiveImageId(newId);
    }

    // clear input so same file can be re-selected later
    e.currentTarget.value = "";
  };

  const updateOverlayImage = (id: string | null, changes: Partial<OverlayImage>) => {
    if (!id) return;
    setOverlayImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  };

  const toggleAutoHeightForActive = () => {
    if (!activeImageId) return;
    const ov = overlayImages.find((i) => i.id === activeImageId);
    if (!ov) return;
    const container = containerRef.current;
    // if currently auto (height === 0) we want to compute an explicit height from DOM
    if (ov.height === 0) {
      try {
        const imgEl = container?.querySelector(`img[data-id="${ov.id}"]`) as HTMLImageElement | null;
        if (container && imgEl) {
          const rect = container.getBoundingClientRect();
          const imgRect = imgEl.getBoundingClientRect();
          const heightPercent = (imgRect.height / rect.height) * 100;
          updateOverlayImage(ov.id, { height: Math.max(1, Math.min(100, Math.round(heightPercent))) });
          return;
        }
      } catch {}
      // fallback explicit height
      updateOverlayImage(ov.id, { height: 30 });
    } else {
      // set to auto
      updateOverlayImage(ov.id, { height: 0 });
    }
  };

  const deleteSelectedImage = () => {
    if (!activeImageId) return;
    const toDelete = overlayImages.find((i) => i.id === activeImageId);
    if (!toDelete) return;
    if (!confirm("Delete selected image?")) return;
    setOverlayImages((prev) => prev.filter((i) => i.id !== activeImageId));
    try {
      if (toDelete.src.startsWith("blob:")) URL.revokeObjectURL(toDelete.src);
    } catch {}
    setActiveImageId(null);
  };

  // pointer-based dragging handlers for overlay images
  const onImagePointerDown = (e: React.PointerEvent, imageId: string) => {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const img = overlayImages.find((i) => i.id === imageId);
    if (!img) return;

    dragRef.current = {
      dragging: true,
      pointerId: e.pointerId,
      imageId: imageId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startImageX: img.x,
      startImageY: img.y,
      containerRect,
    };
    setActiveImageId(imageId);
  };

  const onPointerMoveWindow = (e: PointerEvent) => {
    if (!dragRef.current.dragging) return;
    if (e.pointerId !== dragRef.current.pointerId) return;
    const d = dragRef.current;
    const rect = d.containerRect!;
    const dx = e.clientX - d.startPointerX;
    const dy = e.clientY - d.startPointerY;

    const newX = ((d.startImageX / 100) * rect.width + dx) / rect.width * 100;
    const newY = ((d.startImageY / 100) * rect.height + dy) / rect.height * 100;

    setOverlayImages((prev) => prev.map((im) => (im.id === d.imageId ? { ...im, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } : im)));
  };

  const onPointerUpWindow = (e: PointerEvent) => {
    if (!dragRef.current.dragging) return;
    if (e.pointerId !== dragRef.current.pointerId) return;
    dragRef.current.dragging = false;
    dragRef.current.imageId = null;
    dragRef.current.pointerId = undefined;
  };

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMoveWindow);
    window.addEventListener("pointerup", onPointerUpWindow);
    return () => {
      window.removeEventListener("pointermove", onPointerMoveWindow);
      window.removeEventListener("pointerup", onPointerUpWindow);
      // revoke object urls
      overlayImages.forEach((ov) => {
        try {
          if (ov.src.startsWith("blob:")) URL.revokeObjectURL(ov.src);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayImages]);

  return (
    <div className={`${rootBg} min-h-screen flex flex-col transition-colors duration-200`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-neutral-800" : "border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 ${isDark ? "text-neutral-200" : "text-gray-700"} hover:opacity-90`}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-lg font-semibold tracking-tight">MayMay</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1 rounded ${controlBg} hover:opacity-95`}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light" : "Switch to dark"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hidden sm:inline text-sm">{isDark ? "Light" : "Dark"}</span>
          </button>

          <button className={`flex items-center gap-2 px-3 py-1 rounded ${controlBg} hover:opacity-95`} aria-label="Star">
            <Star size={16} />
            <span className="hidden sm:inline text-sm">Give it a star</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas / Preview */}
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className={`w-full max-w-5xl rounded-xl shadow-sm border ${panelBg}`}>
            <div className="md:flex md:items-stretch">
              <div className="flex-1 p-6 flex flex-col items-center">
                <div className="w-full max-w-3xl">
                  <div className="mb-3 text-xs uppercase tracking-wide text-neutral-400">Preview</div>

                  {/* Fixed size image container that maintains original dimensions */}
                  <div className="flex justify-center">
                    <div className="relative inline-block" ref={containerRef} style={{ touchAction: 'none' }}>
                      {templateUrl ? (
                        <img
                          src={decodeURIComponent(templateUrl)}
                          alt={templateName}
                          crossOrigin="anonymous"
                          className="block rounded-md base-template"
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                            maxHeight: "70vh",
                            display: 'block'
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          className={`rounded-md flex items-center justify-center border-2 border-dashed ${isDark ? "border-neutral-700 bg-neutral-800" : "border-gray-200 bg-gray-100"}`}
                          style={{ width: "500px", height: "400px" }}
                        >
                          <div className="text-sm text-neutral-400">Meme canvas area</div>
                        </div>
                      )}

                      {/* Overlay images (pointer events enabled so they can be dragged) */}
                      <div className="absolute inset-0">
                        {overlayImages.map((ov) => (
                          <img
                            key={ov.id}
                            src={ov.src}
                            onPointerDown={(e) => onImagePointerDown(e, ov.id)}
                            data-id={ov.id}
                            style={{
                              position: 'absolute',
                              left: `${ov.x}%`,
                              top: `${ov.y}%`,
                              transform: `translate(-50%, -50%) rotate(${ov.rotation ?? 0}deg)`,
                              transformOrigin: 'center',
                              width: `${ov.width}%`,
                              height: ov.height > 0 ? `${ov.height}%` : 'auto',
                              touchAction: 'none',
                              cursor: activeImageId === ov.id ? 'grabbing' : 'grab',
                              userSelect: 'none',
                              pointerEvents: 'auto',
                              maxWidth: '100%'
                            }}
                            draggable={false}
                            alt="overlay"
                          />
                        ))}

                        {/* Text overlays positioned absolutely over the image (pointer-events none so dragging images works smoothly) */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                          {textPositions.map((t) =>
                            (t.text && t.text.trim()) ? (
                              <div
                                key={t.id}
                                style={{
                                  position: 'absolute',
                                  left: `${t.x}%`,
                                  top: `${t.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  fontSize: `${t.fontSize}px`,
                                  color: t.color,
                                  fontWeight: t.fontWeight as any,
                                  textShadow: t.textShadow ? '2px 2px 6px rgba(0,0,0,0.7)' : 'none',
                                  fontFamily: "'Impact', Arial Black, sans-serif",
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  whiteSpace: 'pre-wrap',
                                  textAlign: 'center',
                                  padding: '0 8px',
                                }}
                                className="select-none"
                              >
                                {t.text}
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
                    <div>{templateName}</div>
                    <div>Original Size</div>
                  </div>
                </div>
              </div>

              {/* template quick panel on md+ */}
              <div className={`hidden md:flex md:flex-col md:w-60 md:border-l md:px-4 md:py-6 md:gap-3 ${isDark ? "border-neutral-700" : "border-gray-200"}`}>
                <div className="text-sm font-semibold">Template Info</div>
                <div className="text-sm text-neutral-400">Name: {templateName}</div>
                <div className="text-sm text-neutral-400">Size: Original</div>
                <div className="text-sm text-neutral-400">Created: —</div>
              </div>
            </div>
          </div>
        </main>

        {/* Controls Sidebar */}
        <aside className={`w-full lg:w-80 p-5 border-t lg:border-t-0 lg:border-l ${isDark ? "border-neutral-800" : "border-gray-200"} bg-transparent`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Text</h3>
            <button
              onClick={addNewText}
              className={`flex items-center gap-2 px-3 py-1 rounded ${controlBg} hover:opacity-95 text-sm`}
              aria-label="Add text"
            >
              <Type size={14} />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {textPositions.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveTextId(p.id)}
                className={`px-3 py-1 text-sm rounded-full transition-all ${
                  activeTextId === p.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : `${controlBg} ${isDark ? "text-white" : "text-gray-800"} hover:opacity-90`
                }`}
                aria-pressed={activeTextId === p.id}
              >
                Text {p.id}
              </button>
            ))}
          </div>

          {activeText && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs mb-1 ${subtleText}`}>Content</label>
                <input
                  type="text"
                  value={activeText.text}
                  onChange={(e) => updateText(activeTextId, e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${isDark ? "border-neutral-700 bg-neutral-800" : "border-gray-200 bg-white"} focus:outline-none text-sm`}
                  placeholder="Enter text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Font Size</label>
                  <input
                    type="range"
                    min={12}
                    max={96}
                    value={activeText.fontSize}
                    onChange={(e) => updateTextStyle("fontSize", Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Color</label>
                  <input
                    type="color"
                    value={activeText.color}
                    onChange={(e) => updateTextStyle("color", e.target.value)}
                    className="w-full h-9 rounded border px-1"
                    title="Text color"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Horizontal</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activeText.x}
                    onChange={(e) => updateTextStyle("x", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Vertical</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={activeText.y}
                    onChange={(e) => updateTextStyle("y", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <label className={`flex items-center gap-2 text-sm ${subtleText}`}>
                <input
                  type="checkbox"
                  checked={activeText.textShadow}
                  onChange={(e) => updateTextStyle("textShadow", e.target.checked)}
                />
                Shadow
              </label>
            </div>
          )}

          {/* Image controls */}
          <div className="pt-4 mt-4 border-t flex flex-col gap-3">
            <input ref={inputFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={onAddImageClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              title="Add image"
            >
              <ImagePlus size={16} /> Add image
            </button>

            {/* quick list of overlay images */}
            <div className="flex gap-2 overflow-x-auto py-2">
              {overlayImages.map((ov) => (
                <button
                  key={ov.id}
                  onClick={() => setActiveImageId(ov.id)}
                  className={`p-1 rounded border ${activeImageId === ov.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <img src={ov.src} alt="thumb" style={{ width: 60, height: 40, objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>

            <button
              onClick={() => deleteSelectedImage()}
              disabled={!activeImageId}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded ${!activeImageId ? 'opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
              title="Delete selected image"
            >
              Delete image
            </button>

            {activeImageId && (
              <div className="space-y-3 pt-2">
                <div className="text-sm font-semibold">Resize selected image</div>

                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Width (% of canvas)</label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={activeImage ? activeImage.width : 30}
                    onChange={(e) => updateOverlayImage(activeImageId, { width: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Height</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAutoHeightForActive}
                      className={`px-2 py-1 rounded border ${activeImage && activeImage.height === 0 ? 'bg-gray-200 dark:bg-neutral-700' : ''}`}
                      type="button"
                    >
                      {activeImage && activeImage.height === 0 ? 'Auto (maintain aspect)' : 'Fixed'}
                    </button>

                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={activeImage ? (activeImage.height === 0 ? 30 : activeImage.height) : 30}
                      onChange={(e) => updateOverlayImage(activeImageId, { height: Number(e.target.value) })}
                      className={`w-full ${activeImage && activeImage.height === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                      disabled={activeImage ? activeImage.height === 0 : false}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs mb-1 ${subtleText}`}>Rotation (°)</label>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={activeImage ? (activeImage.rotation ?? 0) : 0}
                    onChange={(e) => updateOverlayImage(activeImageId, { rotation: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download size={16} /> Download
            </button>
            <button className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded ${controlBg} hover:opacity-95`}>
              <Copy size={16} /> Copy
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Selected;
