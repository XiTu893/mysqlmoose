/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

var mysql = require('mysql2/promise');
var Schema = require('./lib/schema');
var Model = require('./lib/model');
var Query = require('./lib/query');

function MySQLMoose() {
  this.models = {};
  this.connection = null;
  this.pool = null;
}

MySQLMoose.prototype.connect = function(options) {
  // 如果连接池已存在，直接返回
  if (this.pool) {
    return Promise.resolve(this.pool);
  }
  
  // 创建新的连接池
  this.pool = mysql.createPool(options);
  // 测试连接
  return this.pool.getConnection()
    .then(conn => {
      conn.release();
      this.connection = this.pool;
      return this.connection;
    });
};

MySQLMoose.prototype.Schema = function(definition){

  return new Schema(definition);
};

MySQLMoose.prototype.model = function(name, schema) {
  if (!this.models[name]) {
    this.models[name] = new Model(name, schema, this.connection);
  }
  return this.models[name];
};

module.exports = new MySQLMoose();
module.exports.Model = Model;
module.exports.Query = Query; 
