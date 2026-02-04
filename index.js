/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

var mysql = require('mysql2/promise');
var Schema = require('./lib/schema');
var Model = require('./lib/model');
var Connection = require('./lib/connection');
var Query = require('./lib/query');

function MySQLMoose() {
  this.models = {};
  this.connection = null;
}

MySQLMoose.prototype.connect = function(options) {
  return mysql.createConnection(options)
    .then(conn => {
      this.connection = conn;
      return this.connection;
    });
};

MySQLMoose.prototype.Schema = function(definition) {
  return new Schema(definition);
};

MySQLMoose.prototype.model = function(name, schema) {
  if (!this.models[name]) {
    this.models[name] = new Model(name, schema, this.connection);
  }
  return this.models[name];
};

module.exports = new MySQLMoose();
module.exports.Schema = Schema;
module.exports.Model = Model;
module.exports.Connection = Connection;
module.exports.Query = Query;