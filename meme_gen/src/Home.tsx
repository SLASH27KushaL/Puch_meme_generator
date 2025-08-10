// MemeGeneratorPage.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Pop from "./components/Pop"; // adjust path if necessary

type Template = {
  id: number;
  name: string;
  url: string;
  created_at?: string | null;
};

export default function MemeGeneratorPage() {
  const [search, setSearch] = useState("");
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

  // Typewriter effect
  const part1 = "Generate memes in ";
  const part2 = "seconds";
  const full = part1 + part2;
  const part1Len = part1.length;
  const [typed, setTyped] = useState("");
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const typingSpeed = 50;
    const deletingSpeed = 35;
    const pauseAtFull = 900;
    const pauseAtEmpty = 600;
    let index = 0;
    let deleting = false;
    const tick = () => {
      if (!isMounted) return;
      if (!deleting) {
        index++;
        setTyped(full.slice(0, index));
        if (index >= full.length) {
          timeoutId = setTimeout(() => {
            deleting = true;
            tick();
          }, pauseAtFull);
        } else {
          timeoutId = setTimeout(tick, typingSpeed);
        }
      } else {
        index--;
        setTyped(full.slice(0, index));
        if (index <= 0) {
          deleting = false;
          timeoutId = setTimeout(tick, pauseAtEmpty);
        } else {
          timeoutId = setTimeout(tick, deletingSpeed);
        }
      }
    };
    timeoutId = setTimeout(tick, 500);
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const typedPart1 = typed.slice(0, Math.min(typed.length, part1Len));
  const typedPart2 = typed.length > part1Len ? typed.slice(part1Len) : "";

  // Theme classes
  const rootBg = isDark ? "bg-black text-white" : "bg-white text-black";
  const pageTransition = "transition-colors duration-300 ease-out";
  const pillBg = isDark ? "bg-neutral-800" : "bg-gray-100";
  const inputBg = isDark ? "bg-neutral-900" : "bg-gray-50";
  const inputBorder = isDark ? "border-neutral-700" : "border-gray-200";
  const placeholderCls = isDark ? "placeholder-neutral-500" : "placeholder-neutral-400";
  const templateBg = isDark ? "bg-neutral-800" : "bg-gray-100";
  const templateText = isDark ? "text-white" : "text-black";

  const API_URL = "http://localhost:3000"; // change if your backend runs on another port

  // Router navigate
  const navigate = useNavigate();

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected template for Pop
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPopOpen, setIsPopOpen] = useState(false);

  const placeholderTemplates: Template[] = [
    { id: 1, name: "Placeholder 1", url: "https://via.placeholder.com/400x400?text=1" },
    { id: 2, name: "Placeholder 2", url: "https://via.placeholder.com/400x400?text=2" },
    { id: 3, name: "Placeholder 3", url: "https://via.placeholder.com/400x400?text=3" },
    { id: 4, name: "Placeholder 4", url: "https://via.placeholder.com/400x400?text=4" },
    { id: 5, name: "Placeholder 5", url: "https://via.placeholder.com/400x400?text=5" },
  ];

  // Fetch templates
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<Template[]>(`${API_URL}/templates`, { signal: controller.signal });
        if (!cancelled) {
          setTemplates(res.data);
          setLoading(false);
        }
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED") return;
        if (!cancelled) {
          setError(err.message || "Failed to load templates");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_URL]);

  // filter by search
  const visible = (loading || error ? placeholderTemplates : templates).filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // handle using a template (called from Pop) — robust navigate + fallback
  const handleUseTemplate = (t: Template) => {
    console.log("handleUseTemplate called with:", t);
    // close pop immediately
    setIsPopOpen(false);

    // build query string
    const qs = `?id=${t.id}&name=${encodeURIComponent(t.name)}&url=${encodeURIComponent(t.url)}`;

    // try react-router navigate first (SPA)
    try {
      navigate(`/selected${qs}`);
      console.log("navigate() called -> /selected" + qs);
    } catch (err) {
      console.warn("navigate failed, falling back to window.location", err);
      window.location.href = `/selected${qs}`;
    }

    // fallback if navigate didn't change location (small timeout)
    setTimeout(() => {
      if (!window.location.pathname.includes("/selected")) {
        window.location.href = `/selected${qs}`;
      }
    }, 250);
  };

  // keyboard: close pop on Escape for convenience
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPopOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`${rootBg} ${pageTransition} min-h-screen flex flex-col items-center px-4`}>
      {/* Header */}
      <header className={`w-full flex justify-between items-center py-6 px-6 bg-transparent`}>
        <div className="flex items-center gap-2 text-xl font-bold">MayMay</div>

        <div className="flex gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`px-4 py-2 rounded-lg ${pillBg} ${pageTransition} hover:opacity-90`}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? "🌙" : "🌞"}
          </button>

          <button aria-label="Give it a star" className={`px-4 py-2 rounded-lg ${pillBg} ${pageTransition} hover:opacity-90`}>
            ⭐ Give it a star
          </button>
        </div>
      </header>

      {/* Typewriter Title */}
      <h1 className="text-4xl md:text-6xl font-semibold text-center mt-10 leading-tight">
        <span className="inline-block">
          <span>{typedPart1}</span>
          <span className="font-bold" style={{ color: "#c084fc" }}>
            {typedPart2}
          </span>
          <span
            className="inline-block ml-1 align-middle"
            style={{
              width: 8,
              display: "inline-block",
              verticalAlign: "middle",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1.05em",
                verticalAlign: "middle",
                backgroundColor: typedPart2 ? "#c084fc" : isDark ? "white" : "black",
                marginLeft: 6,
                animation: "blink 1s step-start infinite",
              }}
            />
          </span>
        </span>
      </h1>

      <p className={`${isDark ? "text-neutral-400" : "text-neutral-600"} mt-4 text-center`}>without dealing with a messy UI</p>

      {/* Search */}
      <div className={`flex items-center mt-8 rounded-full px-4 py-2 w-full max-w-md border ${inputBorder} ${inputBg} ${pageTransition}`}>
        <input
          type="text"
          placeholder="Search template"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 bg-transparent outline-none ${isDark ? "text-white" : "text-black"} ${placeholderCls}`}
        />
        <Search className={`${isDark ? "text-neutral-500" : "text-neutral-500"}`} />
      </div>

      <button className={`mt-6 px-4 py-2 rounded-lg ${pillBg} ${pageTransition} hover:opacity-90`}>⬆ Use Custom Template</button>

      {/* Status */}
      <div className="w-full max-w-4xl mt-6 px-2">
        {loading && <div className="text-sm text-neutral-500 mb-3">Loading templates...</div>}
        {error && <div className="text-sm text-rose-400 mb-3">Failed to load templates: {error}</div>}
      </div>

      {/* Templates Grid with improved cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2 pb-16 w-full max-w-6xl px-2">
        {visible.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => {
              setSelectedTemplate(template);
              setIsPopOpen(true);
            }}
            className={`cursor-pointer overflow-hidden rounded-2xl shadow-lg ${templateBg} ${pageTransition} hover:shadow-xl`}
          >
            <div className="relative">
              <img
                src={template.url}
                alt={template.name}
                className="w-full h-56 object-cover rounded-t-2xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=broken";
                }}
              />
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3">
                <h3 className="text-white font-semibold">{template.name}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pop modal */}
      {isPopOpen && selectedTemplate && (
        <Pop
          template={selectedTemplate}
          onClose={() => setIsPopOpen(false)}
          onUseTemplate={(t) => handleUseTemplate(t)}
        />
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
