import { EncryptedURIAlgorithm, EncryptedURIDecrypter, EncryptedURIEncrypter, TEncryptedURI, TEncryptedURIKDFConfig, TEncryptedURIResultset } from "@encrypted-uri/core";
import { bytesToUtf8, hexToBytes, utf8ToBytes } from "@noble/ciphers/utils";
import { ctr } from '@noble/ciphers/webcrypto/aes';
import { randomBytes } from "@noble/hashes/utils";
import { base64 } from '@scure/base';
import { kdf } from '../kdf';
import { getSalt } from '../salt';
import { TInitializationVectorParams, getInitializationVector } from "../initialization-vector";
import { OpenSSLSerializer } from "../openssl-serializer";

class EncryptedURIAESCTRDecrypter extends EncryptedURIDecrypter<TInitializationVectorParams> {
  constructor(
    decoded: TEncryptedURI<TInitializationVectorParams>,
    password: string,
    defaultsKDF: Required<TEncryptedURIKDFConfig>
  ) {
    super(decoded, password, defaultsKDF);
  }

  async decrypt(): Promise<string> {
    const ivhex = getInitializationVector(this.decoded);
    const cipher = base64.decode(this.decoded.cipher);
    const salt = getSalt(cipher, this.decoded?.params);
    const result = await ctr(kdf(this.password, salt, this.decoded), hexToBytes(ivhex))
      .decrypt(cipher);

    return bytesToUtf8(result);
  }
}

@EncryptedURIAlgorithm({
  algorithm: 'aes/ctr',
  decrypter: EncryptedURIAESCTRDecrypter
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class EncryptedURIAESCTREncrypter extends EncryptedURIEncrypter<TInitializationVectorParams> {

  constructor(
    protected override params: TEncryptedURIResultset<TInitializationVectorParams>
  ) {
    super(params);
  }

  async encrypt(): Promise<TEncryptedURI<TInitializationVectorParams>> {
    const ivhex = getInitializationVector(this.params);
    const iv = hexToBytes(ivhex);
    const content = utf8ToBytes(this.params.content);
    const saltLength = 32;
    const salt = randomBytes(saltLength);
    const cipher = await ctr(kdf(this.params.password, salt, this.params.kdf), iv).encrypt(content);

    return Promise.resolve({
      cipher: base64.encode(OpenSSLSerializer.encode(cipher, salt)),
      params: { iv: ivhex }
    });
  }
}
