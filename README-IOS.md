# Pokemon Binder Pokedex — iOS (режим разработчика)

Отдельная ветка `ios-app` и папка для сборки iPhone-приложения через **Capacitor**.

## Что уже сделано

- Все данные (спрайты, детали, эволюции) **внутри приложения** — Python-сервер на iPhone не нужен.
- `mobile-api.js` перехватывает `/api/*` и читает локальные JSON + `localStorage`.
- Коллекция хранится на устройстве.

## Структура

| Папка / файл | Назначение |
|--------------|------------|
| `index.html`, `app.js`, `styles.css` | UI приложения |
| `mobile-api.js` | Офлайн-API для iOS |
| `data/` | Кеш покемонов, спрайты, эволюции |
| `ios/` | Xcode-проект (создаётся на Mac) |
| `capacitor.config.json` | Настройки Capacitor |

## На Windows (подготовка)

```powershell
cd C:\Users\user\Documents\work\Cursor\pokemon-binder-pokedex-ios
npm install
```

Сборка `.ipa` / установка на iPhone **только на Mac** (нужен Xcode).

## На MacBook (первая сборка)

```bash
git clone -b ios-app https://github.com/92hv8rm4fc-code/Test2026.git pokemon-binder-ios
cd pokemon-binder-ios
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

В Xcode:

1. Выбери target **App** → **Signing & Capabilities**
2. Укажи свой **Apple ID** (Team) — Personal Team для режима разработчика
3. Подключи iPhone по USB
4. Выбери iPhone как destination
5. Нажми **Run** (▶)

На iPhone: **Настройки → Основные → VPN и управление устройством** → доверь разработчику.

## Обновление после изменений в коде

На Mac:

```bash
git pull
npm install
npx cap sync ios
```

Затем снова Run в Xcode.

## Wi‑Fi тест без Xcode (Safari)

Если нужен только браузер, а не нативное приложение — запусти `python3 server.py` на Mac и открой с iPhone (отдельная инструкция, ветка `main`).

## App ID

По умолчанию: `com.pokemonbinder.pokedex`.  
Если Apple ругается на занятый ID — поменяй `appId` в `capacitor.config.json` и Bundle Identifier в Xcode.
