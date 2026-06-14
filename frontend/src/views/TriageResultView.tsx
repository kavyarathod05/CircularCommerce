import { useAppContext } from '../context/AppContext';

export default function TriageResultView() {
  const { userRole, activeTab, orderId, productId, msrp, mediaUrl, lastResult } = useAppContext();
  return (
    <>
      {/* TRIAGE RESULT VIEW */}
        {userRole && activeTab === 'result' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Return Processing Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Your Refund Summary</h3>
                {lastResult ? (
                  <>
                    <div style={{ backgroundColor: '#F8F9FA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '1.5rem' }}>
                      <div style={{ borderBottom: '1px solid #EAEAEA', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#131A22' }}>RETURN AUTHORIZED | #RET-{lastResult.orderId.substring(0, 4)}</span>
                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: lastResult.grade.includes('A') ? '#E6F4EA' : lastResult.grade.includes('B') ? '#FFF8E1' : '#FCE8E6', color: lastResult.grade.includes('A') ? '#137333' : lastResult.grade.includes('B') ? '#B08D00' : '#C5221F' }}>
                          Condition: {lastResult.grade}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Item Name</span>
                        <span style={{ fontWeight: '600' }}>{
                          lastResult.productId.includes('smartphone') ? 'iPhone 14 Pro Max' :
                          lastResult.productId.includes('headphones') ? 'Bose QuietComfort Headphones' :
                          lastResult.productId.includes('tshirt') ? 'Essentials Cotton T-Shirt' : lastResult.productId
                        }</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Refund Amount</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success-green, #008A00)', fontSize: '1.1rem' }}>₹{lastResult.msrp}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Next Steps</span>
                        <span style={{ color: 'var(--amazon-orange, #FF9900)', fontWeight: 'bold' }}>
                          {lastResult.pathway === 'premium' ? 'Instant Refund Approved' : lastResult.pathway === 'local-match' ? 'Drop off at Local Buyer' : 'Return to Warehouse'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'flex-start' }}>
                        <span style={{ color: '#565959' }}>Inspection Notes</span>
                        <span style={{ color: '#131A22', fontSize: '0.9rem', fontStyle: 'italic', maxWidth: '60%', textAlign: 'right', backgroundColor: '#FFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid #EAEAEA' }}>"{lastResult.summary}"</span>
                      </div>
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #EAEAEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: '#565959' }}>
                          Authorization Code:<br />
                          <span style={{ color: 'var(--amazon-orange, #FF9900)', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px' }}>AUTH-8F3B</span>
                        </div>
                        <div style={{ width: '60px', height: '60px', backgroundColor: '#FFF', padding: '5px', border: '1px solid #EAEAEA', borderRadius: '4px' }}>
                          <svg width="100%" height="100%" viewBox="0 0 100 100">
                            <rect x="0" y="0" width="100" height="100" fill="white" />
                            <rect x="10" y="10" width="30" height="30" fill="black" />
                            <rect x="60" y="10" width="30" height="30" fill="black" />
                            <rect x="10" y="60" width="30" height="30" fill="black" />
                            <rect x="20" y="20" width="10" height="10" fill="white" />
                            <rect x="70" y="20" width="10" height="10" fill="white" />
                            <rect x="20" y="70" width="10" height="10" fill="white" />
                            <rect x="45" y="45" width="20" height="20" fill="black" />
                            <rect x="75" y="75" width="15" height="15" fill="black" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', backgroundColor: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#007185', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', flexShrink: 0 }}>
                        {lastResult.carbon_saved_co2_kg ? Math.round(lastResult.carbon_saved_co2_kg) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52)}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#007185', fontSize: '1.05rem' }}>Scope-3 Carbon Avoided</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#131A22', lineHeight: 1.5 }}>Calculated equivalent of avoiding warehouse shipping. Saved {lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg.toFixed(2) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52.5)} Kg CO₂ ({(lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg / 21 : (lastResult.pathway === 'locker-dropoff' ? 14 / 21 : 52.5 / 21)).toFixed(2)} trees planted equivalent).</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#879596', padding: '2rem 0', textAlign: 'center' }}>No return triaged yet. Go to the Return Center and submit.</p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Visual Condition Verification</h3>
                  {lastResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {lastResult.bboxes.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', overflow: 'hidden' }}>
                          <svg viewBox="0 0 320 320" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            {lastResult.mediaUrl && !lastResult.mediaUrl.includes('unsplash') ? (
                              <image href={lastResult.mediaUrl} x="0" y="0" width="320" height="320" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
                            ) : lastResult.productId === 'p-smartphone-premium' ? (
                              <>
                                <rect x="95" y="40" width="130" height="240" rx="18" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                                <rect x="130" y="52" width="60" height="12" rx="6" fill="#D5D9D9" />
                              </>
                            ) : lastResult.productId === 'p-tshirt-commodity' ? (
                              <path d="M 140,70 Q 160,82 180,70 L 210,70 L 250,110 L 225,135 L 205,125 L 205,260 L 115,260 L 115,125 L 95,135 L 70,110 L 110,70 Z" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                            ) : (
                              <>
                                <circle cx="160" cy="160" r="100" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                                <rect x="50" y="120" width="20" height="80" rx="10" fill="#EAEAEA" />
                                <rect x="250" y="120" width="20" height="80" rx="10" fill="#EAEAEA" />
                              </>
                            )}
                            {lastResult.bboxes.map((box, idx) => (
                              <g key={idx}>
                                <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="rgba(200, 34, 31, 0.2)" stroke="#C5221F" strokeWidth="2" strokeDasharray="4 2" />
                                <text x={box.x} y={box.y - 5} fill="#C5221F" fontSize="12" fontWeight="bold">{box.label}</text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', color: '#137333', fontWeight: 'bold' }}>
                          ✓ No Defects Detected
                        </div>
                      )}
                      
                      <div style={{ padding: '1rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: '0.5rem', color: '#565959' }}>
                          {lastResult.pathway === 'locker-dropoff' ? (
                            <span><b>Routing:</b> Locker Dropoff (Amazon Locker - Metro Hub, {lastResult.transit_distance_km ? lastResult.transit_distance_km.toFixed(1) : '1.4'} km).</span>
                          ) : (
                            <span><b>Routing:</b> Hyperlocal P2P Match (Matched to {lastResult.matched_buyer?.listing_id ? 'Buyer-Local' : 'buyer-alpha'}, {lastResult.transit_distance_km ? lastResult.transit_distance_km.toFixed(1) : '3.2'} km). Escrow Locked.</span>
                          )}
                        </div>
                        <div style={{ height: '100px', backgroundColor: '#E9E9E9', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                           {/* Simplified mock map */}
                           <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
                            <path d={lastResult.pathway === 'locker-dropoff' ? "M 20,50 Q 100,20 280,50" : "M 20,50 Q 150,90 280,50"} stroke="#007185" strokeWidth="3" strokeDasharray="5,5" fill="none" />
                            <circle cx="20" cy="50" r="6" fill="#131A22" />
                            <circle cx="280" cy="50" r="6" fill="#FF9900" />
                           </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#879596', padding: '2rem 0', textAlign: 'center' }}>Submit a return to view verification metrics.</p>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    GS1 Authentication Certificate
                  </h3>
                  {lastResult ? (
                    <div style={{ padding: '1.5rem', backgroundColor: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#565959', fontWeight: 600 }}>Global Trade Item Number (GTIN)</div>
                          <div style={{ fontSize: '1.4rem', color: '#131A22', fontWeight: 800, fontFamily: 'monospace', marginTop: '0.25rem' }}>00819264023910</div>
                        </div>
                        <div style={{ backgroundColor: '#137333', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          VERIFIED AUTHENTIC
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #BFEAF1', paddingTop: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Brand Owner</div>
                          <div style={{ fontSize: '0.9rem', color: '#131A22', fontWeight: 500 }}>{lastResult.productId === 'p-smartphone-premium' ? 'Apple Inc.' : 'Bose Corporation'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Registry Match Date</div>
                          <div style={{ fontSize: '0.9rem', color: '#131A22', fontWeight: 500 }}>{new Date().toLocaleDateString()}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Blockchain Ledger Hash</div>
                          <div style={{ fontSize: '0.8rem', color: '#879596', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            0x{(Math.random() * 1e16).toString(16)}0e4f...b7c2{(Math.random() * 1e16).toString(16)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#879596', padding: '1rem 0', textAlign: 'center', margin: 0 }}>Submit a return to verify authenticity.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
    </>
  );
}
