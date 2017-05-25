"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const pbkdf2Password = require("pbkdf2-password");
const moment = require("moment");
let LocalStrategy = require("passport-local").Strategy;
let FacebookStrategy = require("passport-facebook").Strategy;
let NaverStrategy = require("passport-naver").Strategy;
let GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
let hasher = pbkdf2Password();
class AuthStrategy {
    constructor(app) {
        this.calcKoreanAge = function (birth) {
            let date = new Date();
            let year = date.getFullYear();
            let month = (date.getMonth() + 1);
            let day = date.getDate();
            let monthday = month * 100 + day;
            let birthNumList = birth.split('-').map((x) => parseInt(x));
            let birthYear = birthNumList[0];
            let birthMonth = birthNumList[1];
            let birthDay = birthNumList[2];
            let birthMonthday = birthMonth * 100 + birthDay;
            if (monthday - birthMonthday >= 0) {
                return year - birthYear;
            }
            else {
                return year - birthYear - 1;
            }
        };
        passport.serializeUser(function (user, done) {
            console.log('serializeUser', user);
            done(null, user.authId);
        });
        passport.deserializeUser(function (id, done) {
            console.log('deserializeUser', id);
            var sql = 'SELECT * FROM users WHERE authId=?';
            app.conn.query(sql, [id], function (err, results) {
                if (err) {
                    console.log(err);
                    done('There is no user.');
                }
                else {
                    done(null, results[0]);
                }
            });
        });
        passport.use(new LocalStrategy({
            usernameField: "email",
            passwordField: "password",
        }, function (email, password, done) {
            let mail = email;
            let pwd = password;
            let sql = 'SELECT * FROM users WHERE authId=?';
            app.conn.query(sql, ['local:' + mail], function (err, results) {
                if (err) {
                    return done('There is no user.');
                }
                let user = results[0];
                return hasher({ password: pwd, salt: user.salt }, function (err, pass, salt, hash) {
                    if (hash === user.password) {
                        console.log('LocalStrategy', user);
                        done(null, user);
                    }
                    else {
                        done(null, false);
                    }
                });
            });
        }));
        passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_APPID,
            clientSecret: process.env.FACEBOOK_APPPW,
            callbackURL: '/auth/facebook/callback',
            profileFields: ['id', 'gender', 'link',
                'displayName', 'birthday', 'email']
        }, (accessToken, refreshToken, profile, done) => {
            let authId = 'facebook:' + profile._json.id;
            let birth = new Date(profile._json.birthday)
                .toISOString().split('T')[0];
            if (profile._json.email) {
                let prof_email = profile._json.email;
            }
            else {
                let prof_email = undefined;
            }
            let sql = 'SELECT * FROM users WHERE authId=?';
            app.conn.query(sql, authId, (err, results) => {
                if (results.length > 0) {
                    done(null, results[0]);
                }
                else {
                    let nowday = moment().format('YYYY-MM-DD');
                    let newuser = {
                        PK: undefined,
                        name: profile._json.name,
                        authId: authId,
                        email: profile._json.email,
                        password: undefined,
                        sex: profile._json.gender,
                        birth: birth,
                        age: this.calcKoreanAge(birth),
                        salt: 'facebook',
                        date: nowday
                    };
                    let sql = 'INSERT INTO users SET ?';
                    app.conn.query(sql, newuser, (err, result) => {
                        if (err) {
                            console.log(err);
                            done('Error');
                        }
                        else {
                            done(null, newuser);
                        }
                    });
                }
            });
        }));
        passport.use(new NaverStrategy({
            clientID: process.env.NAVER_APPID,
            clientSecret: process.env.NAVER_APPPW,
            callbackURL: '/auth/naver/callback',
            profileFields: ['id', 'gender', 'link', 'displayName', 'birthday', 'email']
        }, (accessToken, refreshToken, profile, done) => {
            let authId = 'naver:' + profile._json.id;
            if (profile._json.email) {
                let prof_email = profile._json.email;
            }
            else {
                let prof_email = undefined;
            }
            console.log(profile);
            let sql = 'SELECT * FROM users WHERE authId=?';
            app.conn.query(sql, authId, (err, results) => {
                if (results.length > 0) {
                    console.log(results);
                    done(null, results[0]);
                }
                else {
                    let nowday = moment().format('YYYY-MM-DD').split('T')[0];
                    let newuser = {
                        PK: undefined,
                        name: profile._json.nickname,
                        authId: authId,
                        email: profile._json.email,
                        password: undefined,
                        sex: profile._json.gender,
                        birth: profile._json.birthday,
                        age: parseInt(profile._json.age.split('-')[0]),
                        salt: 'naver',
                        date: nowday
                    };
                    let sql = 'INSERT INTO users SET ?';
                    console.log(newuser);
                    app.conn.query(sql, newuser, (err, result) => {
                        if (err) {
                            console.log(err);
                            done('Error');
                        }
                        else {
                            done(null, newuser);
                        }
                    });
                }
            });
        }));
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_APPID,
            clientSecret: process.env.GOOGLE_APPPW,
            callbackURL: 'http://localhost:8080/auth/google/callback',
        }, (accessToken, refreshToken, profile, done) => {
            console.log(profile);
            console.log('Accesse');
            console.log(accessToken);
            console.log('Refresh');
            console.log(refreshToken);
            let authId = 'google:' + profile._json.id;
            let sql = 'SELECT * FROM users WHERE authId=?';
            app.conn.query(sql, authId, (err, results) => {
                let prof_email;
                if (profile._json.emails[0].value) {
                    prof_email = profile._json.emails[0].value;
                }
                else {
                    prof_email = undefined;
                }
                if (results.length > 0) {
                    done(null, results[0]);
                }
                else {
                    let nowday = moment().format('YYYY-MM-DD').split('T')[0];
                    let newuser = {
                        PK: undefined,
                        name: profile._json.displayName,
                        authId: authId,
                        email: prof_email,
                        password: undefined,
                        sex: profile._json.gender,
                        birth: profile._json.birthday,
                        age: undefined,
                        salt: 'naver',
                        date: nowday
                    };
                    let sql = 'INSERT INTO users SET ?';
                    console.log(newuser);
                    app.conn.query(sql, newuser, (err, result) => {
                        if (err) {
                            console.log(err);
                            done('Error');
                        }
                        else {
                            done(null, newuser);
                        }
                    });
                }
            });
        }));
    }
}
exports.AuthStrategy = AuthStrategy;
