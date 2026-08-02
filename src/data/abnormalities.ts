// src/data/abnormalities.ts
export interface Abnormality {
  id: string;
  name: string;
  risk: 'ZAYIN' | 'TETH' | 'HE' | 'WAW' | 'ALEPH';
  description: string;
  workChances: {
    instinct: number;
    insight: number;
    attachment: number;
    repression: number;
  };
  workDamage: { type: string; min: number; max: number };
  maxBoxes: number;
  energyPerBox?: number;
  qliphothCounter: number | null;
  canBreach: boolean;
  breach?: {
    hp: number;
    resistances: Record<string, number>;
    damage: number;
    damageType: string;
    skills: Array<{ name: string; damage: number; type: string; cooldown: number; range: string }>;
    specialMechanics?: any;
  };
  imageUrl?: string;
  isWhiteNight?: boolean;
  isPlagueDoctor?: boolean;
  isApocalypseBird?: boolean;
  isBlueStar?: boolean;
  onKillGetsStronger?: boolean;
  isCensored?: boolean;
  gift?: {
    id: string;
    name: string;
    description: string;
    chance: number;
    onBreach: boolean;
  };
  observation?: {
    level1?: { count: number; rewards: string[] };
    level2?: { count: number; rewards: string[] };
    level3?: { count: number; rewards: string[] };
    level4?: { count: number; rewards: string[] };
  };
}

function createAbnormality(data: any): Abnormality {
  return {
    id: data.id,
    name: data.name,
    risk: data.risk || 'ZAYIN',
    description: data.description || '',
    workChances: {
      instinct: data.workChances?.instinct || 0.5,
      insight: data.workChances?.insight || 0.5,
      attachment: data.workChances?.attachment || 0.5,
      repression: data.workChances?.repression || 0.5,
    },
    workDamage: {
      type: data.workDamage?.type || 'red',
      min: data.workDamage?.min || 1,
      max: data.workDamage?.max || 3,
    },
    maxBoxes: data.maxBoxes || 10,
    energyPerBox: data.energyPerBox || 1,
    qliphothCounter: data.qliphoth?.counter !== undefined ? data.qliphoth.counter : null,
    canBreach: data.canBreach || false,
    breach: data.breach ? {
      hp: data.breach.hp || 100,
      resistances: data.breach.resistances || { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 },
      damage: data.breach.damage || 10,
      damageType: data.breach.damageType || 'red',
      skills: data.breach.skills?.map((s: any) => ({
        name: s.name || 'Attack',
        damage: s.damage || 10,
        type: s.type || 'red',
        cooldown: s.cooldown || 3,
        range: s.range || 'single',
      })) || [],
      specialMechanics: data.breach.specialMechanics || {},
    } : undefined,
    imageUrl: data.image || null,
    isWhiteNight: data.isWhiteNight || false,
    isPlagueDoctor: data.isPlagueDoctor || false,
    isApocalypseBird: data.isApocalypseBird || false,
    isBlueStar: data.isBlueStar || false,
    onKillGetsStronger: data.onKillGetsStronger || false,
    isCensored: data.isCensored || false,
    gift: data.gift ? {
      id: data.gift.id,
      name: data.gift.name,
      description: data.gift.description,
      chance: data.gift.chance || 0.05,
      onBreach: data.gift.onBreach || false,
    } : undefined,
    observation: data.observation ? {
      level1: data.observation.level1 ? { count: data.observation.level1.count, rewards: data.observation.level1.rewards } : undefined,
      level2: data.observation.level2 ? { count: data.observation.level2.count, rewards: data.observation.level2.rewards } : undefined,
      level3: data.observation.level3 ? { count: data.observation.level3.count, rewards: data.observation.level3.rewards } : undefined,
      level4: data.observation.level4 ? { count: data.observation.level4.count, rewards: data.observation.level4.rewards } : undefined,
    } : undefined,
  };
}

export const abnormalities: Abnormality[] = [
  // ---- Big Bird ----
  createAbnormality({
    id: 'big_bird',
    name: 'Big Bird',
    risk: 'WAW',
    description: 'A long-necked bird with a glowing lamp. It watches. Always watches.',
    workChances: { instinct: 0.55, insight: 0.35, attachment: 0.65, repression: 0.05 },
    workDamage: { type: 'white', min: 8, max: 18 },
    maxBoxes: 26,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 880,
      resistances: { red: 0.8, white: 0.4, black: 0.6, pale: 1.2 },
      damage: 26,
      damageType: 'white',
      skills: [
        { name: 'Behold the Light', damage: 24, type: 'white', cooldown: 5, range: 'room' },
        { name: 'Promise of Protection', damage: 38, type: 'white', cooldown: 7, range: 'single' },
        { name: 'Darkness Approaches', damage: 10, type: 'white', cooldown: 9, range: 'global' },
      ],
    },
    gift: {
      id: 'lamp_gift',
      name: 'Lamp',
      description: 'A small lamp that flickers warmly. Increases White damage by 12%.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Alriune ----
  createAbnormality({
    id: 'alriune',
    name: 'Alriune',
    risk: 'WAW',
    description: 'A sorrowful being that sings lullabies of loss.',
    workChances: { instinct: 0.60, insight: 0.55, attachment: 0.25, repression: 0.05 },
    workDamage: { type: 'white', min: 6, max: 15 },
    maxBoxes: 24,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 750,
      resistances: { red: 0.8, white: 0.4, black: 0.6, pale: 1.2 },
      damage: 28,
      damageType: 'white',
      skills: [
        { name: 'Elegy of Longing', damage: 22, type: 'white', cooldown: 5, range: 'room' },
        { name: 'Wail of the Forgotten', damage: 38, type: 'white', cooldown: 7, range: 'single' },
        { name: 'Tear-soaked Ground', damage: 10, type: 'white', cooldown: 3, range: 'area' },
      ],
    },
    gift: {
      id: 'faint_aroma_gift',
      name: 'Faint Aroma',
      description: 'A lingering scent of tears and spring rain.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Army in Black ----
  createAbnormality({
    id: 'army_in_black',
    name: 'Army in Black',
    risk: 'WAW',
    description: 'A cheerful marching band in black uniforms.',
    workChances: { instinct: 0.00, insight: 0.50, attachment: 0.55, repression: 0.30 },
    workDamage: { type: 'red', min: 4, max: 14 },
    maxBoxes: 28,
    qliphoth: { counter: 3, maxCounter: 3 },
    canBreach: true,
    breach: {
      hp: 850,
      resistances: { red: 0.6, white: 1.2, black: 0.9, pale: 1.0 },
      damage: 20,
      damageType: 'red',
      skills: [
        { name: 'Jolly Volley', damage: 16, type: 'red', cooldown: 6, range: 'room' },
        { name: 'Smile of the Regiment', damage: 32, type: 'red', cooldown: 8, range: 'single' },
      ],
    },
    gift: {
      id: 'pink_gift',
      name: 'Pink',
      description: 'Increases the damage of this Abnormality\'s weapon by 15%.',
      chance: 0.10,
      onBreach: false,
    },
  }),

  // ---- Adult Who Tells Lies ----
  createAbnormality({
    id: 'adult_who_tells_lies',
    name: 'Adult Who Tells Lies',
    risk: 'ALEPH',
    description: 'A tall, shadowy figure wearing an ornate porcelain mask.',
    workChances: { instinct: 0.40, insight: 0.65, attachment: 0.45, repression: 0.25 },
    workDamage: { type: 'white', min: 10, max: 22 },
    maxBoxes: 28,
    qliphoth: { counter: 3, maxCounter: 5 },
    canBreach: true,
    breach: {
      hp: 1800,
      resistances: { red: 1.0, white: 0.4, black: 0.8, pale: 1.2 },
      damage: 35,
      damageType: 'white',
      skills: [
        { name: 'Plausible Deniability', damage: 30, type: 'white', cooldown: 5, range: 'single' },
        { name: 'Gaslight', damage: 15, type: 'white', cooldown: 7, range: 'room' },
        { name: 'Web of Lies', damage: 20, type: 'white', cooldown: 10, range: 'global' },
        { name: 'Ultimate Truth', damage: 50, type: 'pale', cooldown: 15, range: 'single' },
      ],
    },
    isAdult: true,
  }),

  // ---- WhiteNight / Plague Doctor ----
  createAbnormality({
    id: 'whitenight',
    name: 'Plague Doctor',
    risk: 'ZAYIN',
    description: 'A figure in a plague mask and dark robes. It does not speak. It watches.',
    workChances: { instinct: 0.50, insight: 0.60, attachment: 0.55, repression: 0.45 },
    workDamage: { type: 'white', min: 1, max: 2 },
    maxBoxes: 28,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: false,
    isPlagueDoctor: true,
    gift: {
      id: 'bless',
      name: 'Bless',
      description: 'A small blessing from the Plague Doctor. Increases all stats by 6.',
      chance: 1.0,
      onBreach: false,
    },
  }),

  // ---- Warm-Hearted Woodsman ----
  createAbnormality({
    id: 'warm_hearted_woodsman',
    name: 'Warm-Hearted Woodsman',
    risk: 'HE',
    description: 'A man made of tin and copper, holding an axe he cannot lift.',
    workChances: { instinct: 0.45, insight: 0.50, attachment: 0.60, repression: 0.45 },
    workDamage: { type: 'white', min: 3, max: 5 },
    maxBoxes: 18,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: true,
    breach: {
      hp: 430,
      resistances: { red: 0.8, white: 1.0, black: 1.0, pale: 1.5 },
      damage: 10,
      damageType: 'red',
      skills: [
        { name: 'Desperate Swing', damage: 8, type: 'red', cooldown: 4, range: 'single' },
        { name: 'Timber Fall', damage: 7, type: 'red', cooldown: 5, range: 'line' },
        { name: 'Hollow Embrace', damage: 6, type: 'red', cooldown: 6, range: 'single' },
      ],
    },
    gift: {
      id: 'logging_gift',
      name: 'Logging',
      description: 'A small, hollow heart made of tin.',
      chance: 0.04,
      onBreach: false,
    },
  }),

  // ---- Titania ----
  createAbnormality({
    id: 'titania',
    name: 'Titania',
    risk: 'ALEPH',
    description: 'A queen of fairies, draped in flowers and moonlight.',
    workChances: { instinct: 0.50, insight: 0.30, attachment: 0.55, repression: 0.00 },
    workDamage: { type: 'pale', min: 7, max: 8 },
    maxBoxes: 33,
    qliphoth: { counter: 4, maxCounter: 4 },
    canBreach: true,
    breach: {
      hp: 2000,
      resistances: { red: 1.2, white: 0.7, black: 0.8, pale: 0.4 },
      damage: 28,
      damageType: 'pale',
      skills: [
        { name: 'Fairy Dust', damage: 20, type: 'pale', cooldown: 5, range: 'room' },
        { name: 'The Queen\'s Sorrow', damage: 15, type: 'pale', cooldown: 8, range: 'global' },
        { name: 'Embrace of the Lost', damage: 45, type: 'pale', cooldown: 10, range: 'single' },
      ],
    },
    gift: {
      id: 'midsummer_gift',
      name: 'Midsummer Flower',
      description: 'A flower that never wilts. Increases Pale damage by 15%.',
      chance: 0.30,
      onBreach: false,
    },
  }),

  // ---- The Homing Instinct ----
  createAbnormality({
    id: 'the_homing_instinct',
    name: 'The Homing Instinct',
    risk: 'HE',
    description: 'A creature that always finds its way home.',
    workChances: { instinct: 0.50, insight: 0.45, attachment: 0.50, repression: 0.40 },
    workDamage: { type: 'red', min: 3, max: 5 },
    maxBoxes: 20,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 800,
      resistances: { red: 0.8, white: 1.0, black: 1.0, pale: 1.5 },
      damage: 18,
      damageType: 'red',
      skills: [
        { name: 'Instinctual Lunge', damage: 22, type: 'red', cooldown: 4, range: 'single' },
        { name: 'Homing Call', damage: 14, type: 'red', cooldown: 6, range: 'room' },
      ],
    },
    gift: {
      id: 'homing_instinct_gift',
      name: 'Homing Instinct',
      description: 'A small token that always points home.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Spiral of Contempt ----
  createAbnormality({
    id: 'spiral_of_contempt',
    name: 'Spiral of Contempt',
    risk: 'WAW',
    description: 'A spiral that descends forever. It hates what it sees.',
    workChances: { instinct: 0.40, insight: 0.40, attachment: 0.40, repression: 0.40 },
    workDamage: { type: 'white', min: 5, max: 5 },
    maxBoxes: 18,
    qliphoth: { counter: null, maxCounter: null },
    canBreach: false,
    gift: {
      id: 'contempt_awe_gift',
      name: 'Contempt, Awe',
      description: 'A shard of the spiral that still turns.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Spider Bud ----
  createAbnormality({
    id: 'spider_bud',
    name: 'Spider Bud',
    risk: 'TETH',
    description: 'A small, furry spider with too many eyes.',
    workChances: { instinct: 0.50, insight: 0.45, attachment: 0.50, repression: 0.45 },
    workDamage: { type: 'red', min: 2, max: 3 },
    maxBoxes: 14,
    qliphoth: { counter: null, maxCounter: null },
    canBreach: false,
    gift: {
      id: 'red_eyes_gift',
      name: 'Red Eyes',
      description: 'A small spider that sits on your shoulder.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Funeral of the Dead Butterflies ----
  createAbnormality({
    id: 'funeral_of_the_dead_butterflies',
    name: 'Funeral of the Dead Butterflies',
    risk: 'HE',
    description: 'A woman in a black veil, playing a golden harp.',
    workChances: { instinct: 0.50, insight: 0.50, attachment: 0.00, repression: 0.00 },
    workDamage: { type: 'white', min: 4, max: 6 },
    maxBoxes: 16,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 400,
      resistances: { red: 1.0, white: 0.5, black: 1.0, pale: 1.5 },
      damage: 15,
      damageType: 'white',
      skills: [
        { name: 'Butterfly Shot', damage: 15, type: 'white', cooldown: 3, range: 'single' },
        { name: 'Coffin Swarm', damage: 4, type: 'white', cooldown: 6, range: 'area' },
      ],
    },
    gift: {
      id: 'solemn_lament_gift',
      name: 'Solemn Lament',
      description: 'A small black coffin with a white butterfly symbol.',
      chance: 0.03,
      onBreach: false,
    },
  }),

  // ---- Singing Machine ----
  createAbnormality({
    id: 'singing_machine',
    name: 'Singing Machine',
    risk: 'HE',
    description: 'A rusted music box that plays waltzes and lullabies.',
    workChances: { instinct: 0.55, insight: 0.50, attachment: 0.00, repression: 0.40 },
    workDamage: { type: 'white', min: 4, max: 6 },
    maxBoxes: 18,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: false,
    gift: {
      id: 'harmony_gift',
      name: 'Harmony',
      description: 'A small music box key on a chain.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Silent Orchestra ----
  createAbnormality({
    id: 'silentorchestra',
    name: 'Silent Orchestra',
    risk: 'ALEPH',
    description: 'A conductor in a decaying tuxedo.',
    workChances: { instinct: 0.00, insight: 0.40, attachment: 0.50, repression: 0.30 },
    workDamage: { type: 'white', min: 7, max: 9 },
    maxBoxes: 30,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 2000,
      resistances: { red: 1.0, white: 0.5, black: 0.8, pale: 1.2 },
      damage: 35,
      damageType: 'white',
      skills: [
        { name: 'Movement 1', damage: 20, type: 'pale', cooldown: 5, range: 'room' },
        { name: 'Movement 2', damage: 25, type: 'black', cooldown: 5, range: 'room' },
        { name: 'Movement 3', damage: 25, type: 'white', cooldown: 5, range: 'room' },
        { name: 'Movement 4', damage: 30, type: 'red', cooldown: 5, range: 'room' },
      ],
    },
    gift: {
      id: 'da_capo',
      name: 'Da Capo',
      description: 'A small silver baton that hums faintly.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Scaredy Cat ----
  createAbnormality({
    id: 'scaredy_cat',
    name: 'Scaredy Cat',
    risk: 'HE',
    description: 'A small, frightened cat that startles easily.',
    workChances: { instinct: 0.45, insight: 0.40, attachment: 0.50, repression: 0.35 },
    workDamage: { type: 'red', min: 3, max: 6 },
    maxBoxes: 18,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 600,
      resistances: { red: 0.8, white: 1.2, black: 0.9, pale: 1.5 },
      damage: 14,
      damageType: 'red',
      skills: [
        { name: 'Startled Scratch', damage: 16, type: 'red', cooldown: 3, range: 'single' },
        { name: 'Hiss', damage: 6, type: 'white', cooldown: 4, range: 'room' },
      ],
    },
    gift: {
      id: 'scaredy_cat_gift',
      name: 'Scaredy Cat',
      description: 'A small cat figurine that trembles slightly.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Scarecrow Searching for Wisdom ----
  createAbnormality({
    id: 'scarecrow',
    name: 'Scarecrow Searching for Wisdom',
    risk: 'HE',
    description: 'A scarecrow made of burlap and straw.',
    workChances: { instinct: 0.45, insight: 0.50, attachment: 0.45, repression: 0.45 },
    workDamage: { type: 'white', min: 2, max: 6 },
    maxBoxes: 18,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: true,
    breach: {
      hp: 500,
      resistances: { red: 0.8, white: 0.5, black: 1.2, pale: 2.0 },
      damage: 5,
      damageType: 'black',
      skills: [
        { name: 'Desperate Harvest', damage: 5, type: 'black', cooldown: 3, range: 'single' },
        { name: 'Brain Extraction', damage: 0, type: 'black', cooldown: 0, range: 'single' },
      ],
    },
    gift: {
      id: 'harvest_gift',
      name: 'Harvest',
      description: 'A small bundle of golden straw.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- The Road Home ----
  createAbnormality({
    id: 'road_home',
    name: 'The Road Home',
    risk: 'ZAYIN',
    description: 'A winding path that leads nowhere and everywhere.',
    workChances: { instinct: 0.50, insight: 0.50, attachment: 0.50, repression: 0.50 },
    workDamage: { type: 'red', min: 4, max: 5 },
    maxBoxes: 5,
    qliphoth: { counter: null, maxCounter: null },
    canBreach: false,
    gift: {
      id: 'road_home_gift',
      name: 'The Road Home',
      description: 'A small piece of the endless road.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Queen of Hatred ----
  createAbnormality({
    id: 'queenofhatred',
    name: 'Queen of Hatred',
    risk: 'WAW',
    description: 'A magical girl in a frilled dress, holding a heart-shaped wand.',
    workChances: { instinct: 0.45, insight: 0.45, attachment: 0.60, repression: 0.00 },
    workDamage: { type: 'black', min: 3, max: 4 },
    maxBoxes: 22,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 1200,
      resistances: { red: 0.7, white: 1.2, black: 0.3, pale: 1.5 },
      damage: 26,
      damageType: 'black',
      skills: [
        { name: 'Teleport Explosion', damage: 26, type: 'black', cooldown: 5, range: 'area' },
        { name: 'Star Attack', damage: 15, type: 'black', cooldown: 3, range: 'long' },
        { name: 'Facility Laser', damage: 6, type: 'black', cooldown: 8, range: 'global' },
      ],
    },
    gift: {
      id: 'hatred_gift',
      name: 'In the Name of Love and Hate',
      description: 'A heart-shaped hair ornament with small wings.',
      chance: 0.03,
      onBreach: false,
    },
  }),

  // ---- Queen Bee ----
  createAbnormality({
    id: 'queen_bee',
    name: 'Queen Bee',
    risk: 'WAW',
    description: 'A massive, bloated insect that never leaves its chamber.',
    workChances: { instinct: 0.40, insight: 0.60, attachment: 0.30, repression: 0.10 },
    workDamage: { type: 'red', min: 4, max: 6 },
    maxBoxes: 22,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: false,
    gift: {
      id: 'hornet_gift',
      name: 'Hornet',
      description: 'A small, sharp stinger on a chain.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Punishing Bird ----
  createAbnormality({
    id: 'punishingbird',
    name: 'Punishing Bird',
    risk: 'TETH',
    description: 'A small, angry bird with feathers that bristle like thorns.',
    workChances: { instinct: 0.40, insight: 0.60, attachment: 0.55, repression: 0.30 },
    workDamage: { type: 'red', min: 2, max: 4 },
    maxBoxes: 12,
    qliphoth: { counter: 4, maxCounter: 4 },
    canBreach: true,
    isApocalypseBird: true,
    breach: {
      hp: 200,
      resistances: { red: 2.0, white: 2.0, black: 2.0, pale: 2.0 },
      damage: 1,
      damageType: 'red',
      skills: [
        { name: 'Vengeful Peck', damage: 1, type: 'red', cooldown: 2, range: 'single' },
        { name: 'Flurry of Justice', damage: 1, type: 'red', cooldown: 6, range: 'room' },
      ],
    },
    gift: {
      id: 'beak_gift',
      name: 'Beak',
      description: 'A small, sharp beak on a leather cord.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Price of Silence ----
  createAbnormality({
    id: 'price_of_silence',
    name: 'Price of Silence',
    risk: 'HE',
    description: 'A clock without hands. It waits.',
    workChances: { instinct: 0.70, insight: 0.40, attachment: 0.40, repression: 0.60 },
    workDamage: { type: 'white', min: 4, max: 7 },
    maxBoxes: 24,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 750,
      resistances: { red: 1.0, white: 0.5, black: 0.6, pale: 1.3 },
      damage: 26,
      damageType: 'white',
      skills: [
        { name: 'Silence Falls', damage: 22, type: 'white', cooldown: 4, range: 'single' },
        { name: 'Shattered Stillness', damage: 16, type: 'white', cooldown: 6, range: 'room' },
        { name: 'The Debt Comes Due', damage: 36, type: 'white', cooldown: 9, range: 'single' },
      ],
    },
    gift: {
      id: 'dead_silence',
      name: 'Dead Silence',
      description: 'A broken pocket watch that does not tick.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Parasite Tree ----
  createAbnormality({
    id: 'parasite_tree',
    name: 'Parasite Tree',
    risk: 'WAW',
    description: 'A beautiful tree with silver leaves and impossible colors.',
    workChances: { instinct: 0.45, insight: 0.40, attachment: 0.50, repression: 0.20 },
    workDamage: { type: 'white', min: 5, max: 6 },
    maxBoxes: 24,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: false,
    gift: {
      id: 'hypocrisy_gift',
      name: 'Hypocrisy',
      description: 'A single leaf that never wilts.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Ozma ----
  createAbnormality({
    id: 'ozma',
    name: 'Ozma',
    risk: 'WAW',
    description: 'A lion that roars without conviction.',
    workChances: { instinct: 0.45, insight: 0.50, attachment: 0.55, repression: 0.40 },
    workDamage: { type: 'white', min: 7, max: 12 },
    maxBoxes: 24,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 1000,
      resistances: { red: 1.0, white: 0.6, black: 0.9, pale: 1.5 },
      damage: 22,
      damageType: 'white',
      skills: [
        { name: 'Cowardly Roar', damage: 18, type: 'white', cooldown: 5, range: 'room' },
        { name: 'Trembling Swipe', damage: 24, type: 'white', cooldown: 3, range: 'single' },
      ],
    },
    gift: {
      id: 'ozma_gift',
      name: 'Ozma\'s Medal',
      description: 'A medal that reads "Courage".',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Opened Can of WellCheers ----
  createAbnormality({
    id: 'opened_can',
    name: 'Opened Can of WellCheers',
    risk: 'ZAYIN',
    description: 'A flashy grey vending machine that plays music.',
    workChances: { instinct: 0.70, insight: 0.70, attachment: 0.50, repression: 0.50 },
    workDamage: { type: 'red', min: 1, max: 2 },
    maxBoxes: 10,
    qliphoth: { counter: null, maxCounter: null },
    canBreach: false,
    gift: {
      id: 'soda_gift',
      name: 'Soda',
      description: 'A can of WellCheers soda.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- One Sin ----
  createAbnormality({
    id: 'one_sin',
    name: 'One Sin and Hundreds of Good Deeds',
    risk: 'ZAYIN',
    description: 'A skull impaled on a weathered wooden cross.',
    workChances: { instinct: 0.50, insight: 0.70, attachment: 0.70, repression: 0.50 },
    workDamage: { type: 'white', min: 1, max: 2 },
    maxBoxes: 10,
    qliphoth: { counter: null, maxCounter: null },
    canBreach: false,
    gift: {
      id: 'penitence_gift',
      name: 'Penitence',
      description: 'A crown of thorns that does not hurt.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Nothing There ----
  createAbnormality({
    id: 'nothingthere',
    name: 'Nothing There',
    risk: 'ALEPH',
    description: 'A thing that wears skin like a costume.',
    workChances: { instinct: 0.45, insight: 0.00, attachment: 0.50, repression: 0.00 },
    workDamage: { type: 'red', min: 6, max: 9 },
    maxBoxes: 33,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: true,
    breach: {
      hp: 2000,
      resistances: { red: 0.3, white: 0.8, black: 0.8, pale: 1.2 },
      damage: 58,
      damageType: 'red',
      skills: [
        { name: 'Mimicry Slash', damage: 62, type: 'red', cooldown: 4, range: 'single' },
        { name: 'Cocoon', damage: 0, type: 'red', cooldown: 15, range: 'self' },
        { name: 'Adaptation', damage: 0, type: 'red', cooldown: 8, range: 'self' },
      ],
    },
    gift: {
      id: 'mimicry_gift',
      name: 'Mimicry',
      description: 'A small piece of Nothing That attached to your skin.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Nosferatu ----
  createAbnormality({
    id: 'nosferatu',
    name: 'Nosferatu',
    risk: 'WAW',
    description: 'A tall, gaunt figure in a black coat.',
    workChances: { instinct: 0.80, insight: 0.30, attachment: 0.45, repression: 0.15 },
    workDamage: { type: 'white', min: 3, max: 6 },
    maxBoxes: 22,
    qliphoth: { counter: 4, maxCounter: 4 },
    canBreach: true,
    breach: {
      hp: 900,
      resistances: { red: 0.3, white: 1.0, black: 0.5, pale: 1.0 },
      damage: 9,
      damageType: 'red',
      skills: [
        { name: 'Bite of the Ancient', damage: 9, type: 'red', cooldown: 4, range: 'single' },
        { name: 'Call the Children', damage: 0, type: 'red', cooldown: 10, range: 'global' },
      ],
    },
    gift: {
      id: 'dipsia_gift',
      name: 'Dipsia',
      description: 'A constant, unquenchable thirst.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Mountain of Smiling Bodies ----
  createAbnormality({
    id: 'mountainofsmilingbodies',
    name: 'Mountain of Smiling Bodies',
    risk: 'ALEPH',
    description: 'A mass of corpses, stacked and fused, all of them smiling.',
    workChances: { instinct: 0.50, insight: 0.00, attachment: 0.00, repression: 0.50 },
    workDamage: { type: 'black', min: 6, max: 8 },
    maxBoxes: 30,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    onKillGetsStronger: true,
    breach: {
      hp: 500,
      resistances: { red: 1.2, white: 0.8, black: 0.5, pale: 0.8 },
      damage: 11,
      damageType: 'red',
      skills: [
        { name: 'Devour', damage: 0, type: 'red', cooldown: 0, range: 'ground' },
        { name: 'Bite', damage: 11, type: 'red', cooldown: 2, range: 'melee' },
        { name: 'Roar', damage: 27, type: 'black', cooldown: 5, range: 'medium' },
      ],
    },
    gift: {
      id: 'smile_gift',
      name: 'Smile',
      description: 'A small mouth that moves on your skin.',
      chance: 0.30,
      onBreach: false,
    },
  }),

  // ---- Melting Love ----
  createAbnormality({
    id: 'meltinglove',
    name: 'Melting Love',
    risk: 'ALEPH',
    description: 'A pulsing heart of pink slime that beats like a living thing.',
    workChances: { instinct: 0.20, insight: 0.40, attachment: 0.20, repression: 0.00 },
    workDamage: { type: 'black', min: 4, max: 10 },
    maxBoxes: 32,
    qliphoth: { counter: 3, maxCounter: 3 },
    canBreach: true,
    breach: {
      hp: 1500,
      resistances: { red: 0.5, white: 1.0, black: 1.5, pale: 0.8 },
      damage: 32,
      damageType: 'black',
      skills: [
        { name: 'Slime Spit', damage: 32, type: 'black', cooldown: 2, range: 'line' },
        { name: 'Slime Slam', damage: 20, type: 'black', cooldown: 1.5, range: 'melee' },
      ],
    },
    gift: {
      id: 'adoration_gift',
      name: 'Adoration',
      description: 'A small, beating heart that pulses in your palm.',
      chance: 0.30,
      onBreach: false,
    },
  }),

  // ---- Der Freischütz ----
  createAbnormality({
    id: 'derfreischutz',
    name: 'Der Freischütz',
    risk: 'HE',
    description: 'A huntsman in shadow, loading silver bullets into a smoking rifle.',
    workChances: { instinct: 0.40, insight: 0.50, attachment: 0.30, repression: 0.00 },
    workDamage: { type: 'black', min: 3, max: 4 },
    maxBoxes: 18,
    qliphoth: { counter: 3, maxCounter: 3 },
    canBreach: false,
    gift: {
      id: 'magic_bullet_gift',
      name: 'Magic Bullet',
      description: 'The magic this holds is still potent.',
      chance: 0.04,
      onBreach: false,
    },
  }),

  // ---- Little Red Riding Hooded Mercenary ----
  createAbnormality({
    id: 'little_red_riding_hooded_mercenary',
    name: 'Little Red Riding Hooded Mercenary',
    risk: 'WAW',
    description: 'A hunter in a crimson hood. Her shotgun is always loaded.',
    workChances: { instinct: 0.45, insight: 0.50, attachment: 0.00, repression: 0.30 },
    workDamage: { type: 'red', min: 4, max: 6 },
    maxBoxes: 20,
    qliphoth: { counter: 3, maxCounter: 3 },
    canBreach: true,
    onKillGetsStronger: true,
    breach: {
      hp: 1000,
      resistances: { red: 0.9, white: 0.6, black: 0.8, pale: 1.2 },
      damage: 28,
      damageType: 'red',
      skills: [
        { name: 'Hunter\'s Mark', damage: 0, type: 'red', cooldown: 6, range: 'single' },
        { name: 'Vengeful Blast', damage: 34, type: 'red', cooldown: 7, range: 'cone' },
        { name: 'Rapid Reprisal', damage: 12, type: 'red', cooldown: 5, range: 'single' },
      ],
    },
    gift: {
      id: 'crimson_scar_gift',
      name: 'Crimson Scar',
      description: 'A worn leather eyepatch stained with gunpowder.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Laetitia ----
  createAbnormality({
    id: 'laetitia',
    name: 'Laetitia',
    risk: 'HE',
    description: 'A small, doll-like girl who giggles and claps her hands.',
    workChances: { instinct: 0.40, insight: 0.40, attachment: 0.45, repression: 0.30 },
    workDamage: { type: 'black', min: 2, max: 4 },
    maxBoxes: 16,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: false,
    gift: {
      id: 'laetitia_gift',
      name: 'Laetitia',
      description: 'A bright red ribbon that ties itself into a bow.',
      chance: 0.04,
      onBreach: false,
    },
  }),

  // ---- Knight of Despair ----
  createAbnormality({
    id: 'knight_of_despair',
    name: 'Knight of Despair',
    risk: 'WAW',
    description: 'A knight in rusted black armor, perpetually weeping.',
    workChances: { instinct: 0.00, insight: 0.45, attachment: 0.50, repression: 0.40 },
    workDamage: { type: 'white', min: 4, max: 6 },
    maxBoxes: 22,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: true,
    breach: {
      hp: 800,
      resistances: { red: 1.2, white: 1.0, black: 0.8, pale: 0.5 },
      damage: 50,
      damageType: 'pale',
      skills: [
        { name: 'Despairing Throw', damage: 50, type: 'pale', cooldown: 4, range: 'single' },
      ],
    },
    gift: {
      id: 'kod_gift',
      name: 'The Sword Sharpened with Tears',
      description: 'SP +2, MS +4, AS +4.',
      chance: 0.03,
      onBreach: false,
    },
  }),

  // ---- King of Greed ----
  createAbnormality({
    id: 'king_of_greed',
    name: 'King of Greed',
    risk: 'WAW',
    description: 'Once a girl who loved beautiful things. Now she is a throne of gold.',
    workChances: { instinct: 0.25, insight: 0.00, attachment: 0.00, repression: 0.00 },
    workDamage: { type: 'red', min: 5, max: 7 },
    maxBoxes: 22,
    qliphoth: { counter: 1, maxCounter: 1 },
    canBreach: true,
    breach: {
      hp: 1500,
      resistances: { red: 0.5, white: 1.2, black: 1.2, pale: 1.5 },
      damage: 26,
      damageType: 'red',
      skills: [
        { name: 'Devouring Maw', damage: 40, type: 'red', cooldown: 5, range: 'cone' },
        { name: 'Relentless March', damage: 30, type: 'red', cooldown: 4, range: 'line' },
      ],
    },
    gift: {
      id: 'gold_rush_gift',
      name: 'Gold Rush',
      description: 'A golden bracelet with a glowing gem.',
      chance: 0.02,
      onBreach: false,
    },
  }),

  // ---- Judgement Bird ----
  createAbnormality({
    id: 'judgementbird',
    name: 'Judgement Bird',
    risk: 'WAW',
    description: 'A tall, slender bird wearing a cracked stone mask.',
    workChances: { instinct: 0.20, insight: 0.20, attachment: 0.20, repression: 0.00 },
    workDamage: { type: 'pale', min: 5, max: 7 },
    maxBoxes: 24,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    isApocalypseBird: true,
    breach: {
      hp: 800,
      resistances: { red: 0.8, white: 0.8, black: 0.8, pale: 2.0 },
      damage: 30,
      damageType: 'pale',
      skills: [
        { name: 'Guilty Verdict', damage: 30, type: 'pale', cooldown: 6, range: 'single' },
        { name: 'Weighing of the Heart', damage: 0, type: 'pale', cooldown: 8, range: 'room' },
        { name: 'Final Judgment', damage: 30, type: 'pale', cooldown: 14, range: 'global' },
      ],
    },
    gift: {
      id: 'justitia_gift',
      name: 'Justitia',
      description: 'A small golden weight that never stops moving.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Fragments of the Universe ----
  createAbnormality({
    id: 'frag_of_the_universe',
    name: 'Fragments of the Universe',
    risk: 'TETH',
    description: 'A cluster of floating, star-like shards that drift in no pattern.',
    workChances: { instinct: 0.30, insight: 0.40, attachment: 0.60, repression: 0.50 },
    workDamage: { type: 'black', min: 1, max: 3 },
    maxBoxes: 12,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 230,
      resistances: { red: 1.0, white: 1.5, black: 1.0, pale: 2.0 },
      damage: 4,
      damageType: 'black',
      skills: [
        { name: 'Echoes from the Beyond', damage: 4, type: 'white', cooldown: 8, range: 'room' },
        { name: 'Tentacle Grasp', damage: 4, type: 'black', cooldown: 3, range: 'single' },
      ],
    },
    gift: {
      id: 'frag_from_somewhere_gift',
      name: 'Fragments from Somewhere',
      description: 'A gift from beyond the stars.',
      chance: 0.05,
      onBreach: false,
    },
  }),

  // ---- Forsaken Murderer ----
  createAbnormality({
    id: 'forsakenmurderer',
    name: 'Forsaken Murderer',
    risk: 'TETH',
    description: 'A rotting figure in stained bandages, dragging a cleaver.',
    workChances: { instinct: 0.60, insight: 0.40, attachment: 0.50, repression: 0.30 },
    workDamage: { type: 'red', min: 4, max: 11 },
    maxBoxes: 18,
    qliphoth: { counter: 3, maxCounter: 3 },
    canBreach: true,
    breach: {
      hp: 320,
      resistances: { red: 0.6, white: 1.2, black: 1.0, pale: 1.3 },
      damage: 13,
      damageType: 'red',
      skills: [
        { name: 'Trembling Cleaver', damage: 16, type: 'red', cooldown: 3, range: 'single' },
        { name: 'Desperate Lunge', damage: 12, type: 'red', cooldown: 6, range: 'line' },
      ],
    },
    gift: {
      id: 'regret_gift',
      name: 'Regret',
      description: 'Wrapped tightly around your arm. They smell like old tears.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Children of the Galaxy ----
  createAbnormality({
    id: 'children_of_the_galaxy',
    name: 'Children of the Galaxy',
    risk: 'HE',
    description: 'Small, starry figures that drift in slow circles.',
    workChances: { instinct: 0.45, insight: 0.45, attachment: 0.45, repression: 0.45 },
    workDamage: { type: 'white', min: 2, max: 3 },
    maxBoxes: 16,
    qliphoth: { counter: 1, maxCounter: 5 },
    canBreach: false,
    gift: {
      id: 'our_galaxy_gift',
      name: 'Our Galaxy',
      description: 'A white glowing pebble necklace.',
      chance: 0.04,
      onBreach: false,
    },
  }),

  // ---- [CENSORED] ----
  createAbnormality({
    id: 'censored',
    name: '[CENSORED]',
    risk: 'ALEPH',
    description: '[DATA EXPUNGED] — The Qliphoth Determination Committee has classified this entity.',
    workChances: { instinct: 0.80, insight: 0.90, attachment: 0.70, repression: 0.00 },
    workDamage: { type: 'black', min: 22, max: 48 },
    maxBoxes: 28,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    isCensored: true,
    onKillGetsStronger: true,
    breach: {
      hp: 1900,
      resistances: { red: 0.5, white: 0.4, black: 0.3, pale: 0.9 },
      damage: 52,
      damageType: 'black',
      skills: [
        { name: 'The Unspeakable', damage: 65, type: 'black', cooldown: 8, range: 'single' },
        { name: 'Gaze of the Abyss', damage: 28, type: 'black', cooldown: 6, range: 'room' },
        { name: 'Reality Fracture', damage: 20, type: 'black', cooldown: 12, range: 'global' },
      ],
    },
    gift: {
      id: 'censored_gift',
      name: '[REDACTED]',
      description: 'You don\'t remember getting this.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Blue Star ----
  createAbnormality({
    id: 'bluestar',
    name: 'Blue Star',
    risk: 'ALEPH',
    description: 'A distant star that sings in a language older than words.',
    workChances: { instinct: 0.30, insight: 0.50, attachment: 0.00, repression: 0.40 },
    workDamage: { type: 'white', min: 18, max: 42 },
    maxBoxes: 32,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    isBlueStar: true,
    breach: {
      hp: 2200,
      resistances: { red: 0.6, white: 0.2, black: 0.4, pale: 0.8 },
      damage: 48,
      damageType: 'white',
      skills: [
        { name: 'Hymn of Returning', damage: 28, type: 'white', cooldown: 10, range: 'global' },
        { name: 'Gravitational Pull', damage: 15, type: 'white', cooldown: 5, range: 'room' },
        { name: 'Event Horizon', damage: 55, type: 'white', cooldown: 16, range: 'global' },
      ],
    },
    gift: {
      id: 'sound_of_a_star_gift',
      name: 'Sound of a Star',
      description: 'A faint ringing that never stops.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Bloodbath ----
  createAbnormality({
    id: 'bloodbath',
    name: 'Bloodbath',
    risk: 'TETH',
    description: 'A bathtub filled with crimson water. It whispers about relief.',
    workChances: { instinct: 0.55, insight: 0.40, attachment: 0.65, repression: 0.10 },
    workDamage: { type: 'red', min: 5, max: 12 },
    maxBoxes: 14,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    breach: {
      hp: 380,
      resistances: { red: 0.7, white: 1.2, black: 1.0, pale: 1.3 },
      damage: 14,
      damageType: 'red',
      skills: [
        { name: 'Crimson Wave', damage: 16, type: 'red', cooldown: 3, range: 'cone' },
        { name: 'Comforting Warmth', damage: 10, type: 'red', cooldown: 6, range: 'single' },
        { name: 'Call of the Deep', damage: 8, type: 'red', cooldown: 5, range: 'room' },
      ],
    },
    gift: {
      id: 'wrist_cutter_gift',
      name: 'Wrist Cutter',
      description: 'Faint lines that never fade.',
      chance: 0.35,
      onBreach: false,
    },
  }),

  // ---- Big and Will be Bad Wolf ----
  createAbnormality({
    id: 'big_and_will_be_bad_wolf',
    name: 'Big and Will be Bad Wolf',
    risk: 'WAW',
    description: 'A wolf that swore to become the villain of every story.',
    workChances: { instinct: 0.40, insight: 0.20, attachment: 0.45, repression: 0.00 },
    workDamage: { type: 'red', min: 10, max: 22 },
    maxBoxes: 24,
    qliphoth: { counter: 2, maxCounter: 2 },
    canBreach: true,
    onKillGetsStronger: true,
    breach: {
      hp: 950,
      resistances: { red: 0.5, white: 1.0, black: 0.7, pale: 1.3 },
      damage: 28,
      damageType: 'red',
      skills: [
        { name: 'Devouring Maw', damage: 42, type: 'red', cooldown: 5, range: 'single' },
        { name: 'Howl of the Predator', damage: 0, type: 'red', cooldown: 9, range: 'room' },
        { name: 'Relentless Chase', damage: 26, type: 'red', cooldown: 4, range: 'single' },
      ],
    },
    gift: {
      id: 'cobalt_scar_gift',
      name: 'Cobalt Scar',
      description: 'A permanent wound that never heals.',
      chance: 0.35,
      onBreach: false,
    },
  }),
];

// Utility function to get an abnormality by ID
export function getAbnormalityById(id: string): Abnormality | undefined {
  return abnormalities.find(ab => ab.id === id);
}

// Utility function to get abnormalities by risk level
export function getAbnormalitiesByRisk(risk: string): Abnormality[] {
  return abnormalities.filter(ab => ab.risk === risk);
}

// Utility function to get all abnormalities that can breach
export function getBreachingAbnormalities(): Abnormality[] {
  return abnormalities.filter(ab => ab.canBreach);
}

// Utility function to get all ALEPH abnormalities
export function getAlephAbnormalities(): Abnormality[] {
  return abnormalities.filter(ab => ab.risk === 'ALEPH');
}