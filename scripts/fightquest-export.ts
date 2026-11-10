import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nodeLibrary } from './node-assets';
import { buildHuman } from '../src/core/human';
import { DEFAULT_PARAMS, type HumanParams } from '../src/core/params';
import { clipById } from '../src/core/anim/clips';
import type { Clip } from '../src/core/anim/clips/types';
import { planExport, runExport } from '../src/export';

// Purpose-built bodyweight squat cycle. The generator's Crouch clip supplies
// anatomically valid game-rig joint directions; this clip adds controlled descent,
// a brief bottom pause, and a controlled return to standing (not a chair sit/stand).
const idle = clipById.get('idle');
const crouch = clipById.get('crouch');
if (!idle || !crouch) throw new Error('Idle and crouch source poses are required.');
const squatDuration = 2.6;
const downEnd = 1.05;
const holdEnd = 1.35;
const squat: Clip = {
  id: 'squat',
  name: 'Squat repetition',
  category: 'Actions',
  duration: squatDuration,
  loop: true,
  sample: (time) => {
    const t = ((time % squatDuration) + squatDuration) % squatDuration;
    const smooth = (x: number) => {
      const v = Math.max(0, Math.min(1, x));
      return v * v * (3 - 2 * v);
    };
    const depth = t < downEnd
      ? smooth(t / downEnd)
      : t < holdEnd
        ? 1
        : 1 - smooth((t - holdEnd) / (squatDuration - holdEnd));
    const standing = idle.sample(0);
    const lowered = crouch.sample(0);
    const bones: Record<string, [number, number, number]> = {};
    const names = new Set([...Object.keys(standing.bones), ...Object.keys(lowered.bones)]);
    for (const name of names) {
      const a = standing.bones[name] || [0, 0, 0];
      const b = lowered.bones[name] || a;
      // Keep the squat slightly above the generator's deepest crouch pose.
      const amount = depth * 0.78;
      bones[name] = [
        a[0] + (b[0] - a[0]) * amount,
        a[1] + (b[1] - a[1]) * amount,
        a[2] + (b[2] - a[2]) * amount,
      ];
    }
    return {
      bones,
      root: { ground: true },
      gaze: [0, 0],
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
