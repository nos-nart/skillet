import { Suspense, use, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/utils.ts";

const emptySubscribe = () => () => {};
const imageResourceCache = new Map<string, Promise<void>>();

type SuspenseImageProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt"> & {
  src: string;
  alt: string;
  placeholderClassName?: string;
};

export function SuspenseImage({
  src,
  alt,
  className,
  placeholderClassName,
  decoding = "async",
  loading = "lazy",
  ...props
}: SuspenseImageProps) {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const placeholder = (
    <span
      aria-hidden="true"
      className={cn(
        className,
        "flex items-center justify-center opacity-100 mix-blend-normal saturate-100 transition-none",
      )}
    >
      <span
        className={cn(
          "flex aspect-square w-3/4 max-w-40 items-center justify-center rounded-lg border border-border/60 bg-muted/70 text-muted-foreground/55 dark:bg-muted/35",
          placeholderClassName,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        >
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m5.5 17 4.2-4.2a1.6 1.6 0 0 1 2.2 0L15.5 16" />
          <path d="m13.5 14.5 1.6-1.6a1.6 1.6 0 0 1 2.2 0l1.2 1.2" />
        </svg>
      </span>
    </span>
  );

  if (!isHydrated) {
    return placeholder;
  }

  return (
    <Suspense fallback={placeholder}>
      <ResolvedSuspenseImage
        {...props}
        src={src}
        alt={alt}
        className={className}
        decoding={decoding}
        loading={loading}
      />
    </Suspense>
  );
}

function ResolvedSuspenseImage({
  src,
  alt,
  ...props
}: Omit<SuspenseImageProps, "placeholderClassName">) {
  use(getImageResource(src));

  return <img {...props} src={src} alt={alt} />;
}

function getImageResource(src: string) {
  let promise = imageResourceCache.get(src);

  if (!promise) {
    promise = loadImage(src);
    imageResourceCache.set(src, promise);
  }

  return promise;
}

function loadImage(src: string): Promise<void> {
  if (globalThis.window === undefined) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new window.Image();

    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}
