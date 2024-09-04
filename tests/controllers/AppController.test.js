import dbClient from '../../utils/db';

describe('+ AppController', () => {
  before(async function () {
    this.timeout(10000);
    try {
      const usersCollection = await dbClient.usersCollection();
      const filesCollection = await dbClient.filesCollection();
      await Promise.all([usersCollection.deleteMany({}), filesCollection.deleteMany({})]);
    } catch (err) {
      throw new Error(`Setup failed: ${err.message}`);
    }
  });

  describe('+ GET: /status', () => {
    it('+ Services are online', async function () {
      const res = await request.get('/status').expect(200);
      expect(res.body).to.deep.eql({ redis: true, db: true });
    });
  });

  describe('+ GET: /stats', () => {
    beforeEach(async function () {
      this.timeout(10000);
      const usersCollection = await dbClient.usersCollection();
      const filesCollection = await dbClient.filesCollection();
      await Promise.all([usersCollection.deleteMany({}), filesCollection.deleteMany({})]);
    });

    it('+ Correct statistics about empty db collections', async function () {
      const res = await request.get('/stats').expect(200);
      expect(res.body).to.deep.eql({ users: 0, files: 0 });
    });

    it('+ Correct statistics about populated db collections', async function () {
      this.timeout(10000);
      const usersCollection = await dbClient.usersCollection();
      const filesCollection = await dbClient.filesCollection();
      await Promise.all([
        usersCollection.insertMany([{ email: 'john@mail.com' }]),
        filesCollection.insertMany([
          { name: 'foo.txt', type: 'file' },
          { name: 'pic.png', type: 'image' },
        ]),
      ]);

      const res = await request.get('/stats').expect(200);
      expect(res.body).to.deep.eql({ users: 1, files: 2 });
    });

    it('+ Handles database connection failures gracefully', async function () {
    });
  });
});
