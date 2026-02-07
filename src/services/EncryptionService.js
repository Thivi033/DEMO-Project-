/**
 * End-to-End Encryption Service
 * PERF-37: Implement comprehensive E2E encryption for sensitive data
 *
 * Features:
 * - AES-256-GCM symmetric encryption
 * - RSA-OAEP asymmetric encryption
 * - Key derivation (PBKDF2, Argon2)
 * - Digital signatures (ECDSA)
 * - Secure key exchange (ECDH)
 * - Key rotation and management
 * - Secure random generation
 * - Message authentication (HMAC)
 */

const crypto = require('crypto');

// Encryption Algorithms
const Algorithms = {
  SYMMETRIC: 'aes-256-gcm',
  ASYMMETRIC: 'RSA-OAEP',
  HASH: 'SHA-256',
  HMAC: 'SHA-256',
  SIGNATURE: 'SHA-256',
  KEY_DERIVATION: 'pbkdf2'
};

// Key sizes
const KeySizes = {
  AES: 256,
  RSA: 4096,
  ECDSA: 'P-384',
  ECDH: 'P-384',
  IV: 12,
  SALT: 32,
  TAG: 16
};

/**
 * Secure Random Generator
 */
class SecureRandom {
  static bytes(length) {
    return crypto.randomBytes(length);
  }

  static hex(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  static base64(length) {
    return crypto.randomBytes(length).toString('base64');
  }

  static uuid() {
    return crypto.randomUUID();
  }

  static integer(min, max) {
    const range = max - min;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBytes = crypto.randomBytes(bytesNeeded);
    const randomValue = parseInt(randomBytes.toString('hex'), 16);
    return min + (randomValue % range);
  }
}

/**
 * Key Derivation Functions
 */
class KeyDerivation {
  static async pbkdf2(password, salt, iterations = 100000, keyLength = 32) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLength,
        'sha512',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  static async scrypt(password, salt, keyLength = 32) {
    return new Promise((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        keyLength,
        { N: 16384, r: 8, p: 1 },
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  static hkdf(ikm, salt, info, length = 32) {
    return crypto.hkdfSync('sha256', ikm, salt, info, length);
  }
}

/**
 * Symmetric Encryption (AES-256-GCM)
 */
class SymmetricEncryption {
  constructor(key) {
    if (!key || key.length !== 32) {
      throw new Error('Invalid key: must be 32 bytes for AES-256');
    }
    this.key = key;
    this.algorithm = Algorithms.SYMMETRIC;
  }

  static generateKey() {
    return SecureRandom.bytes(32);
  }

  encrypt(plaintext, associatedData = null) {
    const iv = SecureRandom.bytes(KeySizes.IV);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv, {
      authTagLength: KeySizes.TAG
    });

    if (associatedData) {
      cipher.setAAD(Buffer.from(associatedData));
    }

    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(plaintext)),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.algorithm
    };
  }

  decrypt(encryptedData, associatedData = null) {
    const { ciphertext, iv, authTag } = encryptedData;

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'base64'),
      { authTagLength: KeySizes.TAG }
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    if (associatedData) {
      decipher.setAAD(Buffer.from(associatedData));
    }

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final()
    ]);

    return decrypted.toString();
  }

  encryptStream(inputStream, outputStream, associatedData = null) {
    const iv = SecureRandom.bytes(KeySizes.IV);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv, {
      authTagLength: KeySizes.TAG
    });

    if (associatedData) {
      cipher.setAAD(Buffer.from(associatedData));
    }

    // Write IV first
    outputStream.write(iv);

    return new Promise((resolve, reject) => {
      inputStream
        .pipe(cipher)
        .pipe(outputStream)
        .on('finish', () => {
          const authTag = cipher.getAuthTag();
          outputStream.write(authTag);
          resolve({ iv, authTag });
        })
        .on('error', reject);
    });
  }
}

/**
 * Asymmetric Encryption (RSA-OAEP)
 */
class AsymmetricEncryption {
  static generateKeyPair(modulusLength = KeySizes.RSA) {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        'rsa',
        {
          modulusLength,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        },
        (err, publicKey, privateKey) => {
          if (err) reject(err);
          else resolve({ publicKey, privateKey });
        }
      );
    });
  }

  static encrypt(plaintext, publicKey) {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(plaintext)
    );

    return encrypted.toString('base64');
  }

  static decrypt(ciphertext, privateKey) {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(ciphertext, 'base64')
    );

    return decrypted.toString();
  }
}

/**
 * Digital Signatures (ECDSA)
 */
class DigitalSignature {
  static generateKeyPair(curve = KeySizes.ECDSA) {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        'ec',
        {
          namedCurve: curve,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        },
        (err, publicKey, privateKey) => {
          if (err) reject(err);
          else resolve({ publicKey, privateKey });
        }
      );
    });
  }

  static sign(data, privateKey) {
    const sign = crypto.createSign(Algorithms.SIGNATURE);
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  static verify(data, signature, publicKey) {
    const verify = crypto.createVerify(Algorithms.SIGNATURE);
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }
}

/**
 * Key Exchange (ECDH)
 */
class KeyExchange {
  constructor() {
    this.ecdh = crypto.createECDH(KeySizes.ECDH);
    this.ecdh.generateKeys();
  }

  getPublicKey() {
    return this.ecdh.getPublicKey('base64');
  }

  computeSharedSecret(otherPublicKey) {
    return this.ecdh.computeSecret(
      Buffer.from(otherPublicKey, 'base64')
    );
  }

  deriveEncryptionKey(otherPublicKey, salt = null, info = 'encryption') {
    const sharedSecret = this.computeSharedSecret(otherPublicKey);
    const derivedKey = KeyDerivation.hkdf(
      sharedSecret,
      salt || SecureRandom.bytes(32),
      info,
      32
    );
    return derivedKey;
  }
}

/**
 * Message Authentication (HMAC)
 */
class MessageAuthentication {
  static createHMAC(data, key, algorithm = Algorithms.HMAC) {
    const hmac = crypto.createHmac(algorithm, key);
    hmac.update(data);
    return hmac.digest('base64');
  }

  static verifyHMAC(data, mac, key, algorithm = Algorithms.HMAC) {
    const computedMAC = this.createHMAC(data, key, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(computedMAC),
      Buffer.from(mac)
    );
  }
}

/**
 * Hashing Utilities
 */
class Hashing {
  static hash(data, algorithm = Algorithms.HASH) {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  static hashPassword(password, salt = null) {
    salt = salt || SecureRandom.bytes(32);
    return KeyDerivation.pbkdf2(password, salt, 100000, 64)
      .then(hash => ({
        hash: hash.toString('base64'),
        salt: salt.toString('base64')
      }));
  }

  static async verifyPassword(password, storedHash, salt) {
    const hash = await KeyDerivation.pbkdf2(
      password,
      Buffer.from(salt, 'base64'),
      100000,
      64
    );
    return crypto.timingSafeEqual(
      hash,
      Buffer.from(storedHash, 'base64')
    );
  }
}

/**
 * Key Management
 */
class KeyManager {
  constructor() {
    this.keys = new Map();
    this.keyRotationSchedule = new Map();
  }

  async generateKey(keyId, type = 'symmetric', options = {}) {
    let keyData;

    switch (type) {
      case 'symmetric':
        keyData = {
          key: SymmetricEncryption.generateKey(),
          type: 'symmetric',
          algorithm: Algorithms.SYMMETRIC
        };
        break;
      case 'asymmetric':
        const rsaKeys = await AsymmetricEncryption.generateKeyPair(
          options.modulusLength
        );
        keyData = {
          ...rsaKeys,
          type: 'asymmetric',
          algorithm: 'RSA-OAEP'
        };
        break;
      case 'signing':
        const ecdsaKeys = await DigitalSignature.generateKeyPair(
          options.curve
        );
        keyData = {
          ...ecdsaKeys,
          type: 'signing',
          algorithm: 'ECDSA'
        };
        break;
      default:
        throw new Error(`Unknown key type: ${type}`);
    }

    keyData.id = keyId;
    keyData.createdAt = Date.now();
    keyData.expiresAt = options.expiresAt || null;
    keyData.version = 1;

    this.keys.set(keyId, keyData);
    return keyData;
  }

  getKey(keyId) {
    const keyData = this.keys.get(keyId);

    if (!keyData) {
      throw new Error(`Key not found: ${keyId}`);
    }

    if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
      throw new Error(`Key expired: ${keyId}`);
    }

    return keyData;
  }

  async rotateKey(keyId) {
    const oldKey = this.getKey(keyId);
    const newKeyId = `${keyId}_v${oldKey.version + 1}`;

    const newKey = await this.generateKey(newKeyId, oldKey.type);
    newKey.version = oldKey.version + 1;
    newKey.previousKeyId = keyId;

    // Keep old key for decryption of existing data
    oldKey.rotatedAt = Date.now();
    oldKey.replacedBy = newKeyId;

    this.keys.set(newKeyId, newKey);
    return newKey;
  }

  scheduleKeyRotation(keyId, intervalMs) {
    if (this.keyRotationSchedule.has(keyId)) {
      clearInterval(this.keyRotationSchedule.get(keyId));
    }

    const timer = setInterval(async () => {
      try {
        await this.rotateKey(keyId);
        console.log(`Key ${keyId} rotated successfully`);
      } catch (error) {
        console.error(`Key rotation failed for ${keyId}:`, error);
      }
    }, intervalMs);

    this.keyRotationSchedule.set(keyId, timer);
  }

  deleteKey(keyId) {
    const schedule = this.keyRotationSchedule.get(keyId);
    if (schedule) {
      clearInterval(schedule);
      this.keyRotationSchedule.delete(keyId);
    }
    return this.keys.delete(keyId);
  }

  listKeys() {
    return Array.from(this.keys.entries()).map(([id, data]) => ({
      id,
      type: data.type,
      algorithm: data.algorithm,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      version: data.version
    }));
  }

  exportKey(keyId, format = 'base64') {
    const keyData = this.getKey(keyId);

    if (keyData.type === 'symmetric') {
      return {
        id: keyId,
        key: keyData.key.toString(format),
        type: keyData.type
      };
    }

    return {
      id: keyId,
      publicKey: keyData.publicKey,
      type: keyData.type
    };
  }
}

/**
 * Encryption Service - main interface
 */
class EncryptionService {
  constructor() {
    this.keyManager = new KeyManager();
    this.defaultKeyId = null;
  }

  async initialize(options = {}) {
    // Generate default encryption key
    const defaultKey = await this.keyManager.generateKey(
      'default',
      'symmetric',
      { expiresAt: options.keyExpiry }
    );
    this.defaultKeyId = defaultKey.id;

    // Set up key rotation if specified
    if (options.keyRotationInterval) {
      this.keyManager.scheduleKeyRotation(
        'default',
        options.keyRotationInterval
      );
    }

    return this;
  }

  // Encrypt data
  encrypt(data, options = {}) {
    const keyId = options.keyId || this.defaultKeyId;
    const keyData = this.keyManager.getKey(keyId);

    if (keyData.type !== 'symmetric') {
      throw new Error('Cannot use asymmetric key for symmetric encryption');
    }

    const cipher = new SymmetricEncryption(keyData.key);
    const result = cipher.encrypt(
      typeof data === 'string' ? data : JSON.stringify(data),
      options.associatedData
    );

    return {
      ...result,
      keyId,
      keyVersion: keyData.version
    };
  }

  // Decrypt data
  decrypt(encryptedData, options = {}) {
    const keyId = encryptedData.keyId || options.keyId || this.defaultKeyId;
    const keyData = this.keyManager.getKey(keyId);

    const cipher = new SymmetricEncryption(keyData.key);
    const decrypted = cipher.decrypt(encryptedData, options.associatedData);

    return options.parseJSON ? JSON.parse(decrypted) : decrypted;
  }

  // Encrypt with public key
  async encryptWithPublicKey(data, publicKey) {
    // Generate one-time symmetric key
    const sessionKey = SymmetricEncryption.generateKey();
    const cipher = new SymmetricEncryption(sessionKey);

    // Encrypt data with symmetric key
    const encryptedData = cipher.encrypt(
      typeof data === 'string' ? data : JSON.stringify(data)
    );

    // Encrypt symmetric key with public key
    const encryptedKey = AsymmetricEncryption.encrypt(
      sessionKey.toString('base64'),
      publicKey
    );

    return {
      ...encryptedData,
      encryptedKey,
      algorithm: 'hybrid-RSA-AES'
    };
  }

  // Decrypt with private key
  async decryptWithPrivateKey(encryptedData, privateKey) {
    // Decrypt the symmetric key
    const sessionKeyBase64 = AsymmetricEncryption.decrypt(
      encryptedData.encryptedKey,
      privateKey
    );
    const sessionKey = Buffer.from(sessionKeyBase64, 'base64');

    // Decrypt data with symmetric key
    const cipher = new SymmetricEncryption(sessionKey);
    return cipher.decrypt(encryptedData);
  }

  // Sign data
  async sign(data, keyId) {
    const keyData = this.keyManager.getKey(keyId);

    if (keyData.type !== 'signing') {
      throw new Error('Key is not a signing key');
    }

    return DigitalSignature.sign(
      typeof data === 'string' ? data : JSON.stringify(data),
      keyData.privateKey
    );
  }

  // Verify signature
  async verify(data, signature, keyId) {
    const keyData = this.keyManager.getKey(keyId);

    return DigitalSignature.verify(
      typeof data === 'string' ? data : JSON.stringify(data),
      signature,
      keyData.publicKey
    );
  }

  // Hash password
  async hashPassword(password) {
    return Hashing.hashPassword(password);
  }

  // Verify password
  async verifyPassword(password, hash, salt) {
    return Hashing.verifyPassword(password, hash, salt);
  }

  // Create secure token
  createSecureToken(length = 32) {
    return SecureRandom.hex(length);
  }

  // Get key manager
  getKeyManager() {
    return this.keyManager;
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = {
  encryptionService,
  EncryptionService,
  SymmetricEncryption,
  AsymmetricEncryption,
  DigitalSignature,
  KeyExchange,
  MessageAuthentication,
  Hashing,
  KeyDerivation,
  SecureRandom,
  KeyManager,
  Algorithms,
  KeySizes
};
