import day01 from './day01.js';
import day02 from './day02.js';
import day03 from './day03.js';
import day04 from './day04.js';
import day05 from './day05.js';
import day06 from './day06.js';
import day07 from './day07.js';
import day08 from './day08.js';
import day09 from './day09.js';
import day10 from './day10.js';
import day11 from './day11.js';
import day12 from './day12.js';
import day13 from './day13.js';
import day14 from './day14.js';
import day15 from './day15.js';
import day16 from './day16.js';
import day17 from './day17.js';
import day18 from './day18.js';

const all = [
  day01, day02, day03, day04, day05, day06, day07, day08, day09,
  day10, day11, day12, day13, day14, day15, day16, day17, day18,
];

export const exercises = Object.fromEntries(all.map((e) => [e.id, e]));
