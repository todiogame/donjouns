const { ieCanUse } = require('../models/ItemEffectsClick');

class BotAI {
    constructor() {
        this.draftDelay = 500;
        this.dungeonActionDelay = 900;
        this.afterActionDelay = 650;
        this.postPickDelay = 1200;

        // Item buckets used across draft, combat, and sacrifices
        this.passiveExecute = new Set([
            'hammer', 'pickaxe', 'sacred_book', 'rat_lich', 'pest', 'slayer_shield',
            'lich_bane', 'golem_shield', 'lich_skull', 'lich_armor', 'red_torch',
            'blue_torch', 'rat_ring', 'fire_ring', 'ocean_ring', 'sorcerer_hat', 'chainsaw',
            'magic_ring', 'katana', '13_16', 'noob_cape', 'noob_hat', 'noob_amu'
        ]);

        this.passiveReduction = new Set([
            'dragon_blade', 'golem_heart', 'ice_ring', 'fire_armor',
            'fire_hammer', 'scuba', 'mage_armor'
        ]);

        // Active executes that break on use (prefer to save when damage is low)
        this.breakingActiveExec = new Set([
            'bard', 'glass_axe', 'bahn', 'totem', 'whip', 'boomerang',
            'midas', 'dragon_mask', 'shells', 'laser', 'pizza', 'axe'
        ]);
        // Passive executes that still break on use
        this.breakingPassiveExec = new Set(['noob_cape']);

        this.activeExecute = new Set([
            'bard', 'glass_axe', 'bahn', 'totem', 'whip', 'boomerang',
            'midas', 'dragon_mask', 'shells', 'pirate_pistol', 'mage_robe',
            'laser', 'pizza', 'eternity_leaf', 'axe'
        ]);

        this.survival = new Set(['fairy_potion', 'dragon_potion', 'noob_ring', 'aegis', 'mana_potion']);
        this.activeReduction = new Set(['ice_potion', 'dragon_shield']);
        this.escapeBoost = new Set(['noob_geta', 'noob_ring', 'tp']);
        this.escapePenalty = new Set(['monkey', 'ball', 'bow', 'slayer_belt', 'slayer_bike']);

        this.hpHeavy = new Set(['slayer_belt', 'ball', 'bow', 'heart', 'golem_shield', 'bard', 'dragon_shield', 'dragon_mask']);
        this.scoring = new Set(['monkey', 'golden_statue', 'midas']);
        this.delayTools = new Set(['wind_ring']);

        // Always-dangerous monsters (context-free)
        this.dangerousEffects = new Set([
            'SLEEPING_DRAGON', 'GLUTTONOUS_OOZE', 'RAT_RIDER', 'BIG_DISGUSTING_RAT'
        ]);

        // Items whose effects resolve after a dice animation (needs a longer wait)
        this.diceRollItems = new Set(['cake', 'box', 'dragon_shield', 'shells']);
    }

    shouldStop(bot, gameState) {
        if (!gameState || gameState.phase === "END") return true;
        if (!bot) return true;
        if (typeof bot.inDungeon === "function") return !bot.inDungeon();
        return bot.dead || bot.fled;
    }

    // Decide and trigger special monster actions (Kraken, Guardian Angel, Shapeshifter)
    handleSpecialMonster(bot, gameState) {
        const card = gameState.currentCard;
        if (!card?.specialUI) return false;
        const incoming = typeof card.damage === "number" ? card.damage : (card.calculateDamage ? card.calculateDamage() : 0);
        const usableItems = bot.stuff.filter(item => item.canBeUsed && !item.broken);
        const hasExecute = usableItems.some(i => this.passiveExecute.has(i.key) || this.activeExecute.has(i.key));

        // Kraken: always send it under on first appearance
        if (card.effect === "KRAKEN") {
            console.log(`Bot ${bot.name} sends Kraken under the dungeon`);
            gameState.specialEffect(bot.id, null);
            setTimeout(() => {
                if (bot.canPass && gameState.isMyTurn(bot.id) && gameState.noCurrentCard()) {
                    gameState.wantToPassTurn(bot.id);
                }
            }, this.afterActionDelay);
            return true;
        }

        // Guardian Angel: discard it if we would otherwise die, fight to earn Aegis if safe
        if (card.effect === "GUARDIAN_ANGEL") {
            const lethalHit = incoming >= bot.hp;
            const canTank = incoming < bot.hp;
            // If we cannot execute and the hit is lethal, discard instead of wasting reducers
            if (!hasExecute && lethalHit) {
                console.log(`Bot ${bot.name} discards Guardian Angel (no safe kill, incoming ${incoming} >= HP ${bot.hp})`);
                gameState.specialEffect(bot.id, null);
                setTimeout(() => {
                    if (bot.canPass && gameState.isMyTurn(bot.id) && gameState.noCurrentCard()) {
                        gameState.wantToPassTurn(bot.id);
                    }
                }, this.afterActionDelay);
                return true;
            }
            const hasAnswer = !!this.selectBestItem(bot, gameState);
            if (!canTank && !hasAnswer) {
                console.log(`Bot ${bot.name} discards Guardian Angel to avoid lethal damage`);
                gameState.specialEffect(bot.id, null);
                setTimeout(() => {
                    if (bot.canPass && gameState.isMyTurn(bot.id) && gameState.noCurrentCard()) {
                        gameState.wantToPassTurn(bot.id);
                    }
                }, this.afterActionDelay);
                return true;
            }
            // Otherwise keep the card to try earning Aegis
            card.specialUI = false;
            return false;
        }

        // Shapeshifter: pick a monster type we have tools against
        if (card.effect === "SHAPESHIFTER") {
            const type = this.pickBestShapeshifterType(bot, gameState);
            console.log(`Bot ${bot.name} sets Shapeshifter type to ${type}`);
            gameState.specialEffect(bot.id, type);
            return false; // Continue handling the fight
        }

        return false;
    }

    // ===== Draft Phase =====
    autoDraft(bot, gameController) {
        if (!bot.isBot || bot.selectedItemCardIndex !== -1) {
            return;
        }

        setTimeout(() => {
            const handSize = bot.hand.length;
            if (handSize === 0) return;

            const chosenIndex = this.pickDraftCardIndex(bot);
            console.log(`Bot ${bot.name} drafting card index ${chosenIndex}`);
            gameController.handleDraftSelection(bot.id, { cardIndex: chosenIndex });
        }, this.draftDelay);
    }

    pickDraftCardIndex(bot) {
        let bestIndex = 0;
        let bestScore = -Infinity;
        const colorCount = this.countColors(bot.stuff);

        bot.hand.forEach((item, idx) => {
            const score = this.evaluateDraftItem(item, colorCount);
            if (score > bestScore) {
                bestScore = score;
                bestIndex = idx;
            }
        });
        return bestIndex;
    }

    evaluateDraftItem(item, colorCount) {
        let score = 0;

        // Core value by role
        if (this.survival.has(item.key)) score += 120;
        if (this.passiveExecute.has(item.key)) score += 90;
        if (this.passiveReduction.has(item.key)) score += 70;
        if (this.activeExecute.has(item.key)) score += 65;
        if (this.activeReduction.has(item.key)) score += 55;
        if (this.delayTools.has(item.key)) score += 55;
        if (this.escapeBoost.has(item.key)) score += 35;
        if (this.hpHeavy.has(item.key)) score += 30;
        if (this.scoring.has(item.key)) score += 20;

        // Penalize escape-hostile gear if no boost yet
        if (this.escapePenalty.has(item.key)) score -= 12;

        // Panoply bonus: pick a third of a color
        if (item.color && colorCount[item.color] >= 2) score += 18;
        else if (item.color && colorCount[item.color] === 1) score += 6;

        // Tiebreaker randomness to avoid deterministic mirrors
        score += Math.random() * 2;
        return score;
    }

    countColors(items) {
        return items.reduce((acc, item) => {
            if (item.color) acc[item.color] = (acc[item.color] || 0) + 1;
            return acc;
        }, {});
    }

    processBotDraftTurns(gameController) {
        const bots = gameController.state.players.filter(p => p.isBot && p.selectedItemCardIndex === -1);
        bots.forEach(bot => this.autoDraft(bot, gameController));
    }

    // ===== Dungeon Phase =====
    autoPlayDungeon(bot, gameState, room) {
        if (!bot.isBot || !gameState.isMyTurn(bot.id) || this.shouldStop(bot, gameState)) {
            return;
        }

        setTimeout(() => {
            this.takeTurn(bot, gameState, room);
        }, this.dungeonActionDelay);
    }

    takeTurn(bot, gameState, room) {
        if (this.shouldStop(bot, gameState)) return;
        if (gameState.noCurrentCard()) {
            // Consider fleeing before drawing when low HP and ahead
            if (this.shouldEscapeBeforeDraw(bot, gameState)) {
                const escaped = this.attemptEscape(bot, gameState, room);
                if (escaped) return;
            }

            if (gameState.dungeon.length > 0) {
                console.log(`Bot ${bot.name} drawing a dungeon card`);
                gameState.pickDungeonCard(bot.id);
                setTimeout(() => this.handleCurrentCard(bot, gameState, room), this.postPickDelay);
            } else if (bot.canPass) {
                const result = gameState.wantToPassTurn(bot.id);
                if (result instanceof Promise) result.catch(err => console.error(`Bot ${bot.name} failed to pass turn:`, err));
            }
            return;
        }

        this.handleCurrentCard(bot, gameState, room);
    }

    shouldEscapeBeforeDraw(bot, gameState) {
        if (!gameState.canTryToEscape) return false;

        const scoreLead = this.computeScoreLead(bot, gameState);
        const remainingDeck = gameState.dungeon.length;
        const otherLiving = gameState.players.filter(p => p.id !== bot.id && !p.dead);
        const opponents = gameState.players.filter(p =>
            p.id !== bot.id &&
            typeof p.inDungeon === "function" &&
            p.inDungeon()
        );
        const myScore = this.computePlayerScore(bot);
        const fledPlayers = gameState.players.filter(p => p.fled);
        const bestFledScore = this.computeBestFledScore(gameState);
        const aheadOfEscapedPlayers = fledPlayers.length > 0 && myScore > bestFledScore;
        const weakestOpponentHP = opponents.length ? Math.min(...opponents.map(p => p.hp)) : 0;

        const hasSurvival = bot.stuff.some(item => !item.broken && this.survival.has(item.key));
        const hasReduction = bot.stuff.some(item => !item.broken &&
            (this.passiveReduction.has(item.key) || this.activeReduction.has(item.key))
        );
        const fragile = bot.hp <= Math.max(2, Math.ceil(bot.baseHP * 0.5));
        const bigRecentHit = bot.lastDamageTaken >= Math.max(2, bot.hp - 1);
        const lowHP = bot.hp <= 1 || (fragile && (bigRecentHit || (!hasSurvival && !hasReduction)));
        const medalRisk = bot.medals > 0 && bot.hp <= 2;

        // Escape to lock in a lead if opponents look weak or the dungeon is almost empty
        const shortDeck = remainingDeck <= 3;
        const scoreSafe = scoreLead > 0 && (scoreLead >= remainingDeck || (shortDeck && scoreLead >= opponents.length));
        const opponentsExhausted = opponents.length === 0 || weakestOpponentHP <= 2;
        const winningEscape = scoreSafe && (shortDeck || opponentsExhausted);

        // If every other player is dead, fleeing guarantees the win – stop risking extra draws.
        if (otherLiving.length === 0) {
            console.log(`Bot ${bot.name} escapes as sole survivor.`);
            return true;
        }

        if (aheadOfEscapedPlayers && opponents.length === 0) {
            console.log(`Bot ${bot.name} escapes to beat escaped leaderboard (${myScore} vs ${bestFledScore}).`);
            return true;
        }

        return lowHP || medalRisk || winningEscape;
    }

    attemptEscape(bot, gameState, room) {
        const { escapeRoll, escapeModifier } = gameState.wantToEscape(bot.id);
        if (!escapeRoll) return false;

        const total = escapeRoll + escapeModifier;
        console.log(`Bot ${bot.name} attempting escape with roll ${escapeRoll} (+${escapeModifier})`);

        setTimeout(() => {
            gameState.tryToEscape(bot.id, total);
            // If still alive and still the bot's turn, continue
            setTimeout(() => {
                if (gameState.isMyTurn(bot.id)) {
                    this.handleCurrentCard(bot, gameState, room);
                }
            }, this.afterActionDelay);
        }, 400);

        return true;
    }

    handleCurrentCard(bot, gameState, room) {
        if (this.shouldStop(bot, gameState)) return;
        if (!gameState.currentCard) {
            if (bot.canPass && gameState.isMyTurn(bot.id)) {
                const result = gameState.wantToPassTurn(bot.id);
                if (result instanceof Promise) result.catch(err => console.error(`Bot ${bot.name} failed to pass turn (empty):`, err));
            }
            return;
        }

        if (gameState.currentCard.specialUI) {
            const handled = this.handleSpecialMonster(bot, gameState);
            if (handled || !gameState.currentCard) return;
        }

        // Auto-fire any stored execute-before-next-monster effect
        if (gameState.canExecute && gameState.inFight() && gameState.isMyTurn(bot.id)) {
            console.log(`Bot ${bot.name} uses stored execute on ${gameState.currentCard.title}`);
            gameState.wantToExecuteNextMonster(bot.id);
            // After executing, state may change; schedule the next decision so the bot keeps playing
            setTimeout(() => {
                if (!this.shouldStop(bot, gameState) && gameState.isMyTurn(bot.id)) {
                    this.autoPlayDungeon(bot, gameState, room);
                }
            }, this.afterActionDelay);
            return;
        }

        if (gameState.inFight()) {
            this.handleMonster(bot, gameState, room);
        } else if (gameState.inEvent()) {
            this.handleEvent(bot, gameState, room);
        }
    }

    // ===== Combat =====
    handleMonster(bot, gameState, room) {
        if (this.shouldStop(bot, gameState)) return;
        const itemToUse = this.selectBestItem(bot, gameState);
        if (itemToUse) {
            let arg = null;
            if (itemToUse.key === 'hex') {
                arg = this.pickHexTarget(bot, gameState);
                if (arg) console.log(`Bot ${bot.name} targets card ${arg} with Hex`);
            } else if (itemToUse.key === 'wind_ring') {
                arg = this.pickWindRingPosition(bot, gameState);
                console.log(`Bot ${bot.name} sends monster to position ${arg} with Wind Ring`);
            }
            console.log(`Bot ${bot.name} using ${itemToUse.title} before damage`);
            gameState.wantToUseItem(bot.id, itemToUse.id, arg);
            const resolveDelay = this.getResolveDelay(itemToUse.key);
            setTimeout(() => this.handleMonsterAfterItem(bot, gameState, room), resolveDelay);
        } else {
            this.handleMonsterAfterItem(bot, gameState, room);
        }
    }

    computeItemScore(item, bot, context) {
        const { damage, lethal, heavyHit, dangerousEffect, remainingDungeon } = context;
        let score = 0;
        const key = item.key;
        const isPassiveExec = this.passiveExecute.has(key);
        const isActiveExec = this.activeExecute.has(key);
        const isSurvival = this.survival.has(key);
        const isReduction = this.passiveReduction.has(key) || this.activeReduction.has(key);
        const breakCost = item.hp || 0;
        const breaksOnUse = this.breakingActiveExec.has(key) || this.breakingPassiveExec.has(key);
        const isWindRing = key === 'wind_ring';
        const remaining = typeof remainingDungeon === "number" ? remainingDungeon : null;

        if (isPassiveExec) score += 110;
        if (isActiveExec) score += 80;
        if (isReduction) score += 70;
        if (isSurvival) score += 140;

        if (isWindRing) {
            const depthPenalty = remaining !== null && remaining <= 1 ? -35 : 0;
            score += depthPenalty;
            if (lethal) score += 140;
            else if (heavyHit || dangerousEffect) score += 95;
            else score += 35;
            if (!dangerousEffect && damage <= 1) score -= 100;
        }

        if (lethal) score += 60;
        else if (heavyHit) score += 35;
        if (dangerousEffect) score += 40;

        // Avoid wasting survival on non-lethal hits
        if (isSurvival && !lethal) score -= 150;

        // Active executes that cost more HP than the hit are wasteful
        if (isActiveExec && !lethal && !dangerousEffect) {
            if (damage <= 2) score -= 40;
            if (breakCost > damage) score -= 25 * Math.min(2, breakCost - damage);
        }
        // Even with dangerous effects, avoid breaking executions that cost as much or more than the hit when it's non-lethal
        if (isActiveExec && breaksOnUse && !lethal && !heavyHit && breakCost >= damage) {
            score -= 100;
        }
        // Bard-specific: it's too costly for tiny hits
        if (key === 'bard' && !lethal && damage <= 3) {
            score -= 140;
        }

        // Prefer executes that don't break on use, especially on small hits
        if (isActiveExec && !breaksOnUse) score += 20;
        if (isActiveExec && breaksOnUse && !lethal && damage <= 4) score -= 35;
        if (isPassiveExec && breaksOnUse && damage <= 2 && !dangerousEffect) score -= 60;

        // Save reducers when damage is small
        if (isReduction && !heavyHit && !dangerousEffect && !lethal) score -= 40;

        // Passive executes cost nothing
        if (isPassiveExec) score += 20;

        // Don't waste passive executes on tiny hits when we're healthy
        if (isPassiveExec && !lethal && !dangerousEffect && damage <= 2) {
            const veryHealthy = bot.hp >= Math.max(5, Math.ceil(bot.baseHP * 1.4));
            score -= veryHealthy ? 160 : 110;
        }

        // Cheap executes on low power monsters: slightly prefer saving unless dangerous
        if ((isPassiveExec || isActiveExec) && damage <= 2 && !dangerousEffect) score -= 10;

        return score;
    }

    getResolveDelay(itemKey) {
        // Extend delay for items that wait on a dice roll animation (playerRollDice waits 1000ms)
        const extra = this.diceRollItems.has(itemKey) ? 1100 : 0;
        return this.afterActionDelay + extra;
    }

    selectBestItem(bot, gameState) {
        if (!gameState.currentCard || !gameState.inFight()) return null;
        const monster = gameState.currentCard;
        const damage = monster.damage || monster.calculateDamage();
        const lethal = damage >= bot.hp;
        const heavyHit = damage >= Math.ceil(bot.hp * 0.6);
        const dangerousEffect = this.isDangerousEffect(monster, bot);
        const remainingDungeon = gameState.dungeon.length;

        // Don't spend anything on harmless monsters
        if (damage <= 0 && !dangerousEffect) {
            console.log(`Bot ${bot.name} skips items on harmless ${monster.title} (${damage} dmg)`);
            return null;
        }

        const usableItems = bot.stuff.filter(item => item.canBeUsed && !item.broken);
        if (!usableItems.length) return null;

        let best = null;
        let bestScore = 0;

        usableItems.forEach(item => {
            const score = this.computeItemScore(item, bot, { damage, lethal, heavyHit, dangerousEffect, remainingDungeon });
            if (score > bestScore) {
                bestScore = score;
                best = item;
            }
        });

        // If the best option is not meaningfully better than taking the hit, bail out
        // Avoid burning executes on harmless hits when very healthy
        const veryHealthy = bot.hp >= Math.max(5, Math.ceil(bot.baseHP * 1.6));
        const bestIsPassive = this.passiveExecute.has(best?.key);
        const bestIsActive = this.activeExecute.has(best?.key);
        const bestBreaks = this.breakingActiveExec.has(best?.key);
        const bestCostsHP = (best?.hp || 0) > 0;
        const bestHasCostlyUse = bestBreaks || bestCostsHP;
        if (veryHealthy && damage <= 2 && (bestIsPassive || bestIsActive) && bestHasCostlyUse) {
            bestScore -= 90; // only penalize when using up a costly execute
        }

        const safeToTank = damage <= Math.max(1, Math.floor(bot.hp * 0.45)) && !dangerousEffect && !lethal;
        if (safeToTank && bestScore < 70) {
            console.log(`Bot ${bot.name} chooses to tank ${damage} damage (best item score ${bestScore.toFixed(1)})`);
            return null;
        }

        return best;
    }

    handleMonsterAfterItem(bot, gameState, room) {
        if (this.shouldStop(bot, gameState)) return;
        if (!gameState.currentCard || !gameState.inFight()) {
            // If we queued an auto-execute for the next monster (e.g. boomerang), keep drawing instead of passing
            if (gameState.isMyTurn(bot.id) && gameState.nextMonsterCondition && gameState.nextMonsterAction && gameState.dungeon.length > 0) {
                console.log(`Bot ${bot.name} drawing to trigger queued execute`);
                setTimeout(() => {
                    gameState.pickDungeonCard(bot.id);
                    setTimeout(() => this.handleCurrentCard(bot, gameState, room), this.postPickDelay);
                }, this.afterActionDelay);
                return;
            }
            if (bot.canPass && gameState.isMyTurn(bot.id)) {
                const result = gameState.wantToPassTurn(bot.id);
                if (result instanceof Promise) result.catch(err => console.error(`Bot ${bot.name} failed to pass turn after execute:`, err));
            }
            return;
        }

        const monster = gameState.currentCard;
        let itemToDestroy = null;
        if (monster.effect === "GLUTTONOUS_OOZE") {
            const sacrifice = this.chooseSacrifice(bot);
            if (sacrifice) {
                itemToDestroy = sacrifice.id;
                console.log(`Bot ${bot.name} sacrificing ${sacrifice.title} to Ooze`);
            }
        }

        console.log(`Bot ${bot.name} taking damage from ${monster.title} (${monster.damage} dmg)`);
        gameState.faceMonster(bot.id, itemToDestroy);

        // Turn may already have passed after death/flee
        if (!gameState.isMyTurn(bot.id)) return;

        setTimeout(() => {
            if (bot.canPass && gameState.isMyTurn(bot.id)) {
                const result = gameState.wantToPassTurn(bot.id);
                if (result instanceof Promise) result.catch(err => console.error(`Bot ${bot.name} failed to pass turn after monster:`, err));
            } else if (gameState.inFight()) {
                this.handleCurrentCard(bot, gameState, room);
            }
        }, this.afterActionDelay);
    }

    pickBestShapeshifterType(bot, gameState) {
        const card = gameState.currentCard;
        const originalTypes = [...(card.types || [])];
        const candidateTypes = ["Dragon", "Demon", "Skeleton", "Golem", "Goblin", "Orc", "Rat", "Vampire", "Lich"];
        const remainingDungeon = gameState.dungeon.length;

        let bestType = "Goblin";
        let bestScore = -Infinity;

        candidateTypes.forEach(type => {
            card.types = [type];
            const damage = card.damage || card.calculateDamage();
            const lethal = damage >= bot.hp;
            const heavyHit = damage >= Math.ceil(bot.hp * 0.6);
            const dangerousEffect = this.isDangerousEffect(card, bot);

            let localBest = -Infinity;
            bot.stuff
                .filter(item => !item.broken && ieCanUse[item.key]?.(item, bot, gameState))
                .forEach(item => {
                    const score = this.computeItemScore(item, bot, { damage, lethal, heavyHit, dangerousEffect, remainingDungeon });
                    if (score > localBest) localBest = score;
                });

            // prefer types that enable an execute especially if lethal
            if (lethal && localBest < 0) localBest -= 50;
            if (localBest > bestScore) {
                bestScore = localBest;
                bestType = type;
            }
        });

        card.types = originalTypes;
        return bestType;
    }

    isDangerousEffect(card, bot) {
        if (!card) return false;

        const incoming = typeof card.damage === "number"
            ? card.damage
            : (typeof card.calculateDamage === "function" ? card.calculateDamage() : 0);
        if (incoming === 0) return false;

        // Contextual threats
        if (card.effect === "EVIL_MIRROR") {
            const top = bot.defeatedMonstersPile?.[bot.defeatedMonstersPile.length - 1];
            return !!top && top.power >= 4;
        }
        if (card.effect === "THE_PULLER") {
            return bot.defeatedMonstersPile.length > 0;
        }
        if (card.effect === "MIMIC") {
            return bot.stuff.filter(i => !i.broken).length >= 4;
        }
        if (card.effect === "MEDAL_GRINDER") {
            return bot.medals > 0 || card.power > 0;
        }

        // Generic always-nasty threats
        return this.dangerousEffects.has(card.effect);
    }

    // ===== Events =====
    handleEvent(bot, gameState, room) {
        if (this.shouldStop(bot, gameState)) return;
        const decision = this.decideEvent(bot, gameState);
        console.log(`Bot ${bot.name} ${decision.accept ? 'accepts' : 'declines'} event ${gameState.currentCard.title}`);
        gameState.dealWithEvent(bot.id, decision.accept, decision.arg ?? null);

        setTimeout(() => {
            if (gameState.isMyTurn(bot.id)) {
                this.autoPlayDungeon(bot, gameState, room);
            }
        }, this.afterActionDelay + 200);
    }

    decideEvent(bot, gameState) {
        const card = gameState.currentCard;
        const effect = card.effect;
        const defaultAccept = !card.optional;
        const scoreLead = this.computeScoreLead(bot, gameState);
        const lowHP = bot.hp <= Math.max(3, Math.ceil(bot.baseHP * 0.7));

        switch (effect) {
            case "SECRET_SHOP": {
                const intact = bot.stuff.filter(i => !i.broken);
                const tooMany = intact.length >= 5;
                const sacrifice = tooMany ? this.chooseSacrifice(bot, { allowBroken: false }) : null;
                const accept = intact.length <= 4 || !!sacrifice;
                return { accept, arg: sacrifice ? sacrifice.id : null };
            }
            case "WHEEL_OF_FORTUNE":
                return { accept: bot.hp >= 5 || scoreLead < 0 };
            case "HEALING_ANGEL":
                return { accept: lowHP || scoreLead < 0 };
            case "EVIL_TRAP":
            case "ALLY":
                return { accept: true };
            case "HANDYMAN": {
                const broken = bot.stuff.find(i => i.broken);
                return { accept: !!broken, arg: broken ? broken.id : null };
            }
            case "DRAGON_SKINNER": {
                const hasDragon = bot.defeatedMonstersPile.some(c => c.types?.includes('Dragon'));
                return { accept: hasDragon || scoreLead < 0 };
            }
            case "CLAY_INJECTION": {
                const hasGolem = bot.defeatedMonstersPile.some(c => c.types?.includes('Golem'));
                return { accept: hasGolem || scoreLead < 0 };
            }
            case "SOULSTORM":
                return { accept: true };
            default:
                return { accept: defaultAccept || scoreLead < 0 };
        }
    }

    // ===== Utilities =====
    pickWindRingPosition(bot, gameState) {
        const remaining = gameState?.dungeon?.length || 0;
        // Put the monster at the bottom so someone else draws it later
        return remaining + 1;
    }

    pickHexTarget(bot, gameState) {
        const dungeonCards = Array.from(gameState.dungeon || []).filter(c => c?.dungeonCardType === "monster");
        if (!dungeonCards.length) return null;

        let best = null;
        let bestScore = -Infinity;

        dungeonCards.forEach(card => {
            const isFairy = card.effect === "FAIRY";
            const canExecute = this.canExecuteCard(bot, gameState, card);
            const damage = typeof card.damage === "number"
                ? card.damage
                : (typeof card.calculateDamage === "function" ? card.calculateDamage() : (typeof card.power === "number" ? card.power : 0));

            let score = -damage;
            if (isFairy) score += 1000;
            if (canExecute) score += 200;
            if (this.dangerousEffects.has(card.effect)) score -= 50;

            if (score > bestScore) {
                bestScore = score;
                best = card;
            }
        });

        return best ? best.id : null;
    }

    canExecuteCard(bot, gameState, card) {
        if (!card || card.dungeonCardType !== "monster") return false;
        const fakeGame = {
            ...gameState,
            currentCard: card,
            trap: false,
            inFight: () => true,
            noCurrentCard: () => false,
        };

        return bot.stuff.some(item =>
            !item.broken &&
            (this.passiveExecute.has(item.key) || this.activeExecute.has(item.key)) &&
            ieCanUse[item.key]?.(item, bot, fakeGame)
        );
    }

    computePlayerScore(player) {
        if (!player) return 0;
        const defeated = player.defeatedMonstersPile?.length || 0;
        const trackedScore = typeof player.score === "number" ? player.score : 0;
        return Math.max(defeated, trackedScore);
    }

    computeBestFledScore(gameState) {
        const fledPlayers = gameState.players.filter(p => p.fled);
        if (!fledPlayers.length) return 0;
        return fledPlayers.reduce((best, p) => Math.max(best, this.computePlayerScore(p)), 0);
    }

    computeScoreLead(bot, gameState) {
        const myScore = this.computePlayerScore(bot);
        const bestOther = gameState.players
            .filter(p => {
                if (p.id === bot.id) return false;
                if (typeof p.inDungeon === "function") return p.inDungeon();
                return true;
            })
            .reduce((best, p) => Math.max(best, this.computePlayerScore(p)), 0);
        return myScore - bestOther;
    }

    chooseSacrifice(bot, options = {}) {
        const { allowBroken = true } = options;
        const candidates = bot.stuff.filter(i => (allowBroken || !i.broken));
        if (!candidates.length) return null;

        let worst = candidates[0];
        let worstScore = this.evaluateItemValue(candidates[0]);
        candidates.forEach(item => {
            const value = this.evaluateItemValue(item);
            if (value < worstScore) {
                worstScore = value;
                worst = item;
            }
        });
        return worst;
    }

    evaluateItemValue(item) {
        let value = 0;
        if (this.survival.has(item.key)) value += 60;
        if (this.passiveExecute.has(item.key)) value += 50;
        if (this.activeExecute.has(item.key)) value += 40;
        if (this.passiveReduction.has(item.key) || this.activeReduction.has(item.key)) value += 35;
        if (this.hpHeavy.has(item.key)) value += 25;
        if (this.scoring.has(item.key)) value += 20;
        if (this.escapeBoost.has(item.key)) value += 15;
        if (this.escapePenalty.has(item.key)) value -= 10;
        if (item.broken) value -= 30;
        value += (item.hp || 0) * 3;
        return value;
    }
}

module.exports = BotAI;
