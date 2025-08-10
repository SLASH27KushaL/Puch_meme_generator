// Pop.tsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type Template = { id: number; name: string; url: string };

type PopProps = {
  template: Template;
  onClose: () => void;
};

export default function Pop({ template, onClose }: PopProps) {
  const navigate = useNavigate();

  const handleUse = () => {
    // Close modal locally (optional)
    try { onClose(); } catch {}

    // Navigate to /selected and pass template in location.state
    try {
      navigate("/selected", { state: { template } });
      // small safety fallback: if navigate doesn't change location (rare), force redirect
      setTimeout(() => {
        if (!window.location.pathname.includes("/selected")) {
          // fallback: pass via query string
          const qs = `?id=${template.id}&name=${encodeURIComponent(template.name)}&url=${encodeURIComponent(template.url)}`;
          window.location.href = `/selected${qs}`;
        }
      }, 200);
    } catch (err) {
      // If react-router isn't available for some reason, do a hard redirect with query string
      const qs = `?id=${template.id}&name=${encodeURIComponent(template.name)}&url=${encodeURIComponent(template.url)}`;
      window.location.href = `/selected${qs}`;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg max-w-md w-full p-6 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pop-title"
      >
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 id="pop-title" className="text-xl font-bold mb-4">
          {template.name}
        </h2>

        <img src={template.url} alt={template.name} className="w-full rounded-lg mb-4 object-contain" />

        <div className="flex gap-3">
          <button
            className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
            onClick={handleUse}
            aria-label="Use this template"
          >
            Use this template
          </button>

          <button
            className="flex-1 bg-gray-300 dark:bg-neutral-700 text-black dark:text-white py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-600"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
