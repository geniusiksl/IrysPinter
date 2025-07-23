# 🚀 Переход от Mock к Реальному NFT Минтингу

## 🔍 Почему был Mock-минтинг

### 1. **Отсутствие Metaplex SDK для Python**
- Metaplex SDK доступен только для JavaScript/TypeScript
- Python-версия не существует или не поддерживается
- Backend не мог выполнять реальный NFT минтинг

### 2. **Проблемы безопасности**
- Backend не должен хранить приватные ключи пользователей
- Пользователи должны сами подписывать транзакции
- Это усложняет архитектуру

### 3. **Сложность интеграции**
- Требуется глубокое понимание Solana программ
- Нужны правильные инструкции для создания mint, metadata, master edition
- Ошибки могут привести к потере SOL

## ✅ Решение: Frontend-минтинг с Metaplex

### Архитектура после изменений:

```
Frontend (React + Metaplex SDK)
    ↓
1. Загрузка изображения в Irys
2. Создание метаданных
3. Минтинг NFT через Metaplex
4. Отправка данных в Backend
    ↓
Backend (FastAPI)
    ↓
Сохранение метаданных в MongoDB
```

### Ключевые изменения:

#### 1. **Новый хук useIrys.js**
```javascript
const { mintNFT, createNFTMetadata } = useIrys();

// Реальный NFT минтинг
const nftResult = await mintNFT(metadata, imageFile);
```

#### 2. **Обновленный CreatePinModal.js**
```javascript
// Вместо отправки файла в backend
const nftResult = await mintNFT(metadata, image);
const pinData = {
  mint_address: nftResult.mintAddress,
  transaction_signature: nftResult.transactionSignature,
  // ...
};
```

#### 3. **Упрощенный Backend API**
```python
@api_router.post("/pins")
async def create_pin(
    title: str,
    mint_address: str,  # Реальный адрес NFT
    transaction_signature: str,  # Реальная подпись
    # ...
):
```

## 🛠️ Что нужно для запуска

### 1. **Установить зависимости**
```bash
cd frontend
npm install @metaplex-foundation/js @solana/spl-token
```

### 2. **Настроить кошелек**
- Установить Phantom Wallet
- Подключиться к Devnet
- Получить тестовые SOL: `solana airdrop 2 YOUR_PUBLIC_KEY --url devnet`

### 3. **Настроить Irys**
- Создать аккаунт на Irys
- Пополнить баланс SOL для загрузок

### 4. **Запустить приложение**
```bash
# Backend
cd backend
python server.py

# Frontend
cd frontend
npm start
```

## 🔧 Технические детали

### Metaplex NFT Creation Process:

1. **Create Mint Account**
   ```javascript
   const mint = await metaplex.nfts().create({
     name: metadata.name,
     symbol: metadata.symbol,
     uri: metadataUrl,
     sellerFeeBasisPoints: 500, // 5% royalty
     creators: [{ address: publicKey, verified: true, share: 100 }],
     isMutable: true
   });
   ```

2. **Upload to Irys**
   ```javascript
   const irys = new Irys({
     url: 'https://devnet.irys.xyz',
     token: 'solana',
     key: publicKey.toBytes()
   });
   const receipt = await irys.uploadFile(file);
   ```

3. **Create Metadata**
   ```javascript
   const metadata = {
     name: title,
     symbol: "SOLPIN",
     description: description,
     image: imageUrl,
     attributes: [...],
     properties: { files: [{ uri: imageUrl, type: "image/png" }] }
   };
   ```

## 🧪 Тестирование

### 1. **Проверить NFT на Solana Explorer**
```
https://explorer.solana.com/address/MINT_ADDRESS?cluster=devnet
```

### 2. **Проверить файлы на Irys**
```
https://gateway.irys.xyz/TRANSACTION_ID
```

### 3. **Проверить транзакцию**
```
https://explorer.solana.com/tx/SIGNATURE?cluster=devnet
```

## 🚨 Важные моменты

### 1. **Сеть**
- Используйте **Devnet** для тестирования
- Переключитесь на **Mainnet** только для продакшена

### 2. **Безопасность**
- Никогда не храните приватные ключи в коде
- Всегда используйте кошелек пользователя для подписи
- Валидируйте все входные данные

### 3. **Стоимость**
- Минтинг NFT стоит ~0.002 SOL
- Загрузка в Irys стоит ~0.001 SOL
- Убедитесь, что у пользователя достаточно SOL

### 4. **Обработка ошибок**
```javascript
try {
  const nftResult = await mintNFT(metadata, image);
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    toast.error('Insufficient SOL balance');
  } else {
    toast.error('NFT minting failed');
  }
}
```

## 📈 Следующие шаги

1. **Добавить роялти систему**
2. **Реализовать покупку/продажу NFT**
3. **Добавить верификацию владения**
4. **Интегрировать с маркетплейсами**

## 🔗 Полезные ссылки

- [Metaplex Documentation](https://docs.metaplex.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Irys Documentation](https://docs.irys.xyz/)
- [Phantom Wallet](https://phantom.app/) 