"""
SecondLife Commerce — NSGA-II Multi-Objective Logistics Router
===============================================================
Implements Non-dominated Sorting Genetic Algorithm II (NSGA-II) for
simultaneous minimization of:
  Objective 1: Number of delivery vehicles (fleet units)
  Objective 2: Total operational cost (distance × fuel rate + fixed cost)

Uses real Bangalore hub coordinates from the logistics telemetry engine.
"""

import random
import math
import copy
import uuid
from typing import List, Dict, Tuple, Any
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Bangalore hub coordinates (shared with logistics_telemetry)
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

# Vehicle type definitions with cost parameters
VEHICLE_SPECS = {
    "bike":   {"capacity": 2,  "fixed_cost": 80,   "per_km_cost": 3.5,  "speed_kmh": 35, "emission_kg_km": 0.02},
    "ev-pod": {"capacity": 4,  "fixed_cost": 120,  "per_km_cost": 2.0,  "speed_kmh": 30, "emission_kg_km": 0.00},
    "van":    {"capacity": 8,  "fixed_cost": 250,  "per_km_cost": 6.5,  "speed_kmh": 40, "emission_kg_km": 0.12},
    "truck":  {"capacity": 16, "fixed_cost": 500,  "per_km_cost": 12.0, "speed_kmh": 30, "emission_kg_km": 0.25},
}


@dataclass
class DeliveryPoint:
    """A single delivery stop (customer location)."""
    point_id: str
    lat: float
    lng: float
    demand: int = 1          # parcels to deliver
    time_window_min: float = 0
    time_window_max: float = 480  # 8-hour window default
    service_time_min: float = 5


@dataclass
class Route:
    """A vehicle route: depot → stops → depot."""
    vehicle_type: str
    depot_hub: str
    stop_ids: List[str]
    total_distance_km: float = 0
    total_cost: float = 0
    total_time_min: float = 0
    load: int = 0


@dataclass
class Individual:
    """An NSGA-II individual (a complete routing solution)."""
    chromosome: List[int]   # order→vehicle assignment (gene index = order index, value = vehicle index)
    routes: List[Route] = field(default_factory=list)
    obj_vehicles: float = 0     # Objective 1: number of vehicles
    obj_cost: float = 0         # Objective 2: total cost
    obj_emissions: float = 0    # Bonus Objective 3: CO₂ emissions
    rank: int = 0
    crowding_distance: float = 0
    solution_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class NSGA2Router:
    """
    NSGA-II multi-objective vehicle routing optimizer.

    Objectives:
      f1 = minimize number of vehicles used
      f2 = minimize total operational cost (fixed + variable)
    """

    def __init__(
        self,
        pop_size: int = 80,
        generations: int = 100,
        crossover_rate: float = 0.85,
        mutation_rate: float = 0.15,
    ):
        self.pop_size = pop_size
        self.generations = generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate

    # ------------------------------------------------------------------
    # Generate delivery scenario
    # ------------------------------------------------------------------
    def generate_scenario(self, num_orders: int = 20) -> Tuple[List[DeliveryPoint], str]:
        """Create a realistic delivery scenario around Bangalore hubs."""
        depot = random.choice(list(DEPOT_HUBS.keys()))
        dlat, dlng = DEPOT_HUBS[depot]
        points = []
        for i in range(num_orders):
            points.append(DeliveryPoint(
                point_id=f"DEL-{i+1:03d}",
                lat=dlat + random.uniform(-0.06, 0.06),
                lng=dlng + random.uniform(-0.06, 0.06),
                demand=random.randint(1, 3),
                time_window_min=random.uniform(0, 120),
                time_window_max=random.uniform(240, 480),
            ))
        return points, depot

    # ------------------------------------------------------------------
    # Evaluate a single individual
    # ------------------------------------------------------------------
    def _evaluate(self, ind: Individual, points: List[DeliveryPoint], depot: str):
        """Compute objective values for an individual."""
        depot_lat, depot_lng = DEPOT_HUBS[depot]
        vehicle_types = list(VEHICLE_SPECS.keys())
        max_vehicles = max(ind.chromosome) + 1 if ind.chromosome else 0

        # Group stops by assigned vehicle
        vehicle_stops: Dict[int, List[int]] = {}
        for order_idx, veh_idx in enumerate(ind.chromosome):
            vehicle_stops.setdefault(veh_idx, []).append(order_idx)

        total_cost = 0.0
        total_emissions = 0.0
        routes = []
        active_vehicles = 0

        for veh_idx in sorted(vehicle_stops.keys()):
            stop_indices = vehicle_stops[veh_idx]
            if not stop_indices:
                continue

            active_vehicles += 1
            # Assign vehicle type based on total demand
            total_demand = sum(points[i].demand for i in stop_indices)
            vtype = "bike"
            for vt in ["bike", "ev-pod", "van", "truck"]:
                if VEHICLE_SPECS[vt]["capacity"] >= total_demand:
                    vtype = vt
                    break
            else:
                vtype = "truck"  # fallback

            specs = VEHICLE_SPECS[vtype]

            # Nearest-neighbor order within route
            ordered_stops = self._nearest_neighbor_sequence(stop_indices, points, depot_lat, depot_lng)

            # Calculate route distance
            route_dist = 0.0
            prev_lat, prev_lng = depot_lat, depot_lng
            for idx in ordered_stops:
                d = haversine_km(prev_lat, prev_lng, points[idx].lat, points[idx].lng)
                route_dist += d
                prev_lat, prev_lng = points[idx].lat, points[idx].lng
            # Return to depot
            route_dist += haversine_km(prev_lat, prev_lng, depot_lat, depot_lng)

            route_cost = specs["fixed_cost"] + route_dist * specs["per_km_cost"]
            route_emissions = route_dist * specs["emission_kg_km"]
            route_time = (route_dist / specs["speed_kmh"]) * 60 + len(ordered_stops) * 5

            total_cost += route_cost
            total_emissions += route_emissions

            routes.append(Route(
                vehicle_type=vtype,
                depot_hub=depot,
                stop_ids=[points[i].point_id for i in ordered_stops],
                total_distance_km=round(route_dist, 2),
                total_cost=round(route_cost, 2),
                total_time_min=round(route_time, 1),
                load=total_demand,
            ))

        ind.obj_vehicles = active_vehicles
        ind.obj_cost = round(total_cost, 2)
        ind.obj_emissions = round(total_emissions, 3)
        ind.routes = routes

    def _nearest_neighbor_sequence(self, indices: List[int], points: List[DeliveryPoint],
                                    start_lat: float, start_lng: float) -> List[int]:
        """Order stops using nearest-neighbor heuristic."""
        remaining = list(indices)
        ordered = []
        cur_lat, cur_lng = start_lat, start_lng
        while remaining:
            nearest = min(remaining, key=lambda i: haversine_km(cur_lat, cur_lng, points[i].lat, points[i].lng))
            ordered.append(nearest)
            remaining.remove(nearest)
            cur_lat, cur_lng = points[nearest].lat, points[nearest].lng
        return ordered

    # ------------------------------------------------------------------
    # NSGA-II Non-dominated Sorting
    # ------------------------------------------------------------------
    def _non_dominated_sort(self, population: List[Individual]) -> List[List[int]]:
        """Fast non-dominated sort from Deb et al. (2002)."""
        n = len(population)
        domination_count = [0] * n
        dominated_set: List[List[int]] = [[] for _ in range(n)]
        fronts: List[List[int]] = [[]]

        for p in range(n):
            for q in range(n):
                if p == q:
                    continue
                if self._dominates(population[p], population[q]):
                    dominated_set[p].append(q)
                elif self._dominates(population[q], population[p]):
                    domination_count[p] += 1
            if domination_count[p] == 0:
                population[p].rank = 0
                fronts[0].append(p)

        i = 0
        while fronts[i]:
            next_front = []
            for p in fronts[i]:
                for q in dominated_set[p]:
                    domination_count[q] -= 1
                    if domination_count[q] == 0:
                        population[q].rank = i + 1
                        next_front.append(q)
            i += 1
            fronts.append(next_front)

        return [f for f in fronts if f]

    def _dominates(self, a: Individual, b: Individual) -> bool:
        """Check if solution a dominates solution b (all objectives minimized)."""
        better_in_one = False
        for va, vb in [(a.obj_vehicles, b.obj_vehicles), (a.obj_cost, b.obj_cost)]:
            if va > vb:
                return False
            if va < vb:
                better_in_one = True
        return better_in_one

    # ------------------------------------------------------------------
    # Crowding Distance
    # ------------------------------------------------------------------
    def _crowding_distance(self, population: List[Individual], front: List[int]):
        """Assign crowding distance to individuals in a front."""
        n = len(front)
        if n <= 2:
            for idx in front:
                population[idx].crowding_distance = float('inf')
            return

        for idx in front:
            population[idx].crowding_distance = 0

        for obj_func in [lambda ind: ind.obj_vehicles, lambda ind: ind.obj_cost]:
            sorted_front = sorted(front, key=lambda i: obj_func(population[i]))
            obj_min = obj_func(population[sorted_front[0]])
            obj_max = obj_func(population[sorted_front[-1]])
            obj_range = obj_max - obj_min if obj_max != obj_min else 1.0

            population[sorted_front[0]].crowding_distance = float('inf')
            population[sorted_front[-1]].crowding_distance = float('inf')

            for i in range(1, n - 1):
                diff = obj_func(population[sorted_front[i+1]]) - obj_func(population[sorted_front[i-1]])
                population[sorted_front[i]].crowding_distance += diff / obj_range

    # ------------------------------------------------------------------
    # Genetic Operators
    # ------------------------------------------------------------------
    def _tournament_select(self, pop: List[Individual]) -> Individual:
        """Binary tournament selection based on rank and crowding distance."""
        a, b = random.sample(range(len(pop)), 2)
        if pop[a].rank < pop[b].rank:
            return copy.deepcopy(pop[a])
        elif pop[a].rank > pop[b].rank:
            return copy.deepcopy(pop[b])
        elif pop[a].crowding_distance > pop[b].crowding_distance:
            return copy.deepcopy(pop[a])
        else:
            return copy.deepcopy(pop[b])

    def _crossover(self, p1: Individual, p2: Individual) -> Tuple[Individual, Individual]:
        """Uniform crossover on vehicle assignments."""
        c1 = copy.deepcopy(p1)
        c2 = copy.deepcopy(p2)
        for i in range(len(c1.chromosome)):
            if random.random() < 0.5:
                c1.chromosome[i], c2.chromosome[i] = c2.chromosome[i], c1.chromosome[i]
        c1.solution_id = uuid.uuid4().hex[:8]
        c2.solution_id = uuid.uuid4().hex[:8]
        return c1, c2

    def _mutate(self, ind: Individual, max_vehicles: int):
        """Randomly reassign some orders to different vehicles."""
        for i in range(len(ind.chromosome)):
            if random.random() < self.mutation_rate:
                ind.chromosome[i] = random.randint(0, max_vehicles - 1)
        # Compact: remove empty vehicle slots
        mapping = {}
        new_idx = 0
        for v in ind.chromosome:
            if v not in mapping:
                mapping[v] = new_idx
                new_idx += 1
        ind.chromosome = [mapping[v] for v in ind.chromosome]

    # ------------------------------------------------------------------
    # Main optimization loop
    # ------------------------------------------------------------------
    def optimize(self, points: List[DeliveryPoint], depot: str,
                 pop_size: int = None, generations: int = None) -> Dict[str, Any]:
        """
        Run the full NSGA-II optimization.

        Returns dict with:
          - pareto_front: list of non-dominated solutions
          - all_generations: evolution history
          - best_cost / best_vehicles: extreme solutions
          - scenario metadata
        """
        pop_size = pop_size or self.pop_size
        gens = generations or self.generations
        num_orders = len(points)
        max_vehicles = max(3, num_orders // 2)

        # Initialize population
        population: List[Individual] = []
        for _ in range(pop_size):
            chromosome = [random.randint(0, max_vehicles - 1) for _ in range(num_orders)]
            ind = Individual(chromosome=chromosome)
            self._evaluate(ind, points, depot)
            population.append(ind)

        # Evolution history
        gen_history = []

        for gen in range(gens):
            # Create offspring
            offspring = []
            while len(offspring) < pop_size:
                p1 = self._tournament_select(population)
                p2 = self._tournament_select(population)
                if random.random() < self.crossover_rate:
                    c1, c2 = self._crossover(p1, p2)
                else:
                    c1, c2 = copy.deepcopy(p1), copy.deepcopy(p2)
                self._mutate(c1, max_vehicles)
                self._mutate(c2, max_vehicles)
                self._evaluate(c1, points, depot)
                self._evaluate(c2, points, depot)
                offspring.extend([c1, c2])

            # Combine parent + offspring
            combined = population + offspring[:pop_size]

            # Non-dominated sorting
            fronts = self._non_dominated_sort(combined)

            # Build next generation
            new_pop = []
            for front in fronts:
                self._crowding_distance(combined, front)
                if len(new_pop) + len(front) <= pop_size:
                    new_pop.extend([combined[i] for i in front])
                else:
                    remaining = pop_size - len(new_pop)
                    sorted_front = sorted(front, key=lambda i: combined[i].crowding_distance, reverse=True)
                    new_pop.extend([combined[i] for i in sorted_front[:remaining]])
                    break

            population = new_pop

            # Record generation stats
            front0 = [p for p in population if p.rank == 0]
            gen_history.append({
                "generation": gen + 1,
                "pareto_size": len(front0),
                "min_vehicles": min(p.obj_vehicles for p in front0) if front0 else 0,
                "min_cost": min(p.obj_cost for p in front0) if front0 else 0,
                "avg_cost": round(sum(p.obj_cost for p in population) / len(population), 2),
            })

        # Extract final Pareto front
        fronts = self._non_dominated_sort(population)
        pareto_indices = fronts[0] if fronts else []
        pareto_front = sorted(
            [population[i] for i in pareto_indices],
            key=lambda p: p.obj_vehicles
        )

        # Find extreme solutions
        best_vehicles = min(pareto_front, key=lambda p: p.obj_vehicles) if pareto_front else None
        best_cost = min(pareto_front, key=lambda p: p.obj_cost) if pareto_front else None
        # Find "knee" solution (balanced trade-off)
        knee = self._find_knee(pareto_front) if len(pareto_front) >= 3 else (pareto_front[len(pareto_front)//2] if pareto_front else None)

        depot_lat, depot_lng = DEPOT_HUBS[depot]

        return {
            "scenario": {
                "depot": depot,
                "depot_lat": depot_lat,
                "depot_lng": depot_lng,
                "num_orders": num_orders,
                "delivery_points": [
                    {"id": p.point_id, "lat": p.lat, "lng": p.lng, "demand": p.demand}
                    for p in points
                ],
            },
            "config": {
                "pop_size": pop_size,
                "generations": gens,
                "crossover_rate": self.crossover_rate,
                "mutation_rate": self.mutation_rate,
            },
            "pareto_front": [self._serialize_solution(s) for s in pareto_front],
            "best_vehicles": self._serialize_solution(best_vehicles) if best_vehicles else None,
            "best_cost": self._serialize_solution(best_cost) if best_cost else None,
            "knee_solution": self._serialize_solution(knee) if knee else None,
            "evolution_history": gen_history,
        }

    def _find_knee(self, front: List[Individual]) -> Individual:
        """Find the knee point on the Pareto front using max distance to the line."""
        if len(front) < 3:
            return front[0]
        # Line from first to last point
        x1, y1 = front[0].obj_vehicles, front[0].obj_cost
        x2, y2 = front[-1].obj_vehicles, front[-1].obj_cost
        max_dist = -1
        knee = front[0]
        for sol in front[1:-1]:
            # Perpendicular distance from point to line
            num = abs((y2-y1)*sol.obj_vehicles - (x2-x1)*sol.obj_cost + x2*y1 - y2*x1)
            den = math.sqrt((y2-y1)**2 + (x2-x1)**2) + 1e-9
            dist = num / den
            if dist > max_dist:
                max_dist = dist
                knee = sol
        return knee

    def _serialize_solution(self, sol: Individual) -> Dict[str, Any]:
        """Convert a solution to a JSON-serializable dict."""
        return {
            "solution_id": sol.solution_id,
            "vehicles_used": int(sol.obj_vehicles),
            "total_cost": sol.obj_cost,
            "total_emissions_kg": sol.obj_emissions,
            "routes": [
                {
                    "vehicle_type": r.vehicle_type,
                    "depot_hub": r.depot_hub,
                    "stops": r.stop_ids,
                    "num_stops": len(r.stop_ids),
                    "distance_km": r.total_distance_km,
                    "cost": r.total_cost,
                    "time_min": r.total_time_min,
                    "load": r.load,
                    "capacity": VEHICLE_SPECS[r.vehicle_type]["capacity"],
                }
                for r in sol.routes
            ],
        }
