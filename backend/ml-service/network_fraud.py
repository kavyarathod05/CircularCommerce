import networkx as nx

class SEFraudGNN:
    """
    Heterogeneous Graph Neural Network (SEFraud) Stub
    Detects multi-accounting, graph-based node overlaps, and calculates Trust Scores.
    """
    def __init__(self):
        # Create a mock graph representing users, devices, and payment methods
        self.graph = nx.Graph()
        
    def build_mock_graph(self):
        self.graph.add_node('U1', type='user', trust_score=80)
        self.graph.add_node('U2', type='user', trust_score=30)
        self.graph.add_node('D1', type='device')
        self.graph.add_node('P1', type='payment')
        
        # U1 and U2 share the same device and payment method (Suspicious!)
        self.graph.add_edge('U1', 'D1')
        self.graph.add_edge('U2', 'D1')
        self.graph.add_edge('U1', 'P1')
        self.graph.add_edge('U2', 'P1')
        
    def evaluate_trust_score(self, target_user):
        """
        Evaluates trust score based on graph connectivity.
        If a user shares device/payment with a low-trust user, their score drops.
        """
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
    gnn.build_mock_graph()
    print("Evaluating User 1 (connected to User 2 who has low trust):")
    print(gnn.evaluate_trust_score('U1'))
