// src/data/explorationEnemies.ts
import { ExplorationEnemy } from '../types/exploration';

function mapSinToElement(sin: string): string {
  const map: Record<string, string> = {
    'wrath': 'Physical',
    'pride': 'Light',
    'envy': 'Dark',
    'gloom': 'Void',
    'lust': 'Chaos',
    'gluttony': 'Fire',
    'sloth': 'Water',
    'greed': 'Physical',
  };
  return map[sin] || 'Physical';
}

function mapDamageType(type: string): string {
  const map: Record<string, string> = {
    'red': 'Physical',
    'white': 'Light',
    'black': 'Dark',
    'pale': 'Void',
  };
  return map[type] || 'Physical';
}

function calcPower(min: number, max: number): number {
  return Math.floor((min + max) / 2);
}

function calcPowerFromDice(min: number, max: number, dice: number): number {
  return Math.floor(((min + max) / 2) * (dice / 4));
}

function createEnemyFromJSON(json: any): ExplorationEnemy {
  const combatPages = json.combat_pages || [];
  const skills = combatPages.map((page: any) => {
    const power = page.dice ? calcPowerFromDice(page.min, page.max, page.dice) : calcPower(page.min, page.max);
    return {
      name: page.name,
      power: Math.max(1, power),
      coins: Math.max(1, Math.floor((page.dice || 4) / 3)),
      damageType: mapDamageType(page.damage_type || 'red'),
      description: page.description || '',
    };
  });

  if (skills.length === 0) {
    skills.push({ name: 'Strike', power: 3, coins: 1, damageType: 'Physical' });
  }

  return {
    id: json.id,
    name: json.name,
    hp: json.hp || 100,
    maxHp: json.hp || 100,
    atk: Math.floor((json.hp || 100) * 0.15) + 10,
    def: Math.floor((json.hp || 100) * 0.08) + 5,
    spd: 50 + Math.floor(Math.random() * 20),
    element: mapSinToElement(combatPages[0]?.sin || 'wrath'),
    resist: mapDamageType(combatPages[0]?.damage_type || 'red'),
    skills,
    portrait: getPortrait(json.id),
    isBoss: json.rank === 'ALEPH' || json.rank === 'WAW',
    risk: json.rank || 'TETH',
  };
}

function getPortrait(id: string): string {
  const portraits: Record<string, string> = {
    'lcorp_zayin': '🔮',
    'lcorp_teth': '💎',
    'lcorp_waw': '👹',
    'lcorp_he': '🌀',
    'lcorp_aleph': '🌑',
    'zwei_roland': '🛡️',
    'zwei_guard': '🛡️',
    'zwei_captain': '⚔️',
    'yun_office_sal': '🧘',
    'yun_office_fixer': '🥋',
    'yun_office_elite': '🥊',
    'warp_timeless_one': '🌀',
    'warp_time_ripper': '⏳',
    'warp_shrouded': '👻',
    'warp_server': '💻',
    'warp_passenger': '🧊',
    'warp_maid': '🧹',
    'warp_collector': '📦',
    'warp_chronos': '⏰',
    'warp_conductor': '🎵',
    'ucorp_watcher': '👁️',
    'ucorp_spiral_knight': '🛡️',
    'ucorp_spiral_king': '👑',
    'ucorp_sentinel': '🤖',
    'ucorp_depth_dweller': '🐙',
    'tcorp_class3_collector': '⌛',
    'tcorp_class2_staff': '⏳',
    'streetlight_pamela': '🌟',
    'streetlight_fixer': '💡',
    'streetlight_captain': '👨‍✈️',
    'street_rat': '🐁',
    'roland_black_silence': '🗡️',
    'red_mist_memory': '🌫️',
    'kali_red_mist': '🔴',
    'rcorp_queen': '👸',
    'rcorp_perfect_one': '✨',
    'rcorp_hatchery_guard': '🛡️',
    'rcorp_elite_clone': '⚡',
    'rcorp_clone': '🧪',
    'rat': '🐀',
    'rat_king': '👑',
    'quick_witted_yurodiviy': '🧠',
    'aggressive_yurodiviy': '😤',
    'purple_tear_iori': '💜',
    'purple_tear_executor': '🌀',
    'purple_tear_apprentice': '🪞',
    'pudding_king': '👑',
    'pudding_god': '🙏',
    'pudding_citizen': '🍮',
    'pudding_chef': '🍳',
    'pudding_beast': '🐉',
    'molar_worker': '🤿',
    'molar_olga': '🌊',
    'molar_foreman': '🔧',
    'liu_xiao': '🔥',
    'liu_warrior': '🔥',
    'liu_section_chief': '👨‍✈️',
    'kcorp_worker': '🧬',
    'kcorp_supervisor': '📋',
    'kcorp_regenerator': '💚',
    'kcorp_harvester': '🌿',
    'kcorp_overseer': '👁️',
    'kcorp_immortal_heart': '❤️‍🔥',
    'index_proxy': '👑',
    'index_herald': '📯',
    'index_weaver': '🕸️',
    'index_proselyte': '📜',
    'hook_office_director': '🎯',
    'hook_worker': '🎣',
    'hook_foreman': '🔗',
    'black_silence_recollection': '🌑',
    'black_silence_fury': '🌘',
    'time_ripper': '⚔️',
    'temporal_aberration': '🌀',
    'shi_tenma': '🥷',
    'shi_assassin': '🗡️',
    'shi_elite_assassin': '⚔️',
  };
  return portraits[id] || '👾';
}

// ---- L Corp ----
const lcorp_zayin = {
  id: 'lcorp_zayin',
  name: 'Fledgling Abnormality',
  rank: 'ZAYIN',
  hp: 45,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Enkephalin Bite', sin: 'wrath', min: 1, max: 4, dice: 5, damage_type: 'red' },
    { name: 'Fearful Screech', sin: 'gloom', min: 1, max: 4, dice: 5, damage_type: 'white' }
  ]
};

const lcorp_teth = {
  id: 'lcorp_teth',
  name: 'Wandering Aberration',
  rank: 'TETH',
  hp: 115,
  resistances: { red: 1.0, white: 1.1, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Claw Swipe', sin: 'wrath', min: 2, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Corrupted Whisper', sin: 'lust', min: 2, max: 5, dice: 8, damage_type: 'white' },
    { name: 'Enkephalin Surge', sin: 'greed', min: 2, max: 5, dice: 9, damage_type: 'black' }
  ]
};

const lcorp_waw = {
  id: 'lcorp_waw',
  name: 'The Bound One',
  rank: 'WAW',
  hp: 300,
  resistances: { red: 0.9, white: 1.0, black: 1.1, pale: 1.2 },
  combat_pages: [
    { name: 'Chain Break', sin: 'wrath', min: 5, max: 9, dice: 12, damage_type: 'red' },
    { name: 'Eternal Suffering', sin: 'gloom', min: 5, max: 10, dice: 11, damage_type: 'pale' },
    { name: 'Boundless Rage', sin: 'lust', min: 5, max: 10, dice: 13, damage_type: 'black' },
    { name: 'Final Seal', sin: 'pride', min: 4, max: 9, dice: 11, damage_type: 'white' }
  ]
};

const lcorp_he = {
  id: 'lcorp_he',
  name: 'Containment Breaker',
  rank: 'HE',
  hp: 190,
  resistances: { red: 1.1, white: 0.9, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Reality Tear', sin: 'pride', min: 4, max: 8, dice: 10, damage_type: 'pale' },
    { name: 'Fear Manifest', sin: 'gloom', min: 4, max: 8, dice: 11, damage_type: 'white' },
    { name: 'Relentless Pursuit', sin: 'wrath', min: 5, max: 9, dice: 12, damage_type: 'red' }
  ]
};

const lcorp_aleph = {
  id: 'lcorp_aleph',
  name: 'The Silent God',
  rank: 'ALEPH',
  hp: 780,
  resistances: { red: 0.7, white: 0.6, black: 0.8, pale: 0.9 },
  combat_pages: [
    { name: 'Divine Silence', sin: 'gloom', min: 6, max: 13, dice: 14, damage_type: 'white' },
    { name: 'Creation\'s End', sin: 'pride', min: 7, max: 14, dice: 13, damage_type: 'pale' },
    { name: 'God\'s Wrath', sin: 'wrath', min: 6, max: 12, dice: 15, damage_type: 'red' },
    { name: 'Infinite Void', sin: 'lust', min: 6, max: 13, dice: 14, damage_type: 'black' },
    { name: 'The Final Prayer', sin: 'greed', min: 7, max: 15, dice: 12, damage_type: 'pale' }
  ]
};

// ---- Zwei Office ----
const zwei_guard = {
  id: 'zwei_guard',
  name: 'Zwei Guard',
  rank: 'HE',
  hp: 190,
  resistances: { red: 0.8, white: 1.0, black: 1.0, pale: 0.9 },
  combat_pages: [
    { name: 'Shield Bash', sin: 'wrath', min: 3, max: 5, dice: 9, damage_type: 'red' },
    { name: 'Fortress Stance', sin: 'pride', min: 2, max: 4, dice: 7, damage_type: 'black' },
    { name: 'Counter Thrust', sin: 'envy', min: 2, max: 4, dice: 8, damage_type: 'red' }
  ]
};

const zwei_captain = {
  id: 'zwei_captain',
  name: 'Zwei Captain',
  rank: 'WAW',
  hp: 300,
  resistances: { red: 0.7, white: 1.0, black: 0.9, pale: 0.9 },
  combat_pages: [
    { name: 'Shield Wall', sin: 'pride', min: 3, max: 6, dice: 11, damage_type: 'black' },
    { name: 'Iron Will', sin: 'pride', min: 2, max: 5, dice: 9, damage_type: 'white' },
    { name: 'Phalanx Charge', sin: 'wrath', min: 4, max: 7, dice: 12, damage_type: 'red' }
  ]
};

const zwei_roland = {
  id: 'zwei_roland',
  name: 'Roland – Zwei Office',
  rank: 'WAW',
  hp: 320,
  resistances: { red: 0.6, white: 0.9, black: 0.9, pale: 0.8 },
  combat_pages: [
    { name: 'Immovable Object', sin: 'pride', min: 4, max: 7, dice: 10, damage_type: 'red' },
    { name: 'Shattering Shield', sin: 'wrath', min: 4, max: 7, dice: 12, damage_type: 'pale' },
    { name: 'Zwei\'s Creed', sin: 'pride', min: 3, max: 6, dice: 11, damage_type: 'white' }
  ]
};

// ---- Yun Office ----
const yun_office_fixer = {
  id: 'yun_office_fixer',
  name: 'Yun Office Fixer',
  rank: 'TETH',
  hp: 110,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Tiger Claw', sin: 'wrath', min: 2, max: 4, dice: 8, damage_type: 'red' },
    { name: 'Crane Kick', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Mantis Block', sin: 'envy', min: 1, max: 3, dice: 6, damage_type: 'black' }
  ]
};

const yun_office_elite = {
  id: 'yun_office_elite',
  name: 'Yun Office Elite',
  rank: 'TETH',
  hp: 125,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Dragon\'s Fury', sin: 'wrath', min: 2, max: 5, dice: 9, damage_type: 'red' },
    { name: 'Snake\'s Bite', sin: 'envy', min: 2, max: 5, dice: 8, damage_type: 'black' },
    { name: 'Monkey\'s Agility', sin: 'lust', min: 1, max: 4, dice: 7, damage_type: 'white' }
  ]
};

const yun_office_sal = {
  id: 'yun_office_sal',
  name: 'Sal – Yun Office Leader',
  rank: 'TETH',
  hp: 135,
  resistances: { red: 0.9, white: 1.0, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Master\'s Technique', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'red' },
    { name: 'Five Animal Fist', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Dojo Challenge', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'white' }
  ]
};

// ---- WARP Corp ----
const warp_maid = {
  id: 'warp_maid',
  name: 'WARP Maid',
  rank: 'TETH',
  hp: 115,
  resistances: { red: 1.0, white: 1.2, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Silver Service', sin: 'wrath', min: 2, max: 5, dice: 9, damage_type: 'red' },
    { name: 'Time Loop Serve', sin: 'lust', min: 3, max: 6, dice: 9, damage_type: 'white' },
    { name: 'Frozen Courtesy', sin: 'gloom', min: 2, max: 5, dice: 9, damage_type: 'black' }
  ]
};

const warp_server = {
  id: 'warp_server',
  name: 'WARP Server Unit',
  rank: 'TETH',
  hp: 115,
  resistances: { red: 1.0, white: 1.0, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Optimal Dining', sin: 'gluttony', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Silverware Storm', sin: 'wrath', min: 4, max: 7, dice: 10, damage_type: 'black' },
    { name: 'Malfunction Protocol', sin: 'pride', min: 3, max: 6, dice: 9, damage_type: 'white' }
  ]
};

const warp_shrouded = {
  id: 'warp_shrouded',
  name: 'Shrouded Passenger',
  rank: 'HE',
  hp: 200,
  resistances: { red: 1.0, white: 0.9, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Phase Strike', sin: 'gloom', min: 4, max: 7, dice: 10, damage_type: 'pale' },
    { name: 'Temporal Shift', sin: 'sloth', min: 3, max: 6, dice: 9, damage_type: 'white' },
    { name: 'Reality Bend', sin: 'lust', min: 4, max: 8, dice: 10, damage_type: 'black' }
  ]
};

const warp_passenger = {
  id: 'warp_passenger',
  name: 'Frozen Passenger',
  rank: 'TETH',
  hp: 110,
  resistances: { red: 1.1, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Frozen Stare', sin: 'gloom', min: 2, max: 5, dice: 9, damage_type: 'white' },
    { name: 'Desperate Grasp', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Temporal Echo', sin: 'lust', min: 2, max: 5, dice: 10, damage_type: 'black' }
  ]
};

const warp_collector = {
  id: 'warp_collector',
  name: 'WARP Collector',
  rank: 'HE',
  hp: 205,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Time Harvest', sin: 'greed', min: 4, max: 7, dice: 10, damage_type: 'white' },
    { name: 'Chronos Lock', sin: 'lust', min: 4, max: 8, dice: 10, damage_type: 'black' },
    { name: 'Collection Drive', sin: 'wrath', min: 4, max: 8, dice: 12, damage_type: 'red' }
  ]
};

const warp_chronos = {
  id: 'warp_chronos',
  name: 'Chronos Engine',
  rank: 'HE',
  hp: 200,
  resistances: { red: 1.0, white: 0.8, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Time Skip', sin: 'lust', min: 4, max: 8, dice: 10, damage_type: 'white' },
    { name: 'Temporal Overload', sin: 'wrath', min: 5, max: 9, dice: 11, damage_type: 'black' },
    { name: 'Paradox Pulse', sin: 'pride', min: 4, max: 8, dice: 12, damage_type: 'pale' }
  ]
};

const warp_conductor = {
  id: 'warp_conductor',
  name: 'Timeless Conductor',
  rank: 'WAW',
  hp: 340,
  resistances: { red: 0.9, white: 0.8, black: 1.0, pale: 0.9 },
  combat_pages: [
    { name: 'Temporal Orchestra', sin: 'pride', min: 5, max: 9, dice: 12, damage_type: 'white' },
    { name: 'Time Signature', sin: 'gloom', min: 5, max: 10, dice: 11, damage_type: 'pale' },
    { name: 'Final Movement', sin: 'wrath', min: 6, max: 11, dice: 13, damage_type: 'black' }
  ]
};

const warp_timeless_one = {
  id: 'warp_timeless_one',
  name: 'The Timeless One',
  rank: 'ALEPH',
  hp: 800,
  resistances: { red: 0.7, white: 0.7, black: 0.7, pale: 0.9 },
  combat_pages: [
    { name: 'Eternity\'s Grasp', sin: 'gloom', min: 6, max: 12, dice: 14, damage_type: 'pale' },
    { name: 'Timeline Fracture', sin: 'wrath', min: 7, max: 13, dice: 15, damage_type: 'white' },
    { name: 'Paradox Cascade', sin: 'pride', min: 7, max: 14, dice: 13, damage_type: 'black' },
    { name: 'The End of All Seconds', sin: 'lust', min: 6, max: 11, dice: 15, damage_type: 'red' },
    { name: 'Temporal Singularity', sin: 'greed', min: 6, max: 12, dice: 14, damage_type: 'pale' }
  ]
};

// ---- Time Ripper ----
const time_ripper = {
  id: 'time_ripper',
  name: 'Time Ripper',
  rank: 'WAW',
  hp: 320,
  resistances: { red: 0.9, white: 1.2, black: 1.0, pale: 0.8 },
  combat_pages: [
    { name: 'Temporal Tear', sin: 'gloom', min: 4, max: 8, dice: 9, damage_type: 'pale' },
    { name: 'Time Skip', sin: 'sloth', min: 4, max: 8, dice: 8, damage_type: 'white' },
    { name: 'Rip and Tear', sin: 'wrath', min: 5, max: 9, dice: 10, damage_type: 'red' },
    { name: 'Temporal Shield', sin: 'pride', min: 4, max: 7, dice: 11, damage_type: 'white' },
    { name: 'Time Dilation', sin: 'sloth', min: 3, max: 7, dice: 9, damage_type: 'black' }
  ]
};

const temporal_aberration = {
  id: 'temporal_aberration',
  name: 'Temporal Aberration',
  rank: 'ALEPH',
  hp: 900,
  resistances: { red: 0.7, white: 0.8, black: 0.7, pale: 0.9 },
  combat_pages: [
    { name: 'Timeline Collapse', sin: 'gloom', min: 7, max: 14, dice: 16, damage_type: 'pale' },
    { name: 'Entropic Decay', sin: 'wrath', min: 8, max: 15, dice: 15, damage_type: 'black' },
    { name: 'Reality Fracture', sin: 'pride', min: 7, max: 13, dice: 17, damage_type: 'white' },
    { name: 'Timeless Void', sin: 'gloom', min: 6, max: 12, dice: 14, damage_type: 'pale' }
  ]
};

// ---- T Corp ----
const tcorp_class2_staff = {
  id: 'tcorp_class2_staff',
  name: 'T Corp Class 2 Staff',
  rank: 'HE',
  hp: 190,
  resistances: { red: 1.0, white: 1.0, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Stopwatch Slam', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Time Dilation', sin: 'gloom', min: 2, max: 5, dice: 8, damage_type: 'black' },
    { name: 'Temporal Shock', sin: 'envy', min: 3, max: 6, dice: 9, damage_type: 'white' }
  ]
};

const tcorp_class3_collector = {
  id: 'tcorp_class3_collector',
  name: 'T Corp Class 3 Collector',
  rank: 'HE',
  hp: 210,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.1 },
  combat_pages: [
    { name: 'Collection Protocol', sin: 'gluttony', min: 3, max: 6, dice: 8, damage_type: 'red' },
    { name: 'Temporal Anchor', sin: 'sloth', min: 3, max: 7, dice: 9, damage_type: 'white' },
    { name: 'Coordinated Strike', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'red' },
    { name: 'Time Debt', sin: 'envy', min: 3, max: 7, dice: 10, damage_type: 'black' }
  ]
};

// ---- Streetlight ----
const streetlight_fixer = {
  id: 'streetlight_fixer',
  name: 'Streetlight Fixer',
  rank: 'TETH',
  hp: 115,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Neon Slash', sin: 'lust', min: 2, max: 4, dice: 8, damage_type: 'red' },
    { name: 'Light Blind', sin: 'gloom', min: 2, max: 4, dice: 8, damage_type: 'white' },
    { name: 'Street Dance', sin: 'lust', min: 1, max: 3, dice: 7, damage_type: 'black' }
  ]
};

const streetlight_captain = {
  id: 'streetlight_captain',
  name: 'Streetlight Captain',
  rank: 'HE',
  hp: 195,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Command Performance', sin: 'pride', min: 2, max: 5, dice: 9, damage_type: 'white' },
    { name: 'Spotlight', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'black' },
    { name: 'Encore!', sin: 'lust', min: 2, max: 5, dice: 10, damage_type: 'red' }
  ]
};

const streetlight_pamela = {
  id: 'streetlight_pamela',
  name: 'Pamela – Streetlight Leader',
  rank: 'HE',
  hp: 210,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Neon Requiem', sin: 'lust', min: 4, max: 7, dice: 11, damage_type: 'pale' },
    { name: 'Dance of Death', sin: 'wrath', min: 3, max: 7, dice: 10, damage_type: 'red' },
    { name: 'Starlight', sin: 'gloom', min: 3, max: 6, dice: 9, damage_type: 'white' }
  ]
};

// ---- Rats ----
const rat = {
  id: 'rat',
  name: 'Rat',
  rank: 'ZAYIN',
  hp: 40,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Desperate Swing', sin: 'wrath', min: 1, max: 3, dice: 5, damage_type: 'red' },
    { name: 'Foul Bite', sin: 'gloom', min: 1, max: 3, dice: 4, damage_type: 'red' }
  ]
};

const street_rat = {
  id: 'street_rat',
  name: 'Street Rat',
  rank: 'ZAYIN',
  hp: 42,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Street Smarts', sin: 'pride', min: 1, max: 3, dice: 5, damage_type: 'red' },
    { name: 'Gutter Kick', sin: 'wrath', min: 1, max: 3, dice: 4, damage_type: 'red' },
    { name: 'Dirty Fighting', sin: 'envy', min: 1, max: 3, dice: 4, damage_type: 'black' }
  ]
};

const rat_king = {
  id: 'rat_king',
  name: 'Rat King',
  rank: 'ZAYIN',
  hp: 55,
  resistances: { red: 0.9, white: 1.1, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Swarm Call', sin: 'gloom', min: 2, max: 4, dice: 6, damage_type: 'black' },
    { name: 'King\'s Bite', sin: 'wrath', min: 2, max: 5, dice: 7, damage_type: 'red' },
    { name: 'Vermin Lord', sin: 'pride', min: 2, max: 4, dice: 6, damage_type: 'red' }
  ]
};

// ---- Purple Tear ----
const purple_tear_apprentice = {
  id: 'purple_tear_apprentice',
  name: 'Purple Tear Apprentice',
  rank: 'WAW',
  hp: 290,
  resistances: { red: 1.0, white: 0.9, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Spatial Slice', sin: 'wrath', min: 4, max: 7, dice: 12, damage_type: 'pale' },
    { name: 'Dimensional Pocket', sin: 'gloom', min: 3, max: 6, dice: 10, damage_type: 'black' },
    { name: 'Reality Shift', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'white' },
    { name: 'Spatial Distortion', sin: 'envy', min: 3, max: 7, dice: 11, damage_type: 'pale' }
  ]
};

const purple_tear_executor = {
  id: 'purple_tear_executor',
  name: 'Purple Tear Executor',
  rank: 'WAW',
  hp: 310,
  resistances: { red: 0.9, white: 0.8, black: 0.8, pale: 0.9 },
  combat_pages: [
    { name: 'Executioner\'s Spatial Rend', sin: 'wrath', min: 5, max: 9, dice: 14, damage_type: 'pale' },
    { name: 'Dimensional Anchor', sin: 'pride', min: 4, max: 7, dice: 12, damage_type: 'black' },
    { name: 'Void Step', sin: 'lust', min: 4, max: 7, dice: 11, damage_type: 'white' },
    { name: 'Purple Tear\'s Wrath', sin: 'wrath', min: 5, max: 8, dice: 13, damage_type: 'pale' }
  ]
};

const purple_tear_iori = {
  id: 'purple_tear_iori',
  name: 'Iori – The Purple Tear',
  rank: 'ALEPH',
  hp: 800,
  resistances: { red: 0.7, white: 0.6, black: 0.6, pale: 0.7 },
  combat_pages: [
    { name: 'Dimension Rift', sin: 'gloom', min: 6, max: 12, dice: 19, damage_type: 'pale' },
    { name: 'Purple Tear\'s Requiem', sin: 'wrath', min: 6, max: 11, dice: 18, damage_type: 'pale' },
    { name: 'Spatial Dominion', sin: 'pride', min: 5, max: 10, dice: 16, damage_type: 'white' },
    { name: 'Tear of Creation', sin: 'gloom', min: 6, max: 11, dice: 17, damage_type: 'pale' },
    { name: 'Dimensional Convergence', sin: 'envy', min: 5, max: 9, dice: 15, damage_type: 'black' },
    { name: 'Iori\'s Domain', sin: 'pride', min: 4, max: 8, dice: 14, damage_type: 'white' }
  ]
};

// ---- Pudding Town ----
const pudding_citizen = {
  id: 'pudding_citizen',
  name: 'Pudding Citizen',
  rank: 'ZAYIN',
  hp: 45,
  resistances: { red: 1.1, white: 0.9, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Sticky Strike', sin: 'gluttony', min: 1, max: 4, dice: 5, damage_type: 'red' },
    { name: 'Sweet Smile', sin: 'lust', min: 1, max: 4, dice: 5, damage_type: 'white' }
  ]
};

const pudding_chef = {
  id: 'pudding_chef',
  name: 'Pudding Chef',
  rank: 'TETH',
  hp: 115,
  resistances: { red: 1.0, white: 1.0, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Spoon Swipe', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Secret Recipe', sin: 'gluttony', min: 2, max: 5, dice: 8, damage_type: 'black' },
    { name: 'Caramel Drizzle', sin: 'greed', min: 3, max: 7, dice: 8, damage_type: 'white' }
  ]
};

const pudding_beast = {
  id: 'pudding_beast',
  name: 'Pudding Beast',
  rank: 'HE',
  hp: 200,
  resistances: { red: 0.9, white: 1.2, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Pudding Slam', sin: 'wrath', min: 4, max: 8, dice: 11, damage_type: 'red' },
    { name: 'Assimilation', sin: 'gluttony', min: 4, max: 8, dice: 10, damage_type: 'black' },
    { name: 'Jiggly Defense', sin: 'gloom', min: 3, max: 7, dice: 11, damage_type: 'white' }
  ]
};

const pudding_king = {
  id: 'pudding_king',
  name: 'The Pudding King',
  rank: 'WAW',
  hp: 320,
  resistances: { red: 1.0, white: 1.0, black: 0.9, pale: 1.1 },
  combat_pages: [
    { name: 'Royal Spoon', sin: 'pride', min: 5, max: 9, dice: 12, damage_type: 'red' },
    { name: 'Candy Crown', sin: 'greed', min: 5, max: 8, dice: 11, damage_type: 'white' },
    { name: 'Pudding Army', sin: 'lust', min: 4, max: 8, dice: 13, damage_type: 'black' },
    { name: 'King\'s Feast', sin: 'gluttony', min: 5, max: 10, dice: 11, damage_type: 'pale' }
  ]
};

const pudding_god = {
  id: 'pudding_god',
  name: 'The Pudding God',
  rank: 'ALEPH',
  hp: 760,
  resistances: { red: 0.7, white: 0.9, black: 0.8, pale: 0.9 },
  combat_pages: [
    { name: 'Divine Pudding', sin: 'gluttony', min: 6, max: 12, dice: 14, damage_type: 'black' },
    { name: 'Sweet Salvation', sin: 'lust', min: 6, max: 11, dice: 13, damage_type: 'white' },
    { name: 'Pudding World', sin: 'gloom', min: 7, max: 13, dice: 12, damage_type: 'pale' },
    { name: 'God\'s Spoon', sin: 'wrath', min: 7, max: 14, dice: 15, damage_type: 'red' },
    { name: 'Endless Dessert', sin: 'greed', min: 8, max: 15, dice: 13, damage_type: 'pale' }
  ]
};

// ---- Molar Office ----
const molar_worker = {
  id: 'molar_worker',
  name: 'Molar Office Worker',
  rank: 'TETH',
  hp: 110,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 0.9 },
  combat_pages: [
    { name: 'Depth Charge', sin: 'wrath', min: 2, max: 4, dice: 8, damage_type: 'red' },
    { name: 'Harpoon Gun', sin: 'envy', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Diving Kick', sin: 'lust', min: 1, max: 4, dice: 7, damage_type: 'black' }
  ]
};

const molar_foreman = {
  id: 'molar_foreman',
  name: 'Molar Office Foreman',
  rank: 'HE',
  hp: 200,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 0.8 },
  combat_pages: [
    { name: 'Pressure Cannon', sin: 'wrath', min: 3, max: 6, dice: 10, damage_type: 'red' },
    { name: 'Underwater Ambush', sin: 'gloom', min: 2, max: 5, dice: 9, damage_type: 'black' },
    { name: 'Diving Suit Charge', sin: 'pride', min: 2, max: 4, dice: 8, damage_type: 'red' }
  ]
};

const molar_olga = {
  id: 'molar_olga',
  name: 'Olga – Molar Office Leader',
  rank: 'HE',
  hp: 210,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 0.8 },
  combat_pages: [
    { name: 'Abyssal Dive', sin: 'gloom', min: 4, max: 7, dice: 11, damage_type: 'pale' },
    { name: 'Kraken\'s Grasp', sin: 'wrath', min: 3, max: 7, dice: 10, damage_type: 'red' },
    { name: 'Molar\'s Resolve', sin: 'pride', min: 3, max: 6, dice: 9, damage_type: 'white' }
  ]
};

// ---- Liu Office ----
const liu_warrior = {
  id: 'liu_warrior',
  name: 'Liu Warrior',
  rank: 'TETH',
  hp: 160,
  resistances: { red: 0.9, white: 1.1, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Flame Slash', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Inferno Kick', sin: 'lust', min: 3, max: 6, dice: 8, damage_type: 'red' },
    { name: 'Ember Burst', sin: 'gluttony', min: 2, max: 5, dice: 8, damage_type: 'black' }
  ]
};

const liu_section_chief = {
  id: 'liu_section_chief',
  name: 'Liu Section Chief',
  rank: 'HE',
  hp: 220,
  resistances: { red: 0.8, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Blazing Command', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'white' },
    { name: 'Firestorm', sin: 'wrath', min: 4, max: 8, dice: 11, damage_type: 'red' },
    { name: 'Flame Shield', sin: 'pride', min: 3, max: 6, dice: 9, damage_type: 'black' }
  ]
};

const liu_xiao = {
  id: 'liu_xiao',
  name: 'Xiao',
  rank: 'WAW',
  hp: 360,
  resistances: { red: 0.7, white: 0.9, black: 0.9, pale: 0.8 },
  combat_pages: [
    { name: 'Phoenix Flame', sin: 'wrath', min: 5, max: 10, dice: 13, damage_type: 'pale' },
    { name: 'Dragon\'s Breath', sin: 'lust', min: 5, max: 9, dice: 12, damage_type: 'red' },
    { name: 'Crimson Lotus', sin: 'pride', min: 4, max: 8, dice: 11, damage_type: 'white' },
    { name: 'Liu\'s Resolve', sin: 'pride', min: 4, max: 7, dice: 10, damage_type: 'black' }
  ]
};

// ---- K Corp ----
const kcorp_worker = {
  id: 'kcorp_worker',
  name: 'K Corp Plantation Worker',
  rank: 'TETH',
  hp: 110,
  resistances: { red: 1.0, white: 1.1, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Regenerative Swing', sin: 'wrath', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Glowing Strike', sin: 'gloom', min: 2, max: 6, dice: 8, damage_type: 'white' },
    { name: 'Desperate Lunge', sin: 'lust', min: 2, max: 5, dice: 9, damage_type: 'black' }
  ]
};

const kcorp_supervisor = {
  id: 'kcorp_supervisor',
  name: 'K Corp Supervisor',
  rank: 'TETH',
  hp: 120,
  resistances: { red: 1.0, white: 1.0, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Commanding Voice', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'white' },
    { name: 'Disciplinary Strike', sin: 'wrath', min: 3, max: 6, dice: 8, damage_type: 'red' },
    { name: 'Regen Injection', sin: 'greed', min: 2, max: 4, dice: 10, damage_type: 'black' }
  ]
};

const kcorp_regenerator = {
  id: 'kcorp_regenerator',
  name: 'K Corp Regenerator',
  rank: 'HE',
  hp: 200,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Healing Pulse', sin: 'gloom', min: 3, max: 7, dice: 9, damage_type: 'white' },
    { name: 'Cell Overload', sin: 'gluttony', min: 4, max: 8, dice: 10, damage_type: 'black' },
    { name: 'Regenerative Burst', sin: 'wrath', min: 4, max: 8, dice: 9, damage_type: 'red' }
  ]
};

const kcorp_harvester = {
  id: 'kcorp_harvester',
  name: 'K Corp Harvester',
  rank: 'HE',
  hp: 190,
  resistances: { red: 0.9, white: 1.2, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Scythe Sweep', sin: 'wrath', min: 4, max: 8, dice: 11, damage_type: 'red' },
    { name: 'Plant Drain', sin: 'greed', min: 3, max: 7, dice: 10, damage_type: 'black' },
    { name: 'Reaping Swipe', sin: 'lust', min: 4, max: 9, dice: 10, damage_type: 'pale' }
  ]
};

const kcorp_overseer = {
  id: 'kcorp_overseer',
  name: 'K Corp Overseer',
  rank: 'WAW',
  hp: 310,
  resistances: { red: 0.9, white: 1.0, black: 1.1, pale: 1.2 },
  combat_pages: [
    { name: 'Regen Cannon', sin: 'wrath', min: 4, max: 8, dice: 9, damage_type: 'red' },
    { name: 'Field Override', sin: 'pride', min: 4, max: 8, dice: 12, damage_type: 'white' },
    { name: 'Immortal Protocol', sin: 'gloom', min: 5, max: 9, dice: 10, damage_type: 'black' },
    { name: 'Overseer\'s Judgment', sin: 'lust', min: 5, max: 10, dice: 12, damage_type: 'pale' }
  ]
};

const kcorp_immortal_heart = {
  id: 'kcorp_immortal_heart',
  name: 'The Immortal Heart',
  rank: 'ALEPH',
  hp: 750,
  resistances: { red: 0.7, white: 0.8, black: 0.8, pale: 0.9 },
  combat_pages: [
    { name: 'Heartbeat Pulse', sin: 'gloom', min: 6, max: 12, dice: 14, damage_type: 'white' },
    { name: 'Regenerative Cascade', sin: 'gluttony', min: 5, max: 10, dice: 12, damage_type: 'black' },
    { name: 'Immortal Wrath', sin: 'wrath', min: 7, max: 14, dice: 13, damage_type: 'red' },
    { name: 'Cell Rebellion', sin: 'lust', min: 6, max: 12, dice: 15, damage_type: 'pale' },
    { name: 'The Endless Beat', sin: 'pride', min: 8, max: 16, dice: 12, damage_type: 'pale' }
  ]
};

// ---- Index ----
const index_proselyte = {
  id: 'index_proselyte',
  name: 'Index Proselyte',
  rank: 'HE',
  hp: 180,
  resistances: { red: 1.0, white: 0.9, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Prescript: Strike', sin: 'wrath', min: 2, max: 5, dice: 9, damage_type: 'red' },
    { name: 'Prescript: Shield', sin: 'pride', min: 2, max: 4, dice: 8, damage_type: 'black' },
    { name: 'Prescript: Weaken', sin: 'gloom', min: 2, max: 4, dice: 8, damage_type: 'white' }
  ]
};

const index_weaver = {
  id: 'index_weaver',
  name: 'Index Weaver',
  rank: 'WAW',
  hp: 290,
  resistances: { red: 0.9, white: 0.8, black: 0.9, pale: 0.9 },
  combat_pages: [
    { name: 'Thread of Fate', sin: 'gloom', min: 4, max: 7, dice: 12, damage_type: 'pale' },
    { name: 'Prescript Mastery', sin: 'pride', min: 3, max: 7, dice: 11, damage_type: 'white' },
    { name: 'Fate\'s Design', sin: 'envy', min: 3, max: 6, dice: 10, damage_type: 'black' }
  ]
};

const index_herald = {
  id: 'index_herald',
  name: 'Index Herald',
  rank: 'WAW',
  hp: 300,
  resistances: { red: 0.9, white: 0.8, black: 0.9, pale: 0.9 },
  combat_pages: [
    { name: 'Will of the Index', sin: 'pride', min: 4, max: 7, dice: 12, damage_type: 'white' },
    { name: 'Prophetic Vision', sin: 'gloom', min: 3, max: 7, dice: 11, damage_type: 'pale' },
    { name: 'Herald\'s Proclamation', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'black' }
  ]
};

const index_proxy = {
  id: 'index_proxy',
  name: 'Index Proxy',
  rank: 'ALEPH',
  hp: 750,
  resistances: { red: 0.7, white: 0.6, black: 0.7, pale: 0.8 },
  combat_pages: [
    { name: 'The Final Prescript', sin: 'pride', min: 6, max: 11, dice: 15, damage_type: 'pale' },
    { name: 'Index\'s Judgment', sin: 'wrath', min: 5, max: 10, dice: 17, damage_type: 'pale' },
    { name: 'Fate\'s End', sin: 'gloom', min: 5, max: 9, dice: 16, damage_type: 'black' },
    { name: 'Proxy\'s Authority', sin: 'pride', min: 4, max: 9, dice: 18, damage_type: 'white' }
  ]
};

// ---- Hook Office ----
const hook_worker = {
  id: 'hook_worker',
  name: 'Hook Office Worker',
  rank: 'ZAYIN',
  hp: 45,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Harpoon Thrust', sin: 'wrath', min: 1, max: 4, dice: 5, damage_type: 'red' },
    { name: 'Hook Pull', sin: 'envy', min: 1, max: 3, dice: 4, damage_type: 'red' },
    { name: 'Fishing Line Slash', sin: 'lust', min: 1, max: 3, dice: 4, damage_type: 'red' }
  ]
};

const hook_foreman = {
  id: 'hook_foreman',
  name: 'Hook Office Foreman',
  rank: 'TETH',
  hp: 110,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Command: Strike', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Master Harpooner', sin: 'wrath', min: 3, max: 6, dice: 10, damage_type: 'red' },
    { name: 'Net Trap', sin: 'gloom', min: 1, max: 4, dice: 7, damage_type: 'black' }
  ]
};

const hook_office_director = {
  id: 'hook_office_director',
  name: 'Hook Office Director',
  rank: 'TETH',
  hp: 130,
  resistances: { red: 1.0, white: 1.1, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'The Big Catch', sin: 'pride', min: 3, max: 6, dice: 10, damage_type: 'red' },
    { name: 'Fleet of Fishing Boats', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Captain\'s Command', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'white' }
  ]
};

// ---- Black Silence ----
const black_silence_recollection = {
  id: 'black_silence_recollection',
  name: 'Black Silence Recollection',
  rank: 'WAW',
  hp: 320,
  resistances: { red: 0.9, white: 0.8, black: 0.9, pale: 0.9 },
  combat_pages: [
    { name: 'Echo of Furioso', sin: 'wrath', min: 4, max: 8, dice: 12, damage_type: 'red' },
    { name: 'Memory of Crying Children', sin: 'gloom', min: 4, max: 7, dice: 11, damage_type: 'white' },
    { name: 'Phantom Workshop', sin: 'envy', min: 3, max: 7, dice: 10, damage_type: 'black' },
    { name: 'Silent Recollection', sin: 'gloom', min: 3, max: 6, dice: 10, damage_type: 'pale' }
  ]
};

const black_silence_fury = {
  id: 'black_silence_fury',
  name: 'Black Silence Fury',
  rank: 'WAW',
  hp: 320,
  resistances: { red: 0.8, white: 0.7, black: 0.8, pale: 0.9 },
  combat_pages: [
    { name: 'Fury of the Lost', sin: 'wrath', min: 5, max: 9, dice: 12, damage_type: 'red' },
    { name: 'Crescendo of Violence', sin: 'wrath', min: 4, max: 8, dice: 14, damage_type: 'black' },
    { name: 'Weapon Mastery', sin: 'pride', min: 4, max: 8, dice: 15, damage_type: 'red' },
    { name: 'Unrelenting Assault', sin: 'lust', min: 3, max: 7, dice: 16, damage_type: 'white' }
  ]
};

const roland_black_silence = {
  id: 'roland_black_silence',
  name: 'Roland – The Black Silence',
  rank: 'ALEPH',
  hp: 850,
  resistances: { red: 0.6, white: 0.5, black: 0.7, pale: 0.8 },
  combat_pages: [
    { name: 'Furioso', sin: 'wrath', min: 7, max: 13, dice: 19, damage_type: 'pale' },
    { name: 'Roland\'s Workshop', sin: 'pride', min: 5, max: 10, dice: 13, damage_type: 'red' },
    { name: 'Crying Children\'s Lament', sin: 'gloom', min: 5, max: 10, dice: 14, damage_type: 'white' },
    { name: 'Black Silence\'s Oath', sin: 'gloom', min: 6, max: 11, dice: 16, damage_type: 'pale' },
    { name: 'The Silence', sin: 'gloom', min: 5, max: 10, dice: 17, damage_type: 'white' },
    { name: 'Mask of the Black Silence', sin: 'pride', min: 4, max: 8, dice: 12, damage_type: 'black' },
    { name: 'Finale – The Black Silence', sin: 'wrath', min: 6, max: 12, dice: 14, damage_type: 'pale' },
    { name: 'Reception of the Black Silence', sin: 'pride', min: 4, max: 8, dice: 13, damage_type: 'red' }
  ]
};

// ---- Aggressive Yurodiviy ----
const aggressive_yurodiviy = {
  id: 'aggressive_yurodiviy',
  name: 'Aggressive Yurodiviy',
  rank: 'TETH',
  hp: 120,
  resistances: { red: 1.0, white: 1.2, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Frenzied Assault', sin: 'wrath', min: 4, max: 7, dice: 10, damage_type: 'red' },
    { name: 'Maddening Scream', sin: 'gloom', min: 2, max: 5, dice: 12, damage_type: 'white' },
    { name: 'Rampage', sin: 'wrath', min: 2, max: 6, dice: 14, damage_type: 'red' }
  ]
};

const quick_witted_yurodiviy = {
  id: 'quick_witted_yurodiviy',
  name: 'Quick-Witted Yurodiviy',
  rank: 'TETH',
  hp: 120,
  resistances: { red: 1.0, white: 0.9, black: 1.1, pale: 1.0 },
  combat_pages: [
    { name: 'Taunt', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'white' },
    { name: 'Quick Strike', sin: 'envy', min: 3, max: 6, dice: 9, damage_type: 'red' },
    { name: 'Flanking Maneuver', sin: 'lust', min: 3, max: 6, dice: 9, damage_type: 'black' },
    { name: 'Mocking Laugh', sin: 'pride', min: 2, max: 4, dice: 7, damage_type: 'white' }
  ]
};

// ---- R Corp ----
const rcorp_clone = {
  id: 'rcorp_clone',
  name: 'R Corp Clone',
  rank: 'TETH',
  hp: 105,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Clone Strike', sin: 'wrath', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Swarm Tactics', sin: 'lust', min: 2, max: 5, dice: 9, damage_type: 'black' },
    { name: 'Expendable Charge', sin: 'wrath', min: 3, max: 6, dice: 9, damage_type: 'red' }
  ]
};

const rcorp_elite_clone = {
  id: 'rcorp_elite_clone',
  name: 'R Corp Elite Clone',
  rank: 'HE',
  hp: 195,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.1 },
  combat_pages: [
    { name: 'Precision Strike', sin: 'pride', min: 4, max: 8, dice: 11, damage_type: 'red' },
    { name: 'Tactical Command', sin: 'pride', min: 3, max: 7, dice: 10, damage_type: 'white' },
    { name: 'Flawless Execution', sin: 'wrath', min: 5, max: 9, dice: 12, damage_type: 'black' }
  ]
};

const rcorp_hatchery_guard = {
  id: 'rcorp_hatchery_guard',
  name: 'Hatchery Guard',
  rank: 'HE',
  hp: 200,
  resistances: { red: 0.9, white: 1.1, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Protective Stance', sin: 'gloom', min: 3, max: 7, dice: 10, damage_type: 'white' },
    { name: 'Repelling Blow', sin: 'wrath', min: 4, max: 8, dice: 11, damage_type: 'red' },
    { name: 'Hatchery Fury', sin: 'wrath', min: 5, max: 9, dice: 12, damage_type: 'black' }
  ]
};

const rcorp_queen = {
  id: 'rcorp_queen',
  name: 'The R Corp Queen',
  rank: 'WAW',
  hp: 340,
  resistances: { red: 1.0, white: 1.0, black: 1.1, pale: 1.2 },
  combat_pages: [
    { name: 'Queen\'s Command', sin: 'pride', min: 5, max: 9, dice: 11, damage_type: 'white' },
    { name: 'Clone Genesis', sin: 'greed', min: 4, max: 8, dice: 12, damage_type: 'black' },
    { name: 'Queen\'s Wrath', sin: 'wrath', min: 5, max: 10, dice: 13, damage_type: 'red' },
    { name: 'Genetic Memory', sin: 'gloom', min: 5, max: 10, dice: 12, damage_type: 'pale' }
  ]
};

const rcorp_perfect_one = {
  id: 'rcorp_perfect_one',
  name: 'The Perfect One',
  rank: 'ALEPH',
  hp: 820,
  resistances: { red: 0.7, white: 0.7, black: 0.7, pale: 0.8 },
  combat_pages: [
    { name: 'Perfection\'s Edge', sin: 'pride', min: 7, max: 14, dice: 18, damage_type: 'red' },
    { name: 'No Flaws', sin: 'pride', min: 6, max: 12, dice: 16, damage_type: 'white' },
    { name: 'Absolute Certainty', sin: 'lust', min: 7, max: 13, dice: 15, damage_type: 'pale' },
    { name: 'Perfect Copy', sin: 'greed', min: 6, max: 11, dice: 14, damage_type: 'black' },
    { name: 'The End of Evolution', sin: 'gloom', min: 8, max: 15, dice: 19, damage_type: 'pale' }
  ]
};

// ---- Red Mist ----
const red_mist_memory = {
  id: 'red_mist_memory',
  name: 'Red Mist Memory',
  rank: 'WAW',
  hp: 310,
  resistances: { red: 0.8, white: 1.0, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Echo of Great Split', sin: 'wrath', min: 4, max: 8, dice: 13, damage_type: 'red' },
    { name: 'Memory of Onrush', sin: 'wrath', min: 4, max: 7, dice: 12, damage_type: 'red' },
    { name: 'Phantom Level Slash', sin: 'pride', min: 4, max: 7, dice: 11, damage_type: 'red' },
    { name: 'Fading Fury', sin: 'gloom', min: 3, max: 6, dice: 10, damage_type: 'white' }
  ]
};

const kali_red_mist = {
  id: 'kali_red_mist',
  name: 'Kali – The Red Mist',
  rank: 'ALEPH',
  hp: 800,
  resistances: { red: 0.6, white: 0.8, black: 0.7, pale: 0.9 },
  combat_pages: [
    { name: 'Great Split: Horizontal', sin: 'wrath', min: 7, max: 13, dice: 18, damage_type: 'red' },
    { name: 'Great Split: Vertical', sin: 'wrath', min: 6, max: 12, dice: 18, damage_type: 'pale' },
    { name: 'Onrush', sin: 'wrath', min: 5, max: 10, dice: 12, damage_type: 'red' },
    { name: 'Level Slash', sin: 'pride', min: 4, max: 9, dice: 10, damage_type: 'red' },
    { name: 'Red Mist Manifestation', sin: 'gloom', min: 4, max: 8, dice: 11, damage_type: 'white' },
    { name: 'Kali\'s Awakening', sin: 'pride', min: 4, max: 8, dice: 14, damage_type: 'black' },
    { name: 'Mimicry', sin: 'envy', min: 3, max: 7, dice: 20, damage_type: 'pale' }
  ]
};

// ---- Shi Office ----
const shi_assassin = {
  id: 'shi_assassin',
  name: 'Shi Assassin',
  rank: 'TETH',
  hp: 140,
  resistances: { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Shadow Strike', sin: 'envy', min: 3, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Kunai Throw', sin: 'wrath', min: 2, max: 4, dice: 7, damage_type: 'red' },
    { name: 'Smoke Screen', sin: 'gloom', min: 2, max: 4, dice: 7, damage_type: 'black' }
  ]
};

const shi_elite_assassin = {
  id: 'shi_elite_assassin',
  name: 'Shi Elite Assassin',
  rank: 'HE',
  hp: 240,
  resistances: { red: 0.9, white: 1.0, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Deadly Precision', sin: 'pride', min: 4, max: 7, dice: 10, damage_type: 'red' },
    { name: 'Shadow Dance', sin: 'lust', min: 4, max: 7, dice: 9, damage_type: 'black' },
    { name: 'Assassin\'s Mark', sin: 'envy', min: 3, max: 6, dice: 9, damage_type: 'white' }
  ]
};

const shi_tenma = {
  id: 'shi_tenma',
  name: 'Tenma',
  rank: 'WAW',
  hp: 360,
  resistances: { red: 0.8, white: 0.9, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Tenma\'s Wrath', sin: 'wrath', min: 5, max: 10, dice: 13, damage_type: 'red' },
    { name: 'Shadow Legion', sin: 'gloom', min: 5, max: 9, dice: 12, damage_type: 'black' },
    { name: 'Silent Execution', sin: 'pride', min: 4, max: 8, dice: 11, damage_type: 'pale' },
    { name: 'Shi\'s Legacy', sin: 'envy', min: 5, max: 9, dice: 12, damage_type: 'white' }
  ]
};

// ---- U Corp ----
const ucorp_sentinel = {
  id: 'ucorp_sentinel',
  name: 'U Corp Sentinel',
  rank: 'TETH',
  hp: 120,
  resistances: { red: 1.0, white: 1.2, black: 1.0, pale: 1.0 },
  combat_pages: [
    { name: 'Mechanical Strike', sin: 'wrath', min: 2, max: 5, dice: 8, damage_type: 'red' },
    { name: 'Warning Siren', sin: 'pride', min: 2, max: 5, dice: 8, damage_type: 'white' },
    { name: 'Routine Patrol', sin: 'lust', min: 2, max: 4, dice: 7, damage_type: 'black' }
  ]
};

const ucorp_watcher = {
  id: 'ucorp_watcher',
  name: 'U Corp Watcher',
  rank: 'HE',
  hp: 195,
  resistances: { red: 1.1, white: 0.8, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Penetrating Gaze', sin: 'gloom', min: 4, max: 8, dice: 11, damage_type: 'white' },
    { name: 'Knowledge Strike', sin: 'pride', min: 3, max: 7, dice: 10, damage_type: 'black' },
    { name: 'All-Seeing Eye', sin: 'lust', min: 4, max: 8, dice: 10, damage_type: 'pale' }
  ]
};

const ucorp_spiral_knight = {
  id: 'ucorp_spiral_knight',
  name: 'Spiral Knight',
  rank: 'HE',
  hp: 200,
  resistances: { red: 0.9, white: 1.0, black: 1.0, pale: 1.2 },
  combat_pages: [
    { name: 'Spiral Slash', sin: 'wrath', min: 4, max: 8, dice: 9, damage_type: 'red' },
    { name: 'Knight\'s Oath', sin: 'pride', min: 3, max: 7, dice: 8, damage_type: 'white' },
    { name: 'Descending Charge', sin: 'wrath', min: 5, max: 9, dice: 10, damage_type: 'red' }
  ]
};

const ucorp_depth_dweller = {
  id: 'ucorp_depth_dweller',
  name: 'Depth Dweller',
  rank: 'WAW',
  hp: 310,
  resistances: { red: 1.0, white: 1.1, black: 0.9, pale: 1.0 },
  combat_pages: [
    { name: 'Abyssal Grasp', sin: 'gloom', min: 5, max: 9, dice: 9, damage_type: 'black' },
    { name: 'Darkness Manifest', sin: 'lust', min: 5, max: 10, dice: 8, damage_type: 'white' },
    { name: 'Unending Descent', sin: 'gloom', min: 4, max: 8, dice: 10, damage_type: 'pale' },
    { name: 'Depth\'s Fury', sin: 'wrath', min: 6, max: 10, dice: 9, damage_type: 'red' }
  ]
};

const ucorp_spiral_king = {
  id: 'ucorp_spiral_king',
  name: 'The Spiral King',
  rank: 'ALEPH',
  hp: 780,
  resistances: { red: 0.7, white: 0.8, black: 0.7, pale: 0.9 },
  combat_pages: [
    { name: 'Infinite Descent', sin: 'gloom', min: 7, max: 14, dice: 17, damage_type: 'pale' },
    { name: 'Spiral Dominion', sin: 'pride', min: 6, max: 12, dice: 15, damage_type: 'white' },
    { name: 'Depth\'s Wrath', sin: 'wrath', min: 7, max: 13, dice: 16, damage_type: 'red' },
    { name: 'Eternal Knight', sin: 'pride', min: 6, max: 11, dice: 14, damage_type: 'black' }
  ]
};

// ---- EXPORT ----
export const explorationEnemies: Record<string, ExplorationEnemy> = {};

function addEnemy(enemyData: any) {
  const enemy = createEnemyFromJSON(enemyData);
  explorationEnemies[enemy.id] = enemy;
}

addEnemy(lcorp_zayin);
addEnemy(lcorp_teth);
addEnemy(lcorp_waw);
addEnemy(lcorp_he);
addEnemy(lcorp_aleph);
addEnemy(zwei_guard);
addEnemy(zwei_captain);
addEnemy(zwei_roland);
addEnemy(yun_office_fixer);
addEnemy(yun_office_elite);
addEnemy(yun_office_sal);
addEnemy(warp_maid);
addEnemy(warp_server);
addEnemy(warp_shrouded);
addEnemy(warp_passenger);
addEnemy(warp_collector);
addEnemy(warp_chronos);
addEnemy(warp_conductor);
addEnemy(warp_timeless_one);
addEnemy(time_ripper);
addEnemy(temporal_aberration);
addEnemy(tcorp_class2_staff);
addEnemy(tcorp_class3_collector);
addEnemy(streetlight_fixer);
addEnemy(streetlight_captain);
addEnemy(streetlight_pamela);
addEnemy(rat);
addEnemy(street_rat);
addEnemy(rat_king);
addEnemy(purple_tear_apprentice);
addEnemy(purple_tear_executor);
addEnemy(purple_tear_iori);
addEnemy(pudding_citizen);
addEnemy(pudding_chef);
addEnemy(pudding_beast);
addEnemy(pudding_king);
addEnemy(pudding_god);
addEnemy(molar_worker);
addEnemy(molar_foreman);
addEnemy(molar_olga);
addEnemy(liu_warrior);
addEnemy(liu_section_chief);
addEnemy(liu_xiao);
addEnemy(kcorp_worker);
addEnemy(kcorp_supervisor);
addEnemy(kcorp_regenerator);
addEnemy(kcorp_harvester);
addEnemy(kcorp_overseer);
addEnemy(kcorp_immortal_heart);
addEnemy(index_proselyte);
addEnemy(index_weaver);
addEnemy(index_herald);
addEnemy(index_proxy);
addEnemy(hook_worker);
addEnemy(hook_foreman);
addEnemy(hook_office_director);
addEnemy(black_silence_recollection);
addEnemy(black_silence_fury);
addEnemy(roland_black_silence);
addEnemy(aggressive_yurodiviy);
addEnemy(quick_witted_yurodiviy);
addEnemy(rcorp_clone);
addEnemy(rcorp_elite_clone);
addEnemy(rcorp_hatchery_guard);
addEnemy(rcorp_queen);
addEnemy(rcorp_perfect_one);
addEnemy(red_mist_memory);
addEnemy(kali_red_mist);
addEnemy(shi_assassin);
addEnemy(shi_elite_assassin);
addEnemy(shi_tenma);
addEnemy(ucorp_sentinel);
addEnemy(ucorp_watcher);
addEnemy(ucorp_spiral_knight);
addEnemy(ucorp_depth_dweller);
addEnemy(ucorp_spiral_king);