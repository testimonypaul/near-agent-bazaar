import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Bot, ChevronDown, CircleHelp, Coins, Cpu, Gem, Globe2, Landmark, Play, RefreshCw, ShieldCheck, ShoppingCart, Sparkles, Store, Wallet, Zap } from 'lucide-react';
import { advanceMarket, loadWorld, priceOf, saveWorld, trade, type ItemId, type World } from './engine';

const money = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
export default function App() {
  const [world, setWorld] = useState<World>(() => loadWorld());
  const [merchantId, setMerchantId] = useState('max');
  const [selected, setSelected] = useState<ItemId>('crystal');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [auto, setAuto] = useState(false);
  const merchant = world.merchants.find(m => m.id === merchantId)!;
  const item = world.items.find(x => x.id === selected)!;
  const price = priceOf(item);
  const total = price * quantity;
  const chart = useMemo(() => world.items.map(x => ({ ...x, price: priceOf(x) })), [world.items]);
  useEffect(() => { saveWorld(world); }, [world]);
  useEffect(() => { if (!auto) return; const timer = window.setInterval(() => setWorld(w => advanceMarket(w)), 6500); return () => window.clearInterval(timer); }, [auto]);
  const doTrade = (side: 'buy' | 'sell') => {
    const result = trade(world, merchantId, selected, side, quantity);
    if (result.error) { setNotice(result.error); return; }
    setWorld(result.world); setNotice(side === 'buy' ? 'Trade simulated successfully. No tokens moved.' : 'Sale simulated successfully. No tokens moved.');
  };
  const tick = () => { setWorld(w => advanceMarket(w)); setNotice('Market cycle advanced. Agent decisions are simulated locally.'); };
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Store size={21}/></div><div><b>AGENT<span>BAZAAR</span></b><small>NEAR ECONOMY LAB</small></div></div>
      <div className="network-pill"><span className="pulse"/> DEMO SIMULATION <span className="network-right">LOCAL</span></div>
      <div className="side-label">ECONOMY</div>
      <a className="side-link active"><Globe2 size={17}/> Living Marketplace</a>
      <a className="side-link"><Bot size={17}/> Autonomous Agents <span className="side-count">03</span></a>
      <a className="side-link"><Activity size={17}/> Market Activity</a>
      <div className="side-bottom"><div className="side-label">NETWORK STATUS</div><div className="network-card"><div className="network-icon"><Landmark size={17}/></div><div><b>NEAR Protocol</b><small>Testnet integration pending</small></div><span className="status-dot"/></div><div className="side-foot">BUILT FOR THE OPEN ECONOMY<br/>v0.1.0 · HACKATHON BUILD</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">WORLD STATE <span/> CYCLE #{world.tick}</div><h1>The living economy<span>.</span></h1><p>Autonomous merchants. Real strategies. A market that never sleeps.</p></div><div className="top-actions"><div className="demo-badge"><span/> SIMULATION MODE</div><button className="wallet-btn" onClick={() => setNotice('Wallet connection is not enabled yet. This build is running in honest demo mode.')}><Wallet size={16}/> Connect wallet</button></div></header>
      <section className="stats-grid">
        <div className="stat-card"><div className="stat-head">PLAYER TREASURY <Wallet size={16}/></div><strong>{money(world.player.balance)} <small>CR</small></strong><div className="stat-foot">Demo credits · browser state</div></div>
        <div className="stat-card"><div className="stat-head">MARKET VOLUME <Activity size={16}/></div><strong>{money(world.volume)} <small>CR</small></strong><div className="stat-foot"><span className="positive">↗</span> Total simulated trade value</div></div>
        <div className="stat-card"><div className="stat-head">ACTIVE AGENTS <Bot size={16}/></div><strong>03 <small>ONLINE</small></strong><div className="stat-foot">Independent merchant policies</div></div>
        <div className="stat-card"><div className="stat-head">MARKET CYCLE <Zap size={16}/></div><strong>#{world.tick}</strong><div className="stat-foot">Supply & demand recalculated</div></div>
      </section>
      <section className="market-layout">
        <div className="panel market-panel"><div className="panel-heading"><div><div className="eyebrow">OPEN EXCHANGE</div><h2>Market board</h2></div><button className="icon-btn" onClick={tick} title="Advance market cycle"><RefreshCw size={16}/></button></div>
          <div className="market-table"><div className="table-head"><span>ASSET</span><span>MARKET PRICE</span><span>SUPPLY</span><span>DEMAND</span><span>YOU OWN</span></div>
            {chart.map(x => <button key={x.id} className={selected === x.id ? 'asset-row selected' : 'asset-row'} onClick={() => setSelected(x.id)}><span className="asset-name"><i>{x.icon}</i><span><b>{x.name}</b><small>{x.description}</small></span></span><strong>{x.price.toFixed(1)} <small>CR</small></strong><span className="meter-cell"><b>{x.stock}</b><i><em style={{ width: x.stock + '%' }}/></i></span><span className="meter-cell"><b>{Math.round(x.demand)}%</b><i><em className="demand-meter" style={{ width: x.demand + '%' }}/></i></span><b>{world.player.inventory[x.id]}</b></button>)}
          </div>
          <div className="market-note"><Sparkles size={15}/> Prices update as agents trade and market supply changes.</div>
        </div>
        <div className="panel trade-panel"><div className="panel-heading"><div><div className="eyebrow">PLAYER TERMINAL</div><h2>Execute a trade</h2></div><ShoppingCart size={19}/></div>
          <label className="field-label">SELECT MERCHANT</label><div className="merchant-select">{world.merchants.map(m => <button key={m.id} className={merchantId === m.id ? 'merchant-chip chosen' : 'merchant-chip'} onClick={() => setMerchantId(m.id)}><span>{m.avatar}</span>{m.name}</button>)}</div>
          <div className="selected-agent"><div className={'agent-avatar ' + merchant.color}>{merchant.avatar}</div><div><b>{merchant.name} <span className="online-dot"/></b><small>{merchant.role}</small></div><span className="agent-wallet">{money(merchant.treasury)} CR</span></div>
          <label className="field-label">ASSET</label><div className="asset-picker">{world.items.map(x => <button key={x.id} className={selected === x.id ? 'asset-option chosen' : 'asset-option'} onClick={() => setSelected(x.id)}>{x.icon} {x.name}</button>)}</div>
          <div className="quantity-line"><label className="field-label">QUANTITY</label><div className="stepper"><button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(q => Math.min(20, q + 1))}>+</button></div></div>
          <div className="trade-summary"><span>Unit price</span><b>{price.toFixed(1)} CR</b><span>Estimated total</span><b>{total.toFixed(1)} CR</b><span>Sell-back rate</span><b>88%</b></div>
          <div className="trade-actions"><button className="buy-btn" onClick={() => doTrade('buy')}><ArrowDownRight size={16}/> Buy from agent</button><button className="sell-btn" onClick={() => doTrade('sell')}><ArrowUpRight size={16}/> Sell to agent</button></div>
          <div className="simulation-warning"><ShieldCheck size={14}/> Demo credits only. No real assets or tokens move.</div>
        </div>
      </section>
      <section className="lower-grid">
        <div className="panel agents-panel"><div className="panel-heading"><div><div className="eyebrow">AUTONOMOUS NPC NETWORK</div><h2>Meet your merchants</h2></div><span className="live-tag"><i/> 3 ACTIVE</span></div><div className="agent-grid">{world.merchants.map(m => <article className="agent-card" key={m.id}><div className="agent-card-top"><div className={'agent-avatar ' + m.color}>{m.avatar}</div><span className="agent-state"><i/>{m.mood}</span></div><h3>{m.name}</h3><div className="agent-role">{m.role}</div><p>{m.strategy}</p><div className="agent-card-stats"><span>TRADE ACTIONS <b>{m.trades}</b></span><span>TREASURY <b>{money(m.treasury)} CR</b></span></div></article>)}</div></div>
        <div className="panel activity-panel"><div className="panel-heading"><div><div className="eyebrow">LIVE INTELLIGENCE</div><h2>Agent activity</h2></div><button className={auto ? 'auto-toggle active' : 'auto-toggle'} onClick={() => setAuto(v => !v)}><span/>{auto ? 'AUTO ON' : 'AUTO OFF'}</button></div><div className="activity-feed">{world.events.slice(0, 8).map(e => <div className="activity-item" key={e.id}><div className={'activity-icon ' + e.kind}>{e.kind === 'trade' ? <Coins size={14}/> : e.kind === 'agent' ? <Cpu size={14}/> : <Activity size={14}/>}</div><div><b>{e.agent}</b><p>{e.text}</p><small>{e.time}</small></div></div>)}</div><button className="cycle-btn" onClick={tick}><Play size={14}/> Run next market cycle</button></div>
      </section>
      <footer><span>NEAR AGENT BAZAAR <b>·</b> AN EXPERIMENT IN AUTONOMOUS ECONOMIES</span><span><CircleHelp size={13}/> Simulation build · On-chain settlement not yet enabled</span></footer>
      {notice && <div className="toast" role="status" onClick={() => setNotice('')}>{notice}<button onClick={() => setNotice('')}>×</button></div>}
    </main>
  </div>;
}