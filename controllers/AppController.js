import redisClient from '../utils/redis';
import dbClient from '../utils/db';


class AppController {
  static async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    response.set('Content-Type', 'application/json');
    response.status(200).json({ redis: redisStatus, db: dbStatus }).end();
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.set('Content-Type', 'application/json');
    res.status(200).json({ users, files }).end();
  }
}

export default AppController;
