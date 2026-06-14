import os
import re

APP_TSX_PATH = "frontend/src/App.tsx"

with open(APP_TSX_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Define boundaries
views = [
    ("Sidebar", "{/* SIDEBAR NAVIGATION - Fixed Design Issues */}", "{/* MAIN CONTENT CONTAINER */}"),
    ("RoleSelection", "{/* ROLE SELECTION SCREEN */}", "{/* CATALOG VIEW */}"),
    ("CatalogView", "{/* CATALOG VIEW */}", "{/* VTO VIEW */}"),
    ("VTOView", "{/* VTO VIEW */}", "{/* ACCOUNT VIEW */}"),
    ("AccountView", "{/* ACCOUNT VIEW */}", "{/* RETURN WIZARD VIEW */}"),
    ("ReturnWizardView", "{/* RETURN WIZARD VIEW */}", "{/* TRIAGE RESULT VIEW */}"),
    ("TriageResultView", "{/* TRIAGE RESULT VIEW */}", "{/* SELLER DASHBOARD VIEW */}"),
    ("SellerDashboardView", "{/* SELLER DASHBOARD VIEW */}", "{/* PRE-CHECKOUT PREVENTION VIEW */}"),
    ("PreventionView", "{/* PRE-CHECKOUT PREVENTION VIEW */}", "{/* LOGISTICS TELEMETRY VIEW */}"),
]

# Create directories
os.makedirs("frontend/src/context", exist_ok=True)
os.makedirs("frontend/src/components", exist_ok=True)
os.makedirs("frontend/src/views", exist_ok=True)

# 1. Create AppContext
app_context_code = """import { createContext, useContext } from 'react';
export const AppContext = createContext<any>(null);
export const useAppContext = () => useContext(AppContext);
"""
with open("frontend/src/context/AppContext.tsx", "w", encoding="utf-8") as f:
    f.write(app_context_code)

# 2. Extract views and create components
new_content = content
imports_to_add = "import { AppContext } from './context/AppContext';\n"
imports_to_add += "import Sidebar from './components/Sidebar';\n"

for view_name, start_marker, end_marker in views:
    start_idx = new_content.find(start_marker)
    end_idx = new_content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        chunk = new_content[start_idx:end_idx].strip()
        
        # We need to find all variables used in the chunk to destructure them from context.
        # But wait! A much simpler hack: we can just destructure the entire context object 
        # and ignore unused variables, or let TS complain (it's any anyway).
        # Actually, destructuring everything from useAppContext() is verbose. 
        # Better: just replace the variables? No, destructuring `const { ... } = useAppContext();` is easiest.
        
        # Let's extract all possible state/functions exposed by App.tsx
        all_vars = [
            "userRole", "setUserRole", "activeTab", "setActiveTab",
            "orderId", "setOrderId", "productId", "setProductId",
            "msrp", "setMsrp", "reason", "setReason", "lat", "setLat", "lng", "setLng",
            "mediaUrl", "setMediaUrl", "selectedFile", "setSelectedFile", "setUploading",
            "consoleLogs", "setConsoleLogs", "isEvaluating", "setIsEvaluating",
            "lastResult", "setLastResult", "listings", "setListings",
            "sellerMetrics", "setSellerMetrics", "userMetrics", "setUserMetrics",
            "dppData", "setDppData", "catalogItems", "setCatalogItems",
            "isCatalogLoading", "setIsCatalogLoading", "cartItems", "setCartItems",
            "returnVelocity", "setReturnVelocity", "showPreventionAlert", "setShowPreventionAlert",
            "frictionScore", "setFrictionScore", "evaluateFriction", "addToCart", "removeFromCart",
            "handleFileChange", "uploadFileToS3", "getBase64", "runTriageSimulation", "toggleListingStatus"
        ]
        
        # Find which vars are actually used in this chunk
        used_vars = []
        for var in all_vars:
            # simple regex to check if var is used as a word
            if re.search(r'\b' + var + r'\b', chunk):
                used_vars.append(var)
                
        destructure_stmt = f"  const {{ {', '.join(used_vars)} }} = useAppContext();" if used_vars else ""
        
        # Wrap in component
        component_code = f"import {{ useAppContext }} from '../context/AppContext';\n\n"
        component_code += f"export default function {view_name}() {{\n{destructure_stmt}\n  return (\n    <>\n      {chunk}\n    </>\n  );\n}}\n"
        
        # Write to file
        folder = "components" if view_name == "Sidebar" else "views"
        with open(f"frontend/src/{folder}/{view_name}.tsx", "w", encoding="utf-8") as f:
            f.write(component_code)
            
        # Add import
        if view_name != "Sidebar":
            imports_to_add += f"import {view_name} from './views/{view_name}';\n"
        
        # Replace in App.tsx
        # Handle conditional rendering wrapper that already exists.
        # Often the chunk starts with `{userRole === 'buyer' && activeTab === 'catalog' && (`
        # If the chunk contains `{`, it's an expression. The chunk is literally the expression.
        # We replace it with exactly the same condition but with `<ComponentName />`
        
        # Actually, let's just replace the chunk with the component. But the chunk *is* the JSX!
        # Wait, the start_marker is a comment inside JSX.
        # We can just replace the chunk with `{"\\n"}{start_marker}{"\\n"}<{view_name} />{"\\n"}`
        new_content = new_content[:start_idx] + f"{start_marker}\n        <{view_name} />\n        " + new_content[end_idx:]

# Now wrap the return in App.tsx with Context Provider
# First, insert contextValue before `return (`
context_vars_str = "userRole, setUserRole, activeTab, setActiveTab, orderId, setOrderId, productId, setProductId, msrp, setMsrp, reason, setReason, lat, setLat, lng, setLng, mediaUrl, setMediaUrl, selectedFile, setSelectedFile, setUploading, consoleLogs, setConsoleLogs, isEvaluating, setIsEvaluating, lastResult, setLastResult, listings, setListings, sellerMetrics, setSellerMetrics, userMetrics, setUserMetrics, dppData, setDppData, catalogItems, setCatalogItems, isCatalogLoading, setIsCatalogLoading, cartItems, setCartItems, returnVelocity, setReturnVelocity, showPreventionAlert, setShowPreventionAlert, frictionScore, setFrictionScore, evaluateFriction, addToCart, removeFromCart, handleFileChange, uploadFileToS3, getBase64, runTriageSimulation, toggleListingStatus"

provider_setup = f"  const contextValue = {{ {context_vars_str} }};\n\n  return (\n    <AppContext.Provider value={{contextValue}}>\n"

new_content = new_content.replace("  return (\n", provider_setup)

# Close Provider at the end
# The end of the main return is:
#     </div>
#   )
# }
new_content = new_content.replace("    </div>\n  )\n}", "    </div>\n    </AppContext.Provider>\n  )\n}")

# Add imports to top
new_content = imports_to_add + new_content

with open("frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Refactoring complete.")
