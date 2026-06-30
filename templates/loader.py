"""
loader.py — чтение CSV
──────────────────────
Зависимости: models, utils

Формат входного файла:
  # Couriers
  id, max_weight, start_x, start_y

  # Orders
  id, x, y, weight, time_start, time_end

На олимпиаде: если формат другой — правь только этот файл.
"""

from typing import List, Tuple

from models import Courier, Order
from utils import die, warn


def load_data(filename: str) -> Tuple[List[Courier], List[Order]]:
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
                        warn(lineno, "мало полей для курьера (нужно 4)")
                        continue
                    try:
                        couriers.append(Courier(
                            id=parts[0],
                            max_weight=int(parts[1]),
                            start_x=int(parts[2]),
                            start_y=int(parts[3]),
                        ))
                    except ValueError as exc:
                        warn(lineno, str(exc))

                elif "orders" in section:
                    if len(parts) < 6:
                        warn(lineno, "мало полей для заказа (нужно 6)")
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
                        warn(lineno, str(exc))

    except FileNotFoundError:
        die(f"файл «{filename}» не найден")
    except PermissionError:
        die(f"нет доступа к файлу «{filename}»")

    return couriers, orders
