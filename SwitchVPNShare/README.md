# SwitchBridge — VPN с iPhone на Nintendo Switch 2

Нативное iOS‑приложение (SwiftUI), которое помогает раздать VPN‑трафик с iPhone на Nintendo Switch 2.

## Как это работает

На iOS трафик **Режима модема сам по себе не идёт через VPN**. Поэтому SwitchBridge делает мост:

1. Подключает iPhone к VPN (IKEv2 через системный `NEVPNManager`).
2. Поднимает локальный **HTTP/HTTPS CONNECT прокси** на телефоне.
3. Switch 2 подключается к хотспоту iPhone и в настройках сети указывает этот прокси.
4. Исходящие HTTP(S)‑запросы консоли делает приложение на iPhone — они уже идут в VPN‑туннель.

```text
Switch 2 ──Wi‑Fi──▶ iPhone Hotspot ──HTTP proxy──▶ VPN tunnel ──▶ Internet
```

## Ограничения (важно)

- Прокси покрывает трафик, который Switch отправляет через системный HTTP‑прокси (eShop, аккаунт, многие HTTPS‑сервисы).
- **UDP / часть онлайн‑игр** может обходить HTTP‑прокси. Для полного IP‑туннеля надёжнее travel‑router или Android с VPN‑хотспотом.
- Нужен Mac с Xcode и Apple Developer аккаунт (capability **Personal VPN**).
- Держите приложение на переднем плане, пока пользуетесь прокси — iOS может приостановить фоновые сокеты.

## Установка

1. Откройте `SwitchVPNShare/SwitchVPNShare.xcodeproj` в Xcode 15+.
2. Выберите свой Team и Bundle ID (`com.switchbridge.app` можно заменить).
3. В Signing & Capabilities добавьте **Personal VPN** (entitlements уже в проекте).
4. Соберите на iPhone (симулятор не умеет настоящий VPN/хотспот).

## Использование

1. Вкладка **VPN** — введите IKEv2 сервер, Remote ID, логин, пароль, Shared Secret → Сохранить.
2. Вкладка **Мост** — «Включить VPN», затем «Запустить прокси».
3. Скопируйте адрес (обычно `172.20.10.1:8888`).
4. Включите **Режим модема** на iPhone.
5. На Switch 2 подключитесь к хотспоту и укажите прокси: IP + порт из приложения.
6. Подробные шаги — вкладка **Switch**.

## WireGuard / OpenVPN

Если VPN у провайдера не IKEv2:

1. Поднимите туннель в официальном WireGuard / OpenVPN приложении.
2. В SwitchBridge только запустите прокси — он отправит трафик Switch через активный VPN iPhone.

## Структура

```text
SwitchVPNShare/
  SwitchVPNShare.xcodeproj
  SwitchVPNShare/
    SwitchBridgeApp.swift
    Models/          # состояние, IKEv2 профиль
    Services/        # VPNManager, HTTPProxyServer, NetworkInfo
    Views/           # Мост / VPN / гайд для Switch
    Resources/       # цвета и шрифты
```

## Превью UI

Для быстрого просмотра макета без Xcode откройте `SwitchVPNShare/preview/index.html` в браузере.
