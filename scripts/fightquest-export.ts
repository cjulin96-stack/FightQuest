import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nodeLibrary } from './node-assets';
import { buildHuman } from '../src/core/human';
import { DEFAULT_PARAMS, type HumanParams } from '../src/core/params';
import { clipById } from '../src/core/anim/clips';
import type { Clip } from '../src/core/anim/clips/types';
import { planExport, runExport } from '../src/export';

// Squat repetition: stand -> controlled descent -> brief hold -> stand.
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const squat: Clip = {
  id: 'squat',
  name: 'Squat repetition',
  category: 'Actions',
  duration: 3.6,
  loop: true,
  sample: (time) => {
    const phase = (time % 3.6) / 3.6;
    const down = smooth(phase / 0.28);
    const up = smooth((phase - 0.56) / 0.28);
    const depth = phase < 0.28 ? down : phase < 0.56 ? 1 : phase < 0.84 ? 1 - up : 0;
    const bend = (v: number) => v * depth;
    return {
      bones: {
        Spine: [bend(13), 0, 0],
        Spine1: [bend(5), 0, 0],
        Spine2: [bend(3), 0, 0],
        Neck: [bend(-5), 0, 0],
        Head: [bend(-3), 0, 0],
        LeftUpLeg: [bend(58), 0, bend(4)],
        RightUpLeg: [bend(58), 0, bend(-4)],
        LeftLeg: [bend(-92), 0, 0],
        RightLeg: [bend(-92), 0, 0],
        LeftFoot: [bend(30), 0, 0],
        RightFoot: [bend(30), 0, 0],
        LeftArm: [bend(18), 0, bend(8)],
        RightArm: [bend(18), 0, bend(-8)],
        LeftForeArm: [bend(42), 0, 0],
        RightForeArm: [bend(42), 0, 0],
      },
      root: { ground: true },
    };
  },
};
clipById.set(squat.id, squat);

// Export only general fitness / locomotion clips for the FightQuest instructor.
const clipIds = ['idle', 'crouch', 'squat', 'walk', 'run', 'jump'];
const missing = clipIds.filter((id) => !clipById.has(id));
if (missing.length) throw new Error(`Missing safe animation clips: ${missing.join(', ')}`);

const lib = await nodeLibrary();
const params: HumanParams = {
  ...DEFAULT_PARAMS,
  name: 'FightQuest_Instructor',
  seed: 20261110,
  age: 0.5,
  muscle: 0.58,
  weight: 0.5,
  height: 0.55,
  proportions: 0.58,
  outfit: 'none',
  top: 'tank_top',
  bottom: 'cargo_shorts',
  shoes: 'sneakers',
  hair: 'short02',
  facialHair: 'none',
  accessories: [],
  hat: 'none',
  weapon: 'none',
  carry: 'none',
  vehicle: 'none',
  detail: 'medium',
  rig: 'game',
  restPose: 'A',
  animations: true,
  faceBones: true,
  faceShapes: false,
  speechShapes: false,
  expression: 'neutral',
  garmentStyles: {
    tank_top: { pattern: 'solid', color: '#263342' },
    cargo_shorts: { pattern: 'solid', color: '#141b26' },
    sneakers: { pattern: 'solid', color: '#e04444', color2: '#171c26' },
  },
};

const character = await buildHuman(lib, params);
const settings = {
  mode: 'animated' as const,
  format: 'glb' as const,
  clips: clipIds,
  packaging: 'embedded' as const,
  clipMesh: false,
  rootMotion: false,
  loopSuffix: false,
  weaponFile: 'held' as const,
  vehicleFile: false,
  stageProps: false,
};
const plan = planExport(character, settings);
const exported = await runExport(lib, character, plan);
const output = join(process.cwd(), '..', 'fightquest', 'assets', 'instructor.glb');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, exported.data);
console.log(`FightQuest instructor exported: ${output}`);
console.log(`Animations embedded: ${clipIds.join(', ')}`);
console.log(`GLB size: ${(exported.data.byteLength / 1024 / 1024).toFixed(2)} MB`);
