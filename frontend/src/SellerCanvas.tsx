import { useState, useEffect, useRef } from 'react';
import './SellerCanvas.css';

// Types for the canvas blocks
type BlockType = 'returns' | 'fraud' | 'pricing' | 'logistics';

interface CanvasBlock {
  id: string;
  type: BlockType;
  title: string;
}

export default function SellerCanvas() {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([
    { id: '1', type: 'returns', title: 'Return Interception Rules' }
  ]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPos, setCommandMenuPos] = useState({ top: 0, left: 0 });
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<BlockType | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle Notion-like "/" command to add modules
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/') {
      if (!showCommandMenu && activeSettingsPanel === null) {
        e.preventDefault();
        // Position menu near the bottom of the canvas blocks
        const rect = canvasRef.current?.getBoundingClientRect();
        setCommandMenuPos({ top: (rect?.bottom || 200) - 100, left: (rect?.left || 200) + 50 });
        setShowCommandMenu(true);
      }
    }
    if (e.key === 'Escape') {
      setShowCommandMenu(false);
      setActiveSettingsPanel(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandMenu, activeSettingsPanel]);

  const addBlock = (type: BlockType, title: string) => {
    setBlocks([...blocks, { id: Date.now().toString(), type, title }]);
    setShowCommandMenu(false);
  };

  const removeBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeSettingsPanel) setActiveSettingsPanel(null);
  };

  return (
    <div className="canvas-root">
      {/* Main Canvas Area */}
      <div className={`canvas-area ${activeSettingsPanel ? 'canvas-shrunk' : ''}`} ref={canvasRef}>
        <div className="canvas-header">
          <h1 className="canvas-title" contentEditable suppressContentEditableWarning>
            My SecondLife Workspace
          </h1>
          <p className="canvas-subtitle">Type '/' to add modules to your canvas</p>
        </div>

        <div className="canvas-blocks">
          {blocks.map((block) => (
            <div 
              key={block.id} 
              className={`canvas-block ${activeSettingsPanel === block.type ? 'block-active' : ''}`}
              onClick={() => setActiveSettingsPanel(block.type)}
            >
              <div className="block-header">
                <span className="block-icon">
                  {block.type === 'returns' && '📦'}
                  {block.type === 'fraud' && '🛡️'}
                  {block.type === 'pricing' && '💰'}
                  {block.type === 'logistics' && '🛰️'}
                </span>
                <span className="block-title">{block.title}</span>
                <div className="block-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setActiveSettingsPanel(block.type); }}>⚙️</button>
                  <button className="icon-btn" onClick={(e) => removeBlock(block.id, e)}>✕</button>
                </div>
              </div>
              
              <div className="block-preview">
                {/* Minimal preview of what the block is doing */}
                {block.type === 'returns' && <p>Intercepting Grade A & B items for local P2P matching.</p>}
                {block.type === 'fraud' && <p>GNN passive risk assessment is active.</p>}
                {block.type === 'pricing' && <p>Dynamic localized discounting enabled.</p>}
                {block.type === 'logistics' && <p>Tracking 42 active regional orders.</p>}
                <div className="block-insight">Click for advanced configuration ➔</div>
              </div>
            </div>
          ))}

          {/* Placeholder block to invite adding more */}
          <div 
            className="canvas-block block-placeholder" 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setCommandMenuPos({ top: rect.top, left: rect.left });
              setShowCommandMenu(true);
            }}
          >
            <span className="placeholder-text">+ Add a new module or type '/'</span>
          </div>
        </div>
      </div>

      {/* Notion-style Command Menu */}
      {showCommandMenu && (
        <div 
          className="command-menu" 
          style={{ top: commandMenuPos.top, left: commandMenuPos.left }}
        >
          <div className="cmd-header">Modules</div>
          
          <button className="cmd-item" onClick={() => addBlock('fraud', 'Fraud Shield Engine')}>
            <span className="cmd-icon">🛡️</span>
            <div className="cmd-text">
              <div className="cmd-name">Fraud Shield</div>
              <div className="cmd-desc">Add GNN-based risk assessment</div>
            </div>
          </button>
          
          <button className="cmd-item" onClick={() => addBlock('pricing', 'Dynamic Pricing')}>
            <span className="cmd-icon">💰</span>
            <div className="cmd-text">
              <div className="cmd-name">Dynamic Pricing</div>
              <div className="cmd-desc">Configure localized discount rates</div>
            </div>
          </button>
          
          <button className="cmd-item" onClick={() => addBlock('logistics', 'Logistics Telemetry')}>
            <span className="cmd-icon">🛰️</span>
            <div className="cmd-text">
              <div className="cmd-name">Logistics</div>
              <div className="cmd-desc">Monitor live fleet tracking</div>
            </div>
          </button>

          <button className="cmd-item" onClick={() => addBlock('returns', 'Return Rules')}>
            <span className="cmd-icon">📦</span>
            <div className="cmd-text">
              <div className="cmd-name">Return Rules</div>
              <div className="cmd-desc">Set AI grading thresholds</div>
            </div>
          </button>
        </div>
      )}

      {/* Webflow-style Progressive Disclosure Right Panel */}
      <div className={`settings-panel ${activeSettingsPanel ? 'panel-open' : ''}`}>
        {activeSettingsPanel && (
          <div className="panel-content">
            <div className="panel-header">
              <h2>
                {activeSettingsPanel === 'returns' && 'Return Rules'}
                {activeSettingsPanel === 'fraud' && 'Fraud Shield'}
                {activeSettingsPanel === 'pricing' && 'Dynamic Pricing'}
                {activeSettingsPanel === 'logistics' && 'Logistics Hub'}
              </h2>
              <button className="close-panel" onClick={() => setActiveSettingsPanel(null)}>✕</button>
            </div>

            <div className="panel-body">
              {/* Progressive disclosure: forms are only shown here when actively editing a block */}
              {activeSettingsPanel === 'returns' && (
                <>
                  <div className="form-group">
                    <label>Minimum Quality for Local Matching</label>
                    <select className="ui-select">
                      <option>Grade B and above</option>
                      <option>Grade A only</option>
                      <option>All functional items (Grade C+)</option>
                    </select>
                    <p className="help-text">Grade C items will be heavily discounted locally.</p>
                  </div>
                  <div className="form-group">
                    <label>Maximum Escrow Duration</label>
                    <input type="number" className="ui-input" defaultValue={48} />
                    <p className="help-text">Hours before releasing funds if uncollected.</p>
                  </div>
                  <div className="form-group row-group">
                    <input type="checkbox" id="auto-refund" defaultChecked />
                    <label htmlFor="auto-refund">Auto-approve instant refunds for Level 5 Trust Accounts</label>
                  </div>
                </>
              )}

              {activeSettingsPanel === 'fraud' && (
                <>
                  <div className="form-group">
                    <label>GNN Strictness Level</label>
                    <input type="range" min="1" max="5" defaultValue="3" className="ui-range" />
                    <div className="range-labels">
                      <span>Lenient</span>
                      <span>Strict</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Action on High Risk</label>
                    <select className="ui-select">
                      <option>Flag for Manual Review</option>
                      <option>Auto-Reject Refund</option>
                      <option>Require Additional Liveness Check</option>
                    </select>
                  </div>
                  <div className="alert-box">
                    <span className="alert-icon">⚠️</span>
                    <p>Current configuration is blocking ~4.2% of daily returns as fraudulent.</p>
                  </div>
                </>
              )}

              {activeSettingsPanel === 'pricing' && (
                <>
                  <div className="form-group">
                    <label>Base Depreciation Rate</label>
                    <div className="input-with-suffix">
                      <input type="number" defaultValue={20} className="ui-input" />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Hyperlocal Markdown Velocity</label>
                    <select className="ui-select">
                      <option>Aggressive (-5% / day)</option>
                      <option>Standard (-2% / day)</option>
                      <option>Conservative (Fixed Pricing)</option>
                    </select>
                  </div>
                  <div className="form-group row-group">
                    <input type="checkbox" id="enable-flash" defaultChecked />
                    <label htmlFor="enable-flash">Enable automated flash sales for overstocked items</label>
                  </div>
                </>
              )}

              {activeSettingsPanel === 'logistics' && (
                <>
                  <div className="form-group">
                    <label>Preferred Last-Mile Carrier</label>
                    <select className="ui-select">
                      <option>Zero-Emission Fleet (EV/Bikes)</option>
                      <option>Cost-Optimized (Mixed)</option>
                      <option>Speed-Optimized (Vans)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Locker Network Radius</label>
                    <div className="input-with-suffix">
                      <input type="number" defaultValue={5} className="ui-input" />
                      <span>km</span>
                    </div>
                  </div>
                  <button className="action-btn">Open Full Map Dashboard ➔</button>
                </>
              )}
            </div>
            
            <div className="panel-footer">
              <button className="save-btn" onClick={() => setActiveSettingsPanel(null)}>Save Configuration</button>
            </div>
          </div>
        )}
      </div>
      
      {/* Click outside to close command menu */}
      {showCommandMenu && (
        <div className="command-menu-overlay" onClick={() => setShowCommandMenu(false)}></div>
      )}
    </div>
  );
}
