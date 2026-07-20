# Pokemon Binder Pokedex — iOS (офлайн)

iPhone-приложение на **Capacitor**. Все данные **внутри приложения** — интернет не нужен.

## Что внутри приложения

| Данные | Где лежит | Размер |
|--------|-----------|--------|
| 1025 покемонов (имя, типы, статы) | `data/pokemon-details/` | в бандле |
| Спрайты artwork | `data/sprites/` | в бандле |
| Цепочки эволюций | `data/evolution-chains/` | в бандле |
| Индекс National Dex | `data/pokemon-index.json` | в бандле |
| Коллекция, wishlist, настройки | Capacitor Preferences + локальный кеш | на устройстве |

Python-сервер и PokeAPI **не используются**. `mobile-api.js` перехватывает `/api/*` и читает локальные JSON.

Записи пользовательских данных выполняются последовательно и подтверждаются до
завершения операций. Благодаря этому старое асинхронное сохранение не может
перезаписать более новую коллекцию или вернуть удалённый wishlist.

## Резервная копия и перенос

В разделе **«Поиск и биндер» → «Резервная копия»**:

1. Нажми **«Сохранить в файл»**.
2. Сохрани JSON в Files/iCloud или отправь его на другое устройство.
3. На новом устройстве установи приложение и выбери **«Восстановить из файла»**.

Файл содержит коллекцию, wishlist, настройки биндера и настройки отображения.

## Быстрый старт на Mac (Xcode)

```bash
git clone -b ios-app https://github.com/92hv8rm4fc-code/Test2026.git pokemon-binder-ios
cd pokemon-binder-ios
npm install
npm run ios:open
```

Команда `npm run ios:open`:
1. Собирает папку `www/` со всеми данными
2. Копирует в Xcode-проект (`cap sync ios`)
3. Открывает `ios/App/App.xcworkspace` в Xcode

### В Xcode

1. Target **App** → **Signing & Capabilities**
2. Укажи свой **Apple ID** (Personal Team) — для режима разработчика
3. Подключи iPhone по USB (или выбери симулятор)
4. Нажми **Run** ▶

На iPhone после первой установки:
**Настройки → Основные → VPN и управление устройством** → доверь разработчику.

## Обновление после изменений в коде

```bash
git pull
npm run ios:open
```

Затем снова Run в Xcode.

## Структура проекта

| Путь | Назначение |
|------|------------|
| `index.html`, `app.js`, `styles.css` | UI |
| `mobile-api.js` | Офлайн-API (без сети) |
| `data/` | Встроенная база покемонов |
| `www/` | Сборка для Capacitor (генерируется) |
| `ios/App/` | Xcode-проект |
| `scripts/prepare-www.sh` | Копирует файлы в `www/` |

## App ID

По умолчанию: `com.pokemonbinder.pokedex`

Если Apple ругается на занятый Bundle ID — поменяй `appId` в `capacitor.config.json` и Bundle Identifier в Xcode.

## Размер приложения

~130–150 МБ из-за 1025 спрайтов. Это нормально для полностью офлайн Pokédex.

## Windows

Сборка `.ipa` возможна **только на Mac** с Xcode. На Windows можно править код и пушить в ветку `ios-app`, а собирать на MacBook.

## Ветки

| Ветка | Назначение |
|-------|------------|
| `main` | Веб + Python-сервер |
| `ios-app` | iPhone-приложение (этот README) |
