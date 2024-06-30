const redisUtils = require('../utils/redis');
const dbUtils = require('../utils/db');


class AppController {
  static async getStatus(req, res) {
    const redisStatus = redisUtils.isAlive();
    const dbStatus = dbUtils.isAlive();
    response.set('Content-Type', 'application/json');
    response.status(200).json({ redis: redisStatus, db: dbStatus }).end();
  }

  static async getStats(req, res) {
    const users = await dbUtils.nbUsers();
    const files = await dbUtils.nbFiles();
    response.set('Content-Type', 'application/json');
    response.status(200).json({ users, files }).end();
  }
}

export default AppController;
