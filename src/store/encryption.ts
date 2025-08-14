// 简单的加密/解密工具

const ENCRYPTION_KEY = 'mf-store-key-2024';

/**
 * 简单的字符串加密（Base64 + 简单混淆）
 * 注意：这是一个简单的实现，生产环境建议使用更安全的加密算法
 */
export function encrypt(data: string): string {
  try {
    // 将数据转换为 Base64
    const base64 = btoa(unescape(encodeURIComponent(data)));

    // 简单的字符混淆
    let encrypted = '';
    for (let i = 0; i < base64.length; i++) {
      const char = base64.charCodeAt(i);
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(char ^ keyChar);
    }

    // 再次 Base64 编码
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // 加密失败时返回原数据
  }
}

/**
 * 解密字符串
 */
export function decrypt(encryptedData: string): string {
  try {
    // 第一次 Base64 解码
    const encrypted = atob(encryptedData);

    // 解除字符混淆
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const char = encrypted.charCodeAt(i);
      const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(char ^ keyChar);
    }

    // 第二次 Base64 解码
    return decodeURIComponent(escape(atob(decrypted)));
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // 解密失败时返回原数据
  }
}

/**
 * 加密对象
 */
export function encryptObject(obj: any): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Object encryption failed:', error);
    return JSON.stringify(obj);
  }
}

/**
 * 解密对象
 */
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
