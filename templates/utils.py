"""
utils.py — вспомогательные функции
───────────────────────────────────
Зависимости: sys (для warn/die)

Что здесь:
  • manhattan()   — манхэттенское расстояние
  • step_toward() — один шаг к цели (1 ед./мин)
  • sep()         — разделитель в выводе
  • warn()        — предупреждение в stderr
  • die()         — ошибка + выход
"""

import sys
from typing import Tuple


def manhattan(x1: int, y1: int, x2: int, y2: int) -> int:
    return abs(x1 - x2) + abs(y1 - y2)


def step_toward(cx: int, cy: int, tx: int, ty: int) -> Tuple[int, int]:
    """Один шаг: сначала X, потом Y."""
    if cx != tx:
        return cx + (1 if tx > cx else -1), cy
    if cy != ty:
        return cx, cy + (1 if ty > cy else -1)
    return cx, cy


def sep() -> None:
    print("\n" + "═" * 60)


def warn(lineno: int, msg: str) -> None:
    print(f"  [предупреждение] строка {lineno}: {msg}", file=sys.stderr)


def die(msg: str) -> None:
    print(f"Ошибка: {msg}.", file=sys.stderr)
    sys.exit(1)
