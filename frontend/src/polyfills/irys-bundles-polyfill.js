// Улучшенный полифилл для @irys/bundles module
// Этот модуль используется Irys SDK, но имеет Node.js зависимости

// Создаем базовый класс для всех mock классов
class BaseIrysMock {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this._initialized = true;
    console.warn(`Using mock ${name} - some Irys functionality may be limited`);
  }
}

// Mock Bundle класс с более полной реализацией
class MockBundle extends BaseIrysMock {
  constructor(options = {}) {
    super('Bundle', options);
    this.items = [];
    this.size = 0;
  }

  async upload(data, options = {}) {
    console.warn('Mock Bundle upload called - returning mock response');
    return {
      id: 'mock-bundle-' + Date.now(),
      size: data ? data.length || 0 : 0,
      timestamp: Date.now(),
      mock: true
    };
  }

  async download(id) {
    console.warn('Mock Bundle download called - not implemented in browser');
    throw new Error('Bundle download not available in browser environment');
  }

  addItem(data, tags = {}) {
    this.items.push({ data, tags, id: 'mock-item-' + this.items.length });
    this.size += data ? data.length || 0 : 0;
    return this;
  }
}

// Mock FileDataItem class
class MockFileDataItem {
  constructor(data, options = {}) {
    this.data = data;
    this.options = options;
    console.warn('Using mock FileDataItem - some functionality may be limited');
  }

  async sign(signer) {
    console.warn('MockFileDataItem.sign called - returning mock signature');
    return {
      id: 'mock-item-id-' + Date.now(),
      signature: 'mock-signature',
      owner: 'mock-owner'
    };
  }

  get id() {
    return 'mock-item-id-' + Date.now();
  }

  get size() {
    return this.data ? this.data.length : 0;
  }
}

// Export mock classes
module.exports = {
  FileBundle: MockFileBundle,
  FileDataItem: MockFileDataItem,
  
  // Additional exports that might be expected
  createFileBundle: (data, options) => new MockFileBundle(data, options),
  createFileDataItem: (data, options) => new MockFileDataItem(data, options),
  
  // Mock utility functions
  utils: {
    generateId: () => 'mock-id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    validateSignature: () => Promise.resolve(true),
    serializeBundle: (bundle) => JSON.stringify(bundle),
    deserializeBundle: (data) => JSON.parse(data)
  }
};
