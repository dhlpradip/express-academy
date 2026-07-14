/** Hand-maintained types for the exercise data modules (which stay plain JS). */

export interface TestRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  path: string;
  headers?: Record<string, string>;
  json?: unknown;
  /** Perform the request N times; expectations apply to the last response. */
  repeat?: number;
  /** Wait this long before sending — for observing background work. */
  delayMs?: number;
}

export interface TestExpect {
  status?: number;
  bodyContains?: string | string[];
  /** Strings that must NOT appear in the body (secret-leak tests). */
  bodyLacks?: string | string[];
  /** Subset match for objects; exact length + per-index match for arrays. */
  json?: unknown;
  /** Dot-paths that must exist and be non-null in the JSON body. */
  jsonHas?: string[];
  /** Root JSON array must have exactly this length. */
  jsonLength?: number;
  /** Dot-path -> minimum numeric value (inclusive). */
  jsonMin?: Record<string, number>;
  /** Header name -> required substring (case-insensitive). */
  headers?: Record<string, string>;
  headerMissing?: string[];
  /** Response must arrive within this many milliseconds. */
  maxMs?: number;
}

export interface ExerciseTest {
  name: string;
  request: TestRequest;
  expect?: TestExpect;
  /** Capture values for later tests: varName -> 'json.path' | 'headers.name'. */
  save?: Record<string, string>;
}

export interface Exercise {
  id: string;
  title: string;
  /** JavaScript starter/solution (CommonJS, module.exports = app). */
  starter: string;
  solution: string;
  /** TypeScript starter/solution (ES modules, export default app). */
  starterTs: string;
  solutionTs: string;
  tests: ExerciseTest[];
  /** Environment variables injected into the child process before the code loads. */
  env?: Record<string, string>;
}

export declare const exercises: Record<string, Exercise>;
