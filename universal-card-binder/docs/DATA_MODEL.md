# Модель данных FolioGrid

Данные хранятся в IndexedDB `foliogrid-db`.

## Store `lists`

```js
{
  id: "uuid",
  name: "Моя коллекция",
  createdAt: "ISO date",
  updatedAt: "ISO date",
  sourceType: "paste | csv | xlsx",
  sourceFileName: "cards.xlsx | null",
  columns: [{ key: "set", label: "Set" }],
  titleColumn: "name",
  numberingMode: "sequential | existing",
  numberColumn: "number | null",
  orderMode: "source | alphabetical | custom",
  sortRules: [{ column: "set", direction: "asc" }],
  binder: {
    binderCount: 1,
    sheetsPerBinder: 30,
    sidesPerSheet: 2,
    slotsPerSide: 9
  },
  cardCount: 120
}
```

## Store `cards`

```js
{
  id: "uuid",
  listId: "uuid",
  sequence: 1,
  displayNumber: "1",
  title: "Название карты",
  fields: { name: "Название карты", set: "Набор" },
  collected: false,
  wishlist: false,
  photo: "data:image/jpeg;base64,... | null",
  createdAt: "ISO date",
  updatedAt: "ISO date"
}
```

У `cards` есть индекс `listId`. Удаление списка удаляет все его карточки в одной
транзакции.
