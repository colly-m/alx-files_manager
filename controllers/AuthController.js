const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(request, result) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return result.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    const db = await dbClient.connectDB();
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const user = await db.collection('users').findOne({ email, password: hashedPassword });

    if (!user) {
      return result.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.client.set(key, user._id.toString(), 'EX', 24 * 60 * 60);

    return result.status(200).json({ token });
  }

  static async getDisconnect(request, result) {
    const token = request.headers['x-token'];
    if (!token) {
      return result.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.client.get(key);

    if (!userId) {
      return result.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.client.del(key);
    return result.status(204).send();
  }
}

module.exports = AuthController;
