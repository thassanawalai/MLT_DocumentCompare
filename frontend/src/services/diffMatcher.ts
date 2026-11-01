/**
 * SequenceMatcher and Diff Engine
 * Aligns words, numbers, punctuation, and spacing for readable document diffs
 */

import { DiffChunk } from '../types/shipping';

/**
 * Computes longest common subsequence blocks between two strings
 */
export function generateStructuredDiff(
  text1: string,
  text2: string
): [DiffChunk[], DiffChunk[]] {
  if (text1 === text2) {
    return [
      [{ tag: 'equal', value: text1 }],
      [{ tag: 'equal', value: text2 }],
    ];
  }

  // Always compare complete words/tokens so short fields are never split by character.
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  const opcodes = computeOpcodes(tokens1, tokens2);

  const diff1: DiffChunk[] = [];
  const diff2: DiffChunk[] = [];

  for (const { tag, i1, i2, j1, j2 } of opcodes) {
    const val1 = tokens1.slice(i1, i2).join('');
    const val2 = tokens2.slice(j1, j2).join('');

    if (tag === 'equal') {
      appendChunks(diff1, 'equal', tokens1.slice(i1, i2));
      appendChunks(diff2, 'equal', tokens2.slice(j1, j2));
    } else if (tag === 'replace') {
      appendChunks(diff1, 'delete', tokens1.slice(i1, i2));
      appendChunks(diff2, 'insert', tokens2.slice(j1, j2));
    } else if (tag === 'delete') {
      appendChunks(diff1, 'delete', tokens1.slice(i1, i2));
    } else if (tag === 'insert') {
      appendChunks(diff2, 'insert', tokens2.slice(j1, j2));
    }
  }

  return [mergeConsecutiveChunks(diff1), mergeConsecutiveChunks(diff2)];
}

function tokenize(text: string): string[] {
  // Preserve whitespace and punctuation so reconstructed text remains exact.
  return text.match(/[\\p{L}\\p{N}_]+|[^\\p{L}\\p{N}_\\s]+|\\s+/gu) || [];
}

function appendChunks(target: DiffChunk[], tag: DiffChunk['tag'], tokens: string[]) {
  for (const value of tokens) {
    const tokenTag = /^\\s+$/u.test(value) ? 'equal' : tag;
    const previous = target[target.length - 1];
    if (previous?.tag === tokenTag) {
      previous.value += value;
    } else {
      target.push({ tag: tokenTag, value });
    }
  }
}

interface Opcode {
  tag: 'equal' | 'replace' | 'delete' | 'insert';
  i1: number;
  i2: number;
  j1: number;
  j2: number;
}

/**
 * Compute opcodes using dynamic programming / Longest Common Subsequence
 */
function computeOpcodes(a: string[], b: string[]): Opcode[] {
  const n = a.length;
  const m = b.length;

  // Use Hirschberg / Wagner-Fischer matrix for moderate lengths
  // If array is very large, chunk or bound
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1) as any);

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Backtrack to find alignment
  let i = n;
  let j = m;
  const rawOps: { tag: 'equal' | 'delete' | 'insert' | 'replace'; i: number; j: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      rawOps.push({ tag: 'equal', i: i - 1, j: j - 1 });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      rawOps.push({ tag: 'replace', i: i - 1, j: j - 1 });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      rawOps.push({ tag: 'delete', i: i - 1, j: j });
      i--;
    } else {
      rawOps.push({ tag: 'insert', i: i, j: j - 1 });
      j--;
    }
  }

  rawOps.reverse();

  // Convert step-by-step operations into interval opcodes
  const opcodes: Opcode[] = [];
  let currI = 0;
  let currJ = 0;

  let idx = 0;
  while (idx < rawOps.length) {
    const op = rawOps[idx];
    const startI = currI;
    const startJ = currJ;
    const tag = op.tag;

    while (idx < rawOps.length && rawOps[idx].tag === tag) {
      if (rawOps[idx].tag === 'equal' || rawOps[idx].tag === 'replace') {
        currI++;
        currJ++;
      } else if (rawOps[idx].tag === 'delete') {
        currI++;
      } else if (rawOps[idx].tag === 'insert') {
        currJ++;
      }
      idx++;
    }

    opcodes.push({
      tag,
      i1: startI,
      i2: currI,
      j1: startJ,
      j2: currJ,
    });
  }

  return opcodes;
}

function mergeConsecutiveChunks(chunks: DiffChunk[]): DiffChunk[] {
  if (chunks.length === 0) return [];
  const merged: DiffChunk[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = chunks[i];
    if (prev.tag === curr.tag) {
      prev.value += curr.value;
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}
