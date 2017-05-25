import * as passport from "passport"
import * as pbkdf2Password from "pbkdf2-password"
import * as moment from "moment"

let LocalStrategy  = require("passport-local").Strategy;
let FacebookStrategy = require("passport-facebook").Strategy;
let NaverStrategy = require("passport-naver").Strategy;
let GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
let hasher:pbkdf2Password  = pbkdf2Password();


//Interface Config
interface UserDATA {
  PK:[undefined, number],
  authId:string,
  email:string,
  password:[undefined, string],
  sex:string,
  birth:string,
  age:number,
  date:string,
  salt:string,
  name:string,
}

export class AuthStrategy {

    constructor(app){

    passport.serializeUser(function(user:UserDATA, done:any) {
      console.log('serializeUser', user);
      done(null, user.authId);
    });

    passport.deserializeUser(function(id:string, done:any) {
      console.log('deserializeUser', id);
      var sql = 'SELECT * FROM users WHERE authId=?';
      app.conn.query(sql, [id], function(err:object, results:object){
        if(err){
          console.log(err);
          done('There is no user.');
        } else {
          done(null, results[0]);
        }
      });
    });

    passport.use(new LocalStrategy(
      {
        usernameField:"email",
        passwordField:"password",
      },
      function(email:string, password:string, done:any){
        let mail:string = email;
        let pwd:string = password;
        let sql = 'SELECT * FROM users WHERE authId=?';
        app.conn.query(sql, ['local:'+mail], function(err, results){
          if(err){
            return done('There is no user.');
          }
          let user:UserDATA = results[0];
          return hasher({password:pwd, salt:user.salt},
            function(err, pass, salt, hash){
            if(hash === user.password){
              console.log('LocalStrategy', user);
              done(null, user);
            } else {
              done(null, false);
            }
            }
          );
        });
      }
    ));

    passport.use(new FacebookStrategy({
        clientID:process.env.FACEBOOK_APPID,
        clientSecret:process.env.FACEBOOK_APPPW,

        callbackURL: '/auth/facebook/callback',
        //passReqToCallback: true,
        profileFields:['id', 'gender', 'link',
                       'displayName', 'birthday', 'email']
      },
      (accessToken:string, refreshToken:string, profile, done) => {
        let authId:string = 'facebook:' + profile._json.id;
        let birth:string = new Date(profile._json.birthday)
                                   .toISOString().split('T')[0];
        if (profile._json.email){
          let prof_email:string = profile._json.email;
        } else {
          let prof_email:string = undefined;
        }

        let sql:string = 'SELECT * FROM users WHERE authId=?';
        app.conn.query(sql, authId, (err, results) => {
          if(results.length > 0){
            done(null, results[0])
          } else {
            let nowday = moment().format('YYYY-MM-DD');
            let newuser:UserDATA = {
                PK:undefined,
                name:profile._json.name,
                authId:authId,
                email:profile._json.email,
                password:undefined,
                sex:profile._json.gender,
                birth:birth,
                age:this.calcKoreanAge(birth),
                //birth: profile._json.birthday,
                salt:'facebook',
                date:nowday
            };
            let sql:string = 'INSERT INTO users SET ?'
            app.conn.query(sql, newuser, (err, result) =>{
              if(err) {
                console.log(err);
                done('Error');
              } else {
                done(null, newuser);
              }
            });
          }
        });
      }
    ));

    passport.use(new NaverStrategy({
        clientID:process.env.NAVER_APPID,
        clientSecret:process.env.NAVER_APPPW,

        callbackURL: '/auth/naver/callback',
        //passReqToCallback: true,
        profileFields:['id', 'gender', 'link', 'displayName', 'birthday', 'email']
        //profileFields:['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'displayName']
      },
      (accessToken:string, refreshToken:string, profile, done) => {
        let authId:string = 'naver:' + profile._json.id;
        if (profile._json.email){
          let prof_email:string = profile._json.email;
        } else {
          let prof_email:string = undefined;
        }

        console.log(profile)
        let sql:string = 'SELECT * FROM users WHERE authId=?';
        app.conn.query(sql, authId, (err, results) => {
          if(results.length > 0){
            console.log(results)
            done(null, results[0])
          } else {
            let nowday = moment().format('YYYY-MM-DD').split('T')[0];
            let newuser:UserDATA = {
                PK:undefined,
                name:profile._json.nickname,
                authId:authId,
                email:profile._json.email,
                password:undefined,
                sex:profile._json.gender,
                birth:profile._json.birthday,
                age:parseInt(profile._json.age.split('-')[0]),
                //age:profile._json.age.split('-'),
                //birth: profile._json.birthday,
                salt:'naver',
                date:nowday
            };
            let sql:string = 'INSERT INTO users SET ?'
            console.log(newuser);
            app.conn.query(sql, newuser, (err, result) =>{
              if(err) {
                console.log(err);
                done('Error');
              } else {
                done(null, newuser);
              }
            });
          }
        });
      }
    ));

    passport.use(new GoogleStrategy({
        clientID:process.env.GOOGLE_APPID,
        clientSecret:process.env.GOOGLE_APPPW,

        callbackURL: 'http://localhost:8080/auth/google/callback',
        //passReqToCallback: true,
        //profileFields:['id', 'gender', 'displayName', 'date', 'email', 'name']
        //profileFields:['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'displayName']
      },
      (accessToken:string, refreshToken:string, profile, done) => {
        console.log(profile);
        console.log('Accesse'); console.log(accessToken);
        console.log('Refresh'); console.log(refreshToken);
        let authId:string = 'google:' + profile._json.id;
        let sql:string = 'SELECT * FROM users WHERE authId=?';
        app.conn.query(sql, authId, (err, results) => {

          let prof_email:string;
          if (profile._json.emails[0].value) {
            prof_email= profile._json.emails[0].value;
          } else {
            prof_email= undefined;
          }

          //done(null,  profile)
          if(results.length > 0){
            done(null, results[0])
          } else {
            let nowday = moment().format('YYYY-MM-DD').split('T')[0];
            let newuser:UserDATA = {
                PK:undefined,
                name:profile._json.displayName,
                authId:authId,
                email:prof_email,
                password:undefined,
                sex:profile._json.gender,
                birth:profile._json.birthday,
                age:undefined,
                //age:parseInt(profile._json.age.split('-')[0]),
                //age:profile._json.age.split('-'),
                //birth: profile._json.birthday,
                salt:'naver',
                date:nowday
            };
            let sql:string = 'INSERT INTO users SET ?'
            console.log(newuser);
            app.conn.query(sql, newuser, (err, result) =>{
              if(err) {
                console.log(err);
                done('Error');
              } else {
                done(null, newuser);
              }
            });
          }
        });
      }
    ));
  }

  public calcKoreanAge = function(birth:string):number {
    let date:Date = new Date();
    let year:number = date.getFullYear();
    let month:number = (date.getMonth() + 1);
    let day:number = date.getDate();
    let monthday :number = month*100+day

    let birthNumList:object = birth.split('-').map((x) => parseInt(x));
    let birthYear:number = birthNumList[0];
    let birthMonth:number = birthNumList[1];
    let birthDay:number = birthNumList[2];
    let birthMonthday:number = birthMonth*100+birthDay

    if(monthday-birthMonthday >= 0) {
      return year-birthYear;
    } else {
      return year-birthYear-1;
    }
  }
}
