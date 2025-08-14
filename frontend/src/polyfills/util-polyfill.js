// Улучшенный util polyfill для браузерной среды
// Обеспечивает util функции, которые ожидают Node.js модули

// Безопасная promisify функция с улучшенной обработкой ошибок
function promisify(original) {
  // Если original не функция, возвращаем функцию, которая возвращает resolved promise
  if (typeof original !== 'function') {
    console.warn('util.promisify called with non-function argument:', typeof original, original);
    return function(...args) {
      return Promise.resolve(original);
    };
  }

  // Проверяем, не является ли функция уже промисифицированной
  if (original[promisify.custom]) {
    return original[promisify.custom];
  }

  return function promisified(...args) {
    return new Promise((resolve, reject) => {
      // Добавляем callback в конец аргументов
      args.push((err, ...values) => {
        if (err) {
          reject(err);
        } else {
          resolve(values.length === 1 ? values[0] : values);
        }
      });
      
      try {
        const result = original.apply(this, args);
        // Если функция возвращает Promise, используем его
        if (result && typeof result.then === 'function') {
          result.then(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
}

// Добавляем custom символ для совместимости с Node.js
promisify.custom = Symbol.for('nodejs.util.promisify.custom');

// Улучшенная функция inherits для правильного наследования классов
function inherits(ctor, superCtor) {
  if (ctor === undefined || ctor === null) {
    throw new TypeError('The constructor to "inherits" must not be null or undefined');
  }

  if (superCtor === undefined || superCtor === null) {
    throw new TypeError('The super constructor to "inherits" must not be null or undefined');
  }

  if (superCtor.prototype === undefined) {
    throw new TypeError('The super constructor to "inherits" must have a prototype');
  }

  ctor.super_ = superCtor;
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}

// Функция для безопасного создания классов с наследованием
function createSafeClass(name, superClass, constructor) {
  if (typeof superClass !== 'function') {
    console.warn(`Safe class creation: superClass for ${name} is not a function, creating standalone class`);
    return constructor || function() {};
  }
  
  try {
    const SafeClass = function(...args) {
      if (constructor) {
        return constructor.apply(this, args);
      }
      return superClass.apply(this, args);
    };
    
    inherits(SafeClass, superClass);
    return SafeClass;
  } catch (error) {
    console.warn(`Safe class creation failed for ${name}:`, error.message);
    return constructor || function() {};
  }
}

// Safe deprecate function that handles non-function arguments
function deprecate(fn, msg, code) {
  // If fn is not a function, return a no-op function
  if (typeof fn !== 'function') {
    console.warn('util.deprecate called with non-function argument:', typeof fn, fn);
    return function() {
      console.warn('Deprecated function called (was not a function):', msg);
      return fn; // Return the original value
    };
  }

  // Standard deprecation wrapper
  let warned = false;
  function deprecated(...args) {
    if (!warned) {
      warned = true;
      if (code) {
        console.warn(`[${code}] DeprecationWarning: ${msg}`);
      } else {
        console.warn(`DeprecationWarning: ${msg}`);
      }
    }
    return fn.apply(this, args);
  }

  // Copy properties from original function
  Object.setPrototypeOf(deprecated, fn);
  if (fn.prototype) {
    deprecated.prototype = fn.prototype;
  }

  return deprecated;
}

// Safe callbackify function
function callbackify(original) {
  if (typeof original !== 'function') {
    console.warn('util.callbackify called with non-function argument:', typeof original, original);
    return function(...args) {
      const callback = args.pop();
      if (typeof callback === 'function') {
        setTimeout(() => callback(null, original), 0);
      }
    };
  }

  return function(...args) {
    const callback = args.pop();
    if (typeof callback !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }

    try {
      const result = original.apply(this, args);
      if (result && typeof result.then === 'function') {
        result.then(
          (value) => setTimeout(() => callback(null, value), 0),
          (error) => setTimeout(() => callback(error), 0)
        );
      } else {
        setTimeout(() => callback(null, result), 0);
      }
    } catch (error) {
      setTimeout(() => callback(error), 0);
    }
  };
}

// Improved inherits function (replaced the old simple version)
// The improved version is already defined above

// Simple format function
function format(f, ...args) {
  if (typeof f !== 'string') {
    return [f, ...args].map(arg => 
      typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)
    ).join(' ');
  }

  let i = 0;
  const str = String(f).replace(/%[sdj%]/g, (x) => {
    if (x === '%%') return x;
    if (i >= args.length) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });

  const remaining = args.slice(i).map(arg => 
    typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  return remaining ? str + ' ' + remaining : str;
}

// Export all util functions
module.exports = {
  promisify,
  deprecate,
  callbackify,
  inherits,
  format,
  
  // Additional common util functions
  inspect: function(obj) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return `'${obj}'`;
    if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;
    if (typeof obj === 'object') {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(obj);
  },

  isArray: Array.isArray,
  isBoolean: (arg) => typeof arg === 'boolean',
  isNull: (arg) => arg === null,
  isNullOrUndefined: (arg) => arg == null,
  isNumber: (arg) => typeof arg === 'number',
  isString: (arg) => typeof arg === 'string',
  isSymbol: (arg) => typeof arg === 'symbol',
  isUndefined: (arg) => arg === undefined,
  isRegExp: (arg) => arg instanceof RegExp,
  isObject: (arg) => typeof arg === 'object' && arg !== null,
  isDate: (arg) => arg instanceof Date,
  isError: (arg) => arg instanceof Error,
  isFunction: (arg) => typeof arg === 'function',
  isPrimitive: (arg) => arg == null || (typeof arg !== 'object' && typeof arg !== 'function'),
  isBuffer: (arg) => arg && typeof arg === 'object' && typeof arg.constructor === 'function' && arg.constructor.name === 'Buffer',
  
  // Добавляем новые функции для безопасного наследования
  createSafeClass: createSafeClass
};
