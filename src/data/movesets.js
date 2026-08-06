const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const User = require('../models/User');
const Event = require('../models/Event');
const movesets = require('../movesets');

// ============================================
// CONSTANTS
// ============================================

const RANK_CHANCES = { ZAYIN: 50, TETH: 25, HE: 15, WAW: 8, ALEPH: 2 };
const RANK_EMOJIS = {
    ZAYIN: '<:zayin:1474861280836976721>',
    TETH: '<:teth:1474861321475592387>',
    HE: '<:he:1474861343466061906>',
    WAW: '<:waw:1474861364383191113>',
    ALEPH: '<:aleph:1474861385396649994>',
    WALKIRKSNACHT: '<:walkirksnacht:1477445829676499046>'
};

const PITY_THRESHOLD = 100;
const LUNACY_EMOJI = '<:lunacy:1474604281331187822>';
const WAL_EMOJI = '<:walkirksnacht:1477445829676499046>';

const TICKET_CHOICES = [
    { name: 'Extract x1', value: 'extract_1' },
    { name: 'Extract x10', value: 'extract_10' },
    { name: 'WAW Nomination', value: 'waw_ticket' },
    { name: 'ALEPH Nomination', value: 'aleph_ticket' },
    { name: 'Walkirksnacht', value: 'walkirksnacht_ticket' }
];

// ============================================
// VALIDATION
// ============================================

if (!movesets?.data || !Array.isArray(movesets.data)) {
    console.error('❌ [use.js] movesets.data is missing or not an array!');
}

const movesetPools = new Map();
const movesetNameMap = new Map();

if (movesets?.data) {
    for (const rank of ['ZAYIN', 'TETH', 'HE', 'WAW', 'ALEPH', 'WALKIRKSNACHT']) {
        movesetPools.set(rank, movesets.data.filter(m => m.rank === rank));
    }
    movesetPools.set('default', movesets.data.filter(m => m.rank !== 'WALKIRKSNACHT'));
    
    for (const move of movesets.data) {
        movesetNameMap.set(move.name.toLowerCase(), move);
    }
}

// ============================================
// HELPERS
// ============================================

function RollRank(pityCount) {
    if (pityCount >= PITY_THRESHOLD) return 'ALEPH';
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [rank, chance] of Object.entries(RANK_CHANCES)) {
        cumulative += chance;
        if (rand < cumulative) return rank;
    }
    return 'ZAYIN';
}

function ComputeExtractions(amount, pity, collection) {
    const results = [];
    let refundTotal = 0;
    let newCodes = "";
    let currentPity = pity;
    const newCollection = [...(collection || [])];
    let newItemsCount = 0;

    for (let i = 0; i < amount; i++) {
        currentPity++;
        let rolledRank = RollRank(currentPity);
        if (rolledRank === 'ALEPH') currentPity = 0;

        let pool = movesetPools.get(rolledRank);
        if (!pool?.length) pool = movesetPools.get('default');
        if (!pool?.length) continue;

        const random = pool[Math.floor(Math.random() * pool.length)];
        const rankEmoji = RANK_EMOJIS[random.rank] || '❓';
        
        const correctName = random.name;
        const isNew = !newCollection.some(name => name.toLowerCase() === correctName.toLowerCase());

        if (isNew) {
            newCollection.push(correctName);
            newItemsCount++;
            results.push(`${rankEmoji} **${correctName}** (NEW!)`);
            if (random.code && random.code.length < 500) {
                newCodes += `\n**${correctName}**: \`${random.code}\``;
            }
        } else {
            refundTotal += 50;
            results.push(`${rankEmoji} **${correctName}** (Duplicate) ➔ +50 ${LUNACY_EMOJI}`);
        }
    }
    
    return { results, refundTotal, newCodes, newPity: currentPity, newCollection, newItemsCount };
}

// Helper to send a DM or fallback to a temp channel message
async function sendPrivateMessage(user, content, options = {}) {
    try {
        await user.send(content, options);
        return true;
    } catch (err) {
        console.log(`Could not DM ${user.tag}, sending fallback in channel.`);
        return false;
    }
}

// ============================================
// COMMAND (prefix only)
// ============================================

module.exports = {
    name: 'use',
    aliases: ['extract', 'nominate'],
    
    async execute(message, args, client) {
        // Delete the user's command message for privacy
        if (message.deletable) await message.delete().catch(() => {});

        // Helper to send a response (DM preferred, fallback to temp channel message)
        async function replyPrivate(content, options = {}) {
            const sent = await sendPrivateMessage(message.author, content, options);
            if (!sent) {
                const fallback = await message.channel.send({ content: `📬 ${message.author}, check your DMs! (Failed to DM you – enabling DMs first helps.)\n\n${content}`, ...options });
                setTimeout(() => fallback.delete().catch(() => {}), 15000);
            }
        }

        // Get ticket type from args (first argument)
        const ticketInput = args[0]?.toLowerCase();
        if (!ticketInput) {
            const ticketList = TICKET_CHOICES.map(t => `\`${t.value}\` → ${t.name}`).join('\n');
            await replyPrivate(`**🎫 Available Tickets**\n${ticketList}\n\nUsage: \`$use <ticket>\`\nExample: \`$use extract_1\``);
            return;
        }

        // Match ticket ID
        let ticketId = null;
        for (const choice of TICKET_CHOICES) {
            if (choice.value === ticketInput) {
                ticketId = choice.value;
                break;
            }
        }
        if (!ticketId) {
            await replyPrivate(`❌ Unknown ticket type. Use one of: ${TICKET_CHOICES.map(c => c.value).join(', ')}`);
            return;
        }

        // Fetch user data
        let userData = await User.findOne({ userId: message.author.id }).maxTimeMS(5000);
        if (!userData) {
            await replyPrivate("❌ No profile found. Use `$start` first.");
            return;
        }

        if (!userData.tickets) userData.tickets = [];
        if (!userData.collection) userData.collection = [];

        if (!userData.tickets.includes(ticketId)) {
            await replyPrivate(`❌ You don't have **${ticketId}** in your inventory! Buy one from \`$shop\` first.`);
            return;
        }

        // ─── WALKIRKSNACHT ──────────────────────────────────────────────
        if (ticketId === 'walkirksnacht_ticket') {
            const walEvent = await Event.findOne({ name: 'walkirksnacht' }).maxTimeMS(5000);
            if (!walEvent?.isActive) {
                await replyPrivate("❌ Walkirksnacht is not active. Wait for the red moon.");
                return;
            }

            const walPool = movesetPools.get('WALKIRKSNACHT');
            if (!walPool?.length) {
                await replyPrivate("❌ No Walkirksnacht movesets found.");
                return;
            }

            const random = walPool[Math.floor(Math.random() * walPool.length)];
            const correctName = random.name;
            const isNew = !userData.collection.some(name => name.toLowerCase() === correctName.toLowerCase());

            userData.tickets = userData.tickets.filter(t => t !== ticketId);
            if (isNew) {
                userData.collection.push(correctName);
            } else {
                userData.money = (userData.money || 0) + 400;
            }
            await userData.save();

            let resultText = `${WAL_EMOJI} **${correctName}** (${isNew ? 'NEW' : 'Duplicate'})`;
            if (!isNew) resultText += ` ➔ +400 ${LUNACY_EMOJI}`;

            const embed = new EmbedBuilder()
                .setTitle("🌕 Walkirksnacht Extraction")
                .setDescription(resultText)
                .setColor("#5e0a0a");

            if (isNew && random.code) {
                if (random.code.length < 1900) {
                    embed.addFields({ name: "📜 Code", value: `\`\`\`${random.code}\`\`\``, inline: false });
                    await replyPrivate({ embeds: [embed] });
                } else {
                    const buffer = Buffer.from(random.code, 'utf-8');
                    const file = new AttachmentBuilder(buffer, { name: `${correctName}.txt` });
                    await replyPrivate({ embeds: [embed], files: [file] });
                }
            } else {
                await replyPrivate({ embeds: [embed] });
            }
            return;
        }

        // ─── NOMINATION TICKETS (WAW / ALEPH) ───────────────────────────
        if (ticketId === 'waw_ticket' || ticketId === 'aleph_ticket') {
            const targetRank = ticketId === 'waw_ticket' ? 'WAW' : 'ALEPH';
            const choices = movesetPools.get(targetRank);

            if (!choices?.length) {
                await replyPrivate(`❌ No ${targetRank} movesets exist.`);
                return;
            }

            // Build a numbered list and send to user via DM
            let menuText = `**📂 ${targetRank} Nomination**\nReply with the number of the moveset you want.\n\n`;
            const nameList = choices.map((m, idx) => `${idx+1}. ${m.name}`);
            menuText += nameList.join('\n');
            menuText += `\n\n⏰ You have 60 seconds. Type \`cancel\` to abort.`;

            await replyPrivate(menuText);

            // Create a DM channel collector (since we're already in DM if send succeeded, but we need to listen for the user's reply in DM)
            // However, the user might reply in the channel if DMs are closed. We'll collect from both.
            const filter = (m) => m.author.id === message.author.id;
            let collectedMessage;

            // Give priority to DM, but also listen in the original channel for fallback
            const dmChannel = await message.author.createDM().catch(() => null);
            if (dmChannel) {
                try {
                    collectedMessage = await dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                        .then(collected => collected.first())
                        .catch(() => null);
                } catch(e) {}
            }
            if (!collectedMessage) {
                // Fallback: listen in the original channel
                try {
                    collectedMessage = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                        .then(collected => collected.first())
                        .catch(() => null);
                } catch(e) {}
            }

            if (!collectedMessage) {
                await replyPrivate("⏰ Nomination timed out. Ticket not consumed.");
                return;
            }

            const replyContent = collectedMessage.content.toLowerCase();
            if (replyContent === 'cancel') {
                await replyPrivate("❌ Nomination cancelled. Ticket not consumed.");
                if (collectedMessage.deletable) await collectedMessage.delete().catch(() => {});
                return;
            }

            const choiceNum = parseInt(replyContent);
            if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > choices.length) {
                await replyPrivate(`❌ Invalid number. Please choose between 1 and ${choices.length}. Ticket not consumed.`);
                if (collectedMessage.deletable) await collectedMessage.delete().catch(() => {});
                return;
            }

            const selected = choices[choiceNum - 1];
            if (!selected) {
                await replyPrivate("❌ Moveset not found. Ticket not consumed.");
                return;
            }

            // Delete the user's choice message for cleanliness
            if (collectedMessage.deletable) await collectedMessage.delete().catch(() => {});

            // Refresh user data in case it changed during menu
            const freshUser = await User.findOne({ userId: message.author.id });
            if (!freshUser) {
                await replyPrivate("❌ User data not found.");
                return;
            }
            if (!freshUser.tickets) freshUser.tickets = [];
            if (!freshUser.collection) freshUser.collection = [];

            const correctName = selected.name;
            const isNew = !freshUser.collection.some(name => name.toLowerCase() === correctName.toLowerCase());

            freshUser.tickets = freshUser.tickets.filter(t => t !== ticketId);
            if (isNew) {
                freshUser.collection.push(correctName);
            } else {
                freshUser.money = (freshUser.money || 0) + 250;
            }
            await freshUser.save();

            if (!isNew) {
                await replyPrivate(`♻️ **${correctName}** already owned. Ticket consumed +250 ${LUNACY_EMOJI} refunded.`);
            } else {
                if (selected.code && selected.code.length > 1900) {
                    const buffer = Buffer.from(selected.code, 'utf-8');
                    const file = new AttachmentBuilder(buffer, { name: `${correctName}.txt` });
                    await replyPrivate({ content: `✅ **Extracted:** ${correctName}\n*Code attached.*`, files: [file] });
                } else if (selected.code) {
                    await replyPrivate(`✅ **Extracted:** ${correctName}\n\`\`\`${selected.code}\`\`\``);
                } else {
                    await replyPrivate(`✅ **Extracted:** ${correctName}`);
                }
            }
            return;
        }

        // ─── STANDARD EXTRACTIONS (1x or 10x) ───────────────────────────
        if (ticketId === 'extract_1' || ticketId === 'extract_10') {
            const amount = ticketId === 'extract_10' ? 10 : 1;
            const pity = userData.pityCount || 0;
            const collection = userData.collection || [];

            const { results, refundTotal, newCodes, newPity, newCollection } = ComputeExtractions(amount, pity, collection);

            userData.tickets = userData.tickets.filter(t => t !== ticketId);
            userData.pityCount = newPity;
            userData.collection = newCollection;
            userData.money = (userData.money || 0) + refundTotal;

            await userData.save();

            let description = results.join('\n');
            if (description.length > 4000) {
                description = description.slice(0, 3950) + '\n... (truncated)';
            }

            const embed = new EmbedBuilder()
                .setTitle(`🚀 Extraction Results (${amount}x)`)
                .setDescription(description)
                .setColor("#dec18b")
                .setFooter({ text: `Pity: ${newPity}/${PITY_THRESHOLD} | Refund: ${refundTotal} Lunacy` });

            if (newCodes) {
                embed.addFields({ name: "📜 New Codes", value: newCodes.slice(0, 1024), inline: false });
            }

            await replyPrivate({ embeds: [embed] });
            return;
        }

        await replyPrivate("❌ Unknown ticket type.");
    }
};