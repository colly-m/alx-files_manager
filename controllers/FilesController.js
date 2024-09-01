import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentObjectId = parentId !== 0 ? new dbClient.ObjectID(parentId) : 0;
    if (parentObjectId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentObjectId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentObjectId,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(result.ops[0]);
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const localPath = path.join(folderPath, uuidv4());
      const fileData = Buffer.from(data, 'base64');

      fs.writeFileSync(localPath, fileData);

      fileDocument.localPath = localPath;

      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(result.ops[0]);
    }
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const fileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId,
    });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(fileDocument);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;
    const skip = page * pageSize;

    const query = {
      userId,
      parentId: parentId === '0' ? 0 : new dbClient.ObjectID(parentId),
    };
    const files = await dbClient.db.collection('files').find(query).skip(skip).limit(pageSize).toArray();

    return res.json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const fileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId,
    });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: new dbClient.ObjectID(fileId), userId },
      { $set: { isPublic: true } }
    );

    const updatedFileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId,
    });
    return res.status(200).json(updatedFileDocument);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const fileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId,
    });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await dbClient.db.collection('files').updateOne(
      { _id: new dbClient.ObjectID(fileId), userId },
      { $set: { isPublic: false } }
    );

    const updatedFileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
      userId,
    });
    return res.status(200).json(updatedFileDocument);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const fileDocument = await dbClient.db.collection('files').findOne({
      _id: new dbClient.ObjectID(fileId),
    });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    const token = req.headers['x-token'];
    if (!fileDocument.isPublic) {
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId || fileDocument.userId.toString() !== userId.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (fileDocument.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const filePath = fileDocument.localPath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(fileDocument.name);
    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(filePath).pipe(res);
  }
}

export default FilesController;
