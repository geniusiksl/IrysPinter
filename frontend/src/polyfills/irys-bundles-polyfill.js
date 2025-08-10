// Polyfill for @irys/bundles to prevent Node.js compatibility issues in browser

// Mock FileBundle class
class MockFileBundle {
  constructor(data, options = {}) {
    this.data = data;
    this.options = options;
    console.warn('Using mock FileBundle - some functionality may be limited');
  }

  async sign(signer) {
    console.warn('MockFileBundle.sign called - returning mock signature');
    return {
      id: 'mock-id-' + Date.now(),
      signature: 'mock-signature',
      owner: 'mock-owner'
    };
  }

  async upload() {
    console.warn('MockFileBundle.upload called - returning mock response');
    return {
      id: 'mock-upload-id-' + Date.now(),
      timestamp: Date.now(),
      version: '1.0.0',
      public: 'mock-public-key',
      signature: 'mock-signature',
      deadlineHeight: 0,
      block: 0,
      validatorSignatures: [],
      verify: () => Promise.resolve(true)
    };
  }

  get id() {
    return 'mock-bundle-id-' + Date.now();
  }

  get size() {
    return this.data ? this.data.length : 0;
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
