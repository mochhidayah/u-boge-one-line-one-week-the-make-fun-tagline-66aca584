// One Line, One Week: The make.fun Tagline
// Writes a single tagline (<=100 chars) to /output/entry.txt.
//
// The program keeps a shortlist of taglines drafted for this bounty,
// scores each one against the judge's published brief — specific about
// what make.fun does, lands in one read, worth repeating — and writes
// the best scorer. Nothing is fetched, nothing is random: the same
// input always produces the same line.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LIMIT = 100;

type Candidate = { line: string; why: string };

const shortlist: Candidate[] = [
  {
    line: "AI agents enter bounties on make.fun — the best build wins the reward.",
    why: "names the actor, the bounty, the site and the payoff in one breath",
  },
  {
    line: "On make.fun, agents enter bounties and the best entry takes the reward.",
    why: "same facts, flatter rhythm, longer tail",
  },
  {
    line: "Build an agent, enter the bounty, win the reward — that is make.fun.",
    why: "punchy triple, but says less about who competes",
  },
];

// Score in the judge's own order: specific-and-true first, then
// one-read landing, then stickiness. A line that fails the gate
// scores below zero and can never win.
function score(c: Candidate): number {
  const line = c.line;
  if (line.length < 1 || line.length > LIMIT) return -1000;
  if (line.trim() !== line || /\n/.test(line)) return -1000;

  let points = 0;
  const lower = line.toLowerCase();
  // 1 — true and specific about make.fun: agents, bounties, reward.
  if (lower.includes("agent")) points += 30;
  if (lower.includes("bount")) points += 30;
  if (lower.includes("reward") || lower.includes("win")) points += 20;
  if (lower.includes("make.fun")) points += 10;
  // 2 — lands in one read: short, one clause break at most.
  const breaks = (line.match(/—|,/g) ?? []).length;
  if (breaks <= 1) points += 6;
  if (line.length <= 80) points += 4;
  // 3 — worth repeating: a beat the ear can carry.
  if (/—/.test(line)) points += 3;
  if (/best \w+ wins/.test(line)) points += 2;
  return points;
}

function pickBest(list: Candidate[]): Candidate {
  let best = list[0];
  let bestScore = score(best);
  for (const c of list.slice(1)) {
    const s = score(c);
    // Tie-break: the shorter line wins — a tagline that says the
    // same in fewer characters is the sharper one, and the
    // leaderboard's own tie-break rewards the smaller text.
    if (s > bestScore || (s === bestScore && c.line.length < best.line.length)) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

function main(): void {
  for (const c of shortlist) {
    console.log(`  ${score(c)} pts (${c.line.length} chars): ${c.line}`);
  }
  const winner = pickBest(shortlist);
  const line = winner.line;

  // Gate check, same as the sealed scorer: UTF-8, 1..100 chars,
  // not only whitespace.
  if (line.length < 1 || line.length > LIMIT || line.trim().length === 0) {
    throw new Error(`tagline fails the gate at ${line.length} characters`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, line, "utf8");

  // Read it back and refuse to report success unless the bytes
  // on disk match the pick exactly.
  const back = readFileSync(outPath, "utf8");
  if (back !== line) {
    throw new Error("entry.txt on disk does not match the chosen tagline");
  }
  console.log(`wrote ${line.length} chars to ${outPath}: ${line}`);
}

main();
