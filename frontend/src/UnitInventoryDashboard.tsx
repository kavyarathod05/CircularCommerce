import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import './UnitInventoryDashboard.css';

interface RepairRecord {
  date: string;
  action: string;
  cost: number;
}

interface Unit {
  unit_id: string;
  sku: string;
  product_name: string;
  msrp: number;
  condition_grade: string;
  condition_desc: string;
  residual_value: number;
  co2_saved_kg: number;
  repair_history: RepairRecord[];
  status: string;
  date_acquired: string;
}

const GRADE_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'A': { bg: '#E6F4EA', text: '#137333', border: '#CEEAD6' },
  'B': { bg: '#E8F0FE', text: '#1967D2', border: '#D2E3FC' },
  'C': { bg: '#FEF7E0', text: '#B08D00', border: '#FEEFC3' },
  'D': { bg: '#FCE8E6', text: '#C5221F', border: '#FAD2CF' },
};

export default function UnitInventoryDashboard() {
  const { authFetch } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [filterSku, setFilterSku] = useState<string>('ALL');

  const mlApiUrl = (import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${mlApiUrl}/api/v1/inventory/units`);
      const json = await res.json();
      if (json.status === 'success') {
        setUnits(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch inventory', e);
    }
    setLoading(false);
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      new_grade: formData.get('new_grade') as string,
      new_status: formData.get('new_status') as string,
      repair_action: formData.get('repair_action') as string,
      repair_cost: parseFloat(formData.get('repair_cost') as string || '0')
    };

    try {
      const res = await authFetch(`${mlApiUrl}/api/v1/inventory/units/${selectedUnit.unit_id}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.status === 'success') {
        // Refresh data
        fetchInventory();
        setSelectedUnit(json.data);
      }
    } catch (e) {
      console.error('Failed to submit repair', e);
    }
  };

  const skus = useMemo(() => Array.from(new Set(units.map(u => u.sku))), [units]);
  const filteredUnits = useMemo(() => 
    filterSku === 'ALL' ? units : units.filter(u => u.sku === filterSku),
  [units, filterSku]);

  // Aggregate stats
  const totalValue = units.reduce((sum, u) => sum + u.residual_value, 0);
  const totalMSRP = units.reduce((sum, u) => sum + u.msrp, 0);
  const valuePreserved = totalMSRP > 0 ? (totalValue / totalMSRP) * 100 : 0;
  const inRepair = units.filter(u => u.status === 'In Repair').length;

  return (
    <section className="ds-module-root">
      <div className="ds-header">
        <div className="ui-title-row">
          <div>
            <h2 className="ds-title">Unit-Level Inventory Management</h2>
            <p className="ds-subtitle">TWICE Commerce Architecture • Track Individual Item Lifecycle & Residual Value</p>
          </div>
        </div>
      </div>

      <div className="ds-kpi-grid">
        <div className="ds-kpi-card">
          <div className="ds-kpi-val">{units.length}</div>
          <div className="ds-kpi-label">Total Units Tracked</div>
        </div>
        <div className="ds-kpi-card">
          <div className="ds-kpi-val">₹{totalValue.toLocaleString()}</div>
          <div className="ds-kpi-label">Current Residual Value</div>
        </div>
        <div className="ds-kpi-card">
          <div className="ds-kpi-val">{valuePreserved.toFixed(1)}%</div>
          <div className="ds-kpi-label">Value Preserved vs MSRP</div>
        </div>
        <div className="ds-kpi-card" style={{ borderLeft: '4px solid #C5221F' }}>
          <div className="ds-kpi-val">{inRepair}</div>
          <div className="ds-kpi-label">Units in Repair</div>
        </div>
      </div>

      <div className="ui-main-grid">
        <div className="ds-panel">
          <div className="ds-filter-bar">
            <select value={filterSku} onChange={e => setFilterSku(e.target.value)} className="ds-select">
              <option value="ALL">All SKUs</option>
              {skus.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="ds-btn-secondary" onClick={fetchInventory}>↻ Refresh</button>
          </div>

          <div className="ui-table-container">
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                <h3 style={{ color: '#131A22', marginBottom: '0.5rem' }}>Fetching Unit Ledger</h3>
                <p style={{ color: '#565959' }}>Retrieving condition grades and residual values...</p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="ds-empty-state">
                <div className="ds-empty-icon">📋</div>
                <h3 className="ds-empty-title">No Units Found</h3>
                <p className="ds-empty-text">
                  {filterSku === 'ALL' 
                    ? "Your unit-level inventory ledger is currently empty. Items will appear here once returns have been processed and graded." 
                    : `No individual units found for SKU "${filterSku}". Try selecting a different SKU or clearing the filter.`}
                </p>
                {filterSku !== 'ALL' && (
                  <button onClick={() => setFilterSku('ALL')} className="ds-btn-secondary" style={{ marginTop: '1rem' }}>Clear Filter</button>
                )}
              </div>
            ) : (
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>Product</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Residual Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map(unit => {
                    const gradeColors = GRADE_COLORS[unit.condition_grade] || GRADE_COLORS['C'];
                    const isSelected = selectedUnit?.unit_id === unit.unit_id;
                    return (
                      <tr 
                        key={unit.unit_id} 
                        onClick={() => setSelectedUnit(unit)}
                        className={`ds-table-row-clickable ${isSelected ? 'ds-table-row-active' : ''}`}
                      >
                        <td className="ui-id-cell"><b>{unit.unit_id}</b></td>
                        <td>
                          <div className="ui-prod-name" style={{ fontWeight: 600 }}>{unit.product_name}</div>
                          <div className="ui-prod-sku" style={{ fontSize: '0.8rem', color: 'var(--ds-text-tertiary)' }}>{unit.sku}</div>
                        </td>
                        <td>
                          <span 
                            className="ds-badge" 
                            style={{ backgroundColor: gradeColors.bg, color: gradeColors.text, borderColor: gradeColors.border }}
                          >
                            Grade {unit.condition_grade}
                          </span>
                        </td>
                        <td>
                          <span className={`ui-status-dot ${unit.status === 'In Repair' ? 'dot-red' : 'dot-green'}`}></span>
                          {unit.status}
                        </td>
                        <td className="ui-val-cell">
                          <div className="ui-val-current" style={{ fontWeight: 700, color: 'var(--ds-success-text)' }}>₹{unit.residual_value.toLocaleString()}</div>
                          <div className="ui-val-msrp" style={{ fontSize: '0.8rem', color: 'var(--ds-text-tertiary)' }}>MSRP: ₹{unit.msrp.toLocaleString()}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ds-panel">
          {selectedUnit ? (
            <div className="ui-detail-card">
              <h3 className="ds-section-title">Unit Details</h3>
              <div className="ui-detail-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--ds-border)', paddingBottom: '1rem' }}>
                <div className="ui-dh-id" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedUnit.unit_id}</div>
                <div className="ui-dh-name" style={{ color: 'var(--ds-text-secondary)' }}>{selectedUnit.product_name}</div>
              </div>
              
              <div className="ui-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="ui-dg-item">
                  <span className="ds-kpi-label">SKU</span>
                  <span className="ui-dg-val" style={{ fontWeight: 600 }}>{selectedUnit.sku}</span>
                </div>
                <div className="ui-dg-item">
                  <span className="ds-kpi-label">Acquired</span>
                  <span className="ui-dg-val" style={{ fontWeight: 600 }}>{selectedUnit.date_acquired}</span>
                </div>
                <div className="ui-dg-item">
                  <span className="ds-kpi-label">CO₂ Saved</span>
                  <span className="ui-dg-val" style={{color: 'var(--ds-success-text)', fontWeight: 600}}>{selectedUnit.co2_saved_kg} kg</span>
                </div>
                <div className="ui-dg-item">
                  <span className="ds-kpi-label">Condition</span>
                  <span className="ui-dg-val" style={{ fontWeight: 600 }}>Grade {selectedUnit.condition_grade} - {selectedUnit.condition_desc}</span>
                </div>
              </div>

              <div className="ui-depreciation-box">
                <div className="ui-dep-header">Value Depreciation</div>
                <div className="ui-dep-bar">
                  <div 
                    className="ui-dep-fill" 
                    style={{ width: `${(selectedUnit.residual_value / selectedUnit.msrp) * 100}%`}}
                  ></div>
                </div>
                <div className="ui-dep-labels">
                  <span>₹0</span>
                  <span>Current: ₹{selectedUnit.residual_value.toLocaleString()}</span>
                  <span>MSRP: ₹{selectedUnit.msrp.toLocaleString()}</span>
                </div>
              </div>

              <div className="ui-history-section">
                <h4 className="ui-section-title">Lifecycle & Repair History</h4>
                {selectedUnit.repair_history.length === 0 ? (
                  <p className="ui-no-history">No repairs logged for this unit.</p>
                ) : (
                  <ul className="ui-timeline">
                    {selectedUnit.repair_history.map((record, idx) => (
                      <li key={idx} className="ui-timeline-item">
                        <div className="ui-tl-date">{record.date}</div>
                        <div className="ui-tl-content">
                          <div className="ui-tl-action">{record.action}</div>
                          <div className="ui-tl-cost">Cost: ₹{record.cost}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ui-action-section" style={{ marginTop: '2rem' }}>
                <h4 className="ds-section-title">Log Repair / Grade Update</h4>
                <form onSubmit={handleRepairSubmit} className="ui-repair-form">
                  <div className="ui-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="ui-form-group">
                      <label className="ds-kpi-label">New Grade</label>
                      <select name="new_grade" defaultValue={selectedUnit.condition_grade} className="ds-select" style={{ width: '100%', marginTop: '0.25rem' }}>
                        <option value="A">Grade A (Pristine)</option>
                        <option value="B">Grade B (Minor wear)</option>
                        <option value="C">Grade C (Functional)</option>
                        <option value="D">Grade D (Needs Repair)</option>
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className="ds-kpi-label">New Status</label>
                      <select name="new_status" defaultValue={selectedUnit.status === 'In Repair' ? 'Available' : selectedUnit.status} className="ds-select" style={{ width: '100%', marginTop: '0.25rem' }}>
                        <option value="Available">Available</option>
                        <option value="In Repair">In Repair</option>
                        <option value="Listed">Listed</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>
                  </div>
                  <div className="ui-form-group" style={{ marginBottom: '1rem' }}>
                    <label className="ds-kpi-label">Action Taken (Optional)</label>
                    <input type="text" name="repair_action" placeholder="e.g., Replaced battery, cleaned screen" className="ds-input" style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
                  </div>
                  <div className="ui-form-group" style={{ marginBottom: '1rem' }}>
                    <label className="ds-kpi-label">Repair Cost (₹)</label>
                    <input type="number" name="repair_cost" defaultValue="0" min="0" className="ds-input" style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
                  </div>
                  <button type="submit" className="ds-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Update Unit</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="ds-empty-state">
              <div className="ds-empty-icon">📦</div>
              <h3 className="ds-empty-title">Select a Unit</h3>
              <p className="ds-empty-text">Click on any unit in the inventory list to view its individualized lifecycle, depreciation, and repair history.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
