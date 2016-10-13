//TO DO
//Have mongod work with npm start
//Have min.css file update correctly on droplet




var express = require('express');
var request = require('supertest');
var expect = require('chai').expect;
var app = require('../server-config.js');
var util = require('../lib/utility');

var db = require('../app/config');

/////////////////////////////////////////////////////
// NOTE: these tests are designed for mongo!
/////////////////////////////////////////////////////

describe('', function() {

  beforeEach(function(done) {
    // Log out currently signed in user
    request(app)
      .get('/logout')
      .end(function(err, res) {

        // Delete objects from db so they can be created later for the test
        db.Link.remove({url: 'http://www.roflzoo.com/'}).exec();
        db.User.remove({username: 'Savannah'}).exec();
        db.User.remove({username: 'Phillip'}).exec();

        done();
      });
  });

  describe('Link creation: ', function() {

    it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function(done) {
      request(app)
        .post('/links')
        .send({
          'url': 'definitely not a valid url'})
        .expect(404)
        .end(done);
    });

    describe('Shortening links:', function() {

      it('Responds with the short code', function(done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'})
          .expect(200)
          .expect(function(res) {
            console.log('res.body', res.body);
            expect(res.body.url).to.equal('http://www.roflzoo.com/');
            expect(res.body.code).to.be.ok;
          })
          .end(done);
      });

      it('New links create a database entry', function(done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'})
          .expect(200)
          .expect(function(res) {
            db.Link.findOne({'url': 'http://www.roflzoo.com/'})
              .exec(function(err, link) {
                if (err) { console.log(err); }
                expect(link.url).to.equal('http://www.roflzoo.com/');
              });
          })
          .end(done);
      });

      it('Fetches the link url title', function(done) {
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'})
          .expect(200)
          .expect(function(res) {
            db.Link.findOne({'url': 'http://www.roflzoo.com/'})
              .exec(function(err, link) {
                if (err) { console.log(err); }
                expect(link.title).to.equal('Funny pictures of animals, funny dog pictures');
              });
          })
          .end(done);
      });

    }); // 'Shortening Links'

    describe('With previously saved urls: ', function() {

      beforeEach(function(done) {
        link = new db.Link({
          url: 'http://www.roflzoo.com/',
          title: 'Funny pictures of animals, funny dog pictures',
          baseUrl: 'http://127.0.0.1:4568',
          code: util.createLinkCode('http://www.roflzoo.com/'),
          visits: 0
        });

        link.save(function() {
          done();
        });
      });

      it('Returns the same shortened code if attempted to add the same URL twice', function(done) {
        var firstCode = link.code;
        request(app)
          .post('/links')
          .send({
            'url': 'http://www.roflzoo.com/'})
          .expect(200)
          .expect(function(res) {
            var secondCode = res.body.code;
            expect(secondCode).to.equal(firstCode);
          })
          .end(done);
      });

      it('Shortcode redirects to correct url', function(done) {
        var sha = link.code;
        console.log('sha: ', sha);
        request(app)
          .get('/' + sha)
          .expect(302)
          .expect(function(res) {
            var redirect = res.headers.location;
            expect(redirect).to.equal('http://www.roflzoo.com/');
          })
          .end(done);
      });

    }); // 'With previously saved urls'

  }); // 'Link creation'

  describe('Priviledged Access:', function() {

    // /*  Authentication  */
    // // TODO: xit out authentication
    it('Redirects to login page if a user tries to access the main page and is not signed in', function(done) {
      request(app)
        .get('/')
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

    it('Redirects to login page if a user tries to create a link and is not signed in', function(done) {
      request(app)
        .get('/create')
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

    it('Redirects to login page if a user tries to see all of the links and is not signed in', function(done) {
      request(app)
        .get('/links')
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

  }); // 'Privileged Access'

  describe('Account Creation:', function() {

    it('Signup creates a new user', function(done) {
      request(app)
        .post('/signup')
        .send({
          'username': 'Svnh',
          'password': 'Svnh' })
        .expect(302)
        .expect(function() {
          User.findOne({'username': 'Svnh'})
            .exec(function(err, user) {
              expect(user.username).to.equal('Svnh');
            });
        })
        .end(done);
    });

    it('Successful signup logs in a new user', function(done) {
      request(app)
        .post('/signup')
        .send({
          'username': 'Phillip',
          'password': 'Phillip' })
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/');
          request(app)
            .get('/logout')
            .expect(200);
        })
        .end(done);
    });

  }); // 'Account Creation'

  describe('Account Login:', function() {

    beforeEach(function(done) {
      new User({
        'username': 'Phillip',
        'password': 'Phillip'
      }).save(function() {
        done();
      });
    });

    it('Logs in existing users', function(done) {
      request(app)
        .post('/login')
        .send({
          'username': 'Phillip',
          'password': 'Phillip' })
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/');
        })
        .end(done);
    });

    it('Users that do not exist are kept on login page', function(done) {
      request(app)
        .post('/login')
        .send({
          'username': 'Fred',
          'password': 'Fred' })
        .expect(302)
        .expect(function(res) {
          expect(res.headers.location).to.equal('/login');
        })
        .end(done);
    });

  }); // Account Login

});
