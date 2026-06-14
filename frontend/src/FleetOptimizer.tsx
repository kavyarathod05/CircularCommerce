import { useState, useMemo } from 'react';
import './FleetOptimizer.css';

const ROUTE_COLORS = ['#137333','#FF9900','#007185','#C5221F','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#6366F1','#EF4444'];
const VT_COLORS: Record<string,string> = {'cargo-bike':'#137333','ev-pod':'#007185','hybrid-van':'#FF9900','diesel-truck':'#C5221F'};

interface StopCoord { lat:number; lng:number; id:string; }
interface RouteData { route_id:string; vehicle_type:string; vehicle_name:string; icon:string; stops:string[]; stop_coords:StopCoord[]; num_stops:number; demand:number; capacity:number; utilization:number; distance_km:number; cost:number; co2_kg:number; time_min:number; is_zero_emission:boolean; green_zone_stops:boolean; }
interface FleetComp { count:number; total_cost:number; total_co2:number; total_dist:number; name:string; icon:string; }
interface KPIs { total_vehicles:number; total_cost:number; total_co2_kg:number; total_distance_km:number; sustainability_score:number; green_compliance:number; green_violations:number; zero_emission_pct:number; avg_utilization:number; }
interface EvoPt { generation:number; best_cost:number; best_emission:number; best_combined:number; avg_combined:number; }
interface DelPt { id:string; lat:number; lng:number; demand:number; priority:number; green_zone:boolean; }
interface OptResult {
  scenario:{ depot:string; depot_lat:number; depot_lng:number; num_orders:number; total_demand:number; green_zone_orders:number; delivery_points:DelPt[] };
  clarke_wright:{ routes_created:number; total_distance_km:number; savings_vs_naive:number };
  ga_optimized:{ genome:{genome_id:string;fleet_counts:Record<string,number>;cost_weight:number;emission_weight:number}; evolution_history:EvoPt[] };
  routes:RouteData[]; fleet_composition:Record<string,FleetComp>; kpis:KPIs;
}

function latLngToXY(lat:number, lng:number, b:{minLat:number;maxLat:number;minLng:number;maxLng:number}) {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng + 0.001)) * 88 + 6;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat + 0.001)) * 88 + 6;
  return { x: Math.max(3,Math.min(97,x)), y: Math.max(3,Math.min(97,y)) };
}

export default function FleetOptimizer() {
  const [numOrders, setNumOrders] = useState(20);
  const [costWeight, setCostWeight] = useState(0.6);
  const [gaGens, setGaGens] = useState(15);
  const [status, setStatus] = useState<'idle'|'running'|'done'>('idle');
  const [result, setResult] = useState<OptResult|null>(null);
  const mlApi = (import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000');

  const run = async () => {
    setStatus('running'); setResult(null);
    try {
      const res = await fetch(`${mlApi}/api/v1/fleet/optimize`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ num_orders:numOrders, cost_weight:costWeight, emission_weight:+(1-costWeight).toFixed(2), ga_generations:gaGens })
      });
      const json = await res.json();
      if (json.status === 'success') setResult(json.data);
    } catch(e) { console.error('Fleet opt failed', e); }
    setStatus('done');
  };

  const k = result?.kpis;
  const bounds = useMemo(() => {
    if (!result) return {minLat:12.8,maxLat:13,minLng:77.5,maxLng:77.8};
    const pts = result.scenario.delivery_points;
    const dep = {lat:result.scenario.depot_lat,lng:result.scenario.depot_lng};
    const lats = [...pts.map(p=>p.lat),dep.lat], lngs = [...pts.map(p=>p.lng),dep.lng];
    return {minLat:Math.min(...lats)-0.005,maxLat:Math.max(...lats)+0.005,minLng:Math.min(...lngs)-0.005,maxLng:Math.max(...lngs)+0.005};
  }, [result]);

  return (
    <section className="ds-module-root">
      <div className="ds-header">
        <div className="fo-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="ds-title">Fleet Planning</h2>
            <p className="ds-subtitle">Plan greener delivery routes and vehicle mix for your hub</p>
          </div>
          <div className={`fo-status fo-status-${status}`}><span className="fo-status-dot"/>{status==='idle'?'READY':status==='running'?'SOLVING...':'OPTIMIZED'}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="ds-filter-bar" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-primary)' }}>Delivery Orders</label>
          <input type="number" min={5} max={50} value={numOrders} onChange={e=>setNumOrders(+e.target.value)} className="ds-input" style={{ width: '100px' }} />
        </div>
        <div className="fo-slider-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, minWidth: '300px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-primary)' }}>Objective Balance</label>
          <input type="range" className="fo-slider" min={0} max={100} value={costWeight*100} onChange={e=>setCostWeight(+e.target.value/100)}/>
          <div className="fo-slider-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ds-text-secondary)', fontWeight: 600 }}>
            <span style={{ color: '#137333' }}>Green focus ({((1-costWeight)*100).toFixed(0)}%)</span>
            <span>Cost focus ({(costWeight*100).toFixed(0)}%)</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-primary)' }}>GA Generations</label>
          <input type="number" min={5} max={50} value={gaGens} onChange={e=>setGaGens(+e.target.value)} className="ds-input" style={{ width: '100px' }} />
        </div>
        <button className="ds-btn-primary" onClick={run} disabled={status==='running'} style={{ height: '42px', padding: '0 2rem' }}>
          {status==='running'?<><span className="fo-spinner"/> Solving...</>:'Plan fleet'}
        </button>
      </div>

      {/* KPI Strip */}
      {result && k && (<>
        <div className="ds-kpi-grid">
          <div className="ds-kpi-card" style={{ borderLeft: '4px solid #137333' }}>
            <div className="ds-kpi-val" style={{color: '#137333'}}>{k.sustainability_score}</div>
            <div className="ds-kpi-label">Sustainability Score</div>
          </div>
          <div className="ds-kpi-card" style={{ borderLeft: '4px solid var(--ds-accent)' }}>
            <div className="ds-kpi-val">{k.total_vehicles}</div>
            <div className="ds-kpi-label">Vehicles</div>
          </div>
          <div className="ds-kpi-card"><div className="ds-kpi-val">₹{k.total_cost.toLocaleString()}</div><div className="ds-kpi-label">Total Cost</div></div>
          <div className="ds-kpi-card"><div className="ds-kpi-val" style={{color: '#137333'}}>{k.total_co2_kg.toFixed(1)}</div><div className="ds-kpi-label">CO₂ (kg)</div></div>
          <div className="ds-kpi-card"><div className="ds-kpi-val">{k.zero_emission_pct}%</div><div className="ds-kpi-label">Zero-Emission</div></div>
          <div className="ds-kpi-card"><div className="ds-kpi-val">{k.total_distance_km.toFixed(1)}</div><div className="ds-kpi-label">Distance (km)</div></div>
          <div className="ds-kpi-card"><div className="ds-kpi-val">{k.avg_utilization}%</div><div className="ds-kpi-label">Avg Load</div></div>
          <div className="ds-kpi-card"><div className="ds-kpi-val">{k.green_compliance}/{k.green_compliance+k.green_violations}</div><div className="ds-kpi-label">Green Compliance</div></div>
        </div>

        {/* Pipeline Steps */}
        <div className="fo-pipeline">
          <div className="fo-step"><span className="fo-step-num">1</span><div className="fo-step-title">Route grouping</div><div className="fo-step-val">{result.clarke_wright.savings_vs_naive}% saved</div><div className="fo-step-sub">{result.clarke_wright.routes_created} routes • {result.clarke_wright.total_distance_km} km</div></div>
          <div className="fo-step"><span className="fo-step-num">2</span><div className="fo-step-title">Vehicle assignment</div><div className="fo-step-val">Balanced plan</div><div className="fo-step-sub">Cost weight {result.ga_optimized.genome.cost_weight} · Green weight {result.ga_optimized.genome.emission_weight}</div></div>
          <div className="fo-step"><span className="fo-step-num">3</span><div className="fo-step-title">Fleet mix</div><div className="fo-step-val">{result.ga_optimized.evolution_history.length} iterations</div><div className="fo-step-sub">Fleet: {Object.entries(result.ga_optimized.genome.fleet_counts).filter(([,c])=>(c as number)>0).map(([t,c])=>`${t}:${c}`).join(', ')}</div></div>
        </div>

        <div className="fo-main-grid">
          {/* Left column */}
          <div>
            {/* Map */}
            <div className="ds-panel">
              <h3 className="ds-section-title">Route Map — {result.scenario.depot.replace('hub-','').replace(/-/g,' ')}</h3>
              <div className="fo-map-container" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <div className="fo-map-grid"/>
                <svg className="fo-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {(() => {const d=latLngToXY(result.scenario.depot_lat,result.scenario.depot_lng,bounds); return <><rect x={d.x-1.5} y={d.y-1.5} width="3" height="3" fill="#FF9900" rx="0.5"/><text x={d.x} y={d.y+4} textAnchor="middle" fill="#FF9900" fontSize="2.2" fontWeight="700">DEPOT</text></>;})()}
                  {/* Green zone circles */}
                  {result.scenario.delivery_points.filter(p=>p.green_zone).map((p,i) => {const xy=latLngToXY(p.lat,p.lng,bounds); return <circle key={`gz-${i}`} cx={xy.x} cy={xy.y} r="4" fill="rgba(19,115,51,0.08)" stroke="#137333" strokeWidth="0.2" strokeDasharray="1,1"/>;})}
                  {result.routes.map((route,ri) => {
                    const color = VT_COLORS[route.vehicle_type]||ROUTE_COLORS[ri%ROUTE_COLORS.length];
                    const depXY=latLngToXY(result.scenario.depot_lat,result.scenario.depot_lng,bounds);
                    let parts:string[]=[]; let prev=depXY;
                    for(const sc of route.stop_coords){const xy=latLngToXY(sc.lat,sc.lng,bounds);parts.push(`M${prev.x},${prev.y} L${xy.x},${xy.y}`);prev=xy;}
                    parts.push(`M${prev.x},${prev.y} L${depXY.x},${depXY.y}`);
                    return <g key={ri}>
                      <path d={parts.join(' ')} stroke={color} strokeWidth="0.35" fill="none" opacity="0.7"/>
                      {route.stop_coords.map((sc,si)=>{const xy=latLngToXY(sc.lat,sc.lng,bounds); return <circle key={si} cx={xy.x} cy={xy.y} r="0.9" fill={color} stroke="#FFF" strokeWidth="0.15"/>;})}
                    </g>;
                  })}
                </svg>
              </div>
            </div>

            {/* Route Table */}
            <div className="ds-panel" style={{marginTop:'1.5rem', padding:0, overflow:'hidden'}}>
              <h3 className="ds-section-title" style={{padding:'1.5rem', margin:0}}>Route Breakdown</h3>
              <div className="ds-table-container" style={{borderLeft:'none',borderRight:'none',borderBottom:'none',borderRadius:0}}>
                <table className="ds-table">
                  <thead><tr><th>Route</th><th>Vehicle</th><th>Stops</th><th>Dist</th><th>Load</th><th>Cost</th><th>CO₂</th><th>Time</th><th>Green</th></tr></thead>
                  <tbody>
                    {result.routes.map((r,i) => (
                      <tr key={i}>
                        <td style={{fontWeight:700,color:VT_COLORS[r.vehicle_type]||'#131A22'}}>{r.route_id}</td>
                        <td>{r.icon} {r.vehicle_name}</td>
                        <td>{r.num_stops}</td>
                        <td>{r.distance_km} km</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <div style={{width:30,height:4,background:'#F0F2F2',borderRadius:2,overflow:'hidden'}}>
                              <div style={{width:`${Math.min(100,r.utilization)}%`,height:'100%',background:r.utilization>80?'#C5221F':r.utilization>50?'#FF9900':'#137333',borderRadius:2}}/>
                            </div>
                            {r.utilization}%
                          </div>
                        </td>
                        <td style={{fontWeight:600}}>₹{r.cost.toLocaleString()}</td>
                        <td style={{color:r.co2_kg===0?'#137333':'#C5221F',fontWeight:600}}>{r.co2_kg===0?'Zero':r.co2_kg.toFixed(2)}</td>
                        <td>{r.time_min.toFixed(0)}m</td>
                        <td>{r.green_zone_stops?<span className={r.is_zero_emission?'ds-badge ds-badge-success':'ds-badge ds-badge-error'}>{r.is_zero_emission?'✓ Compliant':'⚠ Violation'}</span>:'—'}</td>
                      </tr>
                    ))}
                    <tr style={{fontWeight:700,background:'#FAFBFC'}}>
                      <td colSpan={2}>TOTAL</td>
                      <td>{result.routes.reduce((a,r)=>a+r.num_stops,0)}</td>
                      <td>{k.total_distance_km.toFixed(1)} km</td>
                      <td>{k.avg_utilization}%</td>
                      <td style={{color:'#B12704'}}>₹{k.total_cost.toLocaleString()}</td>
                      <td style={{color:k.total_co2_kg===0?'#137333':'#C5221F'}}>{k.total_co2_kg.toFixed(2)} kg</td>
                      <td>—</td><td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evolution */}
            {result.ga_optimized.evolution_history.length>0 && (
              <div className="ds-panel" style={{marginTop:'1.5rem'}}>
                <h3 className="ds-section-title">GA Evolution Convergence</h3>
                <EvolutionChart history={result.ga_optimized.evolution_history}/>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            {/* Sustainability Gauge */}
            <div className="ds-panel">
              <h3 className="ds-section-title">Sustainability Index</h3>
              <div className="fo-gauge">
                <div className="fo-gauge-ring">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#F0F2F2" strokeWidth="6"/>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#137333" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${k.sustainability_score/100*213.6} 213.6`}/>
                  </svg>
                  <div className="fo-gauge-val">{k.sustainability_score}</div>
                </div>
                <div className="fo-gauge-info">
                  <strong>{k.zero_emission_pct}%</strong> of fleet is zero-emission<br/>
                  <strong>{k.total_co2_kg.toFixed(1)} kg</strong> CO₂ emitted<br/>
                  {k.green_violations===0?'✅ Full green-zone compliance':'⚠️ '+k.green_violations+' green-zone violation(s)'}
                </div>
              </div>
            </div>

            {/* Fleet Composition */}
            <div className="ds-panel">
              <h3 className="ds-section-title">Fleet Composition</h3>
              <div className="fo-fleet-bars">
                {Object.entries(result.fleet_composition).map(([vt,fc]) => {
                  const comp = fc as FleetComp;
                  const maxCount = Math.max(...Object.values(result.fleet_composition).map(v=>(v as FleetComp).count),1);
                  return (
                    <div key={vt} className="fo-fleet-bar-row">
                      <div className="fo-fleet-bar-label">{comp.icon} {comp.name}</div>
                      <div className="fo-fleet-bar-track">
                        <div className="fo-fleet-bar-fill" style={{width:`${comp.count/maxCount*100}%`,background:VT_COLORS[vt]||'#879596'}}>
                          {comp.count}
                        </div>
                      </div>
                      <div className="fo-fleet-bar-stat">₹{comp.total_cost.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison */}
            <div className="ds-panel">
              <h3 className="ds-section-title">Cost vs. All-Diesel Baseline</h3>
              {(() => {
                const allDieselCost = result.routes.reduce((a,r) => a + 400 + r.distance_km*10, 0);
                const allDieselCO2 = result.routes.reduce((a,r) => a + r.distance_km*0.21, 0);
                const costDiff = allDieselCost - k.total_cost;
                const co2Diff = allDieselCO2 - k.total_co2_kg;
                return <div style={{fontSize:'0.85rem',color:'#565959',lineHeight:1.8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>Diesel-only cost:</span><span style={{fontWeight:700}}>₹{allDieselCost.toFixed(0)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>Optimized cost:</span><span style={{fontWeight:700,color:'#137333'}}>₹{k.total_cost.toFixed(0)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid #EAEAEA',paddingTop:4,marginTop:4}}><span>💰 Cost saved:</span><span style={{fontWeight:700,color:costDiff>0?'#137333':'#C5221F'}}>{costDiff>0?'+':''}₹{costDiff.toFixed(0)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>🌍 CO₂ reduced:</span><span style={{fontWeight:700,color:'#137333'}}>{co2Diff.toFixed(1)} kg ({(co2Diff/Math.max(allDieselCO2,0.01)*100).toFixed(0)}%)</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>🌳 Trees equiv.:</span><span style={{fontWeight:700,color:'#137333'}}>{(co2Diff/21).toFixed(1)}</span></div>
                </div>;
              })()}
            </div>
          </div>
        </div>
      </>)}

      {/* Empty state */}
      {!result && status==='idle' && (
        <div className="ds-empty-state">
          <div className="ds-empty-icon" style={{ fontSize: '2rem', color: '#137333' }}>+</div>
          <h3 className="ds-empty-title">Plan your delivery fleet</h3>
          <p className="ds-empty-text">
            Set delivery volume and balance cost vs sustainability, then click <strong>Plan fleet</strong>.
          </p>
        </div>
      )}
    </section>
  );
}

function EvolutionChart({ history }: { history:EvoPt[] }) {
  const maxC = Math.max(...history.map(h=>h.avg_combined));
  const minC = Math.min(...history.map(h=>h.best_combined));
  const range = maxC - minC || 1;
  const avg = history.map((h,i) => `${(i/(history.length-1||1))*100},${100-((h.avg_combined-minC)/range)*90-5}`).join(' ');
  const best = history.map((h,i) => `${(i/(history.length-1||1))*100},${100-((h.best_combined-minC)/range)*90-5}`).join(' ');
  return (
    <>
      <div className="fo-evo-chart">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={avg} fill="none" stroke="#879596" strokeWidth="0.5" opacity="0.5"/>
          <polyline points={best} fill="none" stroke="#137333" strokeWidth="0.8"/>
        </svg>
      </div>
      <div style={{display:'flex',gap:'1.5rem',marginTop:'0.5rem',fontSize:'0.75rem',color:'#879596'}}>
        <span><span style={{display:'inline-block',width:12,height:3,background:'#137333',borderRadius:1,marginRight:4,verticalAlign:'middle'}}/>Best Fitness</span>
        <span><span style={{display:'inline-block',width:12,height:3,background:'#879596',borderRadius:1,marginRight:4,verticalAlign:'middle'}}/>Avg Population</span>
      </div>
    </>
  );
}
