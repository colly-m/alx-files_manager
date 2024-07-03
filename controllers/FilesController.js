const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-tkn'];
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

    const db = await dbClient.connectDB();

    if (parentId !== 0) {
      const parentFile = await db.collection('files').findOne({ _id: new dbClient.ObjectID(parentId) });
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
      parentId: parentId === 0 ? 0 : new dbClient.ObjectID(parentId),
    };

    if (type === 'folder') {
      const result = await db.collection('files').insertOne(fileDocument);
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

      const result = await db.collection('files').insertOne(fileDocument);
      return res.status(201).json(result.ops[0]);
    }
  }
  static async getShow(req, res) {
    const token = req.headers['x-tkn'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const db = await dbClient.connectDB();
    const fileDocument = await db.collection('files').findOne({ _id: new dbClient.ObjectID(fileId), userId });

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

    const db = await dbClient.connectDB();

    const query = { userId, parentId: parentId === '0' ? 0 : new dbClient.ObjectID(parentId) };
    const files = await db.collection('files').find(query).skip(skip).limit(pageSize).toArray();

    return res.json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-tkn'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const db = await dbClient.connectDB();
    const fileDocument = await db.collection('files').findOne({ _id: new dbClient.ObjectID(fileId), userId });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await db.collection('files').updateOne(
      { _id: new dbClient.ObjectID(fileId), userId },
      { $set: { isPublic: true } }
    );

    const updatedFileDocument = await db.collection('files').findOne({ _id: new dbClient.ObjectID(fileId), userId });
    return res.status(200).json(updatedFileDocument);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-tkn'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const db = await dbUtils.connectDB();
    const fileDocument = await db.collection('files').findOne({ _id: new dbClient.ObjectID(fileId), userId });

    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }

    await db.collection('files').updateOne(
      { _id: new dbClient.ObjectID(fileId), userId },
      { $set: { isPublic: false } }
    );

    const updatedFileDocument = await db.collection('files').findOne({ _id: new dbClient.ObjectID(fileId), userId });
    return res.status(200).json(updatedFileDocument);
  }
}

module.exports = FilesController;
