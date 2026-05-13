"use client";

import { useState } from "react";
import Image from "next/image";

export function PitcherAvatar({
  name,
  src,
  size = 48,
}: {
  name: string;
  src: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-sox-navy)] text-[10px] font-semibold text-white"
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      unoptimized={false}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-[var(--surface-hover)] object-cover ring-1 ring-slate-200 dark:ring-slate-700"
    />
  );
}
