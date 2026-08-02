// src/data/explorationPlaces.ts
import { ExplorationPlace } from '../types/exploration';

export const explorationPlaces: ExplorationPlace[] = [
  // ---- Black Silence ----
  {
    id: "black_silence",
    name: "Black Silence – The Empty Mask",
    description: "The workshop of Roland, the Black Silence. The silence is deafening as you step into his domain.",
    difficulty: "Very Hard",
    maxMembers: 10,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["black_silence_recollection", "black_silence_recollection"],
        description: "Recollections of the Black Silence's past attacks manifest as phantoms.",
        rewards: { lunacy: { min: 130, max: 220 }, exp: { min: 80, max: 140 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["black_silence_fury", "black_silence_recollection"],
        description: "The fury of the Black Silence lashes out as more memories surface.",
        rewards: { lunacy: { min: 200, max: 350 }, exp: { min: 130, max: 220 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["roland_black_silence"],
        description: "**Roland, the Black Silence**, dons his mask and draws Furioso!",
        rewards: { lunacy: { min: 1200, max: 2500 }, exp: { min: 700, max: 1200 } }
      }
    ]
  },
  // ---- District 20 T Corp ----
  {
    id: "district20_tcorp",
    name: "District 20 – T Corp",
    description: "The clockwork district where time flows strangely. T Corp's singularity manipulates temporal fields. Prepare for disorienting fights.",
    difficulty: "Very Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["tcorp_class2_staff", "tcorp_class2_staff"],
        description: "Two T Corp Class 2 Collection Staff block your path. Their stopwatches tick ominously.",
        rewards: { lunacy: { min: 60, max: 120 }, exp: { min: 40, max: 70 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["tcorp_class3_collector", "aggressive_yurodiviy"],
        description: "A Class 3 Collector coordinates with an aggressive Yurodiviy. The air grows tense.",
        rewards: { lunacy: { min: 100, max: 180 }, exp: { min: 60, max: 100 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["quick_witted_yurodiviy", "tcorp_class2_staff"],
        description: "A quick-witted Yurodiviy taunts you while a T Corp staff member flanks your party.",
        rewards: { lunacy: { min: 140, max: 220 }, exp: { min: 80, max: 130 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["time_ripper"],
        description: "**The Time Ripper** emerges from a temporal rift! Defeat it to proceed.",
        rewards: { lunacy: { min: 350, max: 550 }, exp: { min: 180, max: 280 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["temporal_aberration"],
        description: "⚠️ **The temporal instability reaches a peak! An ALEPH abnormality breaks through the rift!** ⚠️",
        rewards: { lunacy: { min: 800, max: 1500 }, exp: { min: 400, max: 700 } }
      }
    ]
  },
  // ---- Hook Office ----
  {
    id: "hook_office",
    name: "Hook Office – Fishing Industry",
    description: "A cold, damp warehouse where Hook Office operates. Fishing equipment hangs from every wall, and the smell of fish permeates the air.",
    difficulty: "Easy",
    maxMembers: 7,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["hook_worker", "hook_worker"],
        description: "Two Hook Office workers brandish harpoons and fish hooks.",
        rewards: { lunacy: { min: 25, max: 50 }, exp: { min: 18, max: 35 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["hook_foreman", "hook_worker"],
        description: "A Foreman cracks a fishing line whip as a worker charges forward.",
        rewards: { lunacy: { min: 40, max: 75 }, exp: { min: 25, max: 45 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "TETH",
        enemies: ["hook_office_director"],
        description: "**The Hook Office Director** reels in his catch – you!",
        rewards: { lunacy: { min: 120, max: 200 }, exp: { min: 70, max: 120 } }
      }
    ]
  },
  // ---- Index ----
  {
    id: "index",
    name: "The Index – Prophets of the Will",
    description: "The mysterious Index headquarters. Strange prescripts flutter in the wind, and cultists chant in the distance.",
    difficulty: "Very Hard",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["index_proselyte", "index_proselyte"],
        description: "Two Index Proselytes recite their prescripts before attacking.",
        rewards: { lunacy: { min: 80, max: 150 }, exp: { min: 50, max: 85 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["index_weaver", "index_proselyte"],
        description: "A Weaver of the Index directs a Proselyte to follow the prescripts.",
        rewards: { lunacy: { min: 130, max: 240 }, exp: { min: 80, max: 140 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["index_herald", "index_weaver"],
        description: "A Herald of the Index leads a Weaver in a coordinated assault.",
        rewards: { lunacy: { min: 180, max: 320 }, exp: { min: 110, max: 190 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["index_proxy"],
        description: "**The Proxy of the Index** descends, prescripts glowing with otherworldly power!",
        rewards: { lunacy: { min: 600, max: 1000 }, exp: { min: 350, max: 550 } }
      }
    ]
  },
  // ---- K Corp Plantation ----
  {
    id: "kcorp_plantation",
    name: "K Corp Plantation - 'The Regenerating Fields'",
    description: "Endless fields of glowing blue plants stretch across K Corp's plantation. The air is thick with regenerative enzymes. Every cut heals instantly, but the workers here have become something far worse than human.",
    difficulty: "Very Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["kcorp_worker", "kcorp_worker"],
        description: "Two plantation workers approach with vacant stares. Their skin glows faintly blue as their bodies constantly regenerate.",
        rewards: { lunacy: { min: 60, max: 120 }, exp: { min: 40, max: 70 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["kcorp_supervisor", "kcorp_worker"],
        description: "A K Corp Supervisor barks orders while a worker charges forward, its body knitting back together even as you strike it.",
        rewards: { lunacy: { min: 100, max: 180 }, exp: { min: 60, max: 100 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["kcorp_regenerator", "kcorp_harvester"],
        description: "A Regenerator pulses with healing energy while a Harvester drags massive claws through the field, tearing up the glowing plants.",
        rewards: { lunacy: { min: 140, max: 220 }, exp: { min: 80, max: 130 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["kcorp_overseer"],
        description: "**The K Corp Overseer** descends from a hovering platform. Its mechanical arm glows with concentrated regenerative fluid, ready to heal any wound instantly.",
        rewards: { lunacy: { min: 350, max: 550 }, exp: { min: 180, max: 280 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["kcorp_immortal_heart"],
        description: "⚠️ **The plantation trembles. The ground splits open, revealing a pulsing heart made entirely of regenerative cells. THE IMMORTAL HEART beats with a rhythm that mocks death itself.** ⚠️\n\nNo wound stays closed. No injury lasts. You must destroy it faster than it can heal.",
        rewards: { lunacy: { min: 800, max: 1500 }, exp: { min: 400, max: 700 } }
      }
    ]
  },
  // ---- L Corp Branch ----
  {
    id: "lcorp_branch",
    name: "L Corp Branch - 'Abnormality Overflow'",
    description: "An abandoned L Corp branch facility. The containment cells have long since failed, and abnormalities roam freely through the darkened corridors. The air hums with residual Enkephalin energy.",
    difficulty: "Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["lcorp_zayin", "lcorp_zayin"],
        description: "Two small abnormalities scurry through the broken containment cells. Their eyes glow with residual Enkephalin.",
        rewards: { lunacy: { min: 50, max: 100 }, exp: { min: 30, max: 60 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["lcorp_teth", "lcorp_zayin"],
        description: "A larger abnormality has made a nest in the main hall. Smaller creatures swarm around it.",
        rewards: { lunacy: { min: 90, max: 160 }, exp: { min: 50, max: 90 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["lcorp_he", "lcorp_teth"],
        description: "A HE-class abnormality blocks the path to the mainframe. Its presence warps the air around it.",
        rewards: { lunacy: { min: 130, max: 210 }, exp: { min: 70, max: 120 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["lcorp_waw"],
        description: "**The facility's WAW-class abnormality has broken free from its containment. Its multiple limbs twitch with barely contained rage.**",
        rewards: { lunacy: { min: 300, max: 500 }, exp: { min: 150, max: 250 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["lcorp_aleph"],
        description: "⚠️ **Deep within the facility, the ALEPH-class abnormality awakens. The lights flicker and die as it opens its eyes. You should not be here.** ⚠️",
        rewards: { lunacy: { min: 700, max: 1300 }, exp: { min: 350, max: 600 } }
      }
    ]
  },
  // ---- Liu Office ----
  {
    id: "liu_office",
    name: "Liu Office – Flames of War",
    description: "The burning headquarters of Liu Office. Heat waves distort your vision as flames roar around you.",
    difficulty: "Hard",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["liu_warrior", "liu_warrior"],
        description: "Two Liu Warriors ignite their weapons, ready to burn you to ash.",
        rewards: { lunacy: { min: 65, max: 120 }, exp: { min: 40, max: 70 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["liu_section_chief", "liu_warrior"],
        description: "A Section Chief commands a warrior to engulf the battlefield in flames.",
        rewards: { lunacy: { min: 110, max: 200 }, exp: { min: 70, max: 120 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["liu_xiao"],
        description: "**Xiao** of Liu Office unleashes her fiery wrath upon you!",
        rewards: { lunacy: { min: 350, max: 550 }, exp: { min: 200, max: 320 } }
      }
    ]
  },
  // ---- Molar Office ----
  {
    id: "molar_office",
    name: "Molar Office – Underwater Recovery",
    description: "The Molar Office specializes in underwater operations. The flooded facility echoes with dripping water.",
    difficulty: "Normal",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["molar_worker", "molar_worker"],
        description: "Two Molar Office workers adjust their diving gear, ready for a fight.",
        rewards: { lunacy: { min: 40, max: 75 }, exp: { min: 25, max: 45 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["molar_foreman", "molar_worker"],
        description: "A Foreman directs a worker to flank your position.",
        rewards: { lunacy: { min: 70, max: 130 }, exp: { min: 45, max: 75 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "HE",
        enemies: ["molar_olga"],
        description: "**Olga**, the leader of Molar Office, emerges from the depths!",
        rewards: { lunacy: { min: 200, max: 350 }, exp: { min: 120, max: 200 } }
      }
    ]
  },
  // ---- Pudding Town ----
  {
    id: "pudding_town",
    name: "Pudding Town - 'The Sweet Nightmare'",
    description: "A town made entirely of pudding. The buildings wobble, the streets are sticky, and the residents have been... assimilated. Every step sinks into the sweet, terrifying ground.",
    difficulty: "Normal",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["pudding_citizen", "pudding_citizen"],
        description: "Two pudding citizens wobble toward you. Their eyes are made of candied fruit, and their smiles never fade.",
        rewards: { lunacy: { min: 40, max: 80 }, exp: { min: 25, max: 50 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["pudding_chef", "pudding_citizen"],
        description: "The Pudding Chef wields a giant spoon, directing a citizen to attack while it prepares something... sweet.",
        rewards: { lunacy: { min: 70, max: 130 }, exp: { min: 40, max: 75 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["pudding_beast", "pudding_chef"],
        description: "A massive Pudding Beast rises from the town square, its body made of countless fused citizens. The Chef directs its movements.",
        rewards: { lunacy: { min: 110, max: 180 }, exp: { min: 60, max: 100 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["pudding_king"],
        description: "**The Pudding King sits atop a throne of solidified custard. Its crown drips caramel, and its eyes hold a terrifying, childlike glee.**",
        rewards: { lunacy: { min: 250, max: 400 }, exp: { min: 120, max: 200 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["pudding_god"],
        description: "⚠️ **The town quakes. The pudding rises. A colossal figure emerges from the center of town - THE PUDDING GOD, the source of all this sweetness, has awakened. It offers you a spoon and a smile.** ⚠️",
        rewards: { lunacy: { min: 600, max: 1000 }, exp: { min: 300, max: 500 } }
      }
    ]
  },
  // ---- Purple Tear ----
  {
    id: "purple_tear",
    name: "Purple Tear – The Color Fixer",
    description: "The domain of Iori, the Purple Tear. Space bends and twists around you, defying all logic.",
    difficulty: "Very Hard",
    maxMembers: 12,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["purple_tear_apprentice", "purple_tear_apprentice"],
        description: "Two apprentices of the Purple Tear wield spatial distortions against you.",
        rewards: { lunacy: { min: 100, max: 180 }, exp: { min: 65, max: 110 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["purple_tear_executor", "purple_tear_apprentice"],
        description: "An Executor manipulates space while an apprentice attacks from a pocket dimension.",
        rewards: { lunacy: { min: 160, max: 280 }, exp: { min: 100, max: 170 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["purple_tear_iori"],
        description: "**Iori, the Purple Tear**, tears through reality itself to face you!",
        rewards: { lunacy: { min: 800, max: 1500 }, exp: { min: 500, max: 800 } }
      }
    ]
  },
  // ---- Rats ----
  {
    id: "rats",
    name: "Rats – Backstreets Alley",
    description: "A dark alley in the backstreets where desperate Rats hunt for their next meal. The stench of garbage and despair fills the air.",
    difficulty: "Easy",
    maxMembers: 3,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["rat", "rat"],
        description: "Two desperate Rats armed with rusty pipes block your path.",
        rewards: { lunacy: { min: 20, max: 40 }, exp: { min: 15, max: 30 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["rat", "street_rat"],
        description: "A seasoned Street Rat leads another Rat in an ambush.",
        rewards: { lunacy: { min: 30, max: 60 }, exp: { min: 20, max: 40 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "ZAYIN",
        enemies: ["rat_king"],
        description: "**The Rat King** emerges from the sewers, commanding a swarm of rodents!",
        rewards: { lunacy: { min: 80, max: 150 }, exp: { min: 50, max: 90 } }
      }
    ]
  },
  // ---- R Corp Nest ----
  {
    id: "rcorp_nest",
    name: "R Corp Nest - 'The Hatchery'",
    description: "R Corp's cloning facility pulses with organic machinery. Rows of incubation pods line the walls, and the air smells of amniotic fluid. Something has gone terribly wrong.",
    difficulty: "Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["rcorp_clone", "rcorp_clone"],
        description: "Two freshly hatched clones stumble toward you, their movements jerky and uncoordinated.",
        rewards: { lunacy: { min: 50, max: 100 }, exp: { min: 30, max: 60 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["rcorp_elite_clone", "rcorp_clone"],
        description: "An elite clone barks orders while a standard clone follows its commands with mechanical precision.",
        rewards: { lunacy: { min: 90, max: 160 }, exp: { min: 50, max: 90 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["rcorp_hatchery_guard", "rcorp_elite_clone"],
        description: "A Hatchery Guard stands protectively before the incubation pods as an elite clone circles around behind you.",
        rewards: { lunacy: { min: 130, max: 210 }, exp: { min: 70, max: 120 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["rcorp_queen"],
        description: "**The R Corp Queen emerges from the largest incubation pod. She is the original from which all clones are made, and she is not pleased with her imperfect children.**",
        rewards: { lunacy: { min: 300, max: 500 }, exp: { min: 150, max: 250 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["rcorp_perfect_one"],
        description: "⚠️ **Deep within the hatchery, a pod marked 'PROJECT PERFECT' cracks open. THE PERFECT ONE steps out - a clone with no flaws, no weaknesses, and no mercy.** ⚠️",
        rewards: { lunacy: { min: 700, max: 1300 }, exp: { min: 350, max: 600 } }
      }
    ]
  },
  // ---- Red Mist ----
  {
    id: "red_mist",
    name: "Red Mist – The Legendary Fixer",
    description: "The memory of Kali, the Red Mist. Her presence alone makes your blood run cold.",
    difficulty: "Very Hard",
    maxMembers: 10,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["red_mist_memory", "red_mist_memory"],
        description: "Fragments of the Red Mist's memories manifest to test you.",
        rewards: { lunacy: { min: 120, max: 200 }, exp: { min: 75, max: 130 } }
      },
      {
        waveNumber: 2,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["kali_red_mist"],
        description: "**Kali, the Red Mist** stands before you, Great Split: Horizontal ready!",
        rewards: { lunacy: { min: 1000, max: 2000 }, exp: { min: 600, max: 1000 } }
      }
    ]
  },
  // ---- Shi Office ----
  {
    id: "shi_office",
    name: "Shi Office – Shadows of the East",
    description: "The mysterious eastern office hidden in the shadows. Whispers of assassination plots fill the air.",
    difficulty: "Hard",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["shi_assassin", "shi_assassin"],
        description: "Two Shi assassins emerge from the shadows, kunai in hand.",
        rewards: { lunacy: { min: 60, max: 110 }, exp: { min: 38, max: 65 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["shi_elite_assassin", "shi_assassin"],
        description: "An elite assassin coordinates with a junior to trap you in a pincer movement.",
        rewards: { lunacy: { min: 100, max: 190 }, exp: { min: 65, max: 110 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["shi_tenma"],
        description: "**Tenma** of Shi Office reveals himself, his blade thirsty for blood!",
        rewards: { lunacy: { min: 320, max: 520 }, exp: { min: 190, max: 300 } }
      }
    ]
  },
  // ---- Streetlight Office ----
  {
    id: "streetlight_office",
    name: "Streetlight Office – Neon District",
    description: "The neon-lit streets where Streetlight Office operates. Flickering lights cast long shadows.",
    difficulty: "Normal",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["streetlight_fixer", "streetlight_fixer"],
        description: "Two Streetlight Fixers emerge from the neon glow.",
        rewards: { lunacy: { min: 45, max: 85 }, exp: { min: 28, max: 50 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["streetlight_captain", "streetlight_fixer"],
        description: "A Captain barks orders while a Fixer executes them.",
        rewards: { lunacy: { min: 80, max: 150 }, exp: { min: 50, max: 85 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "HE",
        enemies: ["streetlight_pamela"],
        description: "**Pamela** of Streetlight Office steps into the light, ready for battle!",
        rewards: { lunacy: { min: 220, max: 380 }, exp: { min: 130, max: 220 } }
      }
    ]
  },
  // ---- U Corp Spiral ----
  {
    id: "ucorp_spiral",
    name: "U Corp Spiral - 'The Descending Staircase'",
    description: "An infinite staircase that descends into the depths of U Corp's underground facility. Each step feels heavier than the last. Something waits at the bottom.",
    difficulty: "Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["ucorp_sentinel", "ucorp_sentinel"],
        description: "Two mechanical sentinels guard the entrance to the spiral. Their eyes glow red in the darkness.",
        rewards: { lunacy: { min: 50, max: 100 }, exp: { min: 30, max: 60 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["ucorp_watcher", "ucorp_sentinel"],
        description: "A Watcher floats silently above the staircase while a Sentinel blocks the path forward.",
        rewards: { lunacy: { min: 90, max: 160 }, exp: { min: 50, max: 90 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["ucorp_spiral_knight", "ucorp_watcher"],
        description: "A Spiral Knight stands at a landing, its armor covered in spiral patterns. A Watcher hovers nearby.",
        rewards: { lunacy: { min: 130, max: 210 }, exp: { min: 70, max: 120 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["ucorp_depth_dweller"],
        description: "**The Depth Dweller emerges from the darkness below. Its multiple eyes have never seen the light, and it does not welcome intruders.**",
        rewards: { lunacy: { min: 300, max: 500 }, exp: { min: 150, max: 250 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["ucorp_spiral_king"],
        description: "⚠️ **At the bottom of the spiral sits a throne. Upon it, THE SPIRAL KING awaits. Its crown spirals infinitely, and its gaze promises an eternity of descent.** ⚠️",
        rewards: { lunacy: { min: 700, max: 1300 }, exp: { min: 350, max: 600 } }
      }
    ]
  },
  // ---- WARP Corp Train ----
  {
    id: "warp_corp_train",
    name: "WARP Corp Train - 'Mourning Express'",
    description: "A luxury WARP train that never arrived at its destination. The passengers have been trapped in an endless 5-second interval for decades. The walls pulse with distorted time, and something ancient stirs in the baggage car.",
    difficulty: "Very Hard",
    maxMembers: 4,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["warp_maid", "warp_server"],
        description: "A WARP Maid and a malfunctioning Server Unit block the dining car. Their silverware gleams under the flickering lights.",
        rewards: { lunacy: { min: 60, max: 120 }, exp: { min: 40, max: 70 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["warp_shrouded", "warp_collector"],
        description: "A Shrouded Passenger phases in and out of reality while a WARP Collector harvests temporal energy from the air around you.",
        rewards: { lunacy: { min: 100, max: 180 }, exp: { min: 60, max: 100 } }
      },
      {
        waveNumber: 3,
        isBoss: false,
        enemies: ["warp_chronos", "warp_passenger"],
        description: "The Chronos Engine pulses with unstable energy as Frozen Passengers reach out from the walls, creating a deadly temporal field.",
        rewards: { lunacy: { min: 140, max: 220 }, exp: { min: 80, max: 130 } }
      },
      {
        waveNumber: 4,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["warp_conductor"],
        description: "**The Timeless Conductor** emerges from the conductor's cabin! Its mask of frozen time cracks as it announces your final departure.",
        rewards: { lunacy: { min: 350, max: 550 }, exp: { min: 180, max: 280 } }
      },
      {
        waveNumber: 5,
        isBoss: true,
        bossRank: "ALEPH",
        enemies: ["warp_timeless_one"],
        description: "⚠️ **The train shudders violently. The walls begin to melt as a presence older than time itself makes itself known. THE TIMELESS ONE has arrived.** ⚠️\n\nIts form shifts between past, present, and future simultaneously. You feel your own timeline becoming unstable just by being near it.",
        rewards: { lunacy: { min: 800, max: 1500 }, exp: { min: 400, max: 700 } }
      }
    ]
  },
  // ---- Yun Office ----
  {
    id: "yun_office",
    name: "Yun’s Office – Martial Arts Dojo",
    description: "A traditional martial arts dojo. The scent of incense and determination permeates the air.",
    difficulty: "Normal",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["yun_office_fixer", "yun_office_fixer"],
        description: "Two Yun Office Fixers bow before attacking with martial precision.",
        rewards: { lunacy: { min: 35, max: 65 }, exp: { min: 22, max: 42 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["yun_office_elite", "yun_office_fixer"],
        description: "An elite Fixer coordinates with a junior to overwhelm you.",
        rewards: { lunacy: { min: 55, max: 100 }, exp: { min: 35, max: 60 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "TETH",
        enemies: ["yun_office_sal"],
        description: "**Sal**, the leader of Yun's Office, unleashes his fury!",
        rewards: { lunacy: { min: 150, max: 250 }, exp: { min: 90, max: 150 } }
      }
    ]
  },
  // ---- Zwei Office ----
  {
    id: "zwei_office",
    name: "Zwei Office – Iron Defense",
    description: "The fortified headquarters of Zwei Office, known for their impenetrable defenses and massive shields.",
    difficulty: "Hard",
    maxMembers: 8,
    minMembers: 1,
    waves: [
      {
        waveNumber: 1,
        isBoss: false,
        enemies: ["zwei_guard", "zwei_guard"],
        description: "Two Zwei Guards raise their shields, forming a wall of iron.",
        rewards: { lunacy: { min: 55, max: 100 }, exp: { min: 35, max: 60 } }
      },
      {
        waveNumber: 2,
        isBoss: false,
        enemies: ["zwei_captain", "zwei_guard"],
        description: "A Captain directs a Guard to hold the line while preparing a counter-attack.",
        rewards: { lunacy: { min: 90, max: 170 }, exp: { min: 60, max: 100 } }
      },
      {
        waveNumber: 3,
        isBoss: true,
        bossRank: "WAW",
        enemies: ["zwei_roland"],
        description: "**Roland** of Zwei Office steps forward, his shield gleaming with determination!",
        rewards: { lunacy: { min: 300, max: 500 }, exp: { min: 180, max: 280 } }
      }
    ]
  }
];