# Handoff: Netcraze Speedster + Vetcraze / BlancVPN / Switch 2110-3127

Источник: экспорт чата `netcraze-vetcraze-chat.md` (transcript `ce8aa29e-b39d-4f69-b70f-4b6788de6e01`).

**Не путать** с SwitchBridge / iPhone VPN — это другой проект.

---

## Цель

Две Wi‑Fi сети на Netcraze Speedster **NC-3013**:
| SSID | Интернет |
|------|----------|
| `Netcraze-1532` | обычный провайдер |
| `Vetcraze-1532` | BlancVPN (WireGuard, NL Amsterdam) |

VPN нужен **только для Wi‑Fi**, не для Ethernet.

---

## Что уже сделано

- Роутер: Netcraze Speedster **NC-3013**, NDMS обновлялся до **5.1.1** при установке WireGuard
- WAN: ISP, DHCP, линк 1 Гбит/с, CGNAT `100.x` — норма
- Home: `192.168.1.1/24`, SSID `Netcraze-1532` (2.4+5), WPA2 — не ломать
- Компонент **WireGuard VPN** установлен
- Туннель **BlancVPN-NL-AMS** из `Blanc_NL_AMS_1.conf` (AmneziaWG) — поднимался online
- Политика **VPN-Blanc** → только WireGuard
- Сегмент **Vetcraze-VPN** / Bridge2 привязан к VPN-Blanc
- SSID **`Vetcraze-1532`**: пересоздавали через Access Points UI (NDMS 5), только **2.4 GHz**, WPA2-PSK
- Пароль `Vetcraze-1532` = тот же, что у `Netcraze-1532` (в экспорте чата: `te8KV3Ys`)
- DHCP DNS на VPN-сегменте пробовали: `8.8.8.8`/`8.8.4.4`, затем `1.1.1.1`/`1.0.0.1`, dns-proxy
- Ноутбук уже успешно попадал в `Vetcraze-1532` с IP **`192.168.2.58`**, политика VPN-Blanc

---

## Текущая проблема

**Nintendo Switch 2** на `Vetcraze-1532`: ошибка **`2110-3127`** — «невозможно получить разрешение DNS-имён».

Wi‑Fi у Switch, скорее всего, есть; падает DNS на тесте Nintendo. После пересоздания AP ошибка осталась.

---

## Что делать дальше (на ноутбуке в `Vetcraze-1532`)

1. Подключиться к **`Vetcraze-1532`**
2. В PowerShell выполнить и прислать вывод:

```powershell
ipconfig /all
ping 192.168.2.1
ping 1.1.1.1
nslookup google.com
nslookup google.com 192.168.2.1
curl https://api.ipify.org
```

3. По результату понять: DNS ломается у всех клиентов VPN-сегмента или только у Switch
4. Панель роутера: `http://192.168.1.1` (или `my.netcraze.ru`) — править **только** сегмент Vetcraze / DNS / политики VPN, **не трогать** Home `Netcraze-1532`
5. На Switch после фикса: забыть сеть → подключиться снова → тест соединения

### Гипотезы, если DNS на ноутбуке ок, а Switch нет
- IPv6 / dual-stack мешает Switch
- MTU / AmneziaWG параметры
- DNS через VPN не доходит до UDP/53 так, как ждёт Nintendo
- Нужен dns-proxy роутера + форвард через WG, или DoH/другой DNS

### Если на ноутбуке DNS тоже мёртв
- Маршрут/политика VPN-Blanc, firewall, DNS на интерфейсе WireGuard
- Handshake / AllowedIPs в Blanc conf

---

## Важно

- `.conf` BlancVPN — **одноразовый ключ**; не крутить параллельно на телефоне
- В Cursor Browser: не открывать роутер через Chrome (`open_resource`); только **cursor-ide-browser**
- Не менять основную сеть `Netcraze-1532` без явной просьбы
- Полный экспорт чата: `netcraze-vetcraze-chat.md`

---

## Стартовый промпт для нового локального чата

Скопируй ниже целиком:

```text
Продолжаем настройку Netcraze Speedster NC-3013 (не SwitchBridge).

Контекст: handoff netcraze-vetcraze-handoff.md + полный экспорт netcraze-vetcraze-chat.md.

Сделано: две сети Netcraze-1532 (обычный интернет) и Vetcraze-1532 (BlancVPN WireGuard NL). Политика VPN-Blanc, сегмент Vetcraze-VPN. Пароль Vetcraze = как у Netcraze.

Проблема: Nintendo Switch 2 → Vetcraze-1532 → ошибка 2110-3127 (DNS).

Сейчас этот ноутбук подключу / уже на Vetcraze-1532. Диагностируем DNS по ipconfig/ping/nslookup/curl, затем чиним только VPN-сегмент, Home не трогаем.
```
