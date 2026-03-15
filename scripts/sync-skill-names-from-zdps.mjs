#!/usr/bin/env node
/**
 * Sync skill names in Resonance Logs from ZDPS (reference).
 * Reads ZDPS SkillTable.json + SkillOverrides.en.json, builds skillId -> Name,
 * then updates class_skill_configs.json and optionally RecountTable.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// BPSR-ZDPS Data lives next to cn-reso-logs-to-en under "Resonance Logs project"
const ZDPS_DATA = path.resolve(ROOT, '../BPSR-ZDPS/BPSR-ZDPS/Data');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function buildZdpsSkillNameMap() {
  const skillTable = loadJson(path.join(ZDPS_DATA, 'SkillTable.json'));
  const overrides = loadJson(path.join(ZDPS_DATA, 'SkillOverrides.en.json'));
  const map = new Map();
  for (const [id, entry] of Object.entries(skillTable)) {
    if (entry.Name) map.set(parseInt(id, 10), entry.Name);
  }
  for (const [id, entry] of Object.entries(overrides)) {
    if (entry.Name) map.set(parseInt(id, 10), entry.Name);
  }
  return map;
}

function updateClassSkillConfigs(nameMap) {
  const configPath = path.join(ROOT, 'src/lib/config/class_skill_configs.json');
  const config = loadJson(configPath);
  let updated = 0;
  for (const classEntry of Object.values(config)) {
    if (classEntry.skills) {
      for (const skill of classEntry.skills) {
        const name = nameMap.get(skill.skillId);
        if (name && skill.name !== name) {
          skill.name = name;
          updated++;
        }
      }
    }
    if (classEntry.derivations) {
      for (const d of classEntry.derivations) {
        const name = nameMap.get(d.derivedSkillId);
        if (name && d.derivedName !== name) {
          d.derivedName = name;
          updated++;
        }
      }
    }
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log('class_skill_configs.json: updated', updated, 'names');
}

// Known RecountTable display name corrections (wrong translation -> ZDPS correct name)
const RECOUNT_NAME_FIXES = {
  'Frost Spear': 'Frost Lance',
  'Iaijutsu Slash': 'Iaido Slash',
  'Pursuit Break': 'Breach Pursuit',
  'Flying Bird Throw': 'Falcon Toss (Leap)',
  'Instant': 'Instant Edge',
  'Courage Wind Ring': 'Aegis Gale',
  'Dragon Cannon': 'Drake Cannon',
  'Shadow Spiral': 'Vortex Strike',
  'Rain Tides Rising': 'Raincall Surge',
  'Extreme Cold: Ice and Snow Hymn': 'Glacier Hymn',
  'Clear Stream Pearl Spiral': 'Tidepool',
  'Freezing Cold Wind': 'Frozen Gale',
  'Ice Infusion': 'Permafrost',
  'Wave Convergence': 'Maelstrom',
  'Ice Shelter': 'Frost Shelter',
  'Ice Crystal Fall': 'Meteor Storm',
  'Piercing Ice Spear': 'Frostbeam',
  'Thunder Chain Slash': 'Stormflash',
  'Thousand Thunders Flash Shadow Intent': 'Ultimate Slash',
  'Divine Shadow Slash': 'Phantom Slash',
  'Divine Punishment Scythe': 'Chaos Breaker',
  'Thunder Scythe': 'Storm Scythe (Thundercleave)',
  'Thunder Rising Dragon Slash': 'Dracoflash',
  'Chaotic Helmet Slash': 'Thundercleave',
  'Blade of Ceasefire': 'Blade of Justice',
  'Shield Smash': 'Valor Bash',
  'Star Shattering Charge': 'Shield Toss',
  'Sandy Cloak': 'Sandshroud',
  'Boulder Body': 'Stoneform',
  'Sandstone Grip': 'Sandgrip',
  'Rock Fury Strike': 'Rageblow',
  'Fury Burst': 'Countercrush',
  'Brave Bulwark': 'Brave Bastion',
  'Sandstone Guardian': 'Sandgrip',
  'Star Fragment Shatter': 'Shield Combo',
  'Sword of Justice': 'Blade of Justice',
  'Heroic Shield Bash': 'Valor Bash',
  'Majesty: Holy Light Infusion': 'Divine Circle',
  'Blazing Judgment': 'Scorching Judgment',
  'Auto Judgment': 'Judgment',
  'Holy Sword': 'Sacred Blade',
  'Light Resolve': 'Holy Barrier',
  'Holy Light Guard': 'Aegis Ward',
  'Ruthless Crusade': 'Zeal Crusade',
  'Condemnation': 'Reckoning',
  'Enhanced Condemnation': 'Inferno Reckoning',
  'Blazing Reckoning': 'Inferno Reckoning',
  'Light Impact': 'Radiant Impact',
  'Radiant Core': 'Radiance',
  'Vine Control': "Vines' Embrace",
  'Flourish: Barrier of Hope': 'Divine Circle Bloom',
  'Flower Restore': 'Bloomheal',
  'Wild Seed': 'Regen Bud: Wild Seed',
  'Nurture': 'Nourish',
  'Regeneration Pulse': 'Regen Pulse',
  'Forest Voice G10: Forest Prayer': 'Grove Wish',
  "Nature's Shelter": 'Nature Shield',
  'Bloom Charge': 'Overgrowth',
  'Accelerated Growth': 'Life Bloom',
  'Deer Dash': 'Stag Charge',
  'Symbiosis Mark': 'Infusion',
  'Nourishing Seed': 'Nourish',
  'String Strike': 'Resonant Strings',
  'Amplify Beat': 'Amplified Beat',
  'Convergence Symphony': 'Resonant Strings',
  'Flame Fantasy': 'Rhapsody of Flame',
  'Fire Rhythm Stomp': 'Stomp',
  'Flame Note': 'Heroic Melody',
  'Fierce Swing': 'Fierce Strike',
  'Surge Quintet': 'Fivefold Crescendo',
  'Passionate Swing': 'Passion Burst',
  'Fervent: Passionate Swing': 'Passion Fury',
  'Center of Attention': 'Center Stage',
  'Every Shot Counts': 'Bullseye',
  'Light Intent: Quadruple Arrow': 'Photon Reforge - Quadraflare',
  'Sharp Eye: Light Giant Arrow': 'Luminary Bolt (Gravity Orb)',
  'Light Energy Explosion': 'Radiance Barrage',
  'Raging Tide Shot': 'Torrent Volley',
  'Concentrated Shot': 'Deter Shot',
  'Light Energy Bombardment': 'Blast Shot',
  'Explosive Shot': 'Blast Shot',
  'Deterrent Shot': 'Deter Shot',
};

function updateRecountTable() {
  const recountPath = path.join(ROOT, 'src/lib/config/RecountTable.json');
  const recount = loadJson(recountPath);
  let updated = 0;
  for (const entry of Object.values(recount)) {
    const fix = RECOUNT_NAME_FIXES[entry.RecountName];
    if (fix) {
      entry.RecountName = fix;
      updated++;
    }
  }
  fs.writeFileSync(recountPath, JSON.stringify(recount, null, 2) + '\n', 'utf8');
  console.log('RecountTable.json: updated', updated, 'names');
}

const nameMap = buildZdpsSkillNameMap();
console.log('ZDPS skill name map size:', nameMap.size);
updateClassSkillConfigs(nameMap);
updateRecountTable();
