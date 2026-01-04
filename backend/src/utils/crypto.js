const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

const encrypt = (text) => {
    if (!text) return null;
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (hash) => {
    if (!hash) return null;
    const bytes = CryptoJS.AES.decrypt(hash, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = { encrypt, decrypt };
