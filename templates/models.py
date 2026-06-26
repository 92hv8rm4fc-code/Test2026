"""
models.py — модели данных
──────────────────────────
Зависимости: только stdlib (dataclasses, enum, typing)

Что здесь:
  • OrderStatus  — статусы заказа
  • Order        — заказ (координаты, вес, временное окно)
  • Courier      — курьер (грузоподъёмность, позиция, маршрут)

На олимпиаде: обычно копируешь первым, от него зависят все остальные модули.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Optional


class OrderStatus(Enum):
    PENDING    = auto()   # ещё не назначен
    ASSIGNED   = auto()   # назначен курьеру
    IN_TRANSIT = auto()   # курьер едет
    WAITING    = auto()   # на месте, ждёт открытия окна
    DELIVERED  = auto()   # доставлен вовремя
    LATE       = auto()   # доставлен с опозданием
    FAILED     = auto()   # не доставлен


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
    delivery_time: int = -1   # -1 = не доставлен


@dataclass
class Courier:
    id: str
    max_weight: int
    start_x: int
    start_y: int
    x: int = field(init=False)
    y: int = field(init=False)
    load: int = 0
    route: List[Order] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.x = self.start_x
        self.y = self.start_y

    @property
    def free_weight(self) -> int:
        return self.max_weight - self.load
