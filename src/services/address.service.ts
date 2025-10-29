import Address from '../models/Address';
import { NotFoundError, ValidationError } from '../utils/errors';
import mongoose from 'mongoose';

/**
 * Address Service
 * 
 * Handles address management operations
 */

/**
 * Create a new address
 */
export async function createAddress(
  userId: string,
  addressData: {
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
    coordinates?: { latitude: number; longitude: number };
  }
) {
  // Validate required fields
  if (!addressData.label || !addressData.street || !addressData.city || !addressData.state || !addressData.postalCode || !addressData.country) {
    throw new ValidationError('All address fields are required');
  }

  // If this is set as default, unset other defaults
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId: new mongoose.Types.ObjectId(userId) },
      { isDefault: false }
    );
  }

  const address = await Address.create({
    userId: new mongoose.Types.ObjectId(userId),
    label: addressData.label,
    street: addressData.street,
    city: addressData.city,
    state: addressData.state,
    postalCode: addressData.postalCode,
    country: addressData.country,
    isDefault: addressData.isDefault || false,
    coordinates: addressData.coordinates,
  });

  return {
    id: (address._id as any).toString(),
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    coordinates: address.coordinates,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: string) {
  const addresses = await Address.findByUserId(new mongoose.Types.ObjectId(userId));

  return addresses.map((address) => ({
    id: (address._id as any).toString(),
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    coordinates: address.coordinates,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  }));
}

/**
 * Get address by ID
 */
export async function getAddressById(addressId: string) {
  const address = await Address.findById(addressId);
  
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  return {
    id: (address._id as any).toString(),
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    coordinates: address.coordinates,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

/**
 * Update an address
 */
export async function updateAddress(
  addressId: string,
  updateData: {
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  }
) {
  const address = await Address.findById(addressId);
  
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  if (updateData.label) address.label = updateData.label;
  if (updateData.street) address.street = updateData.street;
  if (updateData.city) address.city = updateData.city;
  if (updateData.state) address.state = updateData.state;
  if (updateData.postalCode) address.postalCode = updateData.postalCode;
  if (updateData.country) address.country = updateData.country;
  if (updateData.coordinates) address.coordinates = updateData.coordinates;

  await address.save();

  return {
    id: (address._id as any).toString(),
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    coordinates: address.coordinates,
    updatedAt: address.updatedAt,
  };
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string) {
  const address = await Address.findById(addressId);
  
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  await Address.findByIdAndDelete(addressId);

  return {
    success: true,
    message: 'Address deleted successfully',
  };
}

/**
 * Get default address for user
 */
export async function getDefaultAddress(userId: string) {
  const address = await Address.findDefaultByUserId(new mongoose.Types.ObjectId(userId));
  
  if (!address) {
    throw new NotFoundError('No default address found');
  }

  return {
    id: (address._id as any).toString(),
    label: address.label,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    coordinates: address.coordinates,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(addressId: string) {
  const address = await Address.findById(addressId);
  
  if (!address) {
    throw new NotFoundError('Address not found');
  }

  await address.setAsDefault();

  return {
    success: true,
    message: 'Address set as default',
    id: (address._id as any).toString(),
    isDefault: address.isDefault,
  };
}

