"""
simulator.py — пошаговая симуляция + вывод
───────────────────────────────────────────
Зависимости: models, utils, planner

Что здесь:
  • DeliverySimulator.run()           — главный цикл (1 тик = 1 мин)
  • DeliverySimulator.print_log()     — хронологический лог
  • DeliverySimulator.print_summary() — сводный отчёт
  • DeliverySimulator.print_timeline()— ASCII-шкала

На олимпиаде: если меняется логика движения — правь _tick_courier().
"""

from typing import Dict, List

from models import Courier, Order, OrderStatus
from planner import plan_routes
from utils import manhattan, sep, step_toward

_ACTIVE = frozenset({OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT, OrderStatus.WAITING})
_DONE   = frozenset({OrderStatus.DELIVERED, OrderStatus.LATE, OrderStatus.FAILED})

_TL_PRIO: Dict[str, int] = {"D": 6, "L": 5, "w": 4, "-": 3, "r": 2, ".": 1, " ": 0}


class DeliverySimulator:
    TIMELINE_COLS = 70

    def __init__(self, couriers: List[Courier], orders: List[Order]) -> None:
        self.couriers = couriers
        self.orders = orders
        self.t = 0
        self._events: List[str] = []
        self._tl: Dict[str, Dict[int, str]] = {c.id: {} for c in couriers}

    # ── внутренние ───────────────────────────────────────────────────

    def _emit(self, msg: str) -> None:
        self._events.append(msg)

    def _tl_set(self, courier_id: str, t: int, ch: str) -> None:
        prev = self._tl[courier_id].get(t, " ")
        if _TL_PRIO.get(ch, 0) >= _TL_PRIO.get(prev, 0):
            self._tl[courier_id][t] = ch

    def _tick_courier(self, courier: Courier) -> None:
        t = self.t
        active = [o for o in courier.route if o.status in _ACTIVE]

        if not active:
            if (courier.x, courier.y) != (courier.start_x, courier.start_y):
                courier.x, courier.y = step_toward(
                    courier.x, courier.y, courier.start_x, courier.start_y
                )
                self._tl_set(courier.id, t, "r")
            else:
                self._tl_set(courier.id, t, ".")
            return

        order = active[0]

        if (courier.x, courier.y) == (order.x, order.y):
            if t < order.time_start:
                order.status = OrderStatus.WAITING
                self._tl_set(courier.id, t, "w")
                return

            order.delivery_time = t
            courier.load -= order.weight

            if t <= order.time_end:
                order.status = OrderStatus.DELIVERED
                self._tl_set(courier.id, t, "D")
                self._emit(
                    f"[t={t:>4}]  ✓ {courier.id} → {order.id} "
                    f"({order.x},{order.y})  ВОВРЕМЯ"
                    f"   [окно {order.time_start}–{order.time_end}]"
                )
            else:
                order.status = OrderStatus.LATE
                self._tl_set(courier.id, t, "L")
                self._emit(
                    f"[t={t:>4}]  ! {courier.id} → {order.id} "
                    f"({order.x},{order.y})  С ОПОЗДАНИЕМ"
                    f"  [окно {order.time_start}–{order.time_end}, прибыл t={t}]"
                )
        else:
            order.status = OrderStatus.IN_TRANSIT
            courier.x, courier.y = step_toward(
                courier.x, courier.y, order.x, order.y
            )
            self._tl_set(courier.id, t, "-")

    # ── запуск ────────────────────────────────────────────────────────

    def run(self) -> None:
        plan_routes(self.couriers, self.orders)

        for o in self.orders:
            if o.status == OrderStatus.FAILED:
                self._emit(
                    f"[t={0:>4}]  ✗ Заказ {o.id} — нет подходящего курьера"
                    f"  (дедлайн t={o.time_end}, вес {o.weight}кг)"
                )

        if not self.orders:
            return

        max_t = max(o.time_end for o in self.orders)
        extra = max(
            (manhattan(c.start_x, c.start_y, o.x, o.y)
             for c in self.couriers for o in self.orders),
            default=0,
        )
        limit = max_t + extra + 1

        for self.t in range(limit):
            for courier in self.couriers:
                self._tick_courier(courier)

            all_done = all(o.status in _DONE for o in self.orders)
            at_base  = all(
                (c.x, c.y) == (c.start_x, c.start_y) for c in self.couriers
            )
            if all_done and at_base:
                break

    # ── вывод ─────────────────────────────────────────────────────────

    def print_log(self) -> None:
        sep()
        print("  ХРОНОЛОГИЧЕСКИЙ ЛОГ ДОСТАВКИ")
        sep()
        for line in (self._events or ["  (нет событий)"]):
            print(line)

    def print_summary(self) -> None:
        sep()
        print("  СВОДНЫЙ ОТЧЁТ")
        sep()

        print("\n  Курьеры:")
        for c in self.couriers:
            print(f"    {c.id:>6}  грузоподъём {c.max_weight} кг  "
                  f"старт ({c.start_x},{c.start_y})")

        print("\n  Заказы:")
        status_str = {
            OrderStatus.DELIVERED: "вовремя",
            OrderStatus.LATE:      "с опозданием",
            OrderStatus.FAILED:    "не доставлен",
        }
        for o in sorted(
            self.orders,
            key=lambda o: (o.delivery_time if o.delivery_time >= 0 else 999_999),
        ):
            cid = o.courier_id or "—"
            dt  = str(o.delivery_time) if o.delivery_time >= 0 else "—"
            lbl = status_str.get(o.status, "?")
            print(
                f"    {o.id:>5}  ({o.x:>3},{o.y:>3})  {o.weight:>3} кг  "
                f"окно [{o.time_start:>3}–{o.time_end:>3}]  "
                f"t_доставки={dt:>4}  {cid:<6}  [{lbl}]"
            )

        delivered = sum(1 for o in self.orders if o.status == OrderStatus.DELIVERED)
        late      = sum(1 for o in self.orders if o.status == OrderStatus.LATE)
        failed    = sum(1 for o in self.orders if o.status == OrderStatus.FAILED)
        total     = len(self.orders)

        print("\n  Итог:")
        print(f"    Всего заказов:           {total}")
        print(f"    Доставлено вовремя:      {delivered}")
        print(f"    Доставлено с опозданием: {late}")
        print(f"    Не доставлено:           {failed}")
        if total:
            pct = (delivered + late) / total * 100
            print(f"    Выполнено (всего):       {pct:.1f}%")

    def print_timeline(self) -> None:
        sep()
        print("  ASCII ВРЕМЕННАЯ ШКАЛА")
        sep()

        all_times = [t for tl in self._tl.values() for t in tl]
        if not all_times:
            print("  (нет данных)")
            return

        max_t = max(all_times)
        scale = max(1, max_t // self.TIMELINE_COLS + 1)
        cols  = max_t // scale + 1

        ruler = " " * 11
        for i in range(0, cols, 10):
            ruler += f"{i * scale:<10}"
        print(f"\n{ruler}")
        print(" " * 11 + "┄" * cols)

        for courier in self.couriers:
            tl = self._tl[courier.id]
            row = [" "] * cols
            for t, ch in tl.items():
                idx = min(t // scale, cols - 1)
                if _TL_PRIO.get(ch, 0) >= _TL_PRIO.get(row[idx], 0):
                    row[idx] = ch
            print(f"  {courier.id:<8} │{''.join(row)}│")

        print(
            "\n  Легенда:  D=вовремя  L=опоздание  "
            "-=в пути  w=ожидание окна  r=возврат на базу  .=на базе"
        )
        if scale > 1:
            print(f"  Масштаб: 1 символ = {scale} мин")
