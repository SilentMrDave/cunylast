'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/../config/config.js')[env];
var db        = {};

var sequelize = new Sequelize('d80704c8fsvn4r','nerosrhmijgjtw','c516d8f67828745cb8e08682dfab11e563fb9a89ca4657f3926fb539a404f571',
{
	host: 'ec2-54-235-75-214.compute-1.amazonaws.com',
	dialect: 'postgres',
	logging: false,
    "ssl": true,
    "dialectOptions":
		{
	        "ssl": true
	    }
});

sequelize.authenticate()
.then(() =>
{
 	console.log('Connection has been established successfully.');
})
.catch(err =>
{
	console.error('Unable to connect to the database:', err);
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;