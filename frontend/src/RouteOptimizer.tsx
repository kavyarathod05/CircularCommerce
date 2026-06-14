import { useState, useMemo } from 'react';
import './RouteOptimizer.css';

const VEHICLE_ICONS: Record<string,string> = { bike:'🏍️', van:'🚐', truck:'🚛', 'ev-pod':'⚡' };
const ROUTE_COLORS = ['#FF9900','#007185','#137333','#C5221F','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#6366F1','#EF4444','#10B981','#3B82F6'];

interface RouteData { vehicle_type:string; depot_hub:string; stops:string[]; num_stops:number; distance_km:number; cost:number; time_min:number; load:number; capacity:number; }
interface Solution { solution_id:string; vehicles_used:number; total_cost:number; total_emissions_kg:number; routes:RouteData[]; }
interface DeliveryPt { id:string; lat:number; lng:number; demand:number; }
interface EvolutionPt { generation:number; pareto_size:number; min_vehicles:number; min_cost:number; avg_cost:number; }
interface OptResult {
  scenario:{ depot:string; depot_lat:number; depot_lng:number; num_orders:number; delivery_points:DeliveryPt[] };
  config:{ pop_size:number; generations:number; crossover_rate:number; mutation_rate:number };
  pareto_front:Solution[]; best_vehicles:Solution|null; best_cost:Solution|null; knee_solution:Solution|null;
  evolution_history:EvolutionPt[];
}

function latLngToXY(lat:number, lng:number, bounds:{minLat:number;maxLat:number;minLng:number;maxLng:number}) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng + 0.001)) * 88 + 6;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat + 0.001)) * 88 + 6;
  return { x: Math.max(3,Math.min(97,x)), y: Math.max(3,Math.min(97,y)) };
}

export default function RouteOptimizer() {
  const [numOrders, setNumOrders] = useState(20);
  const [popSize, setPopSize] = useState(80);
  const [generations, setGenerations] = useState(100);
  const [status, setStatus] = useState<'idle'|'running'|'done'>('idle');
  const [result, setResult] = useState<OptResult|null>(null);
  const [selectedSol, setSelectedSol] = useState<string|null>(null);
  const mlApiUrl = (import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000');

  const runOptimization = async () => {
    setStatus('running'); setResult(null); setSelectedSol(null);
    try {
      const res = await fetch(`${mlApiUrl}/api/v1/routing/optimize`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ num_orders:numOrders, pop_size:popSize, generations })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setResult(json.data);
        setSelectedSol(json.data.knee_solution?.solution_id || json.data.pareto_front[0]?.solution_id || null);
      }
    } catch(e) { console.error('Optimization failed', e); }
    setStatus('done');
  };

  const sel = useMemo(() => result?.pareto_front.find(s => s.solution_id === selectedSol) || null, [result, selectedSol]);
  const knee = result?.knee_solution;
  const bestV = result?.best_vehicles;
  const bestC = result?.best_cost;

  // Compute bounds for map
  const bounds = useMemo(() => {
    if (!result) return { minLat:12.8, maxLat:13.0, minLng:77.5, maxLng:77.8 };
    const pts = result.scenario.delivery_points;
    const dep = { lat:result.scenario.depot_lat, lng:result.scenario.depot_lng };
    const allLats = [...pts.map(p=>p.lat), dep.lat];
    const allLngs = [...pts.map(p=>p.lng), dep.lng];
    return { minLat:Math.min(...allLats)-0.005, maxLat:Math.max(...allLats)+0.005, minLng:Math.min(...allLngs)-0.005, maxLng:Math.max(...allLngs)+0.005 };
  }, [result]);

  // Pareto chart bounds
  const pareto = result?.pareto_front || [];
  const pBounds = useMemo(() => {
    if (!pareto.length) return {minV:0,maxV:10,minC:0,maxC:5000};
    return {
      minV: Math.min(...pareto.map(s=>s.vehicles_used)) - 1,
      maxV: Math.max(...pareto.map(s=>s.vehicles_used)) + 1,
      minC: Math.min(...pareto.map(s=>s.total_cost)) * 0.9,
      maxC: Math.max(...pareto.map(s=>s.total_cost)) * 1.1,
    };
  }, [pareto]);

  return (
    <section className="ro-root">
      <div className="ro-header">
        <div className="ro-title-row">
          <div>
            <h2 className="ro-title">Route Planning</h2>
            <p className="ro-subtitle">Compare delivery plans by cost, vehicles needed, and emissions</p>
          </div>
          <div className={`ro-status ro-status-${status}`}>
            <span className="ro-status-dot" />
            {status === 'idle' ? 'READY' : status === 'running' ? 'OPTIMIZING...' : 'COMPLETE'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="ro-controls">
        <div className="ro-field">
          <label>Delivery Orders</label>
          <input type="number" min={5} max={60} value={numOrders} onChange={e=>setNumOrders(+e.target.value)} />
        </div>
        <div className="ro-field">
          <label>Population Size</label>
          <input type="number" min={20} max={200} value={popSize} onChange={e=>setPopSize(+e.target.value)} />
        </div>
        <div className="ro-field">
          <label>Generations</label>
          <input type="number" min={10} max={500} value={generations} onChange={e=>setGenerations(+e.target.value)} />
        </div>
        <button className="ro-run-btn" onClick={runOptimization} disabled={status==='running'}>
          {status==='running' ? <><span className="ro-spinner"/> Planning routes...</> : 'Plan routes'}
        </button>
      </div>

      {/* KPI Strip */}
      {result && knee && (
        <div className="ro-kpi-strip">
          <div className="ro-kpi ro-kpi-accent">
            <div className="ro-kpi-val">{pareto.length}</div>
            <div className="ro-kpi-label">Pareto Solutions</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">{knee.vehicles_used}</div>
            <div className="ro-kpi-label">Vehicles (Knee)</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">₹{knee.total_cost.toLocaleString()}</div>
            <div className="ro-kpi-label">Cost (Knee)</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">{bestV?.vehicles_used ?? '-'}</div>
            <div className="ro-kpi-label">Min Vehicles</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">₹{bestC?.total_cost.toLocaleString() ?? '-'}</div>
            <div className="ro-kpi-label">Min Cost</div>
          </div>
          <div className="ro-kpi ro-kpi-green">
            <div className="ro-kpi-val">{knee.total_emissions_kg.toFixed(1)} kg</div>
            <div className="ro-kpi-label">CO₂ Emissions</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">{result.scenario.num_orders}</div>
            <div className="ro-kpi-label">Orders</div>
          </div>
          <div className="ro-kpi">
            <div className="ro-kpi-val">{result.config.generations}</div>
            <div className="ro-kpi-label">Generations</div>
          </div>
        </div>
      )}

      {/* Main content */}
      {result && (
        <div className="ro-main-grid">
          {/* Left: Pareto chart + Map */}
          <div>
            <ParetoChart pareto={pareto} pBounds={pBounds} selected={selectedSol} onSelect={setSelectedSol} knee={knee} bestV={bestV} bestC={bestC} />
            {sel && <RouteMap solution={sel} points={result.scenario.delivery_points} depot={{lat:result.scenario.depot_lat, lng:result.scenario.depot_lng, name:result.scenario.depot}} bounds={bounds} />}
            {sel && <RouteTable solution={sel} />}
            <EvolutionChart history={result.evolution_history} />
          </div>
          {/* Right: Solution cards */}
          <div className="ro-solutions-panel">
            <h3 style={{margin:'0 0 0.5rem 0',fontSize:'1rem',color:'#131A22'}}>Pareto-Optimal Solutions</h3>
            {pareto.map(sol => (
              <div key={sol.solution_id} className={`ro-sol-card ${selectedSol===sol.solution_id?'ro-sol-selected':''}`} onClick={()=>setSelectedSol(sol.solution_id)}>
                {knee?.solution_id===sol.solution_id && <span className="ro-sol-badge ro-sol-badge-knee">★ KNEE</span>}
                {bestV?.solution_id===sol.solution_id && knee?.solution_id!==sol.solution_id && <span className="ro-sol-badge ro-sol-badge-min-v">MIN VEHICLES</span>}
                {bestC?.solution_id===sol.solution_id && knee?.solution_id!==sol.solution_id && <span className="ro-sol-badge ro-sol-badge-min-c">MIN COST</span>}
                <div className="ro-sol-header">
                  <span className="ro-sol-id">{sol.solution_id.toUpperCase()}</span>
                  <div className="ro-sol-objs">
                    <div className="ro-sol-obj"><span className="ro-sol-obj-val">{sol.vehicles_used}</span><span className="ro-sol-obj-label">Vehicles</span></div>
                    <div className="ro-sol-obj"><span className="ro-sol-obj-val">₹{sol.total_cost.toLocaleString()}</span><span className="ro-sol-obj-label">Cost</span></div>
                  </div>
                </div>
                <div className="ro-sol-routes">
                  {sol.routes.map((r,i) => {
                    const cls = r.vehicle_type==='bike'?'ro-route-pill-bike':r.vehicle_type==='van'?'ro-route-pill-van':r.vehicle_type==='truck'?'ro-route-pill-truck':'ro-route-pill-ev';
                    return <span key={i} className={`ro-route-pill ${cls}`}>{VEHICLE_ICONS[r.vehicle_type]||'🚗'} {r.num_stops} stops • {r.distance_km}km</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && status==='idle' && (
        <div style={{textAlign:'center',padding:'4rem 2rem',color:'#879596'}}>
          <h3 style={{color:'#131A22',fontWeight:800,fontSize:'1.3rem'}}>Plan delivery routes</h3>
          <p style={{maxWidth:500,margin:'0.5rem auto',lineHeight:1.6}}>
            Set the number of orders and click <strong>Plan routes</strong> to compare delivery options by cost and fleet size.
          </p>
        </div>
      )}
    </section>
  );
}

/* ===== Pareto Front Chart ===== */
function ParetoChart({ pareto, pBounds, selected, onSelect, knee, bestV, bestC }: {
  pareto:Solution[]; pBounds:{minV:number;maxV:number;minC:number;maxC:number};
  selected:string|null; onSelect:(id:string)=>void;
  knee:Solution|null; bestV:Solution|null; bestC:Solution|null;
}) {
  const toX = (v:number) => ((v - pBounds.minV) / (pBounds.maxV - pBounds.minV)) * 85 + 8;
  const toY = (c:number) => 92 - ((c - pBounds.minC) / (pBounds.maxC - pBounds.minC)) * 82;

  const sorted = [...pareto].sort((a,b) => a.vehicles_used - b.vehicles_used);
  const linePts = sorted.map(s => `${toX(s.vehicles_used)},${toY(s.total_cost)}`).join(' ');

  return (
    <div className="ro-pareto-card">
      <h3 className="ro-pareto-title">Pareto Front — Vehicles vs. Cost</h3>
      <div className="ro-pareto-chart">
        <div className="ro-pareto-grid" />
        <svg className="ro-pareto-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Axes */}
          <line x1="7" y1="93" x2="95" y2="93" stroke="#333" strokeWidth="0.3" />
          <line x1="7" y1="8" x2="7" y2="93" stroke="#333" strokeWidth="0.3" />
          <text x="50" y="99" textAnchor="middle" fill="#879596" fontSize="2.5" fontWeight="600">Vehicles Used →</text>
          <text x="2" y="50" textAnchor="middle" fill="#879596" fontSize="2.5" fontWeight="600" transform="rotate(-90,2,50)">Cost (₹) →</text>
          {/* Axis ticks */}
          {[0,0.25,0.5,0.75,1].map(t => {
            const v = pBounds.minV + t*(pBounds.maxV-pBounds.minV);
            const c = pBounds.minC + t*(pBounds.maxC-pBounds.minC);
            return <g key={t}>
              <text x={toX(v)} y="97" textAnchor="middle" fill="#666" fontSize="2">{Math.round(v)}</text>
              <text x="5" y={toY(c)+0.8} textAnchor="end" fill="#666" fontSize="1.8">{Math.round(c)}</text>
              <line x1="7" y1={toY(c)} x2="95" y2={toY(c)} stroke="#222" strokeWidth="0.1" />
            </g>;
          })}
          {/* Pareto front line */}
          {sorted.length > 1 && <polyline points={linePts} fill="none" stroke="#FF9900" strokeWidth="0.4" opacity="0.6" />}
          {/* Solution points */}
          {pareto.map(s => {
            const cx = toX(s.vehicles_used), cy = toY(s.total_cost);
            const isSel = s.solution_id === selected;
            const isKnee = s.solution_id === knee?.solution_id;
            const isBV = s.solution_id === bestV?.solution_id;
            const isBC = s.solution_id === bestC?.solution_id;
            const col = isKnee ? '#FF9900' : isBV ? '#137333' : isBC ? '#007185' : '#CCC';
            return (
              <g key={s.solution_id} onClick={()=>onSelect(s.solution_id)} style={{cursor:'pointer'}}>
                {isSel && <circle cx={cx} cy={cy} r="3.5" fill="none" stroke="#FF9900" strokeWidth="0.4" opacity="0.5" />}
                <circle cx={cx} cy={cy} r={isSel?2:isKnee?1.8:1.2} fill={col} stroke={isSel?'#FFF':'none'} strokeWidth="0.3" />
                {(isKnee||isBV||isBC) && <text x={cx} y={cy-3} textAnchor="middle" fill={col} fontSize="2" fontWeight="700">{isKnee?'★ Knee':isBV?'Min-V':'Min-₹'}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ro-pareto-legend">
        <span><span className="ro-legend-sq" style={{background:'#FF9900'}} /> Knee (Best Trade-off)</span>
        <span><span className="ro-legend-sq" style={{background:'#137333'}} /> Min Vehicles</span>
        <span><span className="ro-legend-sq" style={{background:'#007185'}} /> Min Cost</span>
        <span><span className="ro-legend-sq" style={{background:'#CCC'}} /> Other Pareto Solutions</span>
      </div>
    </div>
  );
}

/* ===== Route Map ===== */
function RouteMap({ solution, points, depot, bounds }: {
  solution:Solution; points:DeliveryPt[]; depot:{lat:number;lng:number;name:string};
  bounds:{minLat:number;maxLat:number;minLng:number;maxLng:number};
}) {
  const depXY = latLngToXY(depot.lat, depot.lng, bounds);
  const ptMap = Object.fromEntries(points.map(p => [p.id, p]));

  return (
    <div className="ro-map-container">
      <div className="ro-map-grid" />
      <svg className="ro-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Depot */}
        <rect x={depXY.x-1.5} y={depXY.y-1.5} width="3" height="3" fill="#FF9900" rx="0.5" />
        <text x={depXY.x} y={depXY.y+4} textAnchor="middle" fill="#FF9900" fontSize="2.2" fontWeight="700">{depot.name.replace('hub-','')}</text>
        {/* Routes */}
        {solution.routes.map((route, ri) => {
          const color = ROUTE_COLORS[ri % ROUTE_COLORS.length];
          const stopPts = route.stops.map(sid => ptMap[sid]).filter(Boolean);
          // Draw lines: depot → stops → depot
          let pathParts: string[] = [];
          let prev = depXY;
          for (const pt of stopPts) {
            const xy = latLngToXY(pt.lat, pt.lng, bounds);
            pathParts.push(`M${prev.x},${prev.y} L${xy.x},${xy.y}`);
            prev = xy;
          }
          pathParts.push(`M${prev.x},${prev.y} L${depXY.x},${depXY.y}`);
          return (
            <g key={ri}>
              <path d={pathParts.join(' ')} stroke={color} strokeWidth="0.35" fill="none" opacity="0.7" />
              {stopPts.map((pt, si) => {
                const xy = latLngToXY(pt.lat, pt.lng, bounds);
                return <circle key={si} cx={xy.x} cy={xy.y} r="0.9" fill={color} stroke="#FFF" strokeWidth="0.2" />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="ro-map-legend">
        <span>■ Depot</span>
        {solution.routes.map((r,i) => <span key={i} style={{color:ROUTE_COLORS[i%ROUTE_COLORS.length]}}>{VEHICLE_ICONS[r.vehicle_type]||'🚗'} Route {i+1}</span>)}
      </div>
    </div>
  );
}

/* ===== Route Table ===== */
function RouteTable({ solution }: { solution:Solution }) {
  return (
    <div className="ro-route-detail">
      <h3 className="ro-route-detail-title">Route Breakdown — Solution {solution.solution_id.toUpperCase()}</h3>
      <table className="ro-route-table">
        <thead><tr>
          <th>#</th><th>Type</th><th>Stops</th><th>Distance</th><th>Time</th><th>Load</th><th>Capacity</th><th>Utilization</th><th>Cost</th>
        </tr></thead>
        <tbody>
          {solution.routes.map((r,i) => (
            <tr key={i}>
              <td style={{fontWeight:700,color:ROUTE_COLORS[i%ROUTE_COLORS.length]}}>R{i+1}</td>
              <td>{VEHICLE_ICONS[r.vehicle_type]||'🚗'} {r.vehicle_type}</td>
              <td>{r.num_stops}</td>
              <td>{r.distance_km} km</td>
              <td>{r.time_min.toFixed(0)} min</td>
              <td>{r.load}</td>
              <td>{r.capacity}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                  <div style={{width:40,height:4,background:'#F0F2F2',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(100,r.load/r.capacity*100)}%`,height:'100%',background:r.load/r.capacity>0.8?'#C5221F':r.load/r.capacity>0.5?'#FF9900':'#137333',borderRadius:2}} />
                  </div>
                  {(r.load/r.capacity*100).toFixed(0)}%
                </div>
              </td>
              <td style={{fontWeight:700}}>₹{r.cost.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{fontWeight:700,background:'#F8F9FA'}}>
            <td colSpan={2}>TOTAL</td>
            <td>{solution.routes.reduce((a,r)=>a+r.num_stops,0)}</td>
            <td>{solution.routes.reduce((a,r)=>a+r.distance_km,0).toFixed(1)} km</td>
            <td>{solution.routes.reduce((a,r)=>a+r.time_min,0).toFixed(0)} min</td>
            <td>{solution.routes.reduce((a,r)=>a+r.load,0)}</td>
            <td>—</td><td>—</td>
            <td style={{color:'#B12704'}}>₹{solution.total_cost.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ===== Evolution Chart ===== */
function EvolutionChart({ history }: { history:EvolutionPt[] }) {
  if (!history.length) return null;
  const maxCost = Math.max(...history.map(h=>h.avg_cost));
  const minCost = Math.min(...history.map(h=>h.min_cost));
  const costRange = maxCost - minCost || 1;

  const avgLine = history.map((h,i) => {
    const x = (i / (history.length-1||1)) * 100;
    const y = 100 - ((h.avg_cost - minCost) / costRange) * 90 - 5;
    return `${x},${y}`;
  }).join(' ');
  const minLine = history.map((h,i) => {
    const x = (i / (history.length-1||1)) * 100;
    const y = 100 - ((h.min_cost - minCost) / costRange) * 90 - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="ro-evo-card">
      <h3 className="ro-evo-title">Evolution Convergence</h3>
      <div className="ro-evo-chart">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={avgLine} fill="none" stroke="#879596" strokeWidth="0.5" opacity="0.5" />
          <polyline points={minLine} fill="none" stroke="#FF9900" strokeWidth="0.8" />
        </svg>
      </div>
      <div style={{display:'flex',gap:'1.5rem',marginTop:'0.5rem',fontSize:'0.75rem',color:'#879596'}}>
        <span><span style={{display:'inline-block',width:12,height:3,background:'#FF9900',borderRadius:1,marginRight:4,verticalAlign:'middle'}} />Best Cost (Pareto Front)</span>
        <span><span style={{display:'inline-block',width:12,height:3,background:'#879596',borderRadius:1,marginRight:4,verticalAlign:'middle'}} />Avg Population Cost</span>
        <span>Generations: {history.length} | Final Pareto Size: {history[history.length-1]?.pareto_size}</span>
      </div>
    </div>
  );
}
