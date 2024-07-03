const crypto = require('crypto');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const db = await dbClient.connectDB();
    const user = await db.collection('users').findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const newUser = { email, password: hashedPassword };

    const result = await db.collection('users').insertOne(newUser);
    return res.status(201).json({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const { usr } = req;
    delete usr.password;
    usr.id = usr._id;
    delete usr._id;
    response.status(200).json(usr).end();
}

module.exports = UsersController;
