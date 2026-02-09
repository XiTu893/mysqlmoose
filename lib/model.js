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
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
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
  } else {
    // 如果是Promise，直接处理
    const promise = queryResult
      .then(rows => rows[0] || null);
    
    if (callback && typeof callback === 'function') {
      promise.then(result => callback(null, result)).catch(error => callback(error));
    }
  }
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
};

Model.prototype.findById = function(id, callback) {
  const promise = this.findOne({ id: id });
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
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
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
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
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
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
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
};

Model.prototype.updateOne = function(query, update, callback) {
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
  
  const sql = `UPDATE \`${this.tableName}\` SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
};

Model.prototype.aggregate = function(pipeline, callback) {
  // 简化实现，仅支持基本的聚合操作
  let sql = `SELECT * FROM \`${this.tableName}\``;
  const values = [];
  
  // 处理pipeline中的操作
  let selectFields = '*';
  let groupByClause = '';
  
  for (let stage of pipeline) {
    if (stage.$match) {
      const conditions = [];
      for (let field in stage.$match) {
        conditions.push(`\`${field}\` = ?`);
        values.push(stage.$match[field]);
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
    } else if (stage.$project) {
      // 处理$project操作，重新构建SELECT子句
      const projectedFields = [];
      for (let field in stage.$project) {
        if (stage.$project[field]) {
          projectedFields.push(`\`${field}\``);
        }
      }
      if (projectedFields.length > 0) {
        selectFields = projectedFields.join(', ');
      }
    } else if (stage.$group) {
      // 处理$group操作，构建GROUP BY子句
      const groupFields = [];
      for (let field in stage.$group) {
        if (field === '_id') {
          // 处理分组字段
          if (typeof stage.$group[field] === 'string') {
            groupFields.push(`\`${stage.$group[field]}\``);
          }
        } else {
          // 处理聚合函数
          const aggExpr = stage.$group[field];
          for (let aggFunc in aggExpr) {
            if (aggFunc === '$sum') {
              groupFields.push(`SUM(\`${aggExpr[aggFunc]}\`) AS \`${field}\``);
            } else if (aggFunc === '$avg') {
              groupFields.push(`AVG(\`${aggExpr[aggFunc]}\`) AS \`${field}\``);
            } else if (aggFunc === '$max') {
              groupFields.push(`MAX(\`${aggExpr[aggFunc]}\`) AS \`${field}\``);
            } else if (aggFunc === '$min') {
              groupFields.push(`MIN(\`${aggExpr[aggFunc]}\`) AS \`${field}\``);
            }
          }
        }
      }
      if (groupFields.length > 0) {
        selectFields = groupFields.join(', ');
        // 提取分组字段用于GROUP BY子句
        const groupingFields = [];
        for (let field in stage.$group) {
          if (field === '_id' && typeof stage.$group[field] === 'string') {
            groupingFields.push(`\`${stage.$group[field]}\``);
          }
        }
        if (groupingFields.length > 0) {
          groupByClause = ` GROUP BY ${groupingFields.join(', ')}`;
        }
      }
    } else if (stage.$sort) {
      const sortFields = [];
      for (let field in stage.$sort) {
        const direction = stage.$sort[field] === -1 ? 'DESC' : 'ASC';
        sortFields.push(`\`${field}\` ${direction}`);
      }
      if (sortFields.length > 0) {
        sql += ` ORDER BY ${sortFields.join(', ')}`;
      }
    } else if (stage.$limit) {
      sql += ` LIMIT ${stage.$limit}`;
    } else if (stage.$skip) {
      sql += ` OFFSET ${stage.$skip}`;
    }
  }
  
  // 替换SELECT子句
  sql = sql.replace('SELECT *', `SELECT ${selectFields}`);
  
  // 添加GROUP BY子句
  sql += groupByClause;
  
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
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
  }
  
  // 返回this以支持链式调用，与mongoose风格一致
  return this;
};

module.exports = Model;