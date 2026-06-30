"""
Заготовка — симулятор доставки (один файл).
Запуск: python main.py input.csv

Перед олимпиадой сверь с условием:
  - статусы заказа (сейчас 5 штук — ориентир)
  - SHOW_PERCENT — нужен ли процент в отчёте
  - формат CSV и вывода
"""

import sys
from dataclasses import dataclass, field
from enum import Enum, auto


# Поставь False, если в условии нет строки «выполнено X%»
SHOW_PERCENT = True


'''
Статусы заказа — сверь с условием на олимпиаде.
Ориентир (5): PENDING, IN_PROGRESS, DELIVERED, LATE, FAILED
'''
class OrderStatus(Enum):
    PENDING     = auto()   # ещё не назначен
    IN_PROGRESS = auto()   # назначен, в пути или ждёт окно
    DELIVERED   = auto()   # доставлен вовремя
    LATE        = auto()   # доставлен с опозданием
    FAILED      = auto()   # не доставлен


@dataclass
class Order:
    id: str
    x: int
    y: int
    weight: int
    time_start: int
    time_end: int
    status: OrderStatus = OrderStatus.PENDING
    courier_id: str = ""
    delivery_time: int = -1


@dataclass
class Courier:
    id: str
    max_weight: int
    start_x: int
    start_y: int
    x: int = field(init=False)
    y: int = field(init=False)
    load: int = 0
    route: list = field(default_factory=list)

    def __post_init__(self):
        self.x = self.start_x
        self.y = self.start_y


'''
Утилиты
'''
def manhattan(x1, y1, x2, y2):
    return abs(x1 - x2) + abs(y1 - y2)


def step_toward(cx, cy, tx, ty):
    if cx != tx:
        return cx + (1 if tx > cx else -1), cy
    if cy != ty:
        return cx, cy + (1 if ty > cy else -1)
    return cx, cy


def sep():
    print("\n" + "═" * 60)


def warning(lineno, msg):
    print(f"  [предупреждение] строка {lineno}: {msg}", file=sys.stderr)


def die(msg):
    print(f"Ошибка: {msg}.", file=sys.stderr)
    sys.exit(1)


'''
Загрузка CSV — поправь поля, если формат в условии другой
'''
def load_data(filename):
    couriers = []
    orders = []
    section = ""

    try:
        with open(filename, encoding="utf-8") as f:
            for lineno, raw in enumerate(f, 1):
                line = raw.strip()
                if not line:
                    continue
                if line.startswith("#"):
                    section = line.lower()
                    continue

                parts = [p.strip() for p in line.split(",")]

                if "couriers" in section:
                    if len(parts) < 4:
                        warning(lineno, "мало полей для курьера (нужно 4)")
                        continue
                    try:
                        couriers.append(Courier(
                            id=parts[0],
                            max_weight=int(parts[1]),
                            start_x=int(parts[2]),
                            start_y=int(parts[3]),
                        ))
                    except ValueError as e:
                        warning(lineno, str(e))

                elif "orders" in section:
                    if len(parts) < 6:
                        warning(lineno, "мало полей для заказа (нужно 6)")
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
                    except ValueError as e:
                        warning(lineno, str(e))

    except FileNotFoundError:
        die(f"файл «{filename}» не найден")

    return couriers, orders


'''
Планировщик — EDF (самый срочный заказ первым)
'''
def estimated_arrival(courier, order):
    cx, cy, t = courier.x, courier.y, 0
    for o in courier.route:
        if o.status in DONE:
            continue
        t += manhattan(cx, cy, o.x, o.y)
        t = max(t, o.time_start)
        cx, cy = o.x, o.y
    t += manhattan(cx, cy, order.x, order.y)
    return t


def plan_routes(couriers, orders):
    pending = sorted(
        [o for o in orders if o.status == OrderStatus.PENDING],
        key=lambda o: (o.time_end, o.time_start),
    )

    for order in pending:
        best_courier = None
        best_arrival = None

        for courier in couriers:
            if courier.max_weight - courier.load < order.weight:
                continue
            arrival = estimated_arrival(courier, order)
            if arrival > order.time_end:
                continue
            if best_arrival is None or arrival < best_arrival:
                best_arrival = arrival
                best_courier = courier

        if best_courier is not None:
            order.status = OrderStatus.IN_PROGRESS
            order.courier_id = best_courier.id
            best_courier.load += order.weight
            best_courier.route.append(order)
        else:
            order.status = OrderStatus.FAILED


'''
Симулятор
'''
ACTIVE = {OrderStatus.IN_PROGRESS}
DONE = {OrderStatus.DELIVERED, OrderStatus.LATE, OrderStatus.FAILED}

TL_PRIO = {"D": 6, "L": 5, "w": 4, "-": 3, "r": 2, ".": 1, " ": 0}


class DeliverySimulator:

    TIMELINE_COLS = 70

    def __init__(self, couriers, orders):
        self.couriers = couriers
        self.orders = orders
        self.t = 0
        self.events = []
        self.timeline = {c.id: {} for c in couriers}

    def emit(self, msg):
        self.events.append(msg)

    def tl_set(self, courier_id, t, ch):
        prev = self.timeline[courier_id].get(t, " ")
        if TL_PRIO.get(ch, 0) >= TL_PRIO.get(prev, 0):
            self.timeline[courier_id][t] = ch

    def tick_courier(self, courier):
        t = self.t
        active = [o for o in courier.route if o.status in ACTIVE]

        if not active:
            if (courier.x, courier.y) != (courier.start_x, courier.start_y):
                courier.x, courier.y = step_toward(
                    courier.x, courier.y, courier.start_x, courier.start_y
                )
                self.tl_set(courier.id, t, "r")
            else:
                self.tl_set(courier.id, t, ".")
            return

        order = active[0]

        if (courier.x, courier.y) == (order.x, order.y):
            if t < order.time_start:
                self.tl_set(courier.id, t, "w")
                return

            order.delivery_time = t
            courier.load -= order.weight

            if t <= order.time_end:
                order.status = OrderStatus.DELIVERED
                self.tl_set(courier.id, t, "D")
                self.emit(
                    f"[t={t:>4}]  + {courier.id} -> {order.id} "
                    f"({order.x},{order.y})  ВОВРЕМЯ"
                    f"   [окно {order.time_start}-{order.time_end}]"
                )
            else:
                order.status = OrderStatus.LATE
                self.tl_set(courier.id, t, "L")
                self.emit(
                    f"[t={t:>4}]  ! {courier.id} -> {order.id} "
                    f"({order.x},{order.y})  ОПОЗДАНИЕ"
                    f"  [окно {order.time_start}-{order.time_end}, t={t}]"
                )
        else:
            courier.x, courier.y = step_toward(
                courier.x, courier.y, order.x, order.y
            )
            self.tl_set(courier.id, t, "-")

    def run(self):
        plan_routes(self.couriers, self.orders)

        for o in self.orders:
            if o.status == OrderStatus.FAILED:
                self.emit(
                    f"[t={0:>4}]  x Заказ {o.id} — нет курьера"
                    f"  (дедлайн t={o.time_end}, вес {o.weight} кг)"
                )

        if not self.orders:
            return

        max_t = max(o.time_end for o in self.orders)
        extra = max(
            manhattan(c.start_x, c.start_y, o.x, o.y)
            for c in self.couriers for o in self.orders
        )
        limit = max_t + extra + 1

        for self.t in range(limit):
            for courier in self.couriers:
                self.tick_courier(courier)

            all_done = all(o.status in DONE for o in self.orders)
            at_base = all(
                (c.x, c.y) == (c.start_x, c.start_y) for c in self.couriers
            )
            if all_done and at_base:
                break

    def print_report(self):
        status_labels = {
            OrderStatus.DELIVERED: "вовремя",
            OrderStatus.LATE: "с опозданием",
            OrderStatus.FAILED: "не доставлен",
        }

        # --- лог ---
        sep()
        print("  ХРОНОЛОГИЧЕСКИЙ ЛОГ")
        sep()
        for line in (self.events or ["  (нет событий)"]):
            print(line)

        # --- сводка ---
        sep()
        print("  СВОДНЫЙ ОТЧЁТ")
        sep()

        print("\n  Курьеры:")
        for c in self.couriers:
            print(f"    {c.id:>6}  груз {c.max_weight} кг  старт ({c.start_x},{c.start_y})")

        print("\n  Заказы:")
        for o in sorted(
            self.orders,
            key=lambda o: o.delivery_time if o.delivery_time >= 0 else 999999,
        ):
            cid = o.courier_id or "-"
            dt = str(o.delivery_time) if o.delivery_time >= 0 else "-"
            lbl = status_labels.get(o.status, "?")
            print(
                f"    {o.id:>5}  ({o.x:>3},{o.y:>3})  {o.weight:>3} кг  "
                f"окно [{o.time_start:>3}-{o.time_end:>3}]  "
                f"t={dt:>4}  {cid:<6}  [{lbl}]"
            )

        delivered = sum(1 for o in self.orders if o.status == OrderStatus.DELIVERED)
        late = sum(1 for o in self.orders if o.status == OrderStatus.LATE)
        failed = sum(1 for o in self.orders if o.status == OrderStatus.FAILED)
        total = len(self.orders)

        print("\n  Итог:")
        print(f"    Всего заказов:           {total}")
        print(f"    Доставлено вовремя:      {delivered}")
        print(f"    Доставлено с опозданием: {late}")
        print(f"    Не доставлено:           {failed}")
        if SHOW_PERCENT and total:
            pct = (delivered + late) / total * 100
            print(f"    Выполнено:               {pct:.1f}%")

        # --- timeline ---
        sep()
        print("  ASCII ВРЕМЕННАЯ ШКАЛА")
        sep()

        all_times = [t for tl in self.timeline.values() for t in tl]
        if not all_times:
            print("  (нет данных)")
            return

        max_t = max(all_times)
        scale = max(1, max_t // self.TIMELINE_COLS + 1)
        cols = max_t // scale + 1

        ruler = " " * 11
        for i in range(0, cols, 10):
            ruler += f"{i * scale:<10}"
        print(f"\n{ruler}")
        print(" " * 11 + "-" * cols)

        for courier in self.couriers:
            tl = self.timeline[courier.id]
            row = [" "] * cols
            for t, ch in tl.items():
                idx = min(t // scale, cols - 1)
                if TL_PRIO.get(ch, 0) >= TL_PRIO.get(row[idx], 0):
                    row[idx] = ch
            print(f"  {courier.id:<8} |{''.join(row)}|")

        print(
            "\n  Легенда:  D=вовремя  L=опоздание  "
            "-=в пути  w=ожидание  r=возврат  .=база"
        )
        if scale > 1:
            print(f"  Масштаб: 1 символ = {scale} мин")


'''
Точка входа
'''
def main():
    if len(sys.argv) != 2:
        print("Использование: python main.py <файл.csv>")
        print("Пример:        python main.py input.csv")
        sys.exit(1)

    couriers, orders = load_data(sys.argv[1])

    if not couriers:
        die("в файле нет данных о курьерах")
    if not orders:
        die("в файле нет данных о заказах")

    print(f"Загружено: {len(couriers)} курьеров, {len(orders)} заказов.")

    sim = DeliverySimulator(couriers, orders)
    sim.run()
    sim.print_report()
    print()


if __name__ == "__main__":
    main()
