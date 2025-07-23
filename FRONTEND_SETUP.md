# 🚀 Настройка Frontend для SolPinter

## 🔧 Исправление проблем с зависимостями

### 1. **Очистка и переустановка зависимостей**

```bash
cd frontend

# Удалить node_modules и package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Установить зависимости заново
npm install
```

### 2. **Проверка версий зависимостей**

Убедитесь, что в `package.json` указаны правильные версии:

```json
{
  "dependencies": {
    "@metaplex-foundation/js": "^0.21.0",
    "@solana/spl-token": "^0.4.0",
    "@solana/web3.js": "^1.87.6",
    "@irys/sdk": "^0.2.11",
    "assert": "^2.1.0",
    "buffer": "^6.0.3",
    "crypto-browserify": "^3.12.1",
    "os-browserify": "^0.3.0",
    "path-browserify": "^1.0.1",
    "process": "^0.11.10",
    "util": "^0.12.5"
  }
}
```

### 3. **Настройка CRACO**

Файл `craco.config.js` уже настроен для работы с Solana библиотеками.

### 4. **Запуск приложения**

```bash
npm start
```

## 🧪 Тестирование

### 1. **Подключение кошелька**
- Установите Phantom Wallet
- Переключитесь на Devnet
- Подключите кошелек к приложению

### 2. **Тест NFT минтинга**
- На странице появится компонент "Test NFT Minting"
- Нажмите кнопку для создания тестового NFT
- Проверьте консоль браузера для деталей

### 3. **Проверка загрузки в Irys**
- После успешного минтинга проверьте URL в Irys
- Формат: `https://gateway.irys.xyz/TRANSACTION_ID`

## 🐛 Решение проблем

### Ошибка: `(0, codecs_1.getBytesCodec) is not a function`

**Причина:** Конфликт версий между библиотеками Solana

**Решение:**
1. Удалите `node_modules` и `package-lock.json`
2. Установите зависимости заново
3. Убедитесь, что используются совместимые версии

### Ошибка: `Module not found: Can't resolve 'crypto'`

**Причина:** Отсутствуют полифилы для Node.js модулей

**Решение:**
1. Проверьте, что `craco.config.js` настроен правильно
2. Убедитесь, что установлены все полифилы

### Ошибка: `Wallet not connected`

**Причина:** Кошелек не подключен или не поддерживает нужные методы

**Решение:**
1. Убедитесь, что Phantom Wallet установлен
2. Переключитесь на Devnet
3. Подключите кошелек к приложению

## 📋 Чек-лист

- [ ] Установлены все зависимости
- [ ] CRACO настроен правильно
- [ ] Phantom Wallet установлен и подключен к Devnet
- [ ] Приложение запускается без ошибок
- [ ] Тест NFT минтинга работает
- [ ] Загрузка в Irys работает

## 🔗 Полезные ссылки

- [Metaplex Documentation](https://docs.metaplex.com/)
- [Solana Web3.js](https://docs.solana.com/developing/clients/javascript-api)
- [Irys Documentation](https://docs.irys.xyz/)
- [Phantom Wallet](https://phantom.app/) 