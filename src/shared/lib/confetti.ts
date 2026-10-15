import confetti from 'canvas-confetti'

/**
 * Triggers cinematic celebration confetti when completing a title or TV show.
 * Fully respects user's prefers-reduced-motion accessibility setting.
 */
export function fireCompletionCelebration() {
  if (typeof window === 'undefined') return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  // Multi-stage confetti burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#e50914', '#f59e0b', '#38bdf8', '#4ade80', '#ffffff'],
  })

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#e50914', '#f5c518'],
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#38bdf8', '#4ade80'],
    })
  }, 250)
}
