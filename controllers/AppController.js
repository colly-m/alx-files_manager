const redisUtils = require('../utils/redis');
const dbUtils = require('../utils/db');

class AppController {
  static async getStatus(req, res) {
    const redisAlive = await redisUtils.isRedisAlive();
    const dbAlive = await dbUtils.isDbAlive();
    
    res.status(200).json({ redis: redisAlive, db: dbAlive });
  }

  static async getStats(req, res) {
    const usersCount = await dbUtils.getUsersCount();
    const filesCount = await dbUtils.getFilesCount();
    
    res.status(200).json({ users: usersCount, files: filesCount });
  }
}

module.exports = AppController;
