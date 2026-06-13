import networkx as nx
import boto3
from boto3.dynamodb.conditions import Key, Attr

class SEFraudGNN:
    """
    Heterogeneous Graph Neural Network (SEFraud) Stub
    Detects multi-accounting, graph-based node overlaps, and calculates Trust Scores
    by querying DynamoDB MatchesTable and ReturnsTable.
    """
    def __init__(self, region_name='us-east-1'):
        self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
        self.matches_table = self.dynamodb.Table('MatchesTable')
        self.returns_table = self.dynamodb.Table('ReturnsTable')
        
    def build_live_graph(self, target_user):
        self.graph = nx.Graph()
        
        # Add target user
        self.graph.add_node(target_user, type='user', trust_score=100)
        
        try:
            # Query returns for the target user to find IPs or Devices
            # Assuming ReturnsTable has an index 'UserId-index' and attributes DeviceId/IP
            ret_res = self.returns_table.query(
                IndexName='UserId-index',
                KeyConditionExpression=Key('UserId').eq(target_user)
            )
            for item in ret_res.get('Items', []):
                device = item.get('DeviceId')
                ip = item.get('IPAddress')
                if device:
                    self.graph.add_node(device, type='device')
                    self.graph.add_edge(target_user, device)
                if ip:
                    self.graph.add_node(ip, type='ip')
                    self.graph.add_edge(target_user, ip)
                    
            # Scan matches or returns to find others sharing the same device/ip
            # (In a real scenario, use an inverted index, here we just do a limited scan)
            scan_res = self.returns_table.scan(Limit=100)
            for item in scan_res.get('Items', []):
                uid = item.get('UserId')
                if not uid or uid == target_user: continue
                
                device = item.get('DeviceId')
                if device and device in self.graph:
                    self.graph.add_node(uid, type='user', trust_score=int(item.get('TrustScore', 50)))
                    self.graph.add_edge(uid, device)
        except Exception as e:
            print(f"Warning: Failed to build graph from DynamoDB: {e}")
        
    def evaluate_trust_score(self, target_user):
        """
        Evaluates trust score based on graph connectivity using live data.
        If a user shares device/payment with a low-trust user, their score drops.
        """
        self.build_live_graph(target_user)
        if target_user not in self.graph:
            return 100 # Default new user score
            
        base_score = self.graph.nodes[target_user].get('trust_score', 100)
        penalty = 0
        
        # Check 2-hop neighbors (users sharing same device/payment)
        for neighbor in self.graph.neighbors(target_user):
            for second_hop in self.graph.neighbors(neighbor):
                if second_hop != target_user and self.graph.nodes[second_hop].get('type') == 'user':
                    other_score = self.graph.nodes[second_hop].get('trust_score', 100)
                    if other_score < 50:
                        penalty += 20 # Penalize for associating with low-trust node
                        
        final_score = max(0, base_score - penalty)
        
        return {
            'user': target_user,
            'original_score': base_score,
            'final_score': final_score,
            'revoke_keep_and_credit': final_score < 70,
            'fraud_flag': final_score < 30
        }

if __name__ == "__main__":
    gnn = SEFraudGNN()
    print("Evaluating User 12:")
    print(gnn.evaluate_trust_score('usr-12'))
