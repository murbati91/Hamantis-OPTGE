/**
 * Comic-book combat narration for the practice duel. Pure + deterministic:
 * every line is picked from a seed derived from game state (no Math.random), so
 * the log stays stable across re-renders/replays. Names come from the cards in
 * play; `mine` marks whether the acting card is yours (🟢) or the bot's (🔴).
 */

const pick = (arr: string[], seed: number): string => arr[Math.abs(seed) % arr.length]

const who = (mine: boolean) => (mine ? '🟢' : '🔴')

/** A character/leader takes the field. */
export function onPlay(name: string, mine: boolean, seed: number): string {
  return `${who(mine)} ` + pick([
    `${name} leaps into the fray!`,
    `${name} answers the call to battle!`,
    `${name} steps onto the deck, ready to throw down!`,
    `${name} cracks their knuckles and joins the fight!`,
  ], seed)
}

/** An attack is declared. `target` is a ready-made phrase, e.g. "your Leader". */
export function onAttack(attacker: string, target: string, mine: boolean, seed: number): string {
  return `${who(mine)} ` + pick([
    `${attacker} charges straight at ${target}! 💨`,
    `${attacker} lunges for ${target} with everything they've got! ⚔️`,
    `${attacker} winds up a haymaker aimed at ${target}! 👊`,
    `${attacker} sets sail for ${target} — no mercy! 🏴‍☠️`,
    `${attacker} roars and swings at ${target}! 🔥`,
  ], seed)
}

/** A blocker steps in. */
export function onBlock(blocker: string, mine: boolean, seed: number): string {
  return `${who(mine)} ` + pick([
    `${blocker} throws themselves in the way to block! 🛡️`,
    `${blocker} steps up and takes the hit instead! 🧱`,
    `${blocker} shouts "Not today!" and blocks! ✋`,
    `${blocker} guards the line — block! 🛡️`,
  ], seed)
}

/** A counter card is played from hand for +power. */
export function onCounter(card: string, amount: number, total: number, mine: boolean, seed: number): string {
  return `${who(mine)} ` + pick([
    `${card} flips up from hand — +${amount}! Power surges to ${total}! ⚡`,
    `Quick counter! ${card} adds +${amount}, now ${total} strong! 💥`,
    `${card} comes off the bench for +${amount} → ${total}! 🛡️`,
  ], seed)
}

/** Defender outpowers the attack and shrugs it off. */
export function onSurvive(defender: string, atk: number, def_: number, mine: boolean, seed: number): string {
  return `${who(mine)} ` + pick([
    `${defender} plants their feet — ${atk} vs ${def_}, no damage! 💪`,
    `The blow glances off ${defender}! (${atk} < ${def_}) 🪨`,
    `${defender} takes it on the chin and stands tall! ${atk} vs ${def_}. 😤`,
    `Clang! ${defender} holds the line — ${atk} couldn't crack ${def_}. 🛡️`,
  ], seed)
}

/** A character is knocked out. `byMine` = the attacker was yours. */
export function onKO(name: string, byMine: boolean, seed: number): string {
  return `${who(byMine)} ` + pick([
    `💥 ${name} is sent flying — K.O.!`,
    `💥 ${name} goes down hard! K.O.'d!`,
    `💥 Lights out for ${name}! Straight to the trash!`,
    `💥 ${name} couldn't hang on — K.O.!`,
  ], seed)
}

/** A Leader takes 1 damage (loses a Life card). `byMine` = attacker was yours. */
export function onDamage(byMine: boolean, lifeOwnerIsYou: boolean, lifeLeft: number, seed: number): string {
  const owner = lifeOwnerIsYou ? 'You' : 'The bot'
  return `${who(byMine)} ` + pick([
    `❤️‍🔥 Direct hit! ${owner} lose a Life card — ${lifeLeft} left!`,
    `💢 The Leader staggers! ${owner} drop to ${lifeLeft} Life!`,
    `❤️ A Life card is torn away! ${owner}: ${lifeLeft} remaining!`,
  ], seed)
}

/** Game over. `youWin` from the player's perspective. */
export function onWin(youWin: boolean): string {
  return youWin
    ? '🏴‍☠️🎉 KO! You stand victorious — the seas are yours!'
    : '🏴‍☠️💀 The bot lands the finishing blow… you go down swinging.'
}

/** Win/loss by deck-out. */
export function onDeckOut(youWin: boolean): string {
  return youWin
    ? '🃏 The bot runs out of cards — you win by deck-out! 🏴‍☠️'
    : '🃏 Your deck runs dry — deck-out, the bot takes it.'
}
