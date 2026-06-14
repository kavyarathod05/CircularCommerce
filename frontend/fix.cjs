const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/evaluateFriction\(newCart\)\s+navigate\(\)/, "evaluateFriction(newCart)\n    navigate('/prevention')");
code = code.replace(/\/\/ Auto switch view\s+navigate\(\)/, "// Auto switch view\n      navigate('/result')");
code = code.replace(/setPendingReturnPayload\(null\)\s+navigate\(\)/, "setPendingReturnPayload(null)\n    navigate('/account')");
code = code.replace(/setUserRole\('buyer'\); setHasOnboarded\(true\); navigate\(\);/, "setUserRole('buyer'); setHasOnboarded(true); navigate('/catalog');");
code = code.replace(/setUserRole\('seller'\); setHasOnboarded\(true\); navigate\(\);/, "setUserRole('seller'); setHasOnboarded(true); navigate('/admin');");
code = code.replace(/Go to Catalog<\/span>\s*<\/div>/, "Go to Catalog</span>\n                  </div>").replace(/navigate\(\); setIsCommandPaletteOpen\(false\);/, "navigate('/catalog'); setIsCommandPaletteOpen(false);");
code = code.replace(/Start a Return<\/span>\s*<\/div>/, "Start a Return</span>\n                  </div>").replace(/navigate\(\); setIsCommandPaletteOpen\(false\);/, "navigate('/wizard'); setIsCommandPaletteOpen(false);");
code = code.replace(/navigate\(\); fetchFraudData\(\); setIsCommandPaletteOpen\(false\);/, "navigate('/fraud'); fetchFraudData(); setIsCommandPaletteOpen(false);");
code = code.replace(/setUserRole\('buyer'\); setIsCommandPaletteOpen\(false\); navigate\(\);/, "setUserRole('buyer'); setIsCommandPaletteOpen(false); navigate('/catalog');");
code = code.replace(/setUserRole\('seller'\); setIsCommandPaletteOpen\(false\); navigate\(\);/, "setUserRole('seller'); setIsCommandPaletteOpen(false); navigate('/admin');");
code = code.replace(/<button className="btn-action" onClick=\{\(\) => navigate\(\)\} style=\{\{ width: '100%' \}\}>/g, "<button className=\"btn-action\" onClick={() => navigate('/wizard')} style={{ width: '100%' }}>");
code = code.replace(/onClick=\{\(\) => navigate\(\)\}/g, "onClick={() => navigate('/vto')}"); // For the remaining

fs.writeFileSync('src/App.tsx', code);
