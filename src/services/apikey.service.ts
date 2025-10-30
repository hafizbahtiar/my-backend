import mongoose from 'mongoose';
import ApiKey, { IApiKey } from '../models/ApiKey';
import { hashTokenForDatabase } from '../utils/password';

function generateKeyId(bytes: number = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSecret(bytes: number = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  // base64url
  let bin = '';
  for (let i = 0; i < arr.length; i++) {
    bin += String.fromCharCode(arr[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface CreateApiKeyParams {
  ownerId: string;
  name: string;
  scopes?: string[];
  ipAllowlist?: string[];
  expiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export async function createApiKey(params: CreateApiKeyParams): Promise<{ apiKey: string; keyId: string } & Pick<IApiKey, 'name' | 'scopes' | 'expiresAt' | 'enabled'>> {
  const { ownerId, name, scopes = [], ipAllowlist = [], expiresAt = null, metadata = null } = params;

  const keyId = generateKeyId(16);
  const secret = generateSecret(32);
  const apiKeyPlain = `ak_${keyId}.${secret}`;
  const keyHash = await hashTokenForDatabase(secret);

  const doc = await ApiKey.create({
    ownerId: new mongoose.Types.ObjectId(ownerId),
    name,
    keyId,
    keyHash,
    scopes,
    ipAllowlist,
    expiresAt,
    metadata,
    enabled: true,
  });

  return { apiKey: apiKeyPlain, keyId: doc.keyId, name: doc.name, scopes: doc.scopes, expiresAt: doc.expiresAt ?? null, enabled: doc.enabled };
}

export async function listApiKeys(ownerId: string): Promise<Array<Pick<IApiKey, 'keyId' | 'name' | 'scopes' | 'enabled' | 'expiresAt' | 'lastUsedAt' | 'usageCount'>>> {
  const keys = await ApiKey.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }).select('keyId name scopes enabled expiresAt lastUsedAt usageCount').sort({ createdAt: -1 });
  return keys.map((k) => ({ keyId: k.keyId, name: k.name, scopes: k.scopes, enabled: k.enabled, expiresAt: k.expiresAt ?? null, lastUsedAt: k.lastUsedAt ?? null, usageCount: k.usageCount }));
}

export async function revokeApiKey(ownerId: string, keyId: string): Promise<{ success: true }>{
  await ApiKey.updateOne({ ownerId: new mongoose.Types.ObjectId(ownerId), keyId }, { enabled: false });
  return { success: true };
}

export async function recordApiKeyUsage(keyId: string, ip?: string): Promise<void> {
  await ApiKey.updateOne({ keyId }, { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date(), lastUsedIp: ip || null } });
}


