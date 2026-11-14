export type ItemId = 'wood' | 'crystal' | 'iron';
export type Item = { id: ItemId; name: string; icon: string; base: number; stock: number; demand: number; description: string };
export type Merchant = { id: string; name: string; role: string; avatar: string; color: string; strategy: string; treasury: number; inventory: Record<ItemId, number>; mood: string; trades: number };
export type Event = { id: number; time: string; agent: string; text: string; kind: 'trade' | 'market' | 'agent' };
export type World = { tick: number; player: { balance: number; inventory: Record<ItemId, number> }; items: Item[]; merchants: Merchant[]; events: Event[]; volume: number };

const initial: World = {
  tick: 18, player: { balance: 240, inventory: { wood: 8, crystal: 2, iron: 4 } }, volume: 1280,
  items: [
    { id: 'wood', name: 'Ancient Wood', icon: '🪵', base: 12, stock: 82, demand: 54, description: 'A reliable building material' },
    { id: 'crystal', name: 'Aether Crystal', icon: '💎', base: 35, stock: 24, demand: 78, description: 'Rare energy-rich crystals' },
    { id: 'iron', name: 'Forged Iron', icon: '⚙️', base: 18, stock: 56, demand: 61, description: 'Essential for crafted goods' }
  ],
  merchants: [
    { id: 'max', name: 'MAX', role: 'The Opportunist', avatar: '🦾', color: 'cyan', strategy: 'Buys low, sells high. Max hunts for price gaps and keeps a deep reserve.', treasury: 920, inventory: { wood: 35, crystal: 8, iron: 22 }, mood: 'Analyzing market', trades: 42 },
    { id: 'luna', name: 'LUNA', role: 'The Collector', avatar: '🌙', color: 'violet', strategy: 'Luna values rare goods and holds crystals when demand starts climbing.', treasury: 680, inventory: { wood: 12, crystal: 28, iron: 10 }, mood: 'Seeking rare stock', trades: 36 },
    { id: 'rex', name: 'REX', role: 'The Industrialist', avatar: '🤖', color: 'orange', strategy: 'Rex moves volume, restocks essentials and sells steadily to the town.', treasury: 1240, inventory: { wood: 48, crystal: 5, iron: 38 }, mood: 'Managing supply', trades: 57 }
  ],
  events: [
    { id: 1, time: 'NOW', agent: 'SYSTEM', text: 'Market simulation synchronized. Three agents are active.', kind: 'market' },
    { id: 2, time: '−2m', agent: 'LUNA', text: 'Raised crystal reserve target after demand increased.', kind: 'agent' },
    { id: 3, time: '−4m', agent: 'MAX', text: 'Completed a bulk wood purchase from the market.', kind: 'trade' }
  ]
};
const STORAGE = 'near-agent-bazaar-world-v1';
export function loadWorld(): World {
  try { const raw = localStorage.getItem(STORAGE); if (raw) return JSON.parse(raw) as World; } catch { /* reset corrupt demo state */ }
  return structuredClone(initial);
}
export function saveWorld(world: World) { localStorage.setItem(STORAGE, JSON.stringify(world)); }
export function priceOf(item: Item) {
  const pressure = (item.demand - 50) * 0.006 + (50 - item.stock) * 0.004;
  return Math.max(1, Math.round(item.base * (1 + pressure) * 10) / 10);
}
function event(world: World, agent: string, text: string, kind: Event['kind']): Event {
  return { id: Date.now() + Math.random(), time: 'JUST NOW', agent, text, kind };
}
export function trade(world: World, merchantId: string, itemId: ItemId, side: 'buy' | 'sell', quantity: number): { world: World; error?: string } {
  const next = structuredClone(world); const item = next.items.find(x => x.id === itemId)!;
  const merchant = next.merchants.find(x => x.id === merchantId)!; const unit = priceOf(item);
  const qty = Math.max(1, Math.min(20, Math.floor(quantity))); const total = Math.round(unit * qty * 100) / 100;
  if (side === 'buy') {
    if (merchant.inventory[itemId] < qty) return { world, error: 'Merchant does not have enough stock.' };
    if (next.player.balance < total) return { world, error: 'Not enough demo credits.' };
    next.player.balance -= total; next.player.inventory[itemId] += qty; merchant.inventory[itemId] -= qty;
    merchant.treasury += total; item.stock += qty; item.demand = Math.min(100, item.demand + qty * 0.7);
    next.events.unshift(event(next, merchant.name, `Sold ${qty} ${item.name.toLowerCase()} to a player for ${total.toFixed(1)} demo credits.`, 'trade'));
  } else {
    if (next.player.inventory[itemId] < qty) return { world, error: 'You do not have enough items to sell.' };
    const payout = Math.round(total * 0.88 * 100) / 100;
    if (merchant.treasury < payout) return { world, error: 'Merchant treasury is too low for this trade.' };
    next.player.balance += payout; next.player.inventory[itemId] -= qty; merchant.inventory[itemId] += qty;
    merchant.treasury -= payout; item.stock -= qty; item.demand = Math.max(0, item.demand - qty * 0.35);
    next.events.unshift(event(next, merchant.name, `Bought ${qty} ${item.name.toLowerCase()} from a player for ${payout.toFixed(1)} demo credits.`, 'trade'));
  }
  merchant.trades += 1; next.volume += total; next.events = next.events.slice(0, 12);
  return { world: next };
}
export function advanceMarket(world: World): World {
  const next = structuredClone(world); next.tick += 1;
  next.items.forEach(item => {
    item.demand = Math.max(12, Math.min(96, item.demand + (Math.random() * 8 - 3.8)));
    item.stock = Math.max(5, Math.min(120, item.stock + (Math.random() * 8 - 3.5)));
  });
  next.merchants.forEach((m, i) => {
    const focus: ItemId = (['wood', 'crystal', 'iron'] as ItemId[])[(next.tick + i) % 3];
    const item = next.items.find(x => x.id === focus)!;
    if (item.demand > 67 && m.inventory[focus] > 2) {
      const amount = Math.min(2 + (i % 2), m.inventory[focus]);
      m.inventory[focus] -= amount; m.treasury += amount * priceOf(item) * 0.7; item.stock += amount;
      m.mood = 'Selling into demand';
      next.events.unshift(event(next, m.name, `Released ${amount} ${item.name.toLowerCase()} into a high-demand market.`, 'agent'));
    } else if (item.stock < 38 && m.treasury > item.base * 5) {
      const amount = 2; const cost = amount * priceOf(item) * 0.8;
      m.inventory[focus] += amount; m.treasury -= cost; item.stock += amount;
      m.mood = 'Restocking inventory';
      next.events.unshift(event(next, m.name, `Restocked ${amount} ${item.name.toLowerCase()} while supply was low.`, 'agent'));
    } else { m.mood = ['Studying demand', 'Balancing reserves', 'Scanning opportunities'][i]; }
  });
  next.events.unshift(event(next, 'MARKET', `Market cycle #${next.tick} completed. Prices recalculated from supply and demand.`, 'market'));
  next.events = next.events.slice(0, 12); return next;
}
export const starterWorld = initial;