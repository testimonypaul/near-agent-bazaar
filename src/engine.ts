export type ItemId = 'wood' | 'crystal' | 'iron';
export type Item = {
  id: ItemId;
  name: string;
  icon: string;
  base: number;
  stock: number;
  demand: number;
  description: string;
};
export type Merchant = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  strategy: string;
  treasury: number;
  inventory: Record<ItemId, number>;
  mood: string;
  trades: number;
};
export type Event = {
  id: number;
  time: string;
  agent: string;
  text: string;
  kind: 'trade' | 'market' | 'agent';
};
export type World = {
  tick: number;
  player: { balance: number; inventory: Record<ItemId, number> };
  items: Item[];
  merchants: Merchant[];
  events: Event[];
  volume: number;
};

const initial: World = {
  tick: 0,
  player: { balance: 240, inventory: { wood: 8, crystal: 2, iron: 4 } },
  volume: 0,
  items: [
    { id: 'wood', name: 'Ancient Wood', icon: '🪵', base: 12, stock: 82, demand: 54, description: 'A reliable building material' },
    { id: 'crystal', name: 'Aether Crystal', icon: '💎', base: 35, stock: 24, demand: 78, description: 'Rare energy-rich crystals' },
    { id: 'iron', name: 'Forged Iron', icon: '⚙️', base: 18, stock: 56, demand: 61, description: 'Essential for crafted goods' }
  ],
  merchants: [
    { id: 'max', name: 'MAX', role: 'The Opportunist', avatar: '🦾', color: 'cyan', strategy: 'Buys low, sells high. Max hunts for price gaps and keeps a deep reserve.', treasury: 920, inventory: { wood: 35, crystal: 8, iron: 22 }, mood: 'Ready to trade', trades: 0 },
    { id: 'luna', name: 'LUNA', role: 'The Collector', avatar: '🌙', color: 'violet', strategy: 'Luna values rare goods and holds crystals when demand starts climbing.', treasury: 680, inventory: { wood: 12, crystal: 28, iron: 10 }, mood: 'Protecting rare reserves', trades: 0 },
    { id: 'rex', name: 'REX', role: 'The Industrialist', avatar: '🤖', color: 'orange', strategy: 'Rex moves volume, restocks essentials and sells steadily to the town.', treasury: 1240, inventory: { wood: 48, crystal: 5, iron: 38 }, mood: 'Managing supply', trades: 0 }
  ],
  events: [
    { id: 1, time: 'READY', agent: 'SYSTEM', text: 'The demo market is ready. Run a market cycle to see the merchants make their first decisions.', kind: 'market' }
  ]
};

// Version 2 starts with clean demo metrics and corrected supply movement.
const STORAGE = 'near-agent-bazaar-world-v2';

export function loadWorld(): World {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as World;
  } catch {
    // Reset corrupt or unavailable browser state to a clean demo world.
  }
  return structuredClone(initial);
}

export function saveWorld(world: World) {
  localStorage.setItem(STORAGE, JSON.stringify(world));
}

export function priceOf(item: Item) {
  const pressure = (item.demand - 50) * 0.006 + (50 - item.stock) * 0.004;
  return Math.max(1, Math.round(item.base * (1 + pressure) * 10) / 10);
}

function event(agent: string, text: string, kind: Event['kind']): Event {
  return { id: Date.now() + Math.random(), time: 'JUST NOW', agent, text, kind };
}

export function trade(
  world: World,
  merchantId: string,
  itemId: ItemId,
  side: 'buy' | 'sell',
  quantity: number
): { world: World; error?: string } {
  const currentItem = world.items.find(x => x.id === itemId);
  const currentMerchant = world.merchants.find(x => x.id === merchantId);
  if (!currentItem || !currentMerchant) {
    return { world, error: 'That merchant or resource is no longer available. Please refresh the demo.' };
  }

  const requested = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  const qty = Math.max(1, Math.min(20, requested));
  const next = structuredClone(world);
  const item = next.items.find(x => x.id === itemId)!;
  const merchant = next.merchants.find(x => x.id === merchantId)!;
  const unit = priceOf(item);
  const total = Math.round(unit * qty * 100) / 100;

  if (side === 'buy') {
    if (merchant.inventory[itemId] < qty) return { world, error: 'This merchant does not have enough of that resource.' };
    if (next.player.balance < total) return { world, error: 'You do not have enough demo credits for this purchase.' };

    next.player.balance = Math.round((next.player.balance - total) * 100) / 100;
    next.player.inventory[itemId] += qty;
    merchant.inventory[itemId] -= qty;
    merchant.treasury = Math.round((merchant.treasury + total) * 100) / 100;

    // A player purchase removes units from available market supply.
    item.stock = Math.max(0, item.stock - qty);
    item.demand = Math.min(100, item.demand + qty * 0.7);
    next.events.unshift(event(
      merchant.name,
      'Sold ' + qty + ' ' + item.name.toLowerCase() + ' to a player for ' + total.toFixed(1) + ' demo credits.',
      'trade'
    ));
  } else {
    if (next.player.inventory[itemId] < qty) return { world, error: 'You do not own enough of that resource to sell.' };
    const payout = Math.round(total * 0.88 * 100) / 100;
    if (merchant.treasury < payout) return { world, error: 'This merchant does not have enough demo credits to buy your items.' };

    next.player.balance = Math.round((next.player.balance + payout) * 100) / 100;
    next.player.inventory[itemId] -= qty;
    merchant.inventory[itemId] += qty;
    merchant.treasury = Math.round((merchant.treasury - payout) * 100) / 100;

    // A player sale adds units back into market supply.
    item.stock += qty;
    item.demand = Math.max(0, item.demand - qty * 0.35);
    next.events.unshift(event(
      merchant.name,
      'Bought ' + qty + ' ' + item.name.toLowerCase() + ' from a player for ' + payout.toFixed(1) + ' demo credits.',
      'trade'
    ));
  }

  merchant.trades += 1;
  next.volume = Math.round((next.volume + total) * 100) / 100;
  next.events = next.events.slice(0, 12);
  return { world: next };
}

export function advanceMarket(world: World): World {
  const next = structuredClone(world);
  next.tick += 1;

  // Background market movement is random but bounded. Agent choices are rule-based.
  next.items.forEach(item => {
    item.demand = Math.max(12, Math.min(96, item.demand + (Math.random() * 8 - 3.8)));
    item.stock = Math.max(5, Math.min(120, item.stock + (Math.random() * 8 - 3.5)));
  });

  next.merchants.forEach(merchant => {
    const crystal = next.items.find(x => x.id === 'crystal')!;
    const wood = next.items.find(x => x.id === 'wood')!;
    const iron = next.items.find(x => x.id === 'iron')!;
    let action = 'Studying demand';

    if (merchant.id === 'max') {
      const target = [...next.items].sort(
        (a, b) => (b.demand - b.stock * 0.45) - (a.demand - a.stock * 0.45)
      )[0];

      if (target.demand > 63 && merchant.inventory[target.id] > 3) {
        // Max sells his own stock into the market: available supply rises.
        const amount = Math.min(3, merchant.inventory[target.id]);
        merchant.inventory[target.id] -= amount;
        merchant.treasury += amount * priceOf(target) * 0.82;
        target.stock += amount;
        action = 'sold ' + amount + ' ' + target.name.toLowerCase() + ' into a demand spike';
      } else if (target.stock > 5 && target.stock < 45 && merchant.treasury > priceOf(target) * 6) {
        // Max buys available stock to hold in reserve: available supply falls.
        const amount = Math.min(2, target.stock - 5);
        merchant.inventory[target.id] += amount;
        merchant.treasury -= amount * priceOf(target) * 0.78;
        target.stock -= amount;
        action = 'bought ' + amount + ' ' + target.name.toLowerCase() + ' while supply was tight';
      }
    } else if (merchant.id === 'luna') {
      if (crystal.demand > 84 && merchant.inventory.crystal > 8) {
        const amount = Math.min(2, merchant.inventory.crystal);
        merchant.inventory.crystal -= amount;
        merchant.treasury += amount * priceOf(crystal) * 0.9;
        crystal.stock += amount;
        action = 'released ' + amount + ' Aether Crystals at a premium';
      } else if (crystal.stock > 5 && crystal.stock < 30 && merchant.treasury > priceOf(crystal) * 4) {
        merchant.inventory.crystal += 1;
        merchant.treasury -= priceOf(crystal) * 0.85;
        crystal.stock -= 1;
        action = 'secured 1 Aether Crystal for its reserve';
      } else {
        action = 'protected its rare-crystal reserve';
      }
    } else if (merchant.id === 'rex') {
      const target = wood.stock < iron.stock ? wood : iron;
      if (target.stock > 5 && target.stock < 48 && merchant.treasury > priceOf(target) * 5) {
        const amount = Math.min(3, target.stock - 5);
        merchant.inventory[target.id] += amount;
        merchant.treasury -= amount * priceOf(target) * 0.72;
        target.stock -= amount;
        action = 'restocked ' + amount + ' units of ' + target.name.toLowerCase();
      } else if (wood.demand > 70 && merchant.inventory.wood > 5) {
        const amount = Math.min(2, merchant.inventory.wood);
        merchant.inventory.wood -= amount;
        merchant.treasury += amount * priceOf(wood) * 0.8;
        wood.stock += amount;
        action = 'released ' + amount + ' Ancient Wood to builders';
      } else {
        action = 'balanced construction-material reserves';
      }
    }

    merchant.mood = action[0].toUpperCase() + action.slice(1);
    if (action !== 'Studying demand') {
      next.events.unshift(event(merchant.name, action + '.', 'agent'));
    }
  });

  next.events.unshift(event(
    'MARKET',
    'Market cycle #' + next.tick + ' completed. Three merchant policies evaluated the new supply and demand.',
    'market'
  ));
  next.events = next.events.slice(0, 12);
  return next;
}

export const starterWorld = initial;
