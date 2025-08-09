// Crypto polyfills for missing functions in crypto-browserify
const crypto = require('crypto-browserify');

// Mock implementation of generateKeyPair
const generateKeyPair = (type, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Return a mock key pair - this is just a placeholder
  const mockKeyPair = {
    publicKey: {
      asymmetricKeyType: type,
      asymmetricKeySize: 2048,
      export: () => Buffer.from('mock-public-key')
    },
    privateKey: {
      asymmetricKeyType: type,
      asymmetricKeySize: 2048,
      export: () => Buffer.from('mock-private-key')
    }
  };
  
  if (callback) {
    setTimeout(() => callback(null, mockKeyPair.publicKey, mockKeyPair.privateKey), 0);
  } else {
    return Promise.resolve(mockKeyPair);
  }
};

// Mock implementation of createPublicKey
const createPublicKey = (key) => {
  return {
    asymmetricKeyType: 'rsa',
    asymmetricKeySize: 2048,
    export: (options) => {
      if (typeof key === 'string') {
        return key;
      }
      return Buffer.from('mock-public-key');
    }
  };
};

// Mock implementation of createPrivateKey
const createPrivateKey = (key) => {
  return {
    asymmetricKeyType: 'rsa',
    asymmetricKeySize: 2048,
    export: (options) => {
      if (typeof key === 'string') {
        return key;
      }
      return Buffer.from('mock-private-key');
    }
  };
};

module.exports = {
  ...crypto,
  generateKeyPair,
  createPublicKey,
  createPrivateKey
};