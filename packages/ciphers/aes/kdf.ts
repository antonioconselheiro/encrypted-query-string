import { EncryptedURI, TEncryptedURI, TEncryptedURIKDFConfig, TEncryptedURIResultset, TURIParams } from '@encrypted-uri/core';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { HashSupport } from '../hashes/hash-support';

export function kdf<T extends TURIParams>(
  password: string,
  salt: Uint8Array,
  defaultKDFParams: TEncryptedURIKDFConfig,
  decoded?: TEncryptedURI<T> | TEncryptedURIResultset<T>
): Uint8Array {
  const cfg = EncryptedURI.getKDFConfig(decoded, defaultKDFParams);

  const saltLength = 8;
  if (salt.length !== saltLength) {
    throw new Error(`salt length must be 8 bytes, ${salt.length} bytes was given`);
  }

  if (cfg.kdf === 'pbkdf2') {
    return pbkdf2(HashSupport.get(cfg.hasher), password, salt, {
      c: cfg.rounds,
      dkLen: cfg.derivateKeyLength
    });
  } else {
    throw new Error(`kdf "${cfg.kdf}" not supported`);
  }
}
