import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceMarket,
  priceOf,
  starterWorld,
  trade,
  type World
} from '../src/engine.ts';

function freshWorld(): World {
  return structuredClone(starterWorld);
}

test('buying transfers items and credits and reduces market supply', () => {
  const world = freshWorld();
  const crystal = world.items.find(item => item.id === 'crystal')!;
  const max = world.merchants.find(merchant => merchant.id === 'max')!;
  const unitPrice = priceOf(crystal);
  const result = trade(world, 'max', 'crystal', 'buy', 1);

  assert.equal(result.error, undefined);
  assert.notEqual(result.world, world);
  assert.equal(result.world.player.balance, 240 - unitPrice);
  assert.equal(result.world.player.inventory.crystal, 3);
  assert.equal(result.world.merchants[0].inventory.crystal, max.inventory.crystal - 1);
  assert.equal(result.world.merchants[0].treasury, max.treasury + unitPrice);
  assert.equal(result.world.items.find(item => item.id === 'crystal')!.stock, crystal.stock - 1);
  assert.ok(result.world.items.find(item => item.id === 'crystal')!.demand > crystal.demand);
  assert.equal(result.world.volume, unitPrice);
  assert.equal(result.world.merchants[0].trades, 1);

  // A trade must not mutate the previous saved snapshot.
  assert.equal(world.player.balance, 240);
  assert.equal(world.player.inventory.crystal, 2);
});

test('selling transfers items and pays 88% while increasing market supply', () => {
  const world = freshWorld();
  const wood = world.items.find(item => item.id === 'wood')!;
  const max = world.merchants.find(merchant => merchant.id === 'max')!;
  const total = priceOf(wood) * 2;
  const payout = Math.round(total * 0.88 * 100) / 100;
  const result = trade(world, 'max', 'wood', 'sell', 2);

  assert.equal(result.error, undefined);
  assert.equal(result.world.player.balance, 240 + payout);
  assert.equal(result.world.player.inventory.wood, 6);
  assert.equal(result.world.merchants[0].inventory.wood, max.inventory.wood + 2);
  assert.equal(result.world.merchants[0].treasury, max.treasury - payout);
  assert.equal(result.world.items.find(item => item.id === 'wood')!.stock, wood.stock + 2);
  assert.ok(result.world.items.find(item => item.id === 'wood')!.demand < wood.demand);
  assert.equal(result.world.volume, total);
  assert.equal(result.world.merchants[0].trades, 1);
});

test('a failed purchase leaves the world unchanged when the player is short of credits', () => {
  const world = freshWorld();
  world.player.balance = 0;
  const before = structuredClone(world);
  const result = trade(world, 'max', 'crystal', 'buy', 1);

  assert.match(result.error ?? '', /not have enough demo credits/i);
  assert.deepEqual(result.world, before);
});

test('a failed sale leaves the world unchanged when the player lacks inventory', () => {
  const world = freshWorld();
  world.player.inventory.iron = 0;
  const before = structuredClone(world);
  const result = trade(world, 'max', 'iron', 'sell', 1);

  assert.match(result.error ?? '', /do not own enough/i);
  assert.deepEqual(result.world, before);
});

test('a merchant cannot buy items when its treasury is too low', () => {
  const world = freshWorld();
  world.merchants[0].treasury = 0;
  const before = structuredClone(world);
  const result = trade(world, 'max', 'crystal', 'sell', 1);

  assert.match(result.error ?? '', /not have enough demo credits/i);
  assert.deepEqual(result.world, before);
});

test('requested quantity is clamped to the supported maximum of 20', () => {
  const world = freshWorld();
  const result = trade(world, 'max', 'wood', 'buy', 100);

  assert.equal(result.error, undefined);
  assert.equal(result.world.player.inventory.wood, 28);
  assert.equal(result.world.merchants[0].inventory.wood, 15);
});

test('a market cycle advances once, runs agent policies and keeps values bounded', () => {
  const world = freshWorld();
  const originalRandom = Math.random;
  Math.random = () => 0.5;

  try {
    const result = advanceMarket(world);

    assert.equal(result.tick, world.tick + 1);
    assert.equal(result.merchants.find(merchant => merchant.id === 'max')!.inventory.crystal, 5);
    assert.equal(result.merchants.find(merchant => merchant.id === 'luna')!.inventory.crystal, 29);
    assert.ok(result.events.some(entry => entry.agent === 'MAX' && entry.text.includes('sold 3')));
    assert.ok(result.events.some(entry => entry.agent === 'LUNA' && entry.text.includes('secured 1')));
    assert.ok(result.events.some(entry => entry.agent === 'MARKET'));
    assert.ok(result.items.every(item =>
      item.stock >= 5 && item.stock <= 120 && item.demand >= 12 && item.demand <= 96
    ));

    // Advancing a cycle must preserve the previous state snapshot.
    assert.equal(world.tick, 0);
    assert.equal(world.merchants[0].inventory.crystal, 8);
  } finally {
    Math.random = originalRandom;
  }
});
