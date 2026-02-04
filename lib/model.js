/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

function Model(name, schema, connection) {
  this.name = name;
  this.schema = schema;
  this.connection = connection;
  this.tableName = name.toLowerCase() + 's';
  this.ensureTableExists();
}

Model.prototype.ensureTableExists = async function() {
  if (!this.connection) return;
  
  try {
    const columns = [];
    for (let field in this.schema.definition) {
      let type = this.schema.definition[field];
      let mysqlType;
      
      if (type === String) {
        mysqlType = 'VARCHAR(255)';
      } else if (type === Number) {
        mysqlType = 'INT';
      } else if (type === Boolean) {
        mysqlType = 'BOOLEAN';
      } else if (type === Date) {
        mysqlType = 'DATETIME';
      } else if (typeof type === 'object') {
        mysqlType = 'JSON';
      }
      
      if (mysqlType) {
        columns.push(`\`${field}\` ${mysqlType}`);
      }
    }
    
    if (columns.length > 0) {
      const sql = `CREATE TABLE IF NOT EXISTS \`${this.tableName}\` (\`id\` INT AUTO_INCREMENT PRIMARY KEY, ${columns.join(', ')})`;
      await this.connection.execute(sql);
    }
  } catch (error) {
    console.error('Error creating table:', error);
  }
};

Model.prototype.create = function(doc, callback) {
  const fields = [];
  const values = [];
  const placeholders = [];
  
  for (let field in doc) {
    let value = doc[field];
    if (typeof value === 'object' && value !== null) {
      // 确保正确处理嵌套对象和数组
      value = JSON.stringify(value);
    }
    fields.push(`\`${field}\``);
    values.push(value);
    placeholders.push('?');
  }
  
  const sql = `INSERT INTO \`${this.tableName}\` (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
  const promise = this.connection.execute(sql, values)
    .then(([result]) => {
      doc.id = result.insertId;
      return doc;
    });
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  return promise;
};

var Query = require('./query');

Model.prototype.find = function(query, callback) {
  if (typeof query === 'function') {
    callback = query;
    query = {};
  }
  
  if (callback && typeof callback === 'function') {
    let sql = `SELECT * FROM \`${this.tableName}\``;
    const values = [];
    
    if (query && Object.keys(query).length > 0) {
      const conditions = [];
      for (let field in query) {
        conditions.push(`\`${field}\` = ?`);
        values.push(query[field]);
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const promise = this.connection.execute(sql, values)
      .then(([rows]) => {
        return rows.map(row => {
          for (let field in row) {
            if (typeof row[field] === 'string') {
              // 尝试解析JSON字符串，包括对象和数组
              try {
                // 检查是否是JSON格式
                if (row[field].startsWith('{') && row[field].endsWith('}') || 
                    row[field].startsWith('[') && row[field].endsWith(']')) {
                  row[field] = JSON.parse(row[field]);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
          return row;
        });
      });
    
    promise.then(result => callback(null, result)).catch(error => callback(error));
    return promise;
  } else {
    const queryInstance = new Query(this.connection);
    queryInstance.from(this.tableName);
    if (query && Object.keys(query).length > 0) {
      queryInstance.where(query);
    }
    return queryInstance;
  }
};

Model.prototype.findOne = function(query, callback) {
  if (typeof query === 'function') {
    callback = query;
    query = {};
  }
  
  let queryResult = this.find(query);
  
  if (queryResult instanceof Query) {
    // 如果是Query实例，执行查询后返回第一个结果
    const promise = queryResult.exec()
      .then(rows => rows[0] || null);
    
    if (callback && typeof callback === 'function') {
      promise.then(result => callback(null, result)).catch(error => callback(error));
    }
    
    return promise;
  } else {
    // 如果是Promise，直接处理
    const promise = queryResult
      .then(rows => rows[0] || null);
    
    if (callback && typeof callback === 'function') {
      promise.then(result => callback(null, result)).catch(error => callback(error));
    }
    
    return promise;
  }
};

Model.prototype.findById = function(id, callback) {
  const promise = this.findOne({ id: id });
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  return promise;
};

Model.prototype.update = function(query, update, callback) {
  const sets = [];
  const values = [];
  
  for (let field in update) {
    let value = update[field];
    if (typeof value === 'object' && value !== null) {
      // 确保正确处理嵌套对象和数组
      value = JSON.stringify(value);
    }
    sets.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const conditions = [];
  for (let field in query) {
    conditions.push(`\`${field}\` = ?`);
    values.push(query[field]);
  }
  
  const sql = `UPDATE \`${this.tableName}\` SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')}`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  return promise;
};

Model.prototype.deleteOne = function(query, callback) {
  const conditions = [];
  const values = [];
  
  for (let field in query) {
    conditions.push(`\`${field}\` = ?`);
    values.push(query[field]);
  }
  
  const sql = `DELETE FROM \`${this.tableName}\` WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  return promise;
};

Model.prototype.deleteMany = function(query, callback) {
  const conditions = [];
  const values = [];
  
  for (let field in query) {
    conditions.push(`\`${field}\` = ?`);
    values.push(query[field]);
  }
  
  const sql = `DELETE FROM \`${this.tableName}\` WHERE ${conditions.join(' AND ')}`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  return promise;
};

module.exports = Model;