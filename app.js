// Include packages
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var MongoStore = require('connect-mongo/es5')(session);
var cmsauth = require('./classes/database-cmsauth.js');

// Add packages to be used in templates
app.locals.moment = require('moment');

// set env
var env = app.get('env');
console.log("Enviroment: " + env);
console.log("Goto: https://localhost:8443");

// SIMPLE AUTH - Disabled in favor of RBAC OAUTH via Google (below)
// VERY basic simple auth
// var auth = require('http-auth');
// var basic = auth.basic({
//     realm: "Project Management",
//     file: __dirname + "/users.htpasswd"
// });
// app.use(auth.connect(basic));

// Now enable RBAC via Passport.js
// Source: https://github.com/mstade/passport-google-oauth2/blob/master/example/app.js
// Source: https://www.npmjs.com/package/passport-google-oauth2
// Source: http://passportjs.org/docs

switch (env) {
    case 'development':
        console.log("Google will send authentication tokens back to localhost");
        passport.use(new GoogleStrategy({
                clientID: "228390080454-abmmdfmp70rp7tvd3bdlt38vd5meaugd.apps.googleusercontent.com",
                clientSecret: "pnwf-UGQe_Cmxpu4XultMIUC",
                callbackURL: "https://127.0.0.1:8443/auth/google/callback",
                passReqToCallback: true
            },
            function (request, accessToken, refreshToken, profile, done) {
                process.nextTick(function () {
                    if (checkNestedExist(profile._json.domain)) {
                        if (typeof profile._json.domain == 'undefined') {
                            // A regular Google account - does not have a domain field
                            console.warn("Login Fail: Regular public Google account");
                            return done(null, false);
                        }
                        else if (profile._json.domain == 'rcsb.org') {
                            console.log("Login PASS: [" + profile.emails[0].value + "] with ID [" + profile.id + "] authenticated");
                            // Make sure the user exists in the authorization database
                            cmsauth.upsert_to_database(profile.id, profile.emails[0].value);
                            return done(null, profile);
                        } else {
                            // This is a Google account - but not from our domain!
                            console.warn("Login Fail: Google account but for different domain");
                            return done(null, false);
                        }
                    } else {
                        // A regular Google account - does not have a domain field
                        console.warn("Login Fail: Regular public Google account");
                        return done(null, false);
                    }
                });
            }
        ));
        break;
    default:
        passport.use(new GoogleStrategy({
                clientID: "228390080454-abmmdfmp70rp7tvd3bdlt38vd5meaugd.apps.googleusercontent.com",
                clientSecret: "pnwf-UGQe_Cmxpu4XultMIUC",
                callbackURL: "https://cms.rcsb.org/auth/google/callback",
                passReqToCallback: true
            },
            function (request, accessToken, refreshToken, profile, done) {
                process.nextTick(function () {
                    if (checkNestedExist(profile._json.domain)) {
                        if (typeof profile._json.domain == 'undefined') {
                            // A regular Google account - does not have a domain field
                            console.warn("Login Fail: Regular public Google account");
                            return done(null, false);
                        }
                        else if (profile._json.domain == 'rcsb.org') {
                            console.log("Login PASS: [" + profile.emails[0].value + "] with ID [" + profile.id + "] authenticated");
                            // Make sure the user exists in the authorization database
                            cmsauth.upsert_to_database(profile.id, profile.emails[0].value);
                            return done(null, profile);
                        } else {
                            // This is a Google account - but not from our domain!
                            console.warn("Login Fail: Google account but for different domain");
                            return done(null, false);
                        }
                    } else {
                        // A regular Google account - does not have a domain field
                        console.warn("Login Fail: Regular public Google account");
                        return done(null, false);
                    }
                });
            }
        ));
}

function checkNestedExist(obj) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return false;
        }
        obj = obj[args[i]];
    }
    return true;
}

app.use(session({
    secret: 'randomSTUFF3',
    proxy: false,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: 'mongodb://localhost:27017/sessions'
    }),
    cookie: {secure: true}
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

app.get('/login', function (req, res) {
    res.render('login/show', {title: 'Please Login'});
});

app.get('/fail', function (req, res) {
    req.logout();
    res.status(401);
    res.render('login/fail', {title: 'Wrong Account'});
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

app.get('/auth/google',
    passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login',
                'https://www.googleapis.com/auth/plus.profile.emails.read']
        }
    ));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/fail'
    }));

//   Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.session.passport.user._json.domain !== "rcsb.org") {
            // This is a Google account - but not from our domain!
            res.redirect('/fail');
            return false;
        }
        if (checkNestedExist(req.session.passport.user._json.image.url)) {
            res.locals.profile_picture = req.session.passport.user._json.image.url;
        }
        if (checkNestedExist(req.session.passport.user._json.emails[0].value)) {
            res.locals.profile_name = req.session.passport.user._json.emails[0].value;
        }
        if (checkNestedExist(req.session.passport.user._json.id)) {
            res.locals.profile_id = req.session.passport.user._json.id;
        }
        return next();
    }
    // Authentication still pending - force redirect
    res.redirect('/login');
    return false;
}

// Must setup client side access to Javascript and CSS before requiring authentication
app.use(express.static(path.join(__dirname, 'public')));

// All other routes below this line are protected by our authentication
app.all('*', ensureAuthenticated);
// End of RBAC

// Enable Jade
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Other include/config
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// set cdnUrl
switch (env) {
    // This is for local software development
    case 'development':
        //app.locals.cdnUrl = 'http://localhost/pdb101/'; // running local cdn on apache at localhost port 80
        app.locals.cdnUrl = 'https://cdn.rcsb.org/pdb101/';
        db_cluster_admin = 'mongodb://127.0.0.1:27017/admin';
        news_db_location = '127.0.0.1:27017/pdbnewsv1';
        app.locals.pretty = true;
        break;
    // This seems to be used by Rob for Geis students?
    case 'test':
        app.locals.cdnUrl = 'https://cdn.rcsb.org/pdb101/';
        db_cluster_admin = 'mongodb://132.249.213.84:27017,132.249.213.85:27017,132.249.213.86:27017,10.200.0.224:27017,10.200.0.225:27017/admin';
        news_db_location = '132.249.213.84:27017,132.249.213.85:27017,132.249.213.86:27017,10.200.0.224:27017,10.200.0.225:27017/pdbnewsv1';
        app.locals.pretty = true;
        break;
    // Production settings
    default:
        app.locals.cdnUrl = 'https://cdn.rcsb.org/pdb101/';
        db_cluster_admin = 'mongodb://132.249.213.84:27017,132.249.213.85:27017,132.249.213.86:27017,10.200.0.224:27017,10.200.0.225:27017/admin';
        news_db_location = '132.249.213.84:27017,132.249.213.85:27017,132.249.213.86:27017,10.200.0.224:27017,10.200.0.225:27017/pdbnewsv1';
}

console.log("CDN URL: " + app.locals.cdnUrl);
console.log("News DB: " + news_db_location);
app.locals.util = require('./classes/util.js'); // util will be available to all templates

// HTTP to HTTPS redirect
// Note: Does not detect/rewrite specified ports in the URL (so you can end up with https://localhost:8080 for example)
app.use(function (req, res, next) {
    if (req.secure) {
        // request was via https, so do no special handling
        next();
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.url);
    }
});

// Routes
var routes = require('./routes/index');
var motm = require('./routes/motm');
var upload = require('./routes/upload');
var geis = require('./routes/geis');
var learn = require('./routes/learn');
var teach = require('./routes/teach');
var news = require('./routes/news');
var auth = require('./routes/auth');
var welcome = require('./routes/welcome');
var static = require('./routes/static');

app.use('/', routes);
app.use('/auth', auth);
app.use('/motm', motm);
app.use('/upload', upload);
app.use('/geis', geis);
app.use('/learn', learn);
app.use('/teach', teach);
app.use('/news', news);
app.use('/welcome', welcome);
app.use('/static', static);

// Catch 404's and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Development error handler will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// DEFAULT Production error handler will NOT print stacktrace
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
