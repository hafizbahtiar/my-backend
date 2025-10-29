import mongoose, { Document, Schema } from 'mongoose';

/**
 * File Model
 * 
 * Tracks uploaded files in the system
 */

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  category: 'image' | 'document' | 'video' | 'other';
  size: number;
  path: string;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileModel extends mongoose.Model<IFile> {
  findByUserId(userId: mongoose.Types.ObjectId, limit?: number): Promise<IFile[]>;
  findByCategory(category: string, limit?: number): Promise<IFile[]>;
  deleteOldFiles(daysToKeep: number): Promise<number>;
}

const FileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    category: {
      type: String,
      required: [true, 'File category is required'],
      enum: ['image', 'document', 'video', 'other'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'files',
  }
);

// Indexes
FileSchema.index({ userId: 1, category: 1 });
FileSchema.index({ category: 1, createdAt: -1 });
FileSchema.index({ createdAt: -1 });

// Static Methods
FileSchema.statics.findByUserId = async function (
  userId: mongoose.Types.ObjectId,
  limit: number = 100
): Promise<IFile[]> {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

FileSchema.statics.findByCategory = async function (
  category: string,
  limit: number = 100
): Promise<IFile[]> {
  return this.find({ category })
    .sort({ createdAt: -1 })
    .limit(limit);
};

FileSchema.statics.deleteOldFiles = async function (
  daysToKeep: number = 90
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoff },
  });

  return result.deletedCount || 0;
};

const File = mongoose.model<IFile, IFileModel>('File', FileSchema);

export default File;

