"use client";

import { useState, useEffect } from "react";
import { Link2, Loader2, Check, AlertCircle } from "lucide-react";
import { cn, isValidUrl } from "@/lib/utils";
import { checkCache } from "@/lib/api";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onCacheHit?: (audioId: string, audioUrl: string, title?: string) => void;
  disabled?: boolean;
}

export function UrlInput({
  value,
  onChange,
  onCacheHit,
  disabled,
}: UrlInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !isValidUrl(value)) {
      setIsCached(false);
      setError(null);
      return;
    }

    const checkCacheStatus = async () => {
      setIsChecking(true);
      setError(null);
      setIsCached(false);

      try {
        const result = await checkCache(value);
        if (result.cached && result.audioId && result.audioUrl) {
          setIsCached(true);
          onCacheHit?.(result.audioId, result.audioUrl, result.title);
        }
      } catch (err) {
        // Silently fail cache check
        console.error("Cache check failed:", err);
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkCacheStatus, 500);
    return () => clearTimeout(timer);
  }, [value, onCacheHit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue && !isValidUrl(newValue)) {
      setError("Please enter a valid URL");
    } else {
      setError(null);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium tracking-tight text-[#1a1a1a]">
        Article URL
      </label>
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a3a3a3]" />
        <input
          type="url"
          value={value}
          onChange={handleChange}
          placeholder="https://example.com/article"
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border bg-white py-4 pl-12 pr-12 text-[#1a1a1a]",
            "placeholder:text-[#a3a3a3]",
            "focus:outline-none focus:ring-2 focus:ring-black/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus:border-red-500"
              : isCached
                ? "border-green-500 focus:border-green-500"
                : "border-[#e5e5e5] focus:border-[#1a1a1a]"
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="h-5 w-5 animate-spin text-[#737373]" />
          )}
          {!isChecking && isCached && (
            <Check className="h-5 w-5 text-green-500" />
          )}
          {!isChecking && error && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isCached && !error && (
        <p className="text-sm font-normal text-green-500">
          This article is already cached - it will play instantly!
        </p>
      )}
    </div>
  );
}
