"use client";

import { useState } from "react";

type ImageThumbnailProps = {
  url?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
};

export function ImageThumbnail({
  url,
  alt,
  className = "h-14 w-14",
  fallbackLabel = "No image",
}: ImageThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isBroken = !url || failedUrl === url;

  if (!url || isBroken) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-slate-600/50 bg-slate-900/70 text-[11px] font-medium text-slate-400 shadow-inner ${className}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={`rounded-xl border border-slate-500/40 bg-slate-900 object-cover shadow-md shadow-blue-500/10 ring-1 ring-slate-500/30 ${className}`}
      onError={() => {
        setFailedUrl(url);
      }}
    />
  );
}
