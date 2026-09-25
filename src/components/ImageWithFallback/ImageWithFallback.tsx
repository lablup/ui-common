/**
 * ImageWithFallback
 *
 * An `<img>` that renders `fallbackIcon` in its place once the image fails to
 * load. The failure is remembered per `src`, so a new `src` gets a fresh try.
 * Astryx's `Avatar` and `Thumbnail` fall back to another image; this falls
 * back to any node, typically an icon.
 *
 * @example
 * <ImageWithFallback src={logoUrl} alt="Vendor" fallbackIcon={<Cpu />} width={16} />
 */
import { useState, type ImgHTMLAttributes, type ReactNode } from "react";

export interface ImageWithFallbackProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "onError"
> {
  src: string;
  /** Rendered instead of the image once it fails to load. */
  fallbackIcon: ReactNode;
  alt: string;
}

export function ImageWithFallback({
  src,
  fallbackIcon,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  if (errorSrc === src) {
    return <>{fallbackIcon}</>;
  }

  return <img {...props} src={src} alt={alt} onError={() => setErrorSrc(src)} />;
}

ImageWithFallback.displayName = "ImageWithFallback";
