import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { STUDENT_PHOTOS, STUDENT_PHOTO_SECONDS } from '@/config';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Classroom photos that slowly crossfade behind the hero, washed out to a
 * faint tint so the headline, buttons and logo stay fully readable. A cream
 * gradient keeps the text column almost clear and lets the photo show most
 * strongly behind the logo on the right. Decorative: screen readers skip it.
 * Viewers who prefer reduced motion see the first photo without the rotation.
 */
export function PhotoBackdrop({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (STUDENT_PHOTOS.length < 2) return;
    const motion = window.matchMedia(REDUCED_MOTION);
    if (motion.matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % STUDENT_PHOTOS.length),
      STUDENT_PHOTO_SECONDS * 1000,
    );
    const stop = () => {
      if (motion.matches) window.clearInterval(id);
    };
    motion.addEventListener('change', stop);
    return () => {
      window.clearInterval(id);
      motion.removeEventListener('change', stop);
    };
  }, []);

  if (STUDENT_PHOTOS.length === 0) return null;

  return (
    <div className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {STUDENT_PHOTOS.map((photo, i) => (
        <img
          key={photo.src}
          src={photo.src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className={clsx(
            'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[2000ms] ease-in-out',
            i === index ? 'opacity-[0.32]' : 'opacity-0',
          )}
        />
      ))}
      {/* Cream wash: nearly solid over the text column, lighter behind the logo. */}
      <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-cream/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-cream/20 via-transparent to-cream" />
    </div>
  );
}
