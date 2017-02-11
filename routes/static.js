var express = require('express');
var router = express.Router();
var database = require('../classes/database-learn.js');
var cmsauth = require('../classes/database-cmsauth.js');
var component = 'learn';

// testing
const exec = require('child_process').exec;

// empty item used to populate the add form
var newItem = {
	type: '',
	name: '',
	description: '',
	html: '',
	visible: 'n',
	id_string: ''
};

// return all items
router.get('/', function (req, res) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            database.getAll(req, res);
        } else {
            res.redirect("/auth/fail");
        }
    });
});

// return an item for editing
router.get('/edit/:_id', function (req, res) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            database.getItem(req, res);
        } else {
            res.redirect("/auth/fail");
        }
    });
});

// update a field in response to an ajax request
router.get('/updateField', function (req, res) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            database.updateField(req, res);
        } else {
            res.redirect("/auth/fail");
        }
    });
});

// update an item from a post request and return the index list
router.post('/update', function (req, res) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            database.updateItem(req, res);
        } else {
            res.redirect("/auth/fail");
        }
    });
});

// display a form to add a new item
router.get('/add', function (req, res, next) {
    auth(res, function () {
        console.log('static: add');
        // testing
        exec('cat /Users/rlowe/Downloads/test.txt', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        });

        //database.add(req, res);
        console.log('req.path=' + req.path);
        res.render('static/item', { title: 'Static Editor', item: newItem });
    });
});

// insert a new item and return the index list
router.post('/insert', function (req, res, next) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            database.insert(req, res);
        } else {
            res.redirect("/auth/fail");
        }
    });
});

function auth(res, callback) {
    cmsauth.can_access(res.locals.profile_id, component, function (auth) {
        if (auth) {
            console.log('auth ok');
            callback();
        } else {
            res.redirect("/auth/fail");
        }
    });

}

module.exports = router;
