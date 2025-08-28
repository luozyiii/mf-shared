// 加密/解密工具（迁移自 src/store/encryption.ts 到 utils）

const ENCRYPTION_KEY = 'mf-store-key-2025';

/**
 * 简单的字符串加密（Base64 + XOR 混淆）
 * 注意：这是一个简单实现，生产环境建议使用更安全算法
 */
export function encrypt(data: string): string {
  try {
    const base64 = btoa(unescape(encodeURIComponent(data)));
    let encrypted = '';
    for (let i = 0; i < base64.length; i++) {
      const char = base64.charCodeAt(i);
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(char ^ keyChar);
    }
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const encrypted = atob(encryptedData);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const char = encrypted.charCodeAt(i);
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(char ^ keyChar);
    }
    return decodeURIComponent(escape(atob(decrypted)));
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData;
  }
}

export function encryptObject(obj: any): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Object encryption failed:', error);
    return JSON.stringify(obj);
  }
}

export function decryptObject(encryptedData: string): any {
  try {
    const jsonString = decrypt(encryptedData);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Object decryption failed:', error);
    try {
      return JSON.parse(encryptedData);
    } catch {
      return {};
    }
  }
}
