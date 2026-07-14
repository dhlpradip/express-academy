export interface LessonSection {
  h?: string;
  p?: string[];
  code?: string;
  codeTitle?: string;
  note?: string;
}

export interface Resource {
  title: string;
  url: string;
  note: string;
}

export interface Lesson {
  day: number;
  id: string;
  arc: string;
  minutes: number;
  title: string;
  summary: string;
  intro: string;
  sections: LessonSection[];
  exercise: {
    brief: string[];
    hints: string[];
  };
  /** Required on purpose: every lesson must point beyond itself. */
  resources: Resource[];
}
