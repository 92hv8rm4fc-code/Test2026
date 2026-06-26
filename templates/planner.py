"""
planner.py — планировщик маршрутов (EDF)
────────────────────────────────────────
Зависимости: models, utils

Алгоритм Earliest Deadline First:
  1. Сортируем заказы по time_end (дедлайн).
  2. Для каждого ищем курьера с мин. временем прибытия,
     который успевает и вмещает груз.
  3. Не нашли → FAILED.

На олимпиаде: если нужен другой алгоритм — меняй только plan_routes().
"""

from typing import List, Optional

from models import Courier, Order, OrderStatus
from utils import manhattan


def _estimated_arrival(courier: Courier, order: Order) -> int:
    """Оценка времени прибытия, если заказ добавить в конец маршрута."""
    cx, cy, t = courier.x, courier.y, 0
    for o in courier.route:
        if o.status in (OrderStatus.DELIVERED, OrderStatus.LATE, OrderStatus.FAILED):
            continue
        t += manhattan(cx, cy, o.x, o.y)
        t = max(t, o.time_start)   # ждём открытия окна
        cx, cy = o.x, o.y
    t += manhattan(cx, cy, order.x, order.y)
    return t


def plan_routes(couriers: List[Courier], orders: List[Order]) -> None:
    pending = sorted(
        (o for o in orders if o.status == OrderStatus.PENDING),
        key=lambda o: (o.time_end, o.time_start),
    )

    for order in pending:
        best_courier: Optional[Courier] = None
        best_arrival = float("inf")

        for courier in couriers:
            if courier.free_weight < order.weight:
                continue
            arrival = _estimated_arrival(courier, order)
            if arrival > order.time_end:
                continue
            if arrival < best_arrival:
                best_arrival = arrival
                best_courier = courier

        if best_courier is not None:
            order.status = OrderStatus.ASSIGNED
            order.courier_id = best_courier.id
            best_courier.load += order.weight
            best_courier.route.append(order)
        else:
            order.status = OrderStatus.FAILED
