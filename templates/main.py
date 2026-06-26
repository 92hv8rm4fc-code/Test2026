#!/usr/bin/env python3
"""
main.py — точка входа
─────────────────────
Зависимости: loader, simulator, utils

Сборка на олимпиаде:
  1. Скопируй все .py из templates/ в рабочую папку
  2. Положи input.csv рядом
  3. python main.py input.csv

Если нужен ОДИН файл — склей модули в main.py (см. SBORKA.md).
"""

import sys

from loader import load_data
from simulator import DeliverySimulator
from utils import die


def main() -> None:
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
    sim.print_log()
    sim.print_summary()
    sim.print_timeline()
    print()


if __name__ == "__main__":
    main()
