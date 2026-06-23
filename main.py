#!/usr/bin/env python3
"""
Симуляция доставки заказов курьерами — «Московские мастера».

Использование:
    python main.py input.csv
"""

import sys
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple


# ═══════════════════════════════════════════════════════════════════════
#  Перечисления и модели данных
# ═══════════════════════════════════════════════════════════════════════

class OrderStatus(Enum):
    PENDING    = auto()   # ещё не назначен курьеру
    ASSIGNED   = auto()   # назначен, курьер ещё не выдвинулся
    IN_TRANSIT = auto()   # курьер едет к точке доставки
    WAITING    = auto()   # курьер на месте, ждёт открытия временного окна
    DELIVERED  = auto()   # доставлен вовремя
    LATE       = auto()   # доставлен с опозданием
    FAILED     = auto()   # не доставлен (нет подходящего курьера)


@dataclass
class Order:
    id: str
    x: int
    y: int
    weight: int
    time_start: int
    time_end: int
    status: OrderStatus = OrderStatus.PENDING
    courier_id: Optional[str] = None
    delivery_time: int = -1  # -1 если не доставлен


@dataclass
class Courier:
    id: str
    max_weight: int
    start_x: int
    start_y: int
    # Текущее положение — устанавливается в __post_init__
    x: int = field(init=False)
    y: int = field(init=False)
    load: int = 0
    route: List[Order] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.x = self.start_x
        self.y = self.start_y

    @property
    def free_weight(self) -> int:
        """Свободная грузоподъёмность."""
        return self.max_weight - self.load


# ═══════════════════════════════════════════════════════════════════════
#  Утилиты
# ═══════════════════════════════════════════════════════════════════════

def manhattan(x1: int, y1: int, x2: int, y2: int) -> int:
    """Манхэттенское расстояние между двумя точками."""
    return abs(x1 - x2) + abs(y1 - y2)


def step_toward(cx: int, cy: int, tx: int, ty: int) -> Tuple[int, int]:
    """Один шаг (1 ед.) по манхэттенскому пути к точке (tx, ty).
    Сначала выравниваем X, затем Y."""
    if cx != tx:
        return cx + (1 if tx > cx else -1), cy
    if cy != ty:
        return cx, cy + (1 if ty > cy else -1)
    return cx, cy


# ═══════════════════════════════════════════════════════════════════════
#  Загрузка данных из CSV
# ═══════════════════════════════════════════════════════════════════════

def load_data(filename: str) -> Tuple[List[Courier], List[Order]]:
    """
    Читает CSV-файл с секциями «# Couriers» и «# Orders».

    Формат секции курьеров:
        id, max_weight, start_x, start_y

    Формат секции заказов:
        id, x, y, weight, time_start, time_end
    """
    couriers: List[Courier] = []
    orders: List[Order] = []
    section = ""

    try:
        with open(filename, encoding="utf-8") as fh:
            for lineno, raw in enumerate(fh, 1):
                line = raw.strip()
                if not line:
                    continue
                if line.startswith("#"):
                    section = line.lower()
                    continue

                parts = [p.strip() for p in line.split(",")]

                if "couriers" in section:
                    if len(parts) < 4:
                        _warn(lineno, "мало полей для курьера (нужно 4)")
                        continue
                    try:
                        couriers.append(Courier(
                            id=parts[0],
                            max_weight=int(parts[1]),
                            start_x=int(parts[2]),
                            start_y=int(parts[3]),
                        ))
                    except ValueError as exc:
                        _warn(lineno, str(exc))

                elif "orders" in section:
                    if len(parts) < 6:
                        _warn(lineno, "мало полей для заказа (нужно 6)")
                        continue
                    try:
                        orders.append(Order(
                            id=parts[0],
                            x=int(parts[1]),
                            y=int(parts[2]),
                            weight=int(parts[3]),
                            time_start=int(parts[4]),
                            time_end=int(parts[5]),
                        ))
                    except ValueError as exc:
                        _warn(lineno, str(exc))

    except FileNotFoundError:
        _die(f"файл «{filename}» не найден")
    except PermissionError:
        _die(f"нет доступа к файлу «{filename}»")

    return couriers, orders


# ═══════════════════════════════════════════════════════════════════════
#  Планировщик маршрутов — Earliest Deadline First + жадное назначение
# ═══════════════════════════════════════════════════════════════════════

def _estimated_arrival(courier: Courier, order: Order) -> int:
    """
    Оценивает время прибытия к заказу *order*, если тот добавляется
    в конец текущего маршрута курьера. Учитывает ожидание перед
    каждым временным окном.
    """
    cx, cy, t = courier.x, courier.y, 0
    for o in courier.route:
        if o.status in (OrderStatus.DELIVERED, OrderStatus.LATE, OrderStatus.FAILED):
            continue
        t += manhattan(cx, cy, o.x, o.y)
        t = max(t, o.time_start)  # ждём открытия окна, если прибыли раньше
        cx, cy = o.x, o.y
    t += manhattan(cx, cy, order.x, order.y)
    return t


def plan_routes(couriers: List[Courier], orders: List[Order]) -> None:
    """
    EDF (Earliest Deadline First): назначаем самые срочные заказы первыми.

    Для каждого заказа выбирается курьер с минимальным временем прибытия,
    который успевает в дедлайн и имеет достаточную грузоподъёмность.
    Заказы, для которых подходящий курьер не найден, получают статус FAILED.
    """
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


# ═══════════════════════════════════════════════════════════════════════
#  Константы симулятора
# ═══════════════════════════════════════════════════════════════════════

_ACTIVE = frozenset({OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT, OrderStatus.WAITING})
_DONE   = frozenset({OrderStatus.DELIVERED, OrderStatus.LATE, OrderStatus.FAILED})

# Приоритет символов для ASCII-шкалы (выше = важнее при перекрытии)
_TL_PRIO: Dict[str, int] = {"D": 6, "L": 5, "w": 4, "-": 3, "r": 2, ".": 1, " ": 0}


# ═══════════════════════════════════════════════════════════════════════
#  Симулятор
# ═══════════════════════════════════════════════════════════════════════

class DeliverySimulator:
    """Пошаговая симуляция (1 шаг = 1 минута, скорость 1 ед./мин.)."""

    TIMELINE_COLS = 70  # максимальная ширина шкалы времени в символах

    def __init__(self, couriers: List[Courier], orders: List[Order]) -> None:
        self.couriers = couriers
        self.orders = orders
        self.t = 0
        self._events: List[str] = []
        # courier_id → {минута → ASCII-символ}
        self._tl: Dict[str, Dict[int, str]] = {c.id: {} for c in couriers}

    # ── внутренние помощники ──────────────────────────────────────────

    def _emit(self, msg: str) -> None:
        self._events.append(msg)

    def _tl_set(self, courier_id: str, t: int, ch: str) -> None:
        """Записывает символ в временну́ю шкалу с учётом приоритета."""
        prev = self._tl[courier_id].get(t, " ")
        if _TL_PRIO.get(ch, 0) >= _TL_PRIO.get(prev, 0):
            self._tl[courier_id][t] = ch

    # ── движение курьера за один тик ─────────────────────────────────

    def _tick_courier(self, courier: Courier) -> None:
        t = self.t
        active = [o for o in courier.route if o.status in _ACTIVE]

        if not active:
            # Нет активных заказов — возвращаемся на базу
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
            # Курьер уже у точки доставки
            if t < order.time_start:
                # Ждём открытия временного окна
                order.status = OrderStatus.WAITING
                self._tl_set(courier.id, t, "w")
                return

            # Выполняем доставку
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
            # Движемся к точке доставки
            order.status = OrderStatus.IN_TRANSIT
            courier.x, courier.y = step_toward(
                courier.x, courier.y, order.x, order.y
            )
            self._tl_set(courier.id, t, "-")

    # ── запуск полной симуляции ───────────────────────────────────────

    def run(self) -> None:
        """Планирует маршруты и запускает пошаговую симуляцию."""
        plan_routes(self.couriers, self.orders)

        # Сразу логируем заказы без курьера
        for o in self.orders:
            if o.status == OrderStatus.FAILED:
                self._emit(
                    f"[t={0:>4}]  ✗ Заказ {o.id} — нет подходящего курьера"
                    f"  (дедлайн t={o.time_end}, вес {o.weight}кг)"
                )

        if not self.orders:
            return

        # Лимит симуляции = max(time_end) + запас на возврат на базу
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

    # ── вывод хронологического лога ──────────────────────────────────

    def print_log(self) -> None:
        _sep()
        print("  ХРОНОЛОГИЧЕСКИЙ ЛОГ ДОСТАВКИ")
        _sep()
        for line in (self._events or ["  (нет событий)"]):
            print(line)

    # ── вывод сводного отчёта ─────────────────────────────────────────

    def print_summary(self) -> None:
        _sep()
        print("  СВОДНЫЙ ОТЧЁТ")
        _sep()

        print("\n  Курьеры:")
        for c in self.couriers:
            print(f"    {c.id:>6}  грузоподъём {c.max_weight} кг  "
                  f"старт ({c.start_x},{c.start_y})")

        print("\n  Заказы:")
        _status_str = {
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
            lbl = _status_str.get(o.status, "?")
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

    # ── ASCII временная шкала ─────────────────────────────────────────

    def print_timeline(self) -> None:
        _sep()
        print("  ASCII ВРЕМЕННАЯ ШКАЛА")
        _sep()

        all_times = [t for tl in self._tl.values() for t in tl]
        if not all_times:
            print("  (нет данных)")
            return

        max_t = max(all_times)
        # Масштаб: сколько минут на один символ
        scale = max(1, max_t // self.TIMELINE_COLS + 1)
        cols  = max_t // scale + 1

        # Шапка с временными метками
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


# ═══════════════════════════════════════════════════════════════════════
#  Вспомогательные функции CLI
# ═══════════════════════════════════════════════════════════════════════

def _sep() -> None:
    print("\n" + "═" * 60)


def _warn(lineno: int, msg: str) -> None:
    print(f"  [предупреждение] строка {lineno}: {msg}", file=sys.stderr)


def _die(msg: str) -> None:
    print(f"Ошибка: {msg}.", file=sys.stderr)
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════
#  Точка входа
# ═══════════════════════════════════════════════════════════════════════

def main() -> None:
    if len(sys.argv) != 2:
        print("Использование: python main.py <файл.csv>")
        print("Пример:        python main.py input.csv")
        sys.exit(1)

    couriers, orders = load_data(sys.argv[1])

    if not couriers:
        _die("в файле нет данных о курьерах")
    if not orders:
        _die("в файле нет данных о заказах")

    print(f"Загружено: {len(couriers)} курьеров, {len(orders)} заказов.")

    sim = DeliverySimulator(couriers, orders)
    sim.run()
    sim.print_log()
    sim.print_summary()
    sim.print_timeline()
    print()


if __name__ == "__main__":
    main()
