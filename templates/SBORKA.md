# Заготовки — Симулятор доставки (Московские мастера)

> Папка с готовыми модулями. На олимпиаде копируешь в рабочую директорию и запускаешь.

## Быстрый старт (5 минут)

```bash
# 1. Скопировать все файлы в папку проекта
cp templates/*.py templates/input.csv ./

# 2. Запустить
python main.py input.csv
```

## Структура модулей

```
models.py     ← OrderStatus, Order, Courier          (нет зависимостей)
utils.py      ← manhattan, step_toward, warn, die    (нет зависимостей)
loader.py     ← load_data()                          → models, utils
planner.py    ← plan_routes()                        → models, utils
simulator.py  ← DeliverySimulator                    → models, utils, planner
main.py       ← точка входа                          → loader, simulator, utils
input.csv     ← тестовые данные
```

### Граф зависимостей

```
main.py
 ├── loader.py ──→ models.py
 │              └→ utils.py
 └── simulator.py ─→ planner.py ──→ models.py, utils.py
                  └→ models.py, utils.py
```

## Чеклист на олимпиаде

- [ ] Прочитать условие → сверить формат CSV с `loader.py`
- [ ] Скопировать модули в проект
- [ ] `python main.py input.csv` — проверить, что запускается
- [ ] Подставить тестовый файл организаторов
- [ ] При необходимости подправить:
  - **формат входа** → `loader.py`
  - **алгоритм назначения** → `planner.py`
  - **логику движения** → `simulator.py` → `_tick_courier()`
  - **формат вывода** → `simulator.py` → `print_*()`
- [ ] Заполнить `README.md` (шаблон ниже)
- [ ] Финальный прогон

## Вариант А: несколько файлов (рекомендуется)

Просто копируешь все `.py` в одну папку. Импорты уже настроены.

## Вариант Б: один файл `main.py`

Если условие требует один скрипт — склей в таком порядке:

1. `models.py` (без docstring-шапки или с ней)
2. `utils.py`
3. `loader.py` (убери `from models import ...`, код уже выше)
4. `planner.py`
5. `simulator.py`
6. `main.py` (убери импорты из других модулей)

Готовый монолит уже есть в корне репозитория: `/main.py`.

## Что править под конкретное условие

| Изменение в условии | Где править |
|---------------------|-------------|
| Другие поля в CSV | `loader.py` |
| Другой разделитель / кодировка | `loader.py` |
| Другой алгоритм маршрута | `planner.py` |
| Скорость ≠ 1 ед/мин | `simulator.py` → `_tick_courier()` |
| Нет возврата на базу | `simulator.py` → блок `if not active` |
| Другой формат лога | `simulator.py` → `_emit()`, `print_log()` |
| Нужна визуализация карты | новый `viz.py` или метод в simulator |

## Ключевые формулы (шпаргалка)

```python
# Расстояние
dist = abs(x1 - x2) + abs(y1 - y2)

# Время в пути (скорость 1)
travel_time = dist

# Время прибытия с ожиданием окна
arrival = travel_time
if arrival < order.time_start:
    arrival = order.time_start   # ждём

# Статус доставки
if time_start <= t <= time_end:  DELIVERED
elif t > time_end:               LATE (если всё же доехал)
else:                            ждём (WAITING)
```

## Статусы заказа

| Статус | Когда |
|--------|-------|
| `PENDING` | Ещё не назначен |
| `ASSIGNED` | Назначен курьеру |
| `IN_TRANSIT` | Курьер едет |
| `WAITING` | На месте, окно ещё не открылось |
| `DELIVERED` | `time_start ≤ t ≤ time_end` |
| `LATE` | Доставлен после `time_end` |
| `FAILED` | Нет курьера / не успели |

## Символы ASCII-шкалы

| Символ | Значение |
|--------|----------|
| `D` | Доставлен вовремя |
| `L` | С опозданием |
| `-` | В пути |
| `w` | Ждёт окно |
| `r` | Возврат на базу |
| `.` | На базе |
