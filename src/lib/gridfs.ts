import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import dbConnect from './mongoose';

let bucket: GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<GridFSBucket> {
  await dbConnect();
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not connected');
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  }
  return bucket;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const gridBucket = await getGridFSBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = gridBucket.openUploadStream(filename, {
      metadata: {
        contentType,
        originalName: filename,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.end(buffer);
  });
}

export async function getFile(fileId: string) {
  const gridBucket = await getGridFSBucket();
  const objectId = new ObjectId(fileId);

  // Get file metadata
  const files = await gridBucket.find({ _id: objectId }).toArray();
  if (files.length === 0) {
    return null;
  }

  const file = files[0];
  const downloadStream = gridBucket.openDownloadStream(objectId);

  return {
    stream: downloadStream,
    contentType: file.metadata?.contentType || 'application/octet-stream',
    filename: file.filename,
    length: file.length,
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  const gridBucket = await getGridFSBucket();
  const objectId = new ObjectId(fileId);
  await gridBucket.delete(objectId);
}
