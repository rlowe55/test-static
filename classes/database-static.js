var monk		= require('monk');
var util		= require('./util');
var db			= monk('localhost:27017/pdb101v1');

// empty item used to populate the add form
var newItem = {
	type: '',
	name: '',
	description: '',
	html: '',
	visible: 'n',
	id_string: ''
};

module.exports = {
	// function to return all items in the static collection
	getAll: function(req, res) {
		console.log('getAll');
		db.get('static').find({}, {sort: {'name': 1}}, function(e, items){
			console.log('items.length=' + items.length);
			res.render('learn/index', { title: 'Learning Resources Editor', items: items });
		});
	},

	// function to return a single item from the learning_resources collection by id
	getItem: function(req, res) {
		console.log('getItem: _id=' + req.params._id);
		db.get('categories').find({}, {'sort': 'id'}, function(e, categories){
			db.get('learning_resources').findOne(req.params._id, {}, function(e, item){
				res.render('learn/item', { title: 'Learning Resources Editor', categories: categories, item: item });
			});
		});
	},

	// function to render a blank form used to add a new item
	//add: function(req, res) {
	//	console.log('add');
	//	res.render('static/item', { title: 'Static Editor', item: newItem });
	//},

	// function to insert a new item into the db
	insert: function(req, res) {
		console.log('insert');
		// build data obj from post input
		var data = {};
		var _id;
		var msg;
		for (var prop in req.body) {
			if (prop == 'keywords') {
				var keywords = req.body.keywords.trim();
				console.log('keywords=' + keywords);
				data.keywords = [];
				if (keywords.length > 0) {
					var arr = keywords.split(',');
					for (var i = 0; i < arr.length; i++) {
						data.keywords[i] = arr[i].trim();
					}
				}
			} else if (prop == 'subcategory_ids') {
				// ensure that subcategory_ids is stored as an array og ints
				var subcategory_ids = req.body.subcategory_ids;
				data.subcategory_ids = [];
				if (Array.isArray(subcategory_ids))	{
					for (var i = 0; i < subcategory_ids.length; i++) {
						data.subcategory_ids[i] = parseInt(subcategory_ids[i]);
					}
				} else {
					data.subcategory_ids[0] = parseInt(subcategory_ids)
				}
			} else if (prop == 'section_id' || prop == 'order') {
				data[prop] = parseInt(req.body[prop]);
			} else {
				data[prop] = req.body[prop];
			}
		}

		// id_string and href logic
		var resource_type = data.resource_type;
		if (resource_type == 'youtube' || resource_type == 'gif' || resource_type == 'html' || resource_type == 'include') {
			if (data.section_id == 5) {
				// guide-to-understanding-pdb-data
				data.id_string = util.toIdString(data.name);
				data.href = '/learn/guide-to-understanding-pdb-data/' + data.id_string;
			} else {
				data.id_string = util.toIdString(data.name + '-' + data.type);
				data.href = '/learn/resource/' + data.id_string;
			}
		} else if (resource_type == 'href') {
			data.href = data.resource;
			data.id_string = util.toIdString(data.name);
		} else if (resource_type == 'pdf') {
			data.href = 'https://cdn.rcsb.org/pdb101/learn/resources/' + data.resource;
			data.id_string = util.toIdString(data.name + '-' + data.type);
		} else {
			// all scenarios should have been handled
		}

		// subcategory_ids
		if (!req.body.subcategory_ids) {
			// none submitted so set subcategory_ids to empty array
			data.subcategory_ids = [];
		}

		// set backend
		data.backend = 'altered'; // set backend to trigger db refresh

		// update collection
		var learning_resources = db.get('learning_resources');
		learning_resources.insert(data, function(err) {
			if (err) {
				msg = 'error updating ' + data.name + ' - ' + data.type + ': ' + err;
				console.log(msg);
			} else {
				msg = data.name + ' - ' + data.type + ' updated successfully';
				console.log(msg);
			}
			db.get('learning_resources').find({}, {sort: {'section_id': 1, 'order': 1, 'id_string': 1}}, function(e, items){
				console.log('items.length=' + items.length);
				res.render('learn/index', { title: 'Learning Resources Editor', items: items, msg: msg });
			});
		});
	},

	// function to update a learning_resources field in response to an ajax request
	updateField: function(req, res) {
		// build data obj from post input
		var _id = req.query._id;
		var field = req.query.field;
		var value = req.query.value;
		var msg =	'ok';
		console.log('_id=' + _id + ', field=' + field + ', value=' + value);

		var data = {};
		data[field] = value;
		data.backend = 'altered'; // set backend to trigger db refresh

		db.get('learning_resources').update(_id, {$set: data}, function(err) {
			if (err) {
				msg = 'error: ' + err;
			}
			console.log(msg);
			var response = {_id: _id, value: value, msg: msg};
			res.send(JSON.stringify(response));
		});
	},

	// function to update an item in the learning_resources collection
	updateItem: function(req, res) {
		// build data obj from post input
		var data = {};
		var _id;
		var name;
		var type;
		var msg;
		for (var prop in req.body) {
			if (prop == '_id') {
				_id = req.body[prop];
				console.log('_id=' + _id);
			} else if (prop == 'keywords') {
				var keywords = req.body.keywords.trim();
				console.log('keywords=' + keywords);
				data.keywords = [];
				if (keywords.length > 0) {
					var arr = keywords.split(',');
					for (var i = 0; i < arr.length; i++) {
						data.keywords[i] = arr[i].trim();
					}
				}
			} else if (prop == 'subcategory_ids') {
				// ensure that subcategory_ids is stored as an array og ints
				var subcategory_ids = req.body.subcategory_ids;
				data.subcategory_ids = [];
				if (Array.isArray(subcategory_ids))	{
					for (var i = 0; i < subcategory_ids.length; i++) {
						data.subcategory_ids[i] = parseInt(subcategory_ids[i]);
					}
				} else {
					data.subcategory_ids[0] = parseInt(subcategory_ids)
				}
			} else if (prop == 'section_id' || prop == 'order') {
				data[prop] = parseInt(req.body[prop]);
			} else {
				data[prop] = req.body[prop];
			}
		}

		// id_string and href logic
		var resource_type = data.resource_type;
		if (resource_type == 'youtube' || resource_type == 'gif' || resource_type == 'html' || resource_type == 'include') {
			if (data.section_id == 5) {
				// guide-to-understanding-pdb-data
				data.id_string = util.toIdString(data.name);
				data.href = '/learn/guide-to-understanding-pdb-data/' + data.id_string;
			} else {
				data.id_string = util.toIdString(data.name + '-' + data.type);
				data.href = '/learn/resource/' + data.id_string;
			}
		} else if (resource_type == 'href') {
			data.href = data.resource;
			data.id_string = util.toIdString(data.name);
		} else if (resource_type == 'pdf') {
			data.href = 'https://cdn.rcsb.org/pdb101/learn/resources/' + data.resource;
			data.id_string = util.toIdString(data.name + '-' + data.type);
		} else {
			// all scenarios should have been handled
		}

		// subcategory_ids
		if (!req.body.subcategory_ids) {
			// none submitted so set subcategory_ids to empty array
			data.subcategory_ids = [];
		}

		// set backend
		data.backend = 'altered'; // set backend to trigger db refresh

		// update collection
		var learning_resources = db.get('learning_resources');
		learning_resources.update(_id, { $set: data }, function(err) {
			if (err) {
				msg = 'error updating ' + data.name + ': ' + err;
				console.log(msg);
			} else {
				msg = data.name + ' updated successfully';
				console.log(msg);
			}
			db.get('learning_resources').find({}, {sort: {'section_id': 1, 'order': 1, 'id_string': 1}}, function(e, items){
				console.log('items.length=' + items.length);
				res.render('learn/index', { title: 'Learning Resources Editor', items: items, msg: msg });
			});
		});
	},
}
