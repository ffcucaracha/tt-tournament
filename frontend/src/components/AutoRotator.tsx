import { ReactNode, useEffect, useMemo, useState } from "react";

interface AutoRotatorProps {
  slides: Array<{ key: string; title: string; content: ReactNode }>;
  intervalSec?: number;
}

export function AutoRotator({ slides, intervalSec = 10 }: AutoRotatorProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeSlide = useMemo(() => slides[index] ?? slides[0], [index, slides]);

  useEffect(() => {
    if (paused || slides.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [intervalSec, paused, slides.length]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.code === "ArrowRight") {
        setIndex((prev) => (prev + 1) % slides.length);
      }
      if (event.code === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  return (
    <div className="rounded-xl border border-white/10 bg-panel/90 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-textMuted">
          Экран {index + 1}/{slides.length} • {activeSlide?.title}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-white/20 px-3 py-1 text-xs text-textMain"
            onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            type="button"
          >
            Назад
          </button>
          <button
            className="rounded-md border border-white/20 px-3 py-1 text-xs text-textMain"
            onClick={() => setPaused((value) => !value)}
            type="button"
          >
            {paused ? "Пуск" : "Пауза"}
          </button>
          <button
            className="rounded-md border border-white/20 px-3 py-1 text-xs text-textMain"
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
            type="button"
          >
            Вперёд
          </button>
        </div>
      </div>
      <div>{activeSlide?.content}</div>
    </div>
  );
}
