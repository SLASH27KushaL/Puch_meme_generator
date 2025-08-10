// TemplateCard.tsx
import React from "react";
import { motion } from "framer-motion";

export type Template = {
  id: number;
  name: string;
  url: string;
  created_at?: string | null;
};

type Props = {
  template: Template;
  onPreview: (t: Template) => void;
  onUse: (t: Template) => void;
  className?: string;
  showCreatedAt?: boolean;
  fallbackSrc?: string;
};

/**
 * Reusable template card.
 * - keyboard & screen-reader friendly
 * - lazy image loading + fallback
 * - hover / focus actions (Preview / Use)
 */
export default function TemplateCard({
  template,
  onPreview,
  onUse,
  className = "",
  showCreatedAt = false,
  fallbackSrc = "https://via.placeholder.com/600x400?text=broken",
}: Props) {
  const timeAgo = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`group relative rounded-lg overflow-hidden shadow-sm ${className}`}
      role="group"
    >
      {/* image container */}
      <div className="h-44 md:h-48 bg-gray-100">
        <img
          src={template.url}
          alt={template.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackSrc;
          }}
        />
      </div>

      {/* bottom info + hover actions */}
      <div
        className="absolute left-0 right-0 bottom-0 p-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.36) 50%, rgba(0,0,0,0.7) 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div
              className="text-sm font-semibold text-white truncate"
              title={template.name}
            >
              {template.name}
            </div>
            {showCreatedAt && (
              <div className="text-xs text-neutral-200 opacity-80">
                {timeAgo(template.created_at)} ago
              </div>
            )}
          </div>

          <div className="ml-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
              aria-label={`Preview ${template.name}`}
              className="px-2 py-1 text-xs bg-white/10 text-white rounded-md border border-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-white"
            >
              Preview
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onUse(template);
              }}
              aria-label={`Use ${template.name}`}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      {/* full-card clickable overlay (keyboard focusable) */}
      <button
        onClick={() => onPreview(template)}
        aria-label={`Open ${template.name}`}
        className="absolute inset-0 focus:outline-none"
        style={{ background: "transparent" }}
      />
    </motion.div>
  );
}
