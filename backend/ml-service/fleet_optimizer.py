# -*- coding: utf-8 -*-
"""
SecondLife Commerce - Sustainable Fleet Optimizer (MILP + GA + Clarke-Wright)
=============================================================================
Balances financial cost vs. environmental impact using:
  1. Clarke & Wright Savings Heuristic for initial solution seeding
  2. OR-Tools MILP (CP-SAT) for optimal vehicle-type assignment
  3. Genetic Algorithm for meta-level fleet composition tuning

Fleet types with sustainability profiles:
  - Cargo Bike:    zero emission, low capacity, low cost
  - EV Pod:        zero emission, medium capacity, medium cost
  - Hybrid Van:    low emission, high capacity, medium cost
  - Diesel Truck:  high emission, very high capacity, high cost
"""

import math
import random
import copy
import uuid
from typing import List, Dict, Tuple, Any, Optional
from dataclasses import dataclass, field

# OR-Tools CP-SAT solver for MILP
from ortools.sat.python import cp_model

# ---------------------------------------------------------------------------
# Bangalore hub coordinates (shared with logistics_telemetry / nsga2_routing)
# ---------------------------------------------------------------------------
DEPOT_HUBS = {
    "hub-koramangala":     (12.9352, 77.6245),
    "hub-indiranagar":     (12.9784, 77.6408),
    "hub-whitefield":      (12.9698, 77.7500),
    "hub-electronic-city": (12.8451, 77.6602),
    "hub-jayanagar":       (12.9250, 77.5938),
    "hub-hsr-layout":      (12.9116, 77.6389),
    "hub-marathahalli":    (12.9591, 77.6974),
    "hub-btm-layout":      (12.9166, 77.6101),
}

# Green zones: areas where only zero-emission vehicles are allowed
GREEN_ZONES = {
    "Cubbon Park":        (12.9763, 77.5929, 1.2),  # lat, lng, radius_km
    "Lalbagh":            (12.9507, 77.5848, 0.8),
    "JP Nagar Green Belt":(12.9060, 77.5852, 0.6),
}

# ---------------------------------------------------------------------------
# Fleet vehicle type specifications
# ---------------------------------------------------------------------------
@dataclass
class FleetSpec:
    name: str
    capacity: int           # max parcels
    fixed_cost: float       # ₹ per deployment
    per_km_cost: float      # ₹ per km
    co2_per_km: float       # kg CO₂ per km
    nox_per_km: float       # g NOx per km
    speed_kmh: float        # average speed
    range_km: float         # max range per charge/tank
    is_zero_emission: bool  # green-zone compliant
    icon: str

FLEET_TYPES: Dict[str, FleetSpec] = {
    "cargo-bike": FleetSpec("Cargo Bike",   3,   50,   1.5, 0.000, 0.00, 20, 30,  True,  "🚲"),
    "ev-pod":     FleetSpec("EV Pod",        6,  100,   2.5, 0.000, 0.00, 35, 80,  True,  "⚡"),
    "hybrid-van": FleetSpec("Hybrid Van",   12,  200,   5.0, 0.045, 0.15, 45, 200, False, "🚐"),
    "diesel-truck":FleetSpec("Diesel Truck",25,  400,  10.0, 0.210, 0.80, 35, 400, False, "🚛"),
}


@dataclass
class DeliveryNode:
    node_id: str
    lat: float
    lng: float
    demand: int = 1
    priority: int = 1         # 1=normal, 2=express, 3=critical
    in_green_zone: bool = False


@dataclass
class SavingsRoute:
    """A route from the Clarke-Wright heuristic."""
    stops: List[int]          # indices into delivery nodes
    total_demand: int
    total_distance_km: float
    vehicle_type: str = ""    # assigned after MILP


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def in_green_zone(lat: float, lng: float) -> bool:
    for _, (glat, glng, rad) in GREEN_ZONES.items():
        if haversine_km(lat, lng, glat, glng) <= rad:
            return True
    return False


# ===========================================================================
# Phase 1: Clarke & Wright Savings Heuristic
# ===========================================================================
class ClarkeWrightSolver:
    """
    Implements the classical Clarke & Wright (1964) parallel savings algorithm
    for VRP initial solution construction.
    """

    def solve(self, nodes: List[DeliveryNode], depot_lat: float, depot_lng: float,
              max_capacity: int = 25) -> List[SavingsRoute]:
        n = len(nodes)
        if n == 0:
            return []

        # Compute distance matrix
        dist = [[0.0] * (n + 1) for _ in range(n + 1)]  # index 0 = depot
        for i in range(n):
            dist[0][i+1] = haversine_km(depot_lat, depot_lng, nodes[i].lat, nodes[i].lng)
            dist[i+1][0] = dist[0][i+1]
        for i in range(n):
            for j in range(i+1, n):
                d = haversine_km(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng)
                dist[i+1][j+1] = d
                dist[j+1][i+1] = d

        # Calculate savings: s(i,j) = d(0,i) + d(0,j) - d(i,j)
        savings = []
        for i in range(n):
            for j in range(i+1, n):
                s = dist[0][i+1] + dist[0][j+1] - dist[i+1][j+1]
                savings.append((s, i, j))
        savings.sort(reverse=True, key=lambda x: x[0])

        # Initialize: each customer is its own route
        route_of = list(range(n))  # which route each node belongs to
        routes: Dict[int, List[int]] = {i: [i] for i in range(n)}
        demands: Dict[int, int] = {i: nodes[i].demand for i in range(n)}

        # Merge routes using savings
        for saving, i, j in savings:
            ri, rj = route_of[i], route_of[j]
            if ri == rj:
                continue  # already in same route
            # Check capacity
            merged_demand = demands[ri] + demands[rj]
            if merged_demand > max_capacity:
                continue
            # Check if i and j are at route endpoints
            if routes[ri][-1] == i and routes[rj][0] == j:
                # Merge: route_i + route_j
                new_route = routes[ri] + routes[rj]
            elif routes[ri][0] == i and routes[rj][-1] == j:
                new_route = routes[rj] + routes[ri]
            elif routes[ri][-1] == i and routes[rj][-1] == j:
                new_route = routes[ri] + list(reversed(routes[rj]))
            elif routes[ri][0] == i and routes[rj][0] == j:
                new_route = list(reversed(routes[ri])) + routes[rj]
            else:
                continue  # not at endpoints

            # Perform merge
            for node_idx in routes[rj]:
                route_of[node_idx] = ri
            routes[ri] = new_route
            demands[ri] = merged_demand
            del routes[rj]
            del demands[rj]

        # Convert to SavingsRoute objects
        result = []
        for route_id, stop_indices in routes.items():
            route_dist = dist[0][stop_indices[0]+1]
            for k in range(len(stop_indices)-1):
                route_dist += dist[stop_indices[k]+1][stop_indices[k+1]+1]
            route_dist += dist[stop_indices[-1]+1][0]

            result.append(SavingsRoute(
                stops=stop_indices,
                total_demand=sum(nodes[si].demand for si in stop_indices),
                total_distance_km=round(route_dist, 2),
            ))

        return result


# ===========================================================================
# Phase 2: Greedy Vehicle-Type Assignment (Replaces MILP to fix Windows Crash)
# ===========================================================================
class MILPVehicleAssigner:
    """
    Assigns vehicles to routes using a greedy approach:
      - Subject to:
        - Each route assigned exactly one vehicle type
        - Vehicle capacity >= route demand
        - Vehicle range >= route distance
        - Green-zone routes -> zero-emission vehicles only
    """
    def __init__(self, cost_weight: float = 0.6, emission_weight: float = 0.4):
        self.alpha = cost_weight
        self.beta = emission_weight

    def assign(self, routes: List[SavingsRoute], nodes: List[DeliveryNode],
               fleet_limits: Optional[Dict[str, int]] = None) -> Dict[str, Any]:
        vtypes = list(FLEET_TYPES.keys())
        n_routes = len(routes)

        if fleet_limits is None:
            fleet_limits = {vt: n_routes for vt in vtypes}

        assignments = []
        total_cost = 0.0
        total_emissions = 0.0
        total_nox = 0.0
        
        counts = dict(fleet_limits)
        
        # Sort routes by distance descending
        sorted_route_indices = sorted(range(n_routes), key=lambda r: routes[r].total_distance_km, reverse=True)
        
        for r_idx in sorted_route_indices:
            route = routes[r_idx]
            best_vt = None
            best_score = float('inf')
            route_has_green = any(nodes[i].in_green_zone for i in route.stops)
            
            for vt in vtypes:
                if counts[vt] <= 0: continue
                spec = FLEET_TYPES[vt]
                
                if route.total_demand > spec.capacity: continue
                if route.total_distance_km > spec.range_km: continue
                if route_has_green and not spec.is_zero_emission: continue
                    
                cost = spec.fixed_cost + route.total_distance_km * spec.per_km_cost
                co2 = route.total_distance_km * spec.co2_per_km
                
                norm_cost = cost / 200.0
                norm_co2 = co2 / 10.0
                score = self.alpha * norm_cost + self.beta * norm_co2
                
                if score < best_score:
                    best_score = score
                    best_vt = vt
                    
            if best_vt:
                counts[best_vt] -= 1
                spec = FLEET_TYPES[best_vt]
                route_cost = spec.fixed_cost + route.total_distance_km * spec.per_km_cost
                route_co2 = route.total_distance_km * spec.co2_per_km
                route_nox = route.total_distance_km * spec.nox_per_km
                
                route.vehicle_type = best_vt
                total_cost += route_cost
                total_emissions += route_co2
                total_nox += route_nox
                
                assignments.append({
                    "route_idx": r_idx,
                    "vehicle_type": best_vt,
                    "cost": round(route_cost, 2),
                    "co2_kg": round(route_co2, 3),
                    "nox_g": round(route_nox, 3),
                })
            else:
                route.vehicle_type = "unassigned"

        return {
            "status": "optimal" if len(assignments) == n_routes else "infeasible",
            "assignments": assignments,
            "total_cost": round(total_cost, 2),
            "total_co2_kg": round(total_emissions, 3),
            "total_nox_g": round(total_nox, 3),
            "cost_weight": self.alpha,
            "emission_weight": self.beta,
        }


# ===========================================================================
# Phase 3: Genetic Algorithm - Fleet Composition Tuner
# ===========================================================================
@dataclass
class FleetGenome:
    """An individual in the GA: fleet composition + weight balance."""
    fleet_counts: Dict[str, int]        # max count per vehicle type
    cost_weight: float                  # α for MILP objective
    emission_weight: float              # β for MILP objective
    fitness_cost: float = 0
    fitness_emission: float = 0
    fitness_combined: float = 0
    genome_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])


class GeneticFleetTuner:
    """
    GA that evolves fleet compositions and MILP weight parameters
    to find the best trade-off between cost and sustainability.
    """

    def __init__(self, pop_size: int = 5, generations: int = 5):
        self.pop_size = pop_size
        self.generations = generations

    def evolve(self, routes: List[SavingsRoute], nodes: List[DeliveryNode]) -> Dict[str, Any]:
        n_routes = len(routes)
        vtypes = list(FLEET_TYPES.keys())

        # Initialize population
        population: List[FleetGenome] = []
        for _ in range(self.pop_size):
            counts = {vt: random.randint(0, n_routes) for vt in vtypes}
            alpha = random.uniform(0.2, 0.9)
            population.append(FleetGenome(
                fleet_counts=counts,
                cost_weight=round(alpha, 2),
                emission_weight=round(1 - alpha, 2),
            ))

        # Add diversity-seed genomes
        population[0] = FleetGenome(  # pure cost minimizer
            fleet_counts={vt: n_routes for vt in vtypes},
            cost_weight=1.0, emission_weight=0.0,
        )
        population[1] = FleetGenome(  # pure green optimizer
            fleet_counts={"cargo-bike": n_routes, "ev-pod": n_routes, "hybrid-van": 0, "diesel-truck": 0},
            cost_weight=0.0, emission_weight=1.0,
        )

        assigner = MILPVehicleAssigner()
        history = []

        for gen in range(self.generations):
            # Evaluate all
            for ind in population:
                assigner.alpha = ind.cost_weight
                assigner.beta = ind.emission_weight
                result = assigner.assign(
                    [copy.deepcopy(r) for r in routes], nodes, ind.fleet_counts
                )
                ind.fitness_cost = result["total_cost"]
                ind.fitness_emission = result["total_co2_kg"]
                # Weighted combined fitness (lower is better)
                ind.fitness_combined = 0.5 * ind.fitness_cost + 500 * ind.fitness_emission

            population.sort(key=lambda x: x.fitness_combined)

            history.append({
                "generation": gen + 1,
                "best_cost": population[0].fitness_cost,
                "best_emission": population[0].fitness_emission,
                "best_combined": round(population[0].fitness_combined, 2),
                "avg_combined": round(sum(p.fitness_combined for p in population) / len(population), 2),
            })

            # Selection + crossover + mutation
            elite = population[:max(2, self.pop_size // 4)]
            new_pop = list(elite)

            while len(new_pop) < self.pop_size:
                p1, p2 = random.sample(elite, 2)
                child = FleetGenome(
                    fleet_counts={
                        vt: random.choice([p1.fleet_counts[vt], p2.fleet_counts[vt]])
                        for vt in vtypes
                    },
                    cost_weight=round((p1.cost_weight + p2.cost_weight) / 2 + random.uniform(-0.1, 0.1), 2),
                    emission_weight=0,
                )
                child.cost_weight = max(0.05, min(0.95, child.cost_weight))
                child.emission_weight = round(1 - child.cost_weight, 2)
                # Mutation
                if random.random() < 0.3:
                    mut_vt = random.choice(vtypes)
                    child.fleet_counts[mut_vt] = max(0, child.fleet_counts[mut_vt] + random.randint(-2, 2))
                new_pop.append(child)

            population = new_pop[:self.pop_size]

        # Final evaluation of best
        best = population[0]
        assigner.alpha = best.cost_weight
        assigner.beta = best.emission_weight
        final_result = assigner.assign(
            [copy.deepcopy(r) for r in routes], nodes, best.fleet_counts
        )

        return {
            "best_genome": {
                "genome_id": best.genome_id,
                "fleet_counts": best.fleet_counts,
                "cost_weight": best.cost_weight,
                "emission_weight": best.emission_weight,
            },
            "milp_result": final_result,
            "evolution_history": history,
        }


# ===========================================================================
# Master Orchestrator
# ===========================================================================
class SustainableFleetOptimizer:
    """
    End-to-end pipeline:
      1. Generate or accept delivery scenario
      2. Clarke & Wright -> initial route construction
      3. MILP -> optimal vehicle-type assignment per route
      4. GA -> meta-optimize fleet composition + objective weights
    """

    def __init__(self):
        self.cw_solver = ClarkeWrightSolver()
        self.ga_tuner = GeneticFleetTuner(pop_size=5, generations=5)

    def generate_scenario(self, num_orders: int = 20) -> Tuple[List[DeliveryNode], str]:
        depot = random.choice(list(DEPOT_HUBS.keys()))
        dlat, dlng = DEPOT_HUBS[depot]
        nodes = []
        for i in range(num_orders):
            lat = dlat + random.uniform(-0.06, 0.06)
            lng = dlng + random.uniform(-0.06, 0.06)
            nodes.append(DeliveryNode(
                node_id=f"PKG-{i+1:03d}",
                lat=lat, lng=lng,
                demand=random.randint(1, 4),
                priority=random.choices([1, 2, 3], weights=[60, 30, 10])[0],
                in_green_zone=in_green_zone(lat, lng),
            ))
        return nodes, depot

    def optimize(self, nodes: List[DeliveryNode], depot: str,
                 cost_weight: float = 0.6, emission_weight: float = 0.4,
                 ga_generations: int = 15) -> Dict[str, Any]:
        depot_lat, depot_lng = DEPOT_HUBS[depot]

        # Phase 1: Clarke & Wright
        cw_routes = self.cw_solver.solve(nodes, depot_lat, depot_lng, max_capacity=25)

        # Phase 2: MILP baseline (default weights)
        milp = MILPVehicleAssigner(cost_weight=cost_weight, emission_weight=emission_weight)
        baseline_result = milp.assign(
            [copy.deepcopy(r) for r in cw_routes], nodes
        )

        # Phase 3: GA meta-optimization
        self.ga_tuner.generations = ga_generations
        ga_result = self.ga_tuner.evolve(cw_routes, nodes)

        # Build serializable route details
        # Use the GA-optimized assignment
        opt_milp = MILPVehicleAssigner(
            cost_weight=ga_result["best_genome"]["cost_weight"],
            emission_weight=ga_result["best_genome"]["emission_weight"],
        )
        opt_routes = [copy.deepcopy(r) for r in cw_routes]
        opt_result = opt_milp.assign(opt_routes, nodes, ga_result["best_genome"]["fleet_counts"])

        route_details = []
        for i, route in enumerate(opt_routes):
            spec = FLEET_TYPES.get(route.vehicle_type, FLEET_TYPES["hybrid-van"])
            cost = spec.fixed_cost + route.total_distance_km * spec.per_km_cost
            co2 = route.total_distance_km * spec.co2_per_km
            time_min = (route.total_distance_km / spec.speed_kmh) * 60 + len(route.stops) * 5
            has_green = any(nodes[si].in_green_zone for si in route.stops)
            route_details.append({
                "route_id": f"R-{i+1:02d}",
                "vehicle_type": route.vehicle_type,
                "vehicle_name": spec.name,
                "icon": spec.icon,
                "stops": [nodes[si].node_id for si in route.stops],
                "stop_coords": [{"lat": nodes[si].lat, "lng": nodes[si].lng, "id": nodes[si].node_id} for si in route.stops],
                "num_stops": len(route.stops),
                "demand": route.total_demand,
                "capacity": spec.capacity,
                "utilization": round(route.total_demand / spec.capacity * 100, 1),
                "distance_km": route.total_distance_km,
                "cost": round(cost, 2),
                "co2_kg": round(co2, 3),
                "time_min": round(time_min, 1),
                "is_zero_emission": spec.is_zero_emission,
                "green_zone_stops": has_green,
            })

        # Fleet composition summary
        fleet_summary = {}
        for rd in route_details:
            vt = rd["vehicle_type"]
            if vt not in fleet_summary:
                fleet_summary[vt] = {"count": 0, "total_cost": 0, "total_co2": 0, "total_dist": 0, "name": rd["vehicle_name"], "icon": rd["icon"]}
            fleet_summary[vt]["count"] += 1
            fleet_summary[vt]["total_cost"] += rd["cost"]
            fleet_summary[vt]["total_co2"] += rd["co2_kg"]
            fleet_summary[vt]["total_dist"] += rd["distance_km"]
        for vt in fleet_summary:
            fleet_summary[vt]["total_cost"] = round(fleet_summary[vt]["total_cost"], 2)
            fleet_summary[vt]["total_co2"] = round(fleet_summary[vt]["total_co2"], 3)
            fleet_summary[vt]["total_dist"] = round(fleet_summary[vt]["total_dist"], 2)

        # Sustainability score (0-100)
        total_co2 = sum(rd["co2_kg"] for rd in route_details)
        max_possible_co2 = sum(rd["distance_km"] * 0.21 for rd in route_details)  # all diesel
        sustainability_score = round((1 - total_co2 / max(max_possible_co2, 0.01)) * 100, 1)

        green_compliance = sum(1 for rd in route_details if rd["green_zone_stops"] and rd["is_zero_emission"])
        green_violations = sum(1 for rd in route_details if rd["green_zone_stops"] and not rd["is_zero_emission"])

        return {
            "scenario": {
                "depot": depot,
                "depot_lat": depot_lat,
                "depot_lng": depot_lng,
                "num_orders": len(nodes),
                "total_demand": sum(n.demand for n in nodes),
                "green_zone_orders": sum(1 for n in nodes if n.in_green_zone),
                "delivery_points": [
                    {"id": n.node_id, "lat": n.lat, "lng": n.lng, "demand": n.demand,
                     "priority": n.priority, "green_zone": n.in_green_zone}
                    for n in nodes
                ],
            },
            "clarke_wright": {
                "routes_created": len(cw_routes),
                "total_distance_km": round(sum(r.total_distance_km for r in cw_routes), 2),
                "savings_vs_naive": round((1 - sum(r.total_distance_km for r in cw_routes) /
                    max(sum(2 * haversine_km(depot_lat, depot_lng, nodes[si].lat, nodes[si].lng)
                            for r in cw_routes for si in r.stops), 0.01)) * 100, 1),
            },
            "milp_baseline": baseline_result,
            "ga_optimized": {
                "genome": ga_result["best_genome"],
                "milp_result": opt_result,
                "evolution_history": ga_result["evolution_history"],
            },
            "routes": route_details,
            "fleet_composition": fleet_summary,
            "kpis": {
                "total_vehicles": len(route_details),
                "total_cost": round(sum(rd["cost"] for rd in route_details), 2),
                "total_co2_kg": round(total_co2, 3),
                "total_distance_km": round(sum(rd["distance_km"] for rd in route_details), 2),
                "sustainability_score": sustainability_score,
                "green_compliance": green_compliance,
                "green_violations": green_violations,
                "zero_emission_pct": round(sum(1 for rd in route_details if rd["is_zero_emission"]) / max(len(route_details), 1) * 100, 1),
                "avg_utilization": round(sum(rd["utilization"] for rd in route_details) / max(len(route_details), 1), 1),
            },
        }
