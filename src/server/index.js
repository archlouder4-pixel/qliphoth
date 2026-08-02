// server/index.js – Full server with Reception, Exploration, and Department modes
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Reception state ──────────────────────────────────────────────────
const rooms = {};
const queue = [];

const RANK_GROUPS = [
  { name: 'Manager', minScore: 0 },
  { name: 'Professional', minScore: 401 },
  { name: 'Librarian', minScore: 801 },
  { name: 'Patron', minScore: 1201 },
];
function getRank(score) {
  for (let i = RANK_GROUPS.length - 1; i >= 0; i--) {
    if (score >= RANK_GROUPS[i].minScore) return RANK_GROUPS[i].name;
  }
  return RANK_GROUPS[0].name;
}

function rollCoin(power) {
  return Math.random() < 0.5 ? power : 1;
}

function clash(pP, eP, pC, eC) {
  let pt = rollCoin(pP), et = rollCoin(eP);
  for (let i = 1; i < Math.max(pC, eC); i++) {
    if (i < pC) pt += rollCoin(pP);
    if (i < eC) et += rollCoin(eP);
  }
  return { playerTotal: pt, enemyTotal: et };
}

function applyPassive(player, roomState, opponentKey) {
  const passive = player.transformationPassive;
  if (!passive) return;
  const opponent = roomState[opponentKey];
  if (!opponent) return;

  console.log(`[PASSIVE] Applying ${passive.name} for ${player.playerName}`);

  if (passive.mechanics && passive.mechanics.corrosionPerTurn) {
    const current = opponent.corrosionStacks || 0;
    const maxStacks = passive.mechanics.maxStacks || 5;
    const newStacks = Math.min(maxStacks, current + passive.mechanics.corrosionPerTurn);
    opponent.corrosionStacks = newStacks;
    const reduction = newStacks * (passive.mechanics.defReductionPerStack || 0.03);
    opponent.def = opponent.baseDef * (1 - reduction);
    console.log(`[PASSIVE] ${opponent.playerName} corrosion: ${current} -> ${newStacks}, def reduced by ${(reduction*100).toFixed(0)}%`);
  }

  if (passive.mechanics && passive.mechanics.healPercent) {
    const healAmount = Math.floor(player.atk * (passive.mechanics.healPercent || 0.05));
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    const currentBoost = player.damageBoostStacks || 0;
    const maxStacks = passive.mechanics.maxStacks || 5;
    player.damageBoostStacks = Math.min(maxStacks, currentBoost + (passive.mechanics.damageBoostPerTurn || 0.03));
    player.passiveStacks = player.damageBoostStacks;
    console.log(`[PASSIVE] ${player.playerName} healed ${healAmount}, damage boost stacks: ${player.damageBoostStacks}`);
  }
}

function resolveClash(state) {
  const p1Skill = state.p1.skills[state.p1SkillIdx];
  const p2Skill = state.p2.skills[state.p2SkillIdx];
  if (!p1Skill || !p2Skill) {
    console.error('resolveClash: missing skill', { p1Skill, p2Skill, idx1: state.p1SkillIdx, idx2: state.p2SkillIdx });
    return null;
  }

  const p1IsUltimate = p1Skill.isUltimate && state.p1.ultimateBar >= 100;
  const p2IsUltimate = p2Skill.isUltimate && state.p2.ultimateBar >= 100;

  if (p1IsUltimate) {
    state.p1.ultimateBar = 0;
    state.p1.passiveStacks = 0;
    if (state.p1.transformationTrigger === 'ultimate' && state.p1.transformedSkills && state.p1.transformedSkills.length > 0) {
      state.p1.transformationActive = true;
      state.p1.skills = state.p1.transformedSkills;
      state.p1.transformationTurnsLeft = state.p1.ultimateDuration || 8;
    } else {
      state.p1.transformationActive = true;
      state.p1.transformationTurnsLeft = 0;
    }
  }
  if (p2IsUltimate) {
    state.p2.ultimateBar = 0;
    state.p2.passiveStacks = 0;
    if (state.p2.transformationTrigger === 'ultimate' && state.p2.transformedSkills && state.p2.transformedSkills.length > 0) {
      state.p2.transformationActive = true;
      state.p2.skills = state.p2.transformedSkills;
      state.p2.transformationTurnsLeft = state.p2.ultimateDuration || 8;
    } else {
      state.p2.transformationActive = true;
      state.p2.transformationTurnsLeft = 0;
    }
  }

  const result = clash(p1Skill.power, p2Skill.power, p1Skill.coins, p2Skill.coins);
  const mult = 1.0;

  let p1Mult = 1.0, p2Mult = 1.0;
  if (state.p1.classCategory === 'Attacker') p1Mult += state.p1.classEffect;
  if (state.p2.classCategory === 'Attacker') p2Mult += state.p2.classEffect;
  if (state.p1.damageBoostStacks) p1Mult += state.p1.damageBoostStacks * 0.03;
  if (state.p2.damageBoostStacks) p2Mult += state.p2.damageBoostStacks * 0.03;

  const p1DefReduction = state.p1.corrosionStacks ? state.p1.corrosionStacks * 0.03 : 0;
  const p2DefReduction = state.p2.corrosionStacks ? state.p2.corrosionStacks * 0.03 : 0;
  const p1EffectiveDef = state.p1.def * (1 - p2DefReduction);
  const p2EffectiveDef = state.p2.def * (1 - p1DefReduction);

  let p1Dmg = 0, p2Dmg = 0, won = false;
  let gain = 0;

  if (result.playerTotal >= result.enemyTotal) {
    const diff = Math.max(1, result.playerTotal - result.enemyTotal + result.playerTotal / 4);
    p1Dmg = Math.max(1, Math.floor(Math.max(1, (state.p1.atk * (diff / 6) - p2EffectiveDef * 0.5) / 16) * mult * p1Mult * (0.85 + Math.random() * 0.3)));
    p1Dmg = Math.min(p1Dmg, 75);
    state.p2.hp = Math.max(0, state.p2.hp - p1Dmg);
    won = true;
    if (state.p1.hasUltimate) {
      gain = 0.0025 + Math.random() * 0.0275;
      state.p1.ultimateBar = Math.min(100, state.p1.ultimateBar + gain);
      console.log(`[ULT] ${state.p1.playerName} gains ${(gain*100).toFixed(1)}%, now ${state.p1.ultimateBar}%`);
    }
  } else {
    const diff = Math.max(1, result.enemyTotal - result.playerTotal + result.enemyTotal / 4);
    p2Dmg = Math.max(1, Math.floor(Math.max(1, (state.p2.atk * (diff / 6) - p1EffectiveDef * 0.5) / 16) * mult * p2Mult * (0.85 + Math.random() * 0.3)));
    p2Dmg = Math.min(p2Dmg, 75);
    state.p1.hp = Math.max(0, state.p1.hp - p2Dmg);
    won = false;
    if (state.p2.hasUltimate) {
      gain = 0.0025 + Math.random() * 0.0275;
      state.p2.ultimateBar = Math.min(100, state.p2.ultimateBar + gain);
      console.log(`[ULT] ${state.p2.playerName} gains ${(gain*100).toFixed(1)}%, now ${state.p2.ultimateBar}%`);
    }
  }

  if (p1Skill.type !== 'ego' && !state.p1.hasUltimate) {
    state.p1.sp = Math.min(100, state.p1.sp + 10);
  }
  if (p2Skill.type !== 'ego' && !state.p2.hasUltimate) {
    state.p2.sp = Math.min(100, state.p2.sp + 10);
  }

  return {
    clashResult: {
      p: result.playerTotal,
      e: result.enemyTotal,
      pName: p1Skill.name,
      eName: p2Skill.name,
      won,
      dmg: won ? p1Dmg : p2Dmg,
      mult,
      actorName: won ? state.p1.playerName : state.p2.playerName,
      ultimateGain: gain,
    },
    p1Dmg: won ? p1Dmg : 0,
    p2Dmg: won ? 0 : p2Dmg,
    won,
  };
}

// ===== Persistent leaderboard =====
const PLAYERS_FILE = path.join(__dirname, 'players.json');
function loadPlayers() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      const data = fs.readFileSync(PLAYERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) { console.error('Error loading players:', err); }
  return {};
}
function savePlayers(players) {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
  } catch (err) { console.error('Error saving players:', err); }
}
let players = loadPlayers();

function updatePlayerStats(userId, username, won, opponentId, opponentName, scoreChange, lifeChange) {
  if (!players[userId]) {
    players[userId] = {
      userId,
      username: username || 'Unknown',
      score: 1000,
      lives: 5,
      wins: 0,
      losses: 0,
      rank: 'Patron',
      matchHistory: [],
    };
  }
  const player = players[userId];
  player.username = username || player.username;
  player.score += scoreChange;
  player.lives += lifeChange;
  if (player.lives <= 0) player.lives = 5;
  if (won) player.wins += 1;
  else player.losses += 1;
  player.rank = getRank(player.score);
  player.matchHistory.unshift({
    opponent: opponentName || 'Unknown',
    opponentId: opponentId || 'unknown',
    result: won ? 'win' : 'loss',
    scoreChange,
    lifeChange,
    date: new Date().toISOString(),
  });
  if (player.matchHistory.length > 20) player.matchHistory = player.matchHistory.slice(0, 20);
  savePlayers(players);
  return player;
}

function getLeaderboard() {
  const list = Object.values(players);
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, 10).map(p => ({
    userId: p.userId,
    username: p.username,
    score: p.score,
    lives: p.lives,
    wins: p.wins,
    losses: p.losses,
    rank: p.rank,
  }));
}

// ─── Exploration mode state ──────────────────────────────────────────
const explorationRooms = {};
function broadcastExplorationRoom(roomId) {
  const room = explorationRooms[roomId];
  if (!room) return;
  io.to(roomId).emit('explorationStateUpdate', {
    identityStates: room.state.identityStates || [],
    enemies: room.state.enemies || [],
    turn: room.state.turn || 'player',
    activeIdentityIndex: room.state.activeIdentityIndex || 0,
    clashData: room.state.clashData || null,
    log: room.state.log || [],
  });
}

// ─── Department mode state ────────────────────────────────────────────
const departmentRooms = {};
function broadcastDepartmentRoom(roomId) {
  const room = departmentRooms[roomId];
  if (!room) return;
  io.to(roomId).emit('departmentStateUpdate', {
    facility: room.facility,
    players: room.players,
    combat: room.combat || null,
    voting: room.voting || null,
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Socket.IO ──────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // ── Reception events ────────────────────────────────────────────
  socket.on('getLeaderboard', () => {
    socket.emit('leaderboard', getLeaderboard());
  });

  socket.on('findMatch', (playerData) => {
    const opponentIdx = queue.findIndex(q => q.socketId !== socket.id);
    if (opponentIdx !== -1) {
      const opponent = queue[opponentIdx];
      queue.splice(opponentIdx, 1);
      const roomId = `room_${Date.now()}`;
      const p1Data = playerData;
      const p2Data = opponent.playerData;
      const p1Socket = socket;
      const p2Socket = io.sockets.sockets.get(opponent.socketId);
      if (!p2Socket) {
        socket.emit('error', { message: 'Opponent disconnected, try again.' });
        return;
      }

      p1Socket.playerIndex = 0;
      p1Socket.roomId = roomId;
      p2Socket.playerIndex = 1;
      p2Socket.roomId = roomId;

      p1Socket.join(roomId);
      p2Socket.join(roomId);
      rooms[roomId] = { players: [p1Socket.id, p2Socket.id], state: null };

      const gameState = {
        p1: {
          ...p1Data.stats,
          playerName: p1Data.playerName || 'Player 1',
          identityId: p1Data.identityId,
          equipment: { weaponId: p1Data.weaponId, armorId: p1Data.armorId, giftIds: p1Data.giftIds },
          baseSkills: p1Data.baseSkills || [],
          transformedSkills: p1Data.transformedSkills || [],
          skills: p1Data.baseSkills && p1Data.baseSkills.length > 0 ? p1Data.baseSkills : [],
          classCategory: p1Data.classCategory || 'Attacker',
          classEffect: p1Data.classEffect || 0,
          score: p1Data.stats?.score || 1000,
          lives: p1Data.stats?.lives || 5,
          userId: p1Socket.id,
          ultimateBar: 0,
          hasUltimate: p1Data.hasUltimate || false,
          transformationTrigger: p1Data.transformationTrigger || 'none',
          ultimateDuration: p1Data.ultimateDuration || 0,
          transformationActive: false,
          transformationTurnsLeft: p1Data.transformationTrigger === 'timer' ? (p1Data.ultimateDuration || 0) : 0,
          passiveStacks: 0,
          corrosionStacks: 0,
          damageBoostStacks: 0,
          transformationPassive: p1Data.transformationPassive || null,
          baseDef: p1Data.stats?.def || 0,
        },
        p2: {
          ...p2Data.stats,
          playerName: p2Data.playerName || 'Player 2',
          identityId: p2Data.identityId,
          equipment: { weaponId: p2Data.weaponId, armorId: p2Data.armorId, giftIds: p2Data.giftIds },
          baseSkills: p2Data.baseSkills || [],
          transformedSkills: p2Data.transformedSkills || [],
          skills: p2Data.baseSkills && p2Data.baseSkills.length > 0 ? p2Data.baseSkills : [],
          classCategory: p2Data.classCategory || 'Attacker',
          classEffect: p2Data.classEffect || 0,
          score: p2Data.stats?.score || 1000,
          lives: p2Data.stats?.lives || 5,
          userId: p2Socket.id,
          ultimateBar: 0,
          hasUltimate: p2Data.hasUltimate || false,
          transformationTrigger: p2Data.transformationTrigger || 'none',
          ultimateDuration: p2Data.ultimateDuration || 0,
          transformationActive: false,
          transformationTurnsLeft: p2Data.transformationTrigger === 'timer' ? (p2Data.ultimateDuration || 0) : 0,
          passiveStacks: 0,
          corrosionStacks: 0,
          damageBoostStacks: 0,
          transformationPassive: p2Data.transformationPassive || null,
          baseDef: p2Data.stats?.def || 0,
        },
        turn: 'p1',
        phase: 'p1Select',
        p1SkillIdx: null,
        p2SkillIdx: null,
        clashResult: null,
        winner: null,
        scoreChanges: { p1: 0, p2: 0 },
        lifeChanges: { p1: 0, p2: 0 },
        newRanks: { p1: 'Patron', p2: 'Patron' },
        p1UserId: p1Socket.id,
        p2UserId: p2Socket.id,
        p1Name: p1Data.playerName || 'Player 1',
        p2Name: p2Data.playerName || 'Player 2',
      };

      rooms[roomId].state = gameState;

      p1Socket.emit('roomJoined', { roomId, playerIndex: 0 });
      p2Socket.emit('roomJoined', { roomId, playerIndex: 1 });

      io.to(roomId).emit('gameState', gameState);
      io.to(roomId).emit('turn', { currentTurn: 'p1', phase: 'p1Select' });

      console.log(`[${roomId}] Match started: ${p1Data.playerName} vs ${p2Data.playerName}`);
    } else {
      queue.push({ socketId: socket.id, playerData });
      socket.emit('queued');
      console.log(`[QUEUE] Added ${socket.id}, queue length: ${queue.length}`);
    }
  });

  socket.on('cancelMatch', () => {
    const idx = queue.findIndex(q => q.socketId === socket.id);
    if (idx !== -1) {
      queue.splice(idx, 1);
      socket.emit('matchCancelled');
    } else {
      socket.emit('matchCancelled');
    }
  });

  socket.on('selectSkill', (skillIdx) => {
    const roomId = socket.roomId;
    if (!roomId) {
      console.error(`[${socket.id}] selectSkill: no roomId`);
      return;
    }
    const room = rooms[roomId];
    if (!room || !room.state) {
      console.error(`[${roomId}] selectSkill: room not found`);
      return;
    }
    const state = room.state;
    const playerIndex = socket.playerIndex;
    if (playerIndex === undefined) {
      console.error(`[${roomId}] selectSkill: playerIndex not set for ${socket.id}`);
      socket.emit('error', { message: 'Player index not set' });
      return;
    }
    const playerKey = playerIndex === 0 ? 'p1' : 'p2';

    if (state[`${playerKey}SkillIdx`] !== null) {
      console.log(`[${roomId}] ${playerKey} already selected, ignoring duplicate.`);
      return;
    }

    state[`${playerKey}SkillIdx`] = skillIdx;
    console.log(`[${roomId}] ${playerKey} selected skill ${skillIdx} (${state[playerKey].playerName})`);
    console.log(`[${roomId}] Current indices: p1=${state.p1SkillIdx}, p2=${state.p2SkillIdx}`);

    io.to(roomId).emit('gameState', state);

    if (state.p1SkillIdx !== null && state.p2SkillIdx !== null) {
      console.log(`[${roomId}] Both selected, resolving clash...`);
      state.phase = 'clash';
      io.to(roomId).emit('gameState', state);
      io.to(roomId).emit('turn', { currentTurn: state.turn, phase: state.phase });

      const result = resolveClash(state);
      if (!result) {
        console.error(`[${roomId}] resolveClash returned null`);
        state.p1SkillIdx = null;
        state.p2SkillIdx = null;
        state.phase = 'p1Select';
        state.clashResult = null;
        io.to(roomId).emit('gameState', state);
        io.to(roomId).emit('turn', { currentTurn: 'p1', phase: 'p1Select' });
        return;
      }

      state.clashResult = result.clashResult;

      if (state.p1.hp > 0 && state.p2.hp > 0) {
        [state.p1, state.p2].forEach((player, idx) => {
          const oppKey = idx === 0 ? 'p2' : 'p1';
          if (player.transformationTrigger === 'timer') {
            if (!player.transformationActive) {
              player.transformationTurnsLeft = Math.max(0, player.transformationTurnsLeft - 1);
              if (player.transformationTurnsLeft === 0) {
                player.transformationActive = true;
                player.transformationTurnsLeft = player.ultimateDuration || 10;
                if (player.transformedSkills && player.transformedSkills.length > 0) {
                  player.skills = player.transformedSkills;
                }
                player.passiveStacks = 0;
                console.log(`[${roomId}] ${player.playerName} transformed via timer!`);
              }
            } else {
              player.transformationTurnsLeft -= 1;
              if (player.transformationTurnsLeft <= 0) {
                player.transformationActive = false;
                if (player.baseSkills && player.baseSkills.length > 0) {
                  player.skills = player.baseSkills;
                }
                player.passiveStacks = 0;
                console.log(`[${roomId}] ${player.playerName} transformation expired`);
              } else {
                applyPassive(player, state, oppKey);
              }
            }
          } else if (player.transformationTrigger === 'ultimate' && player.transformationActive) {
            if (player.transformationTurnsLeft > 0) {
              player.transformationTurnsLeft -= 1;
              if (player.transformationTurnsLeft <= 0) {
                player.transformationActive = false;
                if (player.baseSkills && player.baseSkills.length > 0) {
                  player.skills = player.baseSkills;
                }
                player.passiveStacks = 0;
                console.log(`[${roomId}] ${player.playerName} ultimate transformation expired`);
              } else {
                applyPassive(player, state, oppKey);
              }
            }
          }
        });
      }

      if (state.p1.hp <= 0 || state.p2.hp <= 0) {
        const p1Won = state.p2.hp <= 0;
        state.winner = p1Won ? 'p1' : 'p2';
        const scoreChange = 20;
        const p1NewScore = state.p1.score + (p1Won ? scoreChange : -scoreChange);
        const p2NewScore = state.p2.score + (p1Won ? -scoreChange : scoreChange);
        const p1Lives = state.p1.lives - (p1Won ? 0 : 1);
        const p2Lives = state.p2.lives - (p1Won ? 1 : 0);
        const p1FinalLives = p1Lives <= 0 ? 5 : p1Lives;
        const p2FinalLives = p2Lives <= 0 ? 5 : p2Lives;
        const p1FinalScore = p1Lives <= 0 ? p1NewScore - 50 : p1NewScore;
        const p2FinalScore = p2Lives <= 0 ? p2NewScore - 50 : p2NewScore;

        state.scoreChanges = { p1: p1FinalScore - state.p1.score, p2: p2FinalScore - state.p2.score };
        state.lifeChanges = { p1: p1FinalLives - state.p1.lives, p2: p2FinalLives - state.p2.lives };
        state.newRanks = {
          p1: getRank(p1FinalScore),
          p2: getRank(p2FinalScore),
        };
        console.log(`[${roomId}] Match end ranks: p1=${state.newRanks.p1}, p2=${state.newRanks.p2}`);

        updatePlayerStats(
          state.p1UserId,
          state.p1Name,
          p1Won,
          state.p2UserId,
          state.p2Name,
          state.scoreChanges.p1,
          state.lifeChanges.p1
        );
        updatePlayerStats(
          state.p2UserId,
          state.p2Name,
          !p1Won,
          state.p1UserId,
          state.p1Name,
          state.scoreChanges.p2,
          state.lifeChanges.p2
        );

        io.to(roomId).emit('matchResult', {
          winner: state.winner,
          scoreChanges: state.scoreChanges,
          lifeChanges: state.lifeChanges,
          newRanks: state.newRanks,
        });
        io.emit('leaderboard', getLeaderboard());
        delete rooms[roomId];
        console.log(`[${roomId}] Match ended, winner: ${state.winner}`);
        return;
      }

      state.p1SkillIdx = null;
      state.p2SkillIdx = null;
      state.turn = state.turn === 'p1' ? 'p2' : 'p1';
      state.phase = state.turn === 'p1' ? 'p1Select' : 'p2Select';

      io.to(roomId).emit('gameState', state);
      io.to(roomId).emit('turn', { currentTurn: state.turn, phase: state.phase });
      console.log(`[${roomId}] Clash resolved, turn: ${state.turn}, phase: ${state.phase}`);

      // Clear clash result to avoid re‑broadcast
      state.clashResult = null;
    }
  });

  socket.on('disconnect', () => {
    const idx = queue.findIndex(q => q.socketId === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const idx2 = room.players.indexOf(socket.id);
      if (idx2 !== -1) {
        room.players.splice(idx2, 1);
        if (room.players.length === 1) {
          const remainingSocketId = room.players[0];
          const remainingSocket = io.sockets.sockets.get(remainingSocketId);
          const winnerKey = remainingSocket && remainingSocket.playerIndex === 0 ? 'p1' : 'p2';
          const loserKey = winnerKey === 'p1' ? 'p2' : 'p1';
          const state = room.state;

          if (state) {
            const scoreChange = 20;
            const winner = state[winnerKey];
            const loser = state[loserKey];
            const winnerNewScore = winner.score + scoreChange;
            const loserNewScore = loser.score - scoreChange;
            const loserLives = loser.lives - 1;
            const loserFinalLives = loserLives <= 0 ? 5 : loserLives;
            const loserFinalScore = loserLives <= 0 ? loserNewScore - 50 : loserNewScore;

            const scoreChanges = {
              [winnerKey]: winnerNewScore - winner.score,
              [loserKey]: loserFinalScore - loser.score,
            };
            const lifeChanges = {
              [winnerKey]: 0,
              [loserKey]: loserFinalLives - loser.lives,
            };
            const newRanks = {
              [winnerKey]: getRank(winnerNewScore),
              [loserKey]: getRank(loserFinalScore),
            };

            updatePlayerStats(
              state[`${winnerKey}UserId`],
              state[`${winnerKey}Name`],
              true,
              state[`${loserKey}UserId`],
              state[`${loserKey}Name`],
              scoreChanges[winnerKey],
              lifeChanges[winnerKey]
            );
            updatePlayerStats(
              state[`${loserKey}UserId`],
              state[`${loserKey}Name`],
              false,
              state[`${winnerKey}UserId`],
              state[`${winnerKey}Name`],
              scoreChanges[loserKey],
              lifeChanges[loserKey]
            );

            io.to(roomId).emit('matchResult', {
              winner: winnerKey,
              forfeit: true,
              scoreChanges,
              lifeChanges,
              newRanks,
            });
            io.emit('leaderboard', getLeaderboard());
          } else {
            io.to(roomId).emit('matchResult', { winner: winnerKey, forfeit: true });
          }
          delete rooms[roomId];
        } else {
          delete rooms[roomId];
        }
      }
    }

    // ── Exploration cleanup ──────────────────────────────────────────
    for (const [rid, expRoom] of Object.entries(explorationRooms)) {
      const playerIdx = expRoom.players.findIndex(p => p.id === socket.id);
      if (playerIdx !== -1) {
        expRoom.players.splice(playerIdx, 1);
        if (expRoom.players.length === 0) {
          delete explorationRooms[rid];
        } else {
          io.to(rid).emit('explorationRoomJoined', {
            roomId: rid,
            players: expRoom.players,
            place: expRoom.placeId ? { id: expRoom.placeId } : null,
          });
        }
        break;
      }
    }

    // ── Department cleanup & disband on host disconnect ────────────
    for (const [rid, deptRoom] of Object.entries(departmentRooms)) {
      if (deptRoom.hostId === socket.id) {
        io.to(rid).emit('departmentRoomDisbanded');
        delete departmentRooms[rid];
        break;
      }
      const playerIdx = deptRoom.players.findIndex(p => p.id === socket.id);
      if (playerIdx !== -1) {
        deptRoom.players.splice(playerIdx, 1);
        if (deptRoom.players.length === 0) {
          delete departmentRooms[rid];
        } else {
          broadcastDepartmentRoom(rid);
        }
        break;
      }
    }

    delete socket.roomId;
    delete socket.playerIndex;
    console.log(`Player disconnected: ${socket.id}`);
  });

  // ── Exploration events ──────────────────────────────────────────

  socket.on('createExplorationRoom', ({ placeId, playerName, identityData }) => {
    const roomId = generateRoomId();
    const player = { id: socket.id, name: playerName, identityData };
    explorationRooms[roomId] = {
      placeId: null,
      players: [player],
      hostId: socket.id,
      state: {
        identityStates: [],
        enemies: [],
        turn: 'player',
        activeIdentityIndex: 0,
        clashData: null,
        log: [],
        phase: 'lobby',
      },
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = 0;
    socket.emit('explorationRoomCreated', {
      roomId,
      place: null,
      players: [player],
      isHost: true,
    });
  });

  socket.on('joinExplorationRoom', ({ roomId, playerName, identityData }) => {
    const room = explorationRooms[roomId];
    if (!room) {
      socket.emit('explorationError', { message: 'Room not found' });
      return;
    }
    if (room.players.length >= 3) {
      socket.emit('explorationError', { message: 'Room is full' });
      return;
    }
    const player = { id: socket.id, name: playerName, identityData };
    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = room.players.length - 1;
    io.to(roomId).emit('explorationRoomJoined', {
      roomId,
      players: room.players,
      place: room.placeId ? { id: room.placeId } : null,
      isHost: false,
    });
  });

  socket.on('startExploration', ({ roomId, placeId, difficulty }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('explorationError', { message: 'Only the host can start exploration.' });
      return;
    }
    room.placeId = placeId;
    room.difficulty = difficulty;
    // Build identity states from stored identityData
    let identityStates = room.players.map(p => p.identityData).filter(Boolean);
    // Ensure each identityState has all required fields
    identityStates = identityStates.map((state, index) => ({
      ...state,
      isActive: index === 0,
      hp: state.hp || 100,
      maxHp: state.maxHp || 100,
      sp: state.sp || 50,
      maxSp: state.maxSp || 100,
      ultimate: state.ultimate || 0,
      shield: state.shield || 0,
      transformationActive: false,
      transformationTurnsLeft: 0,
      transformedSkills: [],
      resolveStacks: 0,
      witherStacks: 0,
      bleedStacks: 0,
      attackerBuffTurns: 0,
    }));
    room.state.identityStates = identityStates;
    room.state.log = [`🗺️ Exploring: ${placeId} (${difficulty})`];
    io.to(roomId).emit('explorationStarted', {
      placeId,
      difficulty,
      identityStates,
      enemies: [], // enemies will be generated client‑side based on place + difficulty
      log: room.state.log,
    });
  });

  socket.on('explorationStateUpdate', ({ roomId, state }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    room.state = state;
    broadcastExplorationRoom(roomId);
  });

  socket.on('explorationAction', ({ roomId, playerId, action, selectedSkillIndex, selectedEnemyIndex }) => {
    // Client processes action; server just syncs state via explorationStateUpdate
  });

  socket.on('explorationFinished', ({ roomId, score }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('explorationFinished', { score });
    delete explorationRooms[roomId];
  });

  socket.on('explorationDefeat', ({ roomId }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('explorationDefeat');
    delete explorationRooms[roomId];
  });

  socket.on('disbandExplorationRoom', ({ roomId }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('explorationError', { message: 'Only the host can disband.' });
      return;
    }
    io.to(roomId).emit('explorationDisbanded');
    delete explorationRooms[roomId];
  });

  socket.on('leaveExplorationRoom', ({ roomId }) => {
    const room = explorationRooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      delete explorationRooms[roomId];
    } else {
      io.to(roomId).emit('explorationRoomJoined', {
        roomId,
        players: room.players,
        place: room.placeId ? { id: room.placeId } : null,
      });
    }
    socket.leave(roomId);
    delete socket.roomId;
  });

  // ── Department events ────────────────────────────────────────────

  socket.on('createDepartmentRoom', ({ deptId, playerName, facility }) => {
    const roomId = generateRoomId();
    const player = { id: socket.id, name: playerName };
    departmentRooms[roomId] = {
      deptId,
      facility: { ...facility, isActive: true },
      players: [player],
      hostId: socket.id,
      combat: null,
      voting: null,
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('departmentRoomCreated', {
      roomId,
      facility: departmentRooms[roomId].facility,
      players: [player],
    });
  });

  socket.on('joinDepartmentRoom', ({ roomId, playerName }) => {
    const room = departmentRooms[roomId];
    if (!room) {
      socket.emit('departmentError', { message: 'Room not found' });
      return;
    }
    const player = { id: socket.id, name: playerName };
    room.players.push(player);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('departmentRoomJoined', {
      roomId,
      players: room.players,
      facility: room.facility,
    });
  });

  socket.on('disbandDepartmentRoom', ({ roomId }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('departmentRoomDisbanded');
    delete departmentRooms[roomId];
  });

  socket.on('departmentAction', ({ roomId, action, payload, playerId }) => {
    // Client broadcasts state updates separately; this is just for logging/forwarding.
  });

  socket.on('departmentStateUpdate', ({ roomId, facility, combat, voting }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    if (facility) room.facility = facility;
    if (combat !== undefined) room.combat = combat;
    if (voting !== undefined) room.voting = voting;
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentVoteUpdate', ({ roomId, yes, no, target, initiator }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    room.voting = { target, yes, no, initiator };
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentVoteResult', ({ roomId, passed, targetName, abnoId, initiator }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('departmentVoteResult', { passed, targetName, abnoId, initiator });
    room.voting = null;
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentCombatAction', ({ roomId, playerHp, enemyHp, clashData, turn, log }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    if (!room.combat) room.combat = {};
    room.combat.playerHp = playerHp;
    room.combat.enemyHp = enemyHp;
    room.combat.clashData = clashData;
    room.combat.turn = turn;
    if (log) room.combat.log = (room.combat.log || []).slice(-20).concat(log);
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentCombatFinish', ({ roomId, abnoId, won, initiator, enemyName }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('departmentCombatFinished', { abnoId, won, initiator, enemyName });
    room.combat = null;
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentCombatRetreat', ({ roomId }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    room.combat = null;
    broadcastDepartmentRoom(roomId);
  });

  socket.on('departmentOrdealTriggered', ({ roomId, ordeal }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    io.to(roomId).emit('departmentOrdealTriggered', ordeal);
  });

  socket.on('leaveDepartmentRoom', ({ roomId }) => {
    const room = departmentRooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      delete departmentRooms[roomId];
    } else {
      broadcastDepartmentRoom(roomId);
    }
    socket.leave(roomId);
    delete socket.roomId;
  });

  socket.on('departmentError', (msg) => {
    socket.emit('departmentError', msg);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Reception server running on port ${PORT}`);
  console.log(`Loaded ${Object.keys(players).length} players from storage`);
});
