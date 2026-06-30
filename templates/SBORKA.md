# Сборка заготовки на олимпиаде

## Быстрый старт

```bash
cp templates/main.py templates/input_simple.csv templates/input_complex.csv ./
python main.py input_simple.csv
python main.py input_complex.csv
```

Один файл `main.py` — всё внутри, ничего склеивать не нужно.

## Перед стартом — чеклист по условию

- [ ] Формат CSV совпадает? → правь `load_data()`
- [ ] Сколько статусов в условии? → правь `OrderStatus` (сейчас 5)
- [ ] Нужен процент в отчёте? → `SHOW_PERCENT = True/False` в начале файла
- [ ] Формат вывода как в условии? → правь `print_report()` и `emit()`
- [ ] Заполни `README.md` по шаблону

## Что настроить в main.py

| Константа / блок | Где | Зачем |
|------------------|-----|-------|
| `SHOW_PERCENT` | строка ~17 | Процент в итоге отчёта |
| `OrderStatus` | начало файла | Статусы по условию |
| `load_data()` | секция загрузки | Поля CSV |
| `plan_routes()` | планировщик | Алгоритм назначения |
| `tick_courier()` | симулятор | Логика движения |
| `print_report()` | вывод | Лог, отчёт, timeline |

## Твой стиль (уже в коде)

- Секции: `'''текст'''`
- Файл: `f`, не `fh`
- Имена без `_`: `warning`, `die`, `estimated_arrival`, `emit`, `tl_set`
- `except ValueError as e`
- Один метод вывода: `print_report()`
- 5 статусов по умолчанию (как прошлый год)

## Файлы в templates/

| Файл | Назначение |
|------|------------|
| `main.py` | **Главная заготовка** — копируй на олимпиаду |
| `input_simple.csv` | Простой тест: 1 курьер, 2 заказа |
| `input_complex.csv` | Сложный тест: 2 курьера, 5 заказов |
| `README.md` | Шаблон документации |
| `PROMPT_OLIMPIADA.md` | Промпт для AI с фото задания |

Старые модули (`models.py`, `loader.py` …) — для справки, на олимпиаду достаточно `main.py`.
