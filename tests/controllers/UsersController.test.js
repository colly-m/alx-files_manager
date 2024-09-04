import dbClient from '../../utils/db';
import sinon from 'sinon';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../app';

describe('+ UserController', () => {
  const mockUser = {
    email: 'makcolly@gmail.com',
    password: 'colly-m',
  };

  let usersCollectionStub;

  before(function (done) {
    this.timeout(10000);

    usersCollectionStub = sinon.stub(dbClient, 'usersCollection').resolves({
      deleteMany: sinon.stub().resolves(),
      insertOne: sinon.stub().resolves({ ops: [{ _id: '1234567890', email: mockUser.email }] }),
      findOne: sinon.stub().resolves(null),
    });

    dbClient.usersCollection()
      .then((usersCollection) => {
        usersCollection.deleteMany({ email: mockUser.email })
          .then(() => done())
          .catch((deleteErr) => done(deleteErr));
      }).catch((connectErr) => done(connectErr));

    setTimeout(done, 5000);
  });

  after(function (done) {
    this.timeout(10000);

    usersCollectionStub.restore();

    done();
  });

  describe('+ POST: /users', () => {
    it('+ Fails when there is no email and there is password', function (done) {
      this.timeout(5000);
      request(app)
        .post('/users')
        .send({
          password: mockUser.password,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Missing email' });
          done();
        });
    });

    it('+ Fails when there is email and there is no password', function (done) {
      this.timeout(5000);
      request(app)
        .post('/users')
        .send({
          email: mockUser.email,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Missing password' });
          done();
        });
    });

    it('+ Succeeds when the new user has a password and email', function (done) {
      this.timeout(5000);

      usersCollectionStub.findOne.onCall(1).resolves(null);
      usersCollectionStub.findOne.onCall(2).resolves({ email: mockUser.email });
      request(app)
        .post('/users')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body.email).to.eql(mockUser.email);
          expect(res.body.id.length).to.be.greaterThan(0);
          done();
        });
    });

    it('+ Fails when the user already exists', function (done) {
      this.timeout(5000);

      usersCollectionStub.findOne.resolves({ email: mockUser.email });

      request(app)
        .post('/users')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Already exist' });
          done();
        });
    });
  });

});
