/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

var mysql = require('mysql2/promise');

function Connection(options) {
  this.options = options;
  this.pool = null;
}

Connection.prototype.connect = function() {
  this.pool = mysql.createPool(this.options);
  // 测试连接
  return this.pool.getConnection()
    .then(conn => {
      conn.release();
      return this.pool;
    });
};

Connection.prototype.execute = function(sql, values) {
  return this.pool.execute(sql, values);
};

Connection.prototype.end = function() {
  return this.pool.end();
};

module.exports = Connection;