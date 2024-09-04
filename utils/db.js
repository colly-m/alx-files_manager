import { env } from 'process';
import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
 
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.dbName = database;
    
    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB client connection error:', err);
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const db = this.client.db(this.dbName);
    const usersCollection = db.collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    const db = this.client.db(this.dbName);
    const filesCollection = db.collection('files');
    return filesCollection.countDocuments();
  }

  async userExists(email) {
    const db = this.client.db();
    const filesCollection = db.collection('users');
    return filesCollection.findOne({ email });
  }

  async newUser(email, passwordHash) {
    const db = this.client.db();
    const filesCollection = db.collection('users');
    return filesCollection.insertOne({ email, passwordHash });
  }

  async filterUser(filters) {
    const db = this.client.db();
    const filesCollection = db.collection('users');
    if ('_id' in filters) {
      filters._id = ObjectId(filters._id);
    }
    return filesCollection.findOne(filters);
  }

  async filterFiles(filters) {
    const db = this.client.db();
    const filesCollection = db.collection('files');
    const idFilters = ['_id', 'userId', 'parentId'].filter((prop) => prop in filters && filters[prop] !== '0');
    idFilters.forEach((i) => {
      filters[i] = ObjectId(filters[i]);
    });
    return filesCollection.findOne(filters);
  }
}

export const dbClient = new DBClient();
export default dbClient;
