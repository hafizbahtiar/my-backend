import Device from '../models/Device';
import { NotFoundError } from '../utils/errors';
import mongoose from 'mongoose';

/**
 * Device Service
 * 
 * Handles device management operations
 */

/**
 * Get user devices
 */
export async function getUserDevices(userId: string) {
  const devices = await Device.find({ userId });

  return devices.map((device: any) => ({
    id: (device._id as any).toString(),
    platform: device.platform,
    deviceModel: device.deviceModel,
    brand: device.brand,
    manufacturer: device.manufacturer,
    osVersion: device.osVersion,
    deviceName: device.deviceName,
    isPhysicalDevice: device.isPhysicalDevice,
    isTrusted: device.isTrusted,
    trustedAt: device.trustedAt,
    verifiedAt: device.verifiedAt,
    lastSeen: device.lastSeen,
    createdAt: device.createdAt,
  }));
}

/**
 * Get trusted devices
 */
export async function getTrustedDevices(userId: string) {
  const devices = await Device.find({
    userId,
    isTrusted: true,
  });

  return devices.map((device: any) => ({
    id: (device._id as any).toString(),
    platform: device.platform,
    deviceModel: device.deviceModel,
    brand: device.brand,
    isTrusted: device.isTrusted,
    trustedAt: device.trustedAt,
    lastSeen: device.lastSeen,
  }));
}

/**
 * Mark device as trusted
 */
export async function markDeviceTrusted(deviceId: string) {
  const device = await Device.findById(new mongoose.Types.ObjectId(deviceId));
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  await device.markTrusted();

  return {
    success: true,
    message: 'Device marked as trusted',
    trustedAt: device.trustedAt,
  };
}

/**
 * Mark device as untrusted
 */
export async function markDeviceUntrusted(deviceId: string) {
  const device = await Device.findById(new mongoose.Types.ObjectId(deviceId));
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  await device.markUntrusted();

  return {
    success: true,
    message: 'Device removed from trusted list',
  };
}

/**
 * Update device information
 */
export async function updateDevice(
  deviceId: string,
  updateData: {
    deviceName?: string;
    lastSeen?: Date;
  }
) {
  const device = await Device.findById(new mongoose.Types.ObjectId(deviceId));
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  if (updateData.deviceName) {
    device.deviceName = updateData.deviceName;
  }

  if (updateData.lastSeen) {
    await device.updateLastSeen();
  } else {
    await device.updateLastSeen(); // Always update
  }

  await device.save();

  return {
    id: (device._id as any).toString(),
    deviceName: device.deviceName,
    lastSeen: device.lastSeen,
  };
}

/**
 * Get device by ID
 */
export async function getDeviceById(deviceId: string) {
  const device = await Device.findById(deviceId);
  
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  return {
    id: (device._id as any).toString(),
    platform: device.platform,
    deviceModel: device.deviceModel,
    brand: device.brand,
    manufacturer: device.manufacturer,
    osVersion: device.osVersion,
    deviceName: device.deviceName,
    isPhysicalDevice: device.isPhysicalDevice,
    isTrusted: device.isTrusted,
    trustedAt: device.trustedAt,
    lastSeen: device.lastSeen,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string) {
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new NotFoundError('Device not found');
  }

  await Device.findByIdAndDelete(deviceId);

  return {
    success: true,
    message: 'Device deleted',
  };
}

