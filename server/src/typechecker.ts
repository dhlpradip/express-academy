/**
 * Strict type-checking for TypeScript exercise submissions.
 *
 * Uses a single warm LanguageService over one virtual file: the first check
 * pays ~1-2s to load lib.d.ts and @types/express; every check after that is
 * incremental (~100-200ms). The virtual file "lives" under server/ so that
 * `import express from 'express'` resolves against the real node_modules.
 */
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.join(__dirname, '..');
const VIRTUAL = path.join(SERVER_DIR, '__attempt__.ts');

const compilerOptions: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  esModuleInterop: true,
  skipLibCheck: true,
  noEmit: true,
  allowJs: false,
  types: ['node'],
  lib: ['lib.es2022.d.ts'],
  // Express handlers routinely ignore params ((req, res, next) with unused next),
  // so the unused-checks stay off — strictness where it matters, not noise.
  noUnusedLocals: false,
  noUnusedParameters: false,
};

let content = '';
let version = 0;

const host: ts.LanguageServiceHost = {
  getScriptFileNames: () => [VIRTUAL],
  getScriptVersion: (fileName) => (fileName === VIRTUAL ? String(version) : '1'),
  getScriptSnapshot: (fileName) => {
    if (fileName === VIRTUAL) return ts.ScriptSnapshot.fromString(content);
    const text = ts.sys.readFile(fileName);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => SERVER_DIR,
  getCompilationSettings: () => compilerOptions,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: (fileName) => fileName === VIRTUAL || ts.sys.fileExists(fileName),
  readFile: (fileName) => (fileName === VIRTUAL ? content : ts.sys.readFile(fileName)),
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());

export interface TypeCheckError {
  line: number;
  column: number;
  code: number;
  message: string;
}

const MAX_ERRORS = 20;

export function checkTypes(code: string): TypeCheckError[] {
  content = code;
  version += 1;

  const diagnostics = [
    ...service.getSyntacticDiagnostics(VIRTUAL),
    ...service.getSemanticDiagnostics(VIRTUAL),
  ];

  return diagnostics
    .map((d) => {
      const pos =
        d.file && d.start !== undefined
          ? d.file.getLineAndCharacterOfPosition(d.start)
          : { line: 0, character: 0 };
      return {
        line: pos.line + 1,
        column: pos.character + 1,
        code: d.code,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      };
    })
    .sort((a, b) => a.line - b.line || a.column - b.column)
    .slice(0, MAX_ERRORS);
}
