import { EncryptedURI, TEncryptedURI, TEncryptedURIResultset, TURIParams } from '@encrypted-uri/core';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { HashSupport } from '../hashes/hash-support';

export function kdf<T extends TURIParams>(
  password: string,
  salt: Uint8Array,
  decoded?: TEncryptedURI<T> | TEncryptedURIResultset<T>
): Uint8Array {
  console.info('decoded content: ', decoded);
  const cfg = EncryptedURI.getKDFConfig(decoded);
  console.info('kdf config from decoded: ', cfg);

  const saltLength = 8;
  if (salt.length !== saltLength) {
    throw new Error(`salt length must be 8 bytes, ${salt.length} bytes was given`);
  }

  if (cfg.kdf === 'pbkdf2') {
    console.info(':: HASH :: ', cfg.hasher);
    return pbkdf2(HashSupport.get(cfg.hasher), password, salt, {
      c: cfg.rounds,
      dkLen: cfg.derivateKeyLength
    });
  } else {
    throw new Error(`kdf "${cfg.kdf}" not supported`);
  }
}
