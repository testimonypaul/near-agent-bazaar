import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, BookOpen, Bot, Check, ChevronLeft,
  ChevronRight, CircleHelp, Coins, Cpu, Globe2, Info, Landmark, Play,
  RefreshCw, ShieldCheck, ShoppingCart, Sparkles, Wallet, X, Zap
} from 'lucide-react';
import { advanceMarket, loadWorld, priceOf, saveWorld, trade, type ItemId, type World } from './engine';

const money = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
const TOUR_KEY = 'near-agent-bazaar-tour-v1';

type SectionId = 'market' | 'agents' | 'activity';

type TourStep = {
  target: 'market' | 'trade' | 'agents' | 'activity' | 'network' | null;
  eyebrow: string;
  title: string;
  body: string;
  tip: string;
};

const tourSteps: TourStep[] = [
  {
    target: null,
    eyebrow: 'WELCOME TO THE BAZAAR',
    title: 'Your tiny economy, your rules.',
    body: 'This is a playable market simulation. You are a trader, and three merchant agents make their own decisions as the market changes.',
    tip: 'Everything currently uses local demo credits. No wallet connection or real tokens are involved.'
  },
  {
    target: 'market',
    eyebrow: 'STEP 1 · THE MARKET',
    title: 'Start by reading the board.',
    body: 'Choose Ancient Wood, Aether Crystal or Forged Iron. The board shows each item’s current price, available supply, buyer demand and the amount you own.',
    tip: 'In this simulation, stronger demand and tighter supply can push a resource’s price upward.'
  },
  {
    target: 'trade',
    eyebrow: 'STEP 2 · THE TRADE DESK',
    title: 'Make a deal with a merchant.',
    body: 'Pick Max, Luna or Rex, select a resource and set a quantity. Buy to add items to your inventory, or sell to trade items you already own for demo credits.',
    tip: 'Selling pays 88% of the displayed market-price total. Check the estimate before you confirm.'
  },
  {
    target: 'agents',
    eyebrow: 'STEP 3 · MEET THE AGENTS',
    title: 'Every merchant has a different plan.',
    body: 'Max hunts for opportunities, Luna protects rare crystals, and Rex keeps construction materials moving. Their strategies affect stock and their own treasuries.',
    tip: 'These are rule-based strategies in this version—not LLM-powered agents yet.'
  },
  {
    target: 'activity',
    eyebrow: 'STEP 4 · MOVE THE MARKET',
    title: 'Advance a cycle and watch decisions happen.',
    body: 'Run one market cycle to refresh supply and demand and let each agent evaluate its strategy. Turn Auto on to run a new cycle about every 6.5 seconds.',
    tip: 'The activity feed explains what the system and merchants just did.'
  },
  {
    target: 'network',
    eyebrow: 'ONE IMPORTANT NOTE',
    title: 'The NEAR connection is the next stage.',
    body: 'The interface and local economy simulation are ready to explore. The NEAR wallet, deployed contract and real on-chain trade settlement are not connected yet.',
    tip: 'When we add blockchain features, we’ll clearly separate testnet activity from this local demo so nothing is mistaken for a real transaction.'
  }
];

export default function App() {
  const [world, setWorld] = useState<World>(() => loadWorld());
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const hash = window.location.hash.slice(1);
    return hash === 'agents' || hash === 'activity' ? hash : 'market';
  });
  const [merchantId, setMerchantId] = useState('max');
  const [selected, setSelected] = useState<ItemId>('crystal');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [auto, setAuto] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourOpen, setTourOpen] = useState(() => {
    try { return localStorage.getItem(TOUR_KEY) !== 'done'; } catch { return true; }
  });

  const merchant = world.merchants.find(m => m.id === merchantId) ?? world.merchants[0];
  const item = world.items.find(x => x.id === selected) ?? world.items[0];
  const price = priceOf(item);
  const total = price * quantity;
  const sellEstimate = total * 0.88;
  const chart = useMemo(() => world.items.map(x => ({ ...x, price: priceOf(x) })), [world.items]);
  const tourStep = tourOpen ? tourSteps[tourIndex] : undefined;
  const tourTarget = (target: TourStep['target']) => Boolean(tourOpen && tourStep?.target === target);
  const classFor = (base: string, target: TourStep['target']) => tourTarget(target) ? base + ' tour-focus' : base;
  const navClass = (section: SectionId) => activeSection === section ? 'side-link active' : 'side-link';

  useEffect(() => {
    const syncActiveSection = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'market' || hash === 'agents' || hash === 'activity') setActiveSection(hash);
    };
    window.addEventListener('hashchange', syncActiveSection);
    return () => window.removeEventListener('hashchange', syncActiveSection);
  }, []);

  useEffect(() => {
    try { saveWorld(world); } catch { /* The demo remains usable if browser storage is unavailable. */ }
  }, [world]);

  useEffect(() => {
    if (!tourOpen || !tourStep?.target) return;
    const target = document.querySelector(`[data-tour="${tourStep.target}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tourOpen, tourIndex]);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => setWorld(w => advanceMarket(w)), 6500);
    return () => window.clearInterval(timer);
  }, [auto]);

  const finishTour = () => {
    setTourOpen(false);
    try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* Tour can still be dismissed for this visit. */ }
  };

  const startTour = () => {
    setTourIndex(0);
    setTourOpen(true);
  };

  const doTrade = (side: 'buy' | 'sell') => {
    const result = trade(world, merchantId, selected, side, quantity);
    if (result.error) { setNotice(result.error); return; }
    setWorld(result.world);
    setNotice(side === 'buy'
      ? 'Bought ' + quantity + ' ' + item.name.toLowerCase() + ' with demo credits. No tokens moved.'
      : 'Sold ' + quantity + ' ' + item.name.toLowerCase() + ' for demo credits. No tokens moved.');
  };

  const tick = () => {
    setWorld(w => advanceMarket(w));
    setNotice('Market cycle advanced. Supply, demand and agent decisions were simulated locally.');
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><img src="/agent-bazaar-icon.webp" alt="NEAR Agent Bazaar mascot" /></div>
        <div><b>AGENT<span>BAZAAR</span></b><small>NEAR ECONOMY LAB</small></div>
      </div>
      <div className="network-pill"><span className="pulse" /> DEMO SIMULATION <span className="network-right">LOCAL</span></div>
      <nav className="side-nav" aria-label="Dashboard sections">
        <div className="side-label">YOUR WORLD</div>
        <a className={navClass('market')} aria-current={activeSection === 'market' ? 'location' : undefined} onClick={() => setActiveSection('market')} href="#market"><Globe2 size={17} /> Market board</a>
        <a className={navClass('agents')} aria-current={activeSection === 'agents' ? 'location' : undefined} onClick={() => setActiveSection('agents')} href="#agents"><Bot size={17} /> Merchant agents <span className="side-count">{String(world.merchants.length).padStart(2, '0')}</span></a>
        <a className={navClass('activity')} aria-current={activeSection === 'activity' ? 'location' : undefined} onClick={() => setActiveSection('activity')} href="#activity"><Activity size={17} /> Activity feed</a>
      </nav>
      <div className="side-bottom">
        <div className="side-label">NETWORK STATUS</div>
        <div className="network-card">
          <div className="network-icon"><Landmark size={17} /></div>
          <div><b>NEAR Protocol</b><small>Integration planned · not connected</small></div>
          <span className="status-dot" />
        </div>
        <div className="side-foot">BUILT FOR THE OPEN ECONOMY<br />v0.1.0 · HACKATHON BUILD</div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="top-copy">
          <div className="eyebrow">WORLD SIMULATION <span /> CYCLE #{world.tick}</div>
          <h1>Welcome to the <span>living market.</span></h1>
          <p>Trade resources, meet independent merchants and see how your choices shape a tiny economy.</p>
          <div className={classFor("plain-language-note", "network")} data-tour="network"><Info size={13} /> CR means demo credits. This is a local simulation—not real NEAR or token activity.</div>
        </div>
        <div className="top-actions">
          <div className="demo-badge"><span /> LOCAL DEMO</div>
          <button className="tour-btn" onClick={startTour}><BookOpen size={15} /> How to play</button>
          <button className="wallet-btn" onClick={() => setNotice('NEAR wallet connection is planned for a later development stage. This version uses local demo credits.')}><Wallet size={15} /> Wallet coming soon</button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Economy overview">
        <div className="stat-card">
          <div className="stat-head">YOUR DEMO CREDITS <Wallet size={16} /></div>
          <strong>{money(world.player.balance)} <small>CR</small></strong>
          <div className="stat-foot">Your spending balance in this demo</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">PLAYER TRADE VOLUME <Activity size={16} /></div>
          <strong>{money(world.volume)} <small>CR</small></strong>
          <div className="stat-foot">Value of your completed demo trades</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">MERCHANT AGENTS <Bot size={16} /></div>
          <strong>{String(world.merchants.length).padStart(2, '0')} <small>ACTIVE</small></strong>
          <div className="stat-foot">Three distinct trading strategies</div>
        </div>
        <div className="stat-card">
          <div className="stat-head">MARKET CYCLE <Zap size={16} /></div>
          <strong>#{world.tick}</strong>
          <div className="stat-foot">Number of times the market has updated</div>
        </div>
      </section>

      <section className="concept-strip" aria-label="What makes this economy different">
        <div className="concept-copy">
          <div className="eyebrow">THE IDEA BEHIND THE GAME</div>
          <h2>What if the merchants ran the market?</h2>
          <p>Instead of static shop menus, players change a shared economy. Each market cycle lets Max, Luna and Rex respond to supply and demand in their own way.</p>
        </div>
        <div className="concept-flow" aria-label="Player trades affect the market, which shapes agent decisions">
          <span>PLAYER TRADES</span><b>→</b><span>MARKET SHIFTS</span><b>→</b><span>AGENT DECISIONS</span>
        </div>
      </section>

      <section className="market-layout">
        <div id="market" className={classFor('panel market-panel', 'market')} data-tour="market">
          <div className="panel-heading">
            <div><div className="eyebrow">01 / WATCH THE ECONOMY</div><h2>Market board</h2><p className="panel-subtitle">Choose a resource to see its details in the trade desk.</p></div>
            <button className="icon-btn" onClick={tick} title="Run one market cycle" aria-label="Run one market cycle"><RefreshCw size={16} /></button>
          </div>
          <div className="market-legend">
            <span><i className="legend-supply" /> Supply = units available</span>
            <span><i className="legend-demand" /> Demand = buyer interest</span>
          </div>
          <div className="market-table">
            <div className="table-head"><span>RESOURCE</span><span>PRICE / UNIT</span><span>SUPPLY</span><span>DEMAND</span><span>OWNED</span></div>
            {chart.map(x => <button key={x.id} className={selected === x.id ? 'asset-row selected' : 'asset-row'} onClick={() => setSelected(x.id)} aria-pressed={selected === x.id}>
              <span className="asset-name"><i>{x.icon}</i><span><b>{x.name}</b><small>{x.description}</small></span></span>
              <strong>{x.price.toFixed(1)} <small>CR</small></strong>
              <span className="meter-cell"><b>{x.stock} <small>units</small></b><i><em style={{ width: Math.min(100, (x.stock / 120) * 100) + '%' }} /></i></span>
              <span className="meter-cell"><b>{Math.round(x.demand)}<small>%</small></b><i><em className="demand-meter" style={{ width: x.demand + '%' }} /></i></span>
              <b className="owned-count">{world.player.inventory[x.id]}</b>
            </button>)}
          </div>
          <div className="market-note"><Sparkles size={15} /><span><b>{item.name} selected.</b> Prices are simulated and may change after each market cycle.</span></div>
        </div>

        <div id="trade" className={classFor('panel trade-panel', 'trade')} data-tour="trade">
          <div className="panel-heading">
            <div><div className="eyebrow">02 / TAKE ACTION</div><h2>Trade desk</h2><p className="panel-subtitle">Buy items from a merchant or sell items you own.</p></div>
            <ShoppingCart size={19} />
          </div>
          <label className="field-label">1. CHOOSE A MERCHANT</label>
          <div className="merchant-select">{world.merchants.map(m => <button key={m.id} className={merchantId === m.id ? 'merchant-chip chosen' : 'merchant-chip'} onClick={() => setMerchantId(m.id)} aria-pressed={merchantId === m.id}><span>{m.avatar}</span>{m.name}</button>)}</div>
          <div className="selected-agent">
            <div className={'agent-avatar ' + merchant.color}>{merchant.avatar}</div>
            <div className="selected-agent-copy"><b>{merchant.name} <span className="online-dot" /></b><small>{merchant.role}</small></div>
            <span className="agent-wallet">{money(merchant.treasury)} CR <small>treasury</small></span>
          </div>
          <label className="field-label">2. CHOOSE A RESOURCE</label>
          <div className="asset-picker">{world.items.map(x => <button key={x.id} className={selected === x.id ? 'asset-option chosen' : 'asset-option'} onClick={() => setSelected(x.id)} aria-pressed={selected === x.id}>{x.icon} {x.name}</button>)}</div>
          <div className="quantity-line">
            <div><label className="field-label">3. SET YOUR QUANTITY</label><small className="quantity-hint">Choose between 1 and 20 units</small></div>
            <div className="stepper"><button onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><b>{quantity}</b><button onClick={() => setQuantity(q => Math.min(20, q + 1))} aria-label="Increase quantity">+</button></div>
          </div>
          <div className="trade-summary">
            <span>Market price per unit</span><b>{price.toFixed(1)} CR</b>
            <span>Buy total</span><b>{total.toFixed(1)} CR</b>
            <span>Estimated sell payout <small>(88%)</small></span><b>{sellEstimate.toFixed(1)} CR</b>
          </div>
          <div className="trade-actions">
            <button className="buy-btn" onClick={() => doTrade('buy')}><ArrowDownRight size={16} /> Buy from merchant</button>
            <button className="sell-btn" onClick={() => doTrade('sell')}><ArrowUpRight size={16} /> Sell to merchant</button>
          </div>
          <div className="simulation-warning"><ShieldCheck size={14} /> Demo credits only. No real assets or tokens move.</div>
        </div>
      </section>

      <section className="lower-grid">
        <div id="agents" className={classFor('panel agents-panel', 'agents')} data-tour="agents">
          <div className="panel-heading">
            <div><div className="eyebrow">03 / KNOW YOUR COUNTERPARTIES</div><h2>Meet the merchant agents</h2><p className="panel-subtitle">Each agent follows a different rule-based strategy.</p></div>
            <span className="live-tag"><i /> {world.merchants.length} ACTIVE</span>
          </div>
          <div className="agent-grid">{world.merchants.map(m => <article className="agent-card" key={m.id}>
            <div className="agent-card-top"><div className={'agent-avatar ' + m.color}>{m.avatar}</div><span className="agent-state"><i />{m.mood}</span></div>
            <h3>{m.name}</h3><div className="agent-role">{m.role}</div><p>{m.strategy}</p>
            <div className="agent-card-stats"><span>PLAYER DEALS <b>{m.trades}</b></span><span>TREASURY <b>{money(m.treasury)} CR</b></span></div>
          </article>)}</div>
        </div>

        <div id="activity" className={classFor('panel activity-panel', 'activity')} data-tour="activity">
          <div className="panel-heading">
            <div><div className="eyebrow">04 / FOLLOW THE STORY</div><h2>Market activity</h2><p className="panel-subtitle">A simple record of what just happened.</p></div>
            <button className={auto ? 'auto-toggle active' : 'auto-toggle'} onClick={() => setAuto(v => !v)} aria-pressed={auto}><span />{auto ? 'AUTO ON' : 'AUTO OFF'}</button>
          </div>
          <div className="auto-explainer">{auto ? 'A new cycle runs about every 6.5 seconds.' : 'Turn Auto on to let the market run by itself.'}</div>
          <div className="activity-feed">{world.events.slice(0, 8).map(e => <div className="activity-item" key={e.id}>
            <div className={'activity-icon ' + e.kind}>{e.kind === 'trade' ? <Coins size={14} /> : e.kind === 'agent' ? <Cpu size={14} /> : <Activity size={14} />}</div>
            <div><b>{e.agent}</b><p>{e.text}</p><small>{e.time}</small></div>
          </div>)}</div>
          <button className="cycle-btn" onClick={tick}><Play size={14} /> Run next market cycle</button>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-heading"><div><div className="eyebrow">QUICK START</div><h2>How to play</h2></div><button className="text-action" onClick={startTour}><BookOpen size={14} /> Take the guided tour</button></div>
        <div className="how-steps">
          <article><span>01</span><div><b>Pick a resource</b><p>Read the price, supply and demand on the market board.</p></div></article>
          <article><span>02</span><div><b>Trade with a merchant</b><p>Buy to grow your inventory, or sell to earn demo credits.</p></div></article>
          <article><span>03</span><div><b>Run a market cycle</b><p>Watch supply shift and see how each agent responds.</p></div></article>
        </div>
      </section>

      <footer>
        <span>NEAR AGENT BAZAAR <b>·</b> AN EXPERIMENT IN AUTONOMOUS ECONOMIES</span>
        <span><CircleHelp size={13} /> Local simulation · NEAR wallet and on-chain settlement are not enabled yet</span>
      </footer>

      {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}
    </main>

    {tourOpen && tourStep && <div className="tour-layer">
      <div className="tour-backdrop" />
      <section className="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <div className="tour-topline"><span><BookOpen size={14} /> BAZAAR FIELD GUIDE</span><button onClick={finishTour} aria-label="Close tour"><X size={17} /></button></div>
        <div className="tour-progress" aria-label={'Step ' + (tourIndex + 1) + ' of ' + tourSteps.length}>
          {tourSteps.map((step, index) => <i key={step.eyebrow} className={index <= tourIndex ? 'complete' : ''} />)}
        </div>
        <div className="tour-eyebrow">{tourStep.eyebrow}</div>
        <h2 id="tour-title">{tourStep.title}</h2>
        <p>{tourStep.body}</p>
        <div className="tour-tip"><Sparkles size={15} /><span>{tourStep.tip}</span></div>
        <div className="tour-footer">
          <button className="skip-tour" onClick={finishTour}>Skip tour</button>
          <div className="tour-nav">
            <span>{tourIndex + 1} / {tourSteps.length}</span>
            <button className="tour-back-btn" onClick={() => setTourIndex(i => Math.max(0, i - 1))} disabled={tourIndex === 0} aria-label="Previous step"><ChevronLeft size={17} /></button>
            {tourIndex === tourSteps.length - 1
              ? <button className="tour-next-btn" onClick={finishTour}><Check size={15} /> Finish guide</button>
              : <button className="tour-next-btn" onClick={() => setTourIndex(i => Math.min(tourSteps.length - 1, i + 1))}>Next <ChevronRight size={16} /></button>}
          </div>
        </div>
      </section>
    </div>}
  </div>;
}
