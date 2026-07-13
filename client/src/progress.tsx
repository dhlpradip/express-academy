import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { lessons } from './lessons/index.ts';

const KEY = 'express-academy:progress';
const LANG_KEY = 'express-academy:lang';

export type Language = 'js' | 'ts';

type CompletedMap = Record<string, boolean>;

interface ProgressValue {
  completed: CompletedMap;
  markComplete: (id: string) => void;
  /** Highest day you may open: the first day whose exercise isn't passed (all later days are locked). */
  unlockedDay: number;
}

function load(): CompletedMap {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '{}') as CompletedMap) || {};
  } catch {
    return {};
  }
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<CompletedMap>(load);

  const markComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [id]: true };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const firstIncomplete = lessons.findIndex((l) => !completed[l.id]);
  const unlockedDay = firstIncomplete === -1 ? lessons.length : firstIncomplete + 1;

  return (
    <ProgressContext.Provider value={{ completed, markComplete, unlockedDay }}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>');
  return value;
}

/** JS keeps the original key so pre-toggle saved code survives; TS gets a suffix. */
export function savedCodeKey(exerciseId: string, language: Language): string {
  return language === 'ts' ? `express-academy:code:${exerciseId}:ts` : `express-academy:code:${exerciseId}`;
}

export function loadLanguage(): Language {
  return localStorage.getItem(LANG_KEY) === 'ts' ? 'ts' : 'js';
}

export function saveLanguage(language: Language): void {
  localStorage.setItem(LANG_KEY, language);
}
