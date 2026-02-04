/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

var mysql = require('mysql2/promise');

function Connection(options) {
  this.options = options;
  this.conn = null;
}

Connection.prototype.connect = function() {
  return mysql.createConnection(this.options)
    .then(conn => {
      this.conn = conn;
      return this.conn;
    });
};

Connection.prototype.execute = function(sql, values) {
  return this.conn.execute(sql, values);
};

Connection.prototype.end = function() {
  return this.conn.end();
};

module.exports = Connection;