import { useState, useMemo } from 'react';
import { useLogisticsTelemetry } from './useLogisticsTelemetry';
import type { FleetVehicle, LogisticsOrder, LogisticsAlert } from './useLogisticsTelemetry';
import './LogisticsTelemetry.css';

const HUB_COORDS: Record<string,{x:number,y:number}> = {
  "hub-koramangala":{x:45,y:48},"hub-indiranagar":{x:55,y:30},"hub-whitefield":{x:82,y:35},
  "hub-electronic-city":{x:50,y:80},"hub-jayanagar":{x:35,y:50},"hub-hsr-layout":{x:48,y:62},
  "hub-marathahalli":{x:70,y:38},"hub-btm-layout":{x:40,y:60},
};

function latLngToXY(lat:number, lng:number) {
  const x = ((lng - 77.55) / 0.25) * 90 + 5;
  const y = ((12.99 - lat) / 0.18) * 90 + 5;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

const STATUS_COLORS: Record<string,string> = {
  "pending":"#879596","picked-up":"#FF9900","in-transit":"#007185",
  "out-for-delivery":"#B12704","delivered":"#137333","returned":"#C5221F",
};

const VEHICLE_ICONS: Record<string,string> = { bike:"🏍️", van:"🚐", truck:"🚛", "ev-pod":"⚡" };
const SEVERITY_COLORS: Record<string,string> = { high:"#C5221F", medium:"#FF9900", low:"#007185" };

type TabType = 'map' | 'fleet' | 'orders' | 'alerts';

export default function LogisticsTelemetry({ role = 'admin' }: { role?: 'buyer' | 'seller' | 'admin' }) {
  const { fleet, orders, alerts, metrics, connected, orderUpdates } = useLogisticsTelemetry();
  const [tab, setTab] = useState<TabType>(role === 'buyer' ? 'orders' : 'map');
  const [selectedVehicle, setSelectedVehicle] = useState<string|null>(null);
  const [orderFilter, setOrderFilter] = useState('all');

  const displayOrders = useMemo(() => {
    if (role === 'buyer') {
      const activeOrders = orders.filter(o => o.status === 'out-for-delivery' || o.status === 'in-transit');
      return activeOrders.length > 0 ? [activeOrders[0]] : orders.slice(0, 1);
    }
    return orders;
  }, [orders, role]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return displayOrders;
    return displayOrders.filter(o => o.status === orderFilter);
  }, [displayOrders, orderFilter]);

  const selectedV = fleet.find(v => v.vehicleId === selectedVehicle);

  return (
    <section className="ds-module-root">
      {/* Connection indicator */}
      <div className="ds-header">
        <div className="ui-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="ds-title">{role === 'buyer' ? 'Track My Orders' : 'Real-Time Logistics Telemetry'}</h2>
            <p className="ds-subtitle">{role === 'buyer' ? 'Live updates for your incoming deliveries' : 'Live GPS Tracking • Operations Command Center'}</p>
          </div>
          <div className={`lt-conn-badge ${connected ? 'lt-conn-live' : ''}`}>
            <span className="lt-conn-dot" /> {connected ? 'LIVE' : 'CONNECTING...'}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      {role === 'admin' && (
        <div className="ds-kpi-grid">
          <div className="ds-kpi-card" style={{ borderLeft: '4px solid var(--ds-accent)' }}>
            <div className="ds-kpi-val">{metrics.fleetUtilization}%</div>
            <div className="ds-kpi-label">Fleet Utilization</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val">{metrics.activeVehicles} <span style={{fontSize:'1rem', color:'var(--ds-text-tertiary)'}}>/ {metrics.totalFleetSize}</span></div>
            <div className="ds-kpi-label">Active Vehicles</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val">{metrics.ordersInTransit}</div>
            <div className="ds-kpi-label">In Transit</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val" style={{color: 'var(--ds-success-text)'}}>{metrics.ordersDelivered}</div>
            <div className="ds-kpi-label">Delivered</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val">{metrics.avgETA} min</div>
            <div className="ds-kpi-label">Avg ETA</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val" style={{color: 'var(--ds-success-text)'}}>{metrics.onTimeRate}%</div>
            <div className="ds-kpi-label">On-Time Rate</div>
          </div>
          <div className="ds-kpi-card">
            <div className="ds-kpi-val">{metrics.avgSpeed_kmh} km/h</div>
            <div className="ds-kpi-label">Avg Speed</div>
          </div>
          <div className="ds-kpi-card" style={{ borderLeft: '4px solid #007185' }}>
            <div className="ds-kpi-val" style={{color: '#007185'}}>{metrics.totalCarbonSaved_kg} kg</div>
            <div className="ds-kpi-label">CO₂ Saved</div>
          </div>
        </div>
      )}

      {/* Tab Nav */}
      {role === 'admin' && (
        <div className="ds-filter-bar" style={{ padding: '0.5rem', marginTop: '1rem', marginBottom: '0' }}>
          {(['map','fleet','orders','alerts'] as TabType[]).map(t => (
            <button key={t} className={tab===t?'ds-btn-primary':'ds-btn-secondary'} onClick={()=>setTab(t)}>
              {t==='map'?'🗺️ Live Map':t==='fleet'?`🚛 Fleet (${fleet.length})`:t==='orders'?`📦 Orders (${displayOrders.length})`:`🚨 Alerts (${alerts.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="ds-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'map' && <MapView fleet={fleet} orders={orders} selected={selectedVehicle} onSelect={setSelectedVehicle} selectedV={selectedV} />}
        {tab === 'fleet' && <FleetTable fleet={fleet} onSelect={setSelectedVehicle} />}
        {tab === 'orders' && <OrdersView orders={filteredOrders} filter={orderFilter} setFilter={setOrderFilter} updates={orderUpdates} />}
        {tab === 'alerts' && <AlertsView alerts={alerts} />}
      </div>
    </section>
  );
}



function MapView({fleet,orders,selected,onSelect,selectedV}:{fleet:FleetVehicle[];orders:LogisticsOrder[];selected:string|null;onSelect:(id:string|null)=>void;selectedV?:FleetVehicle}) {
  return (
    <div className="lt-map-wrap">
      <div className="lt-map-container">
        <div className="lt-map-grid" />
        <svg className="lt-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Hub markers */}
          {Object.entries(HUB_COORDS).map(([id,{x,y}]) => (
            <g key={id}>
              <circle cx={x} cy={y} r="1.8" fill="none" stroke="#FF9900" strokeWidth="0.3" opacity="0.6" />
              <circle cx={x} cy={y} r="0.8" fill="#FF9900" opacity="0.8" />
              <text x={x} y={y+3.5} textAnchor="middle" fill="#879596" fontSize="2" fontWeight="600">{id.replace('hub-','').replace('-',' ')}</text>
            </g>
          ))}
          {/* Order routes */}
          {orders.filter(o=>o.status==='in-transit'||o.status==='out-for-delivery').slice(0,10).map(o => {
            const from = latLngToXY(o.originLat, o.originLng);
            const to = latLngToXY(o.destLat, o.destLng);
            return <line key={o.orderId} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#007185" strokeWidth="0.2" strokeDasharray="1 0.5" opacity="0.4" />;
          })}
          {/* Vehicle markers */}
          {fleet.map(v => {
            const {x,y} = latLngToXY(v.lat, v.lng);
            const isSel = v.vehicleId === selected;
            const col = v.status==='en-route'?'#137333':v.status==='returning'?'#FF9900':'#879596';
            return (
              <g key={v.vehicleId} onClick={()=>onSelect(isSel?null:v.vehicleId)} style={{cursor:'pointer'}}>
                {isSel && <circle cx={x} cy={y} r="3" fill="none" stroke="#FF9900" strokeWidth="0.4" className="lt-pulse-ring" />}
                <circle cx={x} cy={y} r={isSel?1.5:1} fill={col} stroke="#FFF" strokeWidth="0.3" />
                {isSel && <text x={x} y={y-2.5} textAnchor="middle" fill="#131A22" fontSize="1.8" fontWeight="700">{v.vehicleId}</text>}
              </g>
            );
          })}
        </svg>
        {/* Legend */}
        <div className="lt-map-legend">
          <span><span className="lt-legend-dot" style={{background:'#137333'}}/> En Route</span>
          <span><span className="lt-legend-dot" style={{background:'#FF9900'}}/> Returning</span>
          <span><span className="lt-legend-dot" style={{background:'#879596'}}/> Idle</span>
          <span><span className="lt-legend-dot" style={{background:'#FF9900',borderRadius:0,width:8,height:8}}/> Hub</span>
        </div>
      </div>
      {/* Vehicle Detail Card */}
      {selectedV && (
        <div className="lt-vehicle-detail">
          <div className="lt-vd-header">
            <span className="lt-vd-icon">{VEHICLE_ICONS[selectedV.type]||'🚗'}</span>
            <div>
              <h4 className="lt-vd-id">{selectedV.vehicleId}</h4>
              <span className="lt-vd-type">{selectedV.type.toUpperCase()} • {selectedV.driverName}</span>
            </div>
            <span className={`lt-vd-status lt-vd-status-${selectedV.status}`}>{selectedV.status}</span>
          </div>
          <div className="lt-vd-grid">
            <div className="lt-vd-stat"><span>Speed</span><strong>{selectedV.speed_kmh.toFixed(1)} km/h</strong></div>
            <div className="lt-vd-stat"><span>ETA</span><strong>{selectedV.eta_minutes.toFixed(0)} min</strong></div>
            <div className="lt-vd-stat"><span>Fuel</span><strong>{selectedV.fuel_pct.toFixed(0)}%</strong></div>
            <div className="lt-vd-stat"><span>Load</span><strong>{selectedV.capacity_used}/{selectedV.capacity_total}</strong></div>
            <div className="lt-vd-stat"><span>Hub</span><strong>{selectedV.hub.replace('hub-','')}</strong></div>
            <div className="lt-vd-stat"><span>Heading</span><strong>{selectedV.heading.toFixed(0)}°</strong></div>
          </div>
          {/* Fuel bar */}
          <div className="lt-fuel-bar-wrap">
            <div className="lt-fuel-bar" style={{width:`${selectedV.fuel_pct}%`,background:selectedV.fuel_pct<20?'#C5221F':selectedV.fuel_pct<50?'#FF9900':'#137333'}} />
          </div>
        </div>
      )}
    </div>
  );
}

function FleetTable({fleet,onSelect}:{fleet:FleetVehicle[];onSelect:(id:string)=>void}) {
  return (
    <div className="lt-table-wrap">
      <table className="lt-table">
        <thead><tr>
          <th>Vehicle</th><th>Type</th><th>Driver</th><th>Status</th><th>Speed</th><th>ETA</th><th>Fuel</th><th>Load</th><th>Hub</th>
        </tr></thead>
        <tbody>
          {fleet.map(v => (
            <tr key={v.vehicleId} onClick={()=>onSelect(v.vehicleId)} className="lt-table-row">
              <td className="lt-table-id">{v.vehicleId}</td>
              <td>{VEHICLE_ICONS[v.type]||'🚗'} {v.type}</td>
              <td>{v.driverName}</td>
              <td><span className={`lt-status-pill lt-sp-${v.status}`}>{v.status}</span></td>
              <td>{v.speed_kmh.toFixed(1)} km/h</td>
              <td>{v.eta_minutes.toFixed(0)} min</td>
              <td>
                <div className="lt-mini-bar"><div style={{width:`${v.fuel_pct}%`,background:v.fuel_pct<20?'#C5221F':'#137333'}}/></div>
                {v.fuel_pct.toFixed(0)}%
              </td>
              <td>{v.capacity_used}/{v.capacity_total}</td>
              <td>{v.hub.replace('hub-','')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersView({orders,filter,setFilter,updates}:{orders:LogisticsOrder[];filter:string;setFilter:(f:string)=>void;updates:any[]}) {
  return (
    <div className="lt-orders-wrap">
      <div className="lt-orders-toolbar">
        {['all','pending','picked-up','in-transit','out-for-delivery','delivered'].map(f => (
          <button key={f} className={`lt-filter-btn ${filter===f?'lt-filter-active':''}`} onClick={()=>setFilter(f)}>
            {f==='all'?'All':f.replace('-',' ')} {f!=='all' && <span className="lt-filter-count">{orders.filter(o=>f==='all'||o.status===f).length}</span>}
          </button>
        ))}
      </div>
      <div className="lt-orders-split">
        <div className="lt-orders-list">
          {orders.map(o => (
            <div key={o.orderId} className="lt-order-card">
              <div className="lt-oc-header">
                <span className="lt-oc-id">{o.orderId}</span>
                <span className="lt-oc-status" style={{color:STATUS_COLORS[o.status]||'#879596'}}>{o.status.replace('-',' ')}</span>
              </div>
              <div className="lt-oc-product">{o.productName}</div>
              <div className="lt-oc-row"><span>Customer</span><strong>{o.customerName}</strong></div>
              <div className="lt-oc-row"><span>Route</span><strong>{o.pathway}</strong></div>
              <div className="lt-oc-row"><span>ETA</span><strong>{o.eta_minutes.toFixed(0)} min</strong></div>
              <div className="lt-oc-row"><span>CO₂ Saved</span><strong style={{color:'#007185'}}>{o.carbonSaved_kg} kg</strong></div>
              {/* Progress bar */}
              <div className="lt-progress-wrap">
                <div className="lt-progress-bar" style={{width:`${o.progress}%`,background:STATUS_COLORS[o.status]||'#007185'}} />
              </div>
              <div className="lt-oc-progress-label">{o.progress.toFixed(0)}% complete</div>
            </div>
          ))}
        </div>
        {/* Live feed */}
        <div className="lt-live-feed">
          <h4 className="lt-feed-title">⚡ Live Order Events</h4>
          {updates.length === 0 && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: '#FAFBFC', border: '1px dashed #D5D9D9', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>📡</div>
              <h5 style={{ margin: '0 0 0.25rem 0', color: '#131A22' }}>Awaiting Telemetry</h5>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#565959' }}>Connecting to WebSocket stream. Live status changes from the fleet will appear here automatically.</p>
            </div>
          )}
          {updates.slice(0,15).map((u,i) => (
            <div key={i} className="lt-feed-item">
              <span className="lt-feed-dot" style={{background:STATUS_COLORS[u.newStatus]}} />
              <div>
                <strong>{u.orderId}</strong>
                <span className="lt-feed-transition">{u.previousStatus} → {u.newStatus}</span>
                <span className="lt-feed-time">{new Date(u.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertsView({alerts}:{alerts:LogisticsAlert[]}) {
  return (
    <div className="lt-alerts-wrap">
      {alerts.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #EAEAEA', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#137333' }}>🛡️</div>
          <h3 style={{ color: '#131A22', marginBottom: '0.5rem' }}>No Active Operations Alerts</h3>
          <p style={{ color: '#565959', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
            All fleets are operating nominally. Any anomalies related to route deviations, battery levels, or delivery delays will trigger an alert here.
          </p>
        </div>
      )}
      {alerts.map((a,i) => (
        <div key={a.alertId+i} className={`lt-alert-card lt-alert-${a.severity}`}>
          <div className="lt-alert-header">
            <span className="lt-alert-sev" style={{background:SEVERITY_COLORS[a.severity]}}>{a.severity.toUpperCase()}</span>
            <span className="lt-alert-type">{a.type.replace('_',' ')}</span>
            <span className="lt-alert-time">{new Date(a.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="lt-alert-msg">{a.message}</p>
          <span className="lt-alert-vehicle">{a.vehicleId}</span>
        </div>
      ))}
    </div>
  );
}
