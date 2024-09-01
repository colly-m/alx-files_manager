import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import imageThumbnail from 'image-thumbnail';
import dbClient from '../utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const db = await dbClient.connectDB();
  const fileDocument = await db.collection('files').findOne({
    _id: new dbClient.ObjectID(fileId),
    userId: new dbClient.ObjectID(userId)
  });

  if (!fileDocument) {
    throw new Error('File not found');
  }

  const filePath = fileDocument.localPath;
  const thumbnailSizes = [500, 250, 100];

  for (const size of thumbnailSizes) {
    const thumbnail = await imageThumbnail(filePath, { width: size });
    const thumbnailPath = `${filePath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }
});
