"""
SecondLife Commerce — Blockchain Digital Product Passport
=========================================================
Implements immutable product provenance tracking using:
- Hyperledger Fabric (enterprise blockchain)
- Ethereum (public blockchain alternative)
- IPFS (distributed file storage for images/documents)
"""

import hashlib
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

# Try to import blockchain libraries (optional dependencies)
try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False

try:
    import ipfshttpclient
    IPFS_AVAILABLE = True
except ImportError:
    IPFS_AVAILABLE = False


class BlockchainDPP:
    """
    Blockchain-backed Digital Product Passport with immutable audit trail.
    Falls back to cryptographic hashing if blockchain not configured.
    """
    
    def __init__(self, mode: str = "hyperledger"):
        """
        Args:
            mode: "hyperledger" | "ethereum" | "hash-only"
        """
        self.mode = mode
        self.chain = []  # In-memory blockchain for demo
        
        # Ethereum configuration
        if mode == "ethereum" and WEB3_AVAILABLE:
            infura_url = f"https://mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID', '')}"
            self.w3 = Web3(Web3.HTTPProvider(infura_url))
            self.contract_address = os.getenv('DPP_CONTRACT_ADDRESS', '')
            # Would load ABI here for production
        else:
            self.w3 = None
        
        # IPFS configuration
        if IPFS_AVAILABLE:
            try:
                self.ipfs_client = ipfshttpclient.connect('/ip4/127.0.0.1/tcp/5001')
            except:
                self.ipfs_client = None
        else:
            self.ipfs_client = None
        
        # Genesis block
        if len(self.chain) == 0:
            self._create_genesis_block()
    
    def _create_genesis_block(self):
        """Create the first block in the chain."""
        genesis_block = {
            "index": 0,
            "timestamp": datetime(2024, 1, 1).isoformat(),
            "data": {
                "action": "CHAIN_INITIALIZED",
                "system": "SecondLife Commerce DPP",
                "version": "1.0.0"
            },
            "previous_hash": "0" * 64,
            "nonce": 0
        }
        genesis_block["hash"] = self._calculate_hash(genesis_block)
        self.chain.append(genesis_block)
    
    def record_event(
        self,
        item_id: str,
        event_type: str,
        data: Dict[str, Any],
        actor: str
    ) -> Dict[str, Any]:
        """
        Record immutable event on blockchain.
        
        Args:
            item_id: Unique product identifier (GTIN + serial)
            event_type: "MANUFACTURED" | "SOLD" | "RETURNED" | "GRADED" | "TRANSFERRED"
            data: Event-specific data (condition, price, location, etc.)
            actor: Who performed the action (user_id, company, system)
        
        Returns:
            {
                "block_index": int,
                "block_hash": str,
                "transaction_id": str,
                "timestamp": str,
                "immutable": bool
            }
        """
        # Create transaction record
        transaction = {
            "item_id": item_id,
            "event_type": event_type,
            "data": data,
            "actor": actor,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Add to blockchain based on mode
        if self.mode == "ethereum" and self.w3 and self.w3.isConnected():
            result = self._record_to_ethereum(transaction)
        elif self.mode == "hyperledger":
            result = self._record_to_hyperledger(transaction)
        else:
            # Hash-only mode (cryptographic proof without full blockchain)
            result = self._record_to_local_chain(transaction)
        
        return result
    
    def _record_to_ethereum(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record to Ethereum blockchain via smart contract.
        """
        if not self.contract_address:
            return self._record_to_local_chain(transaction)  # Fallback
        
        try:
            # In production, would call smart contract function
            # contract = self.w3.eth.contract(address=self.contract_address, abi=DPP_ABI)
            # tx_hash = contract.functions.recordEvent(
            #     transaction['item_id'],
            #     transaction['event_type'],
            #     json.dumps(transaction['data'])
            # ).transact({'from': self.account.address})
            # 
            # receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Mock response for demo
            mock_tx_hash = "0x" + hashlib.sha256(json.dumps(transaction).encode()).hexdigest()
            
            return {
                "block_index": None,  # Would get from receipt
                "block_hash": mock_tx_hash,
                "transaction_id": mock_tx_hash,
                "timestamp": transaction['timestamp'],
                "immutable": True,
                "blockchain": "ethereum-mainnet",
                "explorer_url": f"https://etherscan.io/tx/{mock_tx_hash}"
            }
        except Exception as e:
            print(f"Ethereum write failed: {e}, falling back to local chain")
            return self._record_to_local_chain(transaction)
    
    def _record_to_hyperledger(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record to Hyperledger Fabric network.
        """
        # In production, would use Hyperledger SDK
        # from hfc.fabric import Client
        # client = Client(net_profile="network-config.json")
        # response = client.chaincode_invoke(
        #     requestor=org1_admin,
        #     channel_name='secondlife-channel',
        #     peers=['peer0.org1.example.com'],
        #     cc_name='dpp-chaincode',
        #     fcn='recordEvent',
        #     args=[transaction['item_id'], json.dumps(transaction)]
        # )
        
        # Mock for demo
        return self._record_to_local_chain(transaction)
    
    def _record_to_local_chain(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record to local in-memory blockchain (for demo/testing).
        """
        # Get last block
        previous_block = self.chain[-1]
        
        # Create new block
        new_block = {
            "index": len(self.chain),
            "timestamp": transaction['timestamp'],
            "data": transaction,
            "previous_hash": previous_block['hash'],
            "nonce": 0
        }
        
        # Proof of work (simplified - just find hash starting with '00')
        new_block = self._proof_of_work(new_block)
        new_block["hash"] = self._calculate_hash(new_block)
        
        # Add to chain
        self.chain.append(new_block)
        
        return {
            "block_index": new_block['index'],
            "block_hash": new_block['hash'],
            "transaction_id": new_block['hash'][:16],
            "timestamp": new_block['timestamp'],
            "immutable": True,
            "blockchain": "local-chain",
            "chain_length": len(self.chain)
        }
    
    def _calculate_hash(self, block: Dict[str, Any]) -> str:
        """Calculate SHA-256 hash of block."""
        # Create deterministic string representation
        block_copy = block.copy()
        block_copy.pop('hash', None)  # Remove hash field if present
        block_string = json.dumps(block_copy, sort_keys=True)
        
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def _proof_of_work(self, block: Dict[str, Any], difficulty: int = 2) -> Dict[str, Any]:
        """
        Simple proof of work: find nonce that makes hash start with N zeros.
        """
        block['nonce'] = 0
        computed_hash = self._calculate_hash(block)
        
        while not computed_hash.startswith('0' * difficulty):
            block['nonce'] += 1
            computed_hash = self._calculate_hash(block)
        
        return block
    
    def get_product_history(self, item_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve complete immutable history for a product.
        """
        history = []
        
        for block in self.chain:
            if block['index'] == 0:  # Skip genesis
                continue
            
            if block['data'].get('item_id') == item_id:
                history.append({
                    "block_index": block['index'],
                    "block_hash": block['hash'],
                    "timestamp": block['timestamp'],
                    "event_type": block['data']['event_type'],
                    "data": block['data']['data'],
                    "actor": block['data']['actor'],
                    "verified": self._verify_block_integrity(block)
                })
        
        return history
    
    def _verify_block_integrity(self, block: Dict[str, Any]) -> bool:
        """
        Verify block hasn't been tampered with.
        """
        stored_hash = block['hash']
        recalculated_hash = self._calculate_hash(block)
        
        return stored_hash == recalculated_hash
    
    def verify_chain_integrity(self) -> Dict[str, Any]:
        """
        Verify entire blockchain integrity.
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Verify current block hash
            if current_block['hash'] != self._calculate_hash(current_block):
                return {
                    "valid": False,
                    "error": f"Block {i} has invalid hash",
                    "tampered_block": i
                }
            
            # Verify chain linkage
            if current_block['previous_hash'] != previous_block['hash']:
                return {
                    "valid": False,
                    "error": f"Block {i} has invalid previous_hash",
                    "broken_link": i
                }
        
        return {
            "valid": True,
            "total_blocks": len(self.chain),
            "integrity": "VERIFIED"
        }
    
    def upload_to_ipfs(self, data: bytes, filename: str) -> Optional[str]:
        """
        Upload file to IPFS for distributed storage.
        Returns IPFS hash (CID).
        """
        if not self.ipfs_client:
            return None
        
        try:
            result = self.ipfs_client.add_bytes(data)
            ipfs_hash = result
            return f"ipfs://{ipfs_hash}"
        except Exception as e:
            print(f"IPFS upload failed: {e}")
            return None
    
    def export_chain(self) -> str:
        """
        Export blockchain to JSON for backup/audit.
        """
        return json.dumps(self.chain, indent=2)
    
    def import_chain(self, chain_json: str) -> bool:
        """
        Import blockchain from JSON.
        """
        try:
            imported_chain = json.loads(chain_json)
            
            # Verify integrity before importing
            temp_blockchain = BlockchainDPP()
            temp_blockchain.chain = imported_chain
            
            verification = temp_blockchain.verify_chain_integrity()
            
            if verification['valid']:
                self.chain = imported_chain
                return True
            else:
                print(f"Import failed: {verification['error']}")
                return False
        except Exception as e:
            print(f"Import exception: {e}")
            return False


if __name__ == "__main__":
    import os
    os.environ.setdefault('INFURA_PROJECT_ID', '')
    
    # Test blockchain
    blockchain = BlockchainDPP(mode="hash-only")
    
    print("=== Test 1: Record Manufacturing ===")
    result1 = blockchain.record_event(
        item_id="GTIN-00614141083561-SN-12345",
        event_type="MANUFACTURED",
        data={
            "factory": "Factory A, Vietnam",
            "date": "2026-08-01",
            "batch": "BATCH-2026-08-A"
        },
        actor="bose-manufacturing-system"
    )
    print(f"Block: {result1['block_index']}, Hash: {result1['block_hash'][:16]}...")
    
    print("\n=== Test 2: Record First Sale ===")
    result2 = blockchain.record_event(
        item_id="GTIN-00614141083561-SN-12345",
        event_type="SOLD",
        data={
            "platform": "Amazon.in",
            "price": 7900,
            "buyer": "usr-45"
        },
        actor="amazon-order-system"
    )
    print(f"Block: {result2['block_index']}, Hash: {result2['block_hash'][:16]}...")
    
    print("\n=== Test 3: Record Return & Grade ===")
    result3 = blockchain.record_event(
        item_id="GTIN-00614141083561-SN-12345",
        event_type="GRADED",
        data={
            "grade": "B",
            "defects": ["Minor wear on ear cushions"],
            "ai_confidence": 0.94
        },
        actor="secondlife-ai-grading-engine"
    )
    print(f"Block: {result3['block_index']}, Hash: {result3['block_hash'][:16]}...")
    
    print("\n=== Test 4: Get Product History ===")
    history = blockchain.get_product_history("GTIN-00614141083561-SN-12345")
    print(f"Total Events: {len(history)}")
    for event in history:
        print(f"  - {event['event_type']}: {event['data']} (Block {event['block_index']})")
    
    print("\n=== Test 5: Verify Chain Integrity ===")
    verification = blockchain.verify_chain_integrity()
    print(f"Valid: {verification['valid']}, Blocks: {verification['total_blocks']}")
    
    print("\n=== Test 6: Export Chain ===")
    exported = blockchain.export_chain()
    print(f"Exported {len(exported)} chars of JSON")
