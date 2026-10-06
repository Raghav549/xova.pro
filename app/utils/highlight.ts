export type TokenType = 'plain' | 'key' | 'string' | 'comment' | 'number' | 'tag' | 'keyword' | 'fn' | 'punct';

export interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'new',
  'class',
  'extends',
  'super',
  'this',
  'import',
  'from',
  'export',
  'default',
  'async',
  'await',
  'try',
  'catch',
  'finally',
  'throw',
  'typeof',
  'instanceof',
  'in',
  'of',
  'interface',
  'type',
  'enum',
  'implements',
  'public',
  'private',
  'protected',
  'readonly',
  'static',
  'as',
  'satisfies',
  'void',
  'null',
  'undefined',
  'true',
  'false',
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUES',
  'CREATE',
  'TABLE',
  'PRIMARY',
  'KEY',
  'NOT',
  'NULL',
]);

const TOKEN_PATTERN = new RegExp(
  [
    '(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|<!--[\\s\\S]*?-->)',
    '(?<string>"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
    '(?<template>`(?:[^`\\\\]|\\\\.)*`)',
    '(?<tag><\\/?[A-Za-z][A-Za-z0-9-]*)',
    '(?<attr>[A-Za-z-]+(?==))',
    '(?<number>\\b\\d+(?:\\.\\d+)?(?:px|rem|em|%|s|ms|fr|vh|vw)?\\b)',
    '(?<word>[A-Za-z_$][\\w$]*)',
    '(?<punct>[{}()[\\].,;:*/+\\-<>!=&|?]+)',
    '(?<space>\\s+)',
    '(?<other>.)',
  ].join('|'),
  'g',
);

function classifyWord(word: string, next?: string): TokenType {
  if (KEYWORDS.has(word)) {
    return 'keyword';
  }

  if (next === '(') {
    return 'fn';
  }

  if (/^[A-Z]/.test(word)) {
    return 'key';
  }

  if (/^--?[a-z]/.test(word)) {
    return 'attr' as TokenType;
  }

  return 'plain';
}

/** Lightweight, dependency-free tokenizer used by the live stream panel. */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = TOKEN_PATTERN.exec(line)) !== null) {
    const groups = match.groups ?? {};
    const value = match[0];

    if (groups.comment) {
      tokens.push({ type: 'comment', value });
    } else if (groups.string || groups.template) {
      tokens.push({ type: 'string', value });
    } else if (groups.tag) {
      tokens.push({ type: 'tag', value });
    } else if (groups.attr) {
      tokens.push({ type: 'key', value });
    } else if (groups.number) {
      tokens.push({ type: 'number', value });
    } else if (groups.word) {
      const next = line.slice(TOKEN_PATTERN.lastIndex, TOKEN_PATTERN.lastIndex + 1);
      tokens.push({ type: classifyWord(value, next), value });
    } else if (groups.punct) {
      tokens.push({ type: 'punct', value });
    } else {
      tokens.push({ type: 'plain', value });
    }

    if (match.index === TOKEN_PATTERN.lastIndex) {
      TOKEN_PATTERN.lastIndex++;
    }
  }

  return tokens;
}

export function tokenClassName(type: TokenType): string | undefined {
  const classes: Partial<Record<TokenType, string>> = {
    key: 'xv-token-key',
    string: 'xv-token-string',
    comment: 'xv-token-comment',
    number: 'xv-token-number',
    tag: 'xv-token-tag',
    keyword: 'xv-token-keyword',
    fn: 'xv-token-fn',
  };

  return classes[type];
}

export function detectLanguage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';

  const languages: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    html: 'html',
    css: 'css',
    scss: 'css',
    json: 'json',
    webmanifest: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sql: 'sql',
  };

  return languages[extension] ?? 'plain';
}
