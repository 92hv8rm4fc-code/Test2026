# xcode installation request

Локальному агенту на Mac: установи приложение **SwitchBridge** на физический iPhone пользователя.

## Цель

Собрать и установить на подключённый iPhone нативное приложение из папки `SwitchVPNShare/`, чтобы пользователь мог раздавать VPN с iPhone на Nintendo Switch 2.

## Репозиторий

- Repo: `https://github.com/92hv8rm4fc-code/Test2026`
- Branch: `cursor/switch-vpn-share-f0b8`
- Project: `SwitchVPNShare/SwitchVPNShare.xcodeproj`
- Scheme / target: `SwitchBridge`
- Bundle ID (по умолчанию): `com.switchbridge.app`

## Что сделать

1. Убедись, что это Mac с установленным Xcode (15+).
2. Возьми код ветки `cursor/switch-vpn-share-f0b8` (clone или checkout, если репо уже есть).
3. Открой `SwitchVPNShare/SwitchVPNShare.xcodeproj`.
4. В Signing & Capabilities:
   - выбери Team пользователя (Apple ID / Personal Team достаточно);
   - включи capability **Personal VPN**;
   - если Bundle ID занят — смени на уникальный, например `com.<user>.switchbridge`.
5. Подключи iPhone по USB (или уже paired по Wi‑Fi), разблокируй телефон, при необходимости нажми Trust.
6. Выбери физический iPhone как destination (не симулятор).
7. Собери и установи на устройство:
   - через Xcode Run, или
   - `xcodebuild` + `devicectl`/`ios-deploy`, если так удобнее в этой среде.
8. Если iOS просит доверие разработчику: подскажи пользователю  
   **Настройки → Основные → VPN и управление устройством → доверить**.
9. При первом запуске VPN система попросит разрешение на добавление VPN‑конфигурации — это ожидаемо, нужно разрешить.

## Критерий успеха

- Приложение **SwitchBridge** установлено и открывается на iPhone.
- Не симулятор: именно физическое устройство пользователя.

## Важно

- Симулятор не подходит: нужны реальный VPN и Режим модема.
- Cloud‑агент это сделать не может — установка только с этого Mac.
- Если signing падает: исправь Team / Bundle ID и повтори установку.
- Кратко отчитайся пользователю: установилось / какая ошибка и что нужно от него (пароль Apple ID, Trust на телефоне и т.п.).

## Контекст приложения

SwitchBridge:
1) поднимает IKEv2 VPN на iPhone;
2) запускает локальный HTTP/HTTPS CONNECT прокси;
3) Switch 2 подключается к Режиму модема и указывает этот прокси.

Подробности: `SwitchVPNShare/README.md`.
