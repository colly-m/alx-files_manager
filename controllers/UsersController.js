import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const user = await dbClient.collection('users').findOne({ email });

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

export default UsersController;
