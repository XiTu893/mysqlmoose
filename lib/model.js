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
  if (!this.connection || !this.schema || !this.schema.definition) return;
  
  try {
    // 检查表是否存在
    const checkTableSql = `SHOW TABLES LIKE '${this.tableName}'`;
    const [tables] = await this.connection.execute(checkTableSql);
    
    if (tables.length === 0) {
      // 表不存在，创建新表
      console.log(`Creating table ${this.tableName}...`);
      await this.createTable();
    } else {
      // 表存在，检查并调整表结构
      console.log(`Checking table ${this.tableName} structure...`);
      await this.adjustTableStructure();
    }
  } catch (error) {
    console.error('Error ensuring table exists:', error);
  }
};

Model.prototype.createTable = async function() {
  const columns = [];
  for (let field in this.schema.definition) {
    const fieldDef = this.schema.definition[field];
    let mysqlType;
    
    if (fieldDef.type === String) {
      mysqlType = 'VARCHAR(255)';
    } else if (fieldDef.type === Number) {
      mysqlType = 'INT';
    } else if (fieldDef.type === Boolean) {
      mysqlType = 'BOOLEAN';
    } else if (fieldDef.type === Date) {
      mysqlType = 'DATETIME';
    } else if (fieldDef.type === Object || typeof fieldDef.type === 'undefined') {
      // 处理嵌套对象，存储为JSON类型
      mysqlType = 'JSON';
    }
    
    if (mysqlType) {
      columns.push(`\`${field}\` ${mysqlType}`);
    }
  }
  
  if (columns.length > 0) {
    const sql = `CREATE TABLE \`${this.tableName}\` (\`id\` INT AUTO_INCREMENT PRIMARY KEY, ${columns.join(', ')})`;
    await this.connection.execute(sql);
    console.log(`Table ${this.tableName} created successfully`);
  }
};

Model.prototype.adjustTableStructure = async function() {
  // 获取表的当前结构
  const describeSql = `DESCRIBE \`${this.tableName}\``;
  const [currentColumns] = await this.connection.execute(describeSql);
  
  // 构建当前列名的映射
  const currentColumnMap = {};
  for (let column of currentColumns) {
    currentColumnMap[column.Field] = column;
  }
  
  // 检查Schema中的每个字段
  for (let field in this.schema.definition) {
    if (field === 'id') continue; // 跳过id字段，它是主键
    
    const fieldDef = this.schema.definition[field];
    let mysqlType;
    
    if (fieldDef.type === String) {
      mysqlType = 'VARCHAR(255)';
    } else if (fieldDef.type === Number) {
      mysqlType = 'INT';
    } else if (fieldDef.type === Boolean) {
      mysqlType = 'BOOLEAN';
    } else if (fieldDef.type === Date) {
      mysqlType = 'DATETIME';
    } else if (fieldDef.type === Object || typeof fieldDef.type === 'undefined') {
      // 处理嵌套对象，存储为JSON类型
      mysqlType = 'JSON';
    }
    
    if (mysqlType) {
      if (!currentColumnMap[field]) {
        // 字段不存在，添加新字段
        const addColumnSql = `ALTER TABLE \`${this.tableName}\` ADD COLUMN \`${field}\` ${mysqlType}`;
        await this.connection.execute(addColumnSql);
        console.log(`Added column ${field} to table ${this.tableName}`);
      } else {
        // 字段存在，检查类型是否一致
        // 注意：这里只是简单检查，实际情况可能更复杂
        // 例如，VARCHAR(255)和VARCHAR(100)会被视为不同类型
        // 但为了简化，我们只检查主要类型
        const currentType = currentColumnMap[field].Type;
        if (!this.isTypeCompatible(currentType, mysqlType)) {
          // 类型不一致，修改字段类型
          const modifyColumnSql = `ALTER TABLE \`${this.tableName}\` MODIFY COLUMN \`${field}\` ${mysqlType}`;
          await this.connection.execute(modifyColumnSql);
          console.log(`Modified column ${field} type from ${currentType} to ${mysqlType} in table ${this.tableName}`);
        }
      }
    }
  }
  
  // 检查是否有多余的字段需要删除
  // 注意：为了安全起见，我们不自动删除字段，只添加或修改字段
};

Model.prototype.isTypeCompatible = function(currentType, expectedType) {
  // 简单的类型兼容性检查
  // 实际情况可能更复杂，需要根据具体需求调整
  const typeMap = {
    'VARCHAR(255)': ['VARCHAR', 'TEXT'],
    'INT': ['INT', 'BIGINT', 'SMALLINT'],
    'BOOLEAN': ['BOOLEAN', 'TINYINT'],
    'DATETIME': ['DATETIME', 'TIMESTAMP'],
    'JSON': ['JSON']
  };
  
  const compatibleTypes = typeMap[expectedType] || [];
  return compatibleTypes.some(type => currentType.includes(type));
};

Model.prototype.create = function(doc, callback) {
  const fields = [];
  const values = [];
  const placeholders = [];
  
  // 应用默认值
  if (this.schema && this.schema.definition) {
    for (let field in this.schema.definition) {
      const fieldDef = this.schema.definition[field];
      if (doc[field] === undefined && fieldDef.default !== undefined) {
        doc[field] = fieldDef.default;
      }
    }
  }
  
  for (let field in doc) {
    let value = doc[field];
    if (value === undefined) {
      value = null;
    } else if (value instanceof Date) {
      // 处理日期对象，转换为MySQL可接受的格式
      value = value.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof value === 'object' && value !== null) {
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
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
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
    
    // 处理values数组中的undefined值，将其转换为null
  const processedValues = values.map(value => value === undefined ? null : value);
  
  const promise = this.connection.execute(sql, processedValues)
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
    // 使用回调时，返回this以支持链式调用
    return this;
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
      // 使用回调时，返回this以支持链式调用
      return this;
    } else {
      // 不使用回调时，返回Promise以支持Promise链
      return promise;
    }
  } else {
    // 如果是Promise，直接处理
    const promise = queryResult
      .then(rows => rows[0] || null);
    
    if (callback && typeof callback === 'function') {
      promise.then(result => callback(null, result)).catch(error => callback(error));
      // 使用回调时，返回this以支持链式调用
      return this;
    } else {
      // 不使用回调时，返回Promise以支持Promise链
      return promise;
    }
  }
};

Model.prototype.findById = function(id, callback) {
  const result = this.findOne({ id: id });
  
  if (callback && typeof callback === 'function') {
    // 如果有回调，确保结果是Promise并处理回调
    if (result instanceof Promise) {
      result.then(result => callback(null, result)).catch(error => callback(error));
    }
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回结果（可能是Promise或Query实例）
    return result;
  }
};

Model.prototype.update = function(query, update, callback) {
  const sets = [];
  const values = [];
  
  for (let field in update) {
    let value = update[field];
    if (value === undefined) {
      value = null;
    } else if (value instanceof Date) {
      // 处理日期对象，转换为MySQL可接受的格式
      value = value.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof value === 'object' && value !== null) {
      // 确保正确处理嵌套对象和数组
      value = JSON.stringify(value);
    }
    sets.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const conditions = [];
  for (let field in query) {
    let value = query[field];
    if (value === undefined) {
      value = null;
    }
    conditions.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const sql = `UPDATE \`${this.tableName}\` SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')}`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
};

Model.prototype.deleteOne = function(query, callback) {
  const conditions = [];
  const values = [];
  
  for (let field in query) {
    let value = query[field];
    if (value === undefined) {
      value = null;
    }
    conditions.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const sql = `DELETE FROM \`${this.tableName}\` WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
};

Model.prototype.deleteMany = function(query, callback) {
  const conditions = [];
  const values = [];
  
  for (let field in query) {
    let value = query[field];
    if (value === undefined) {
      value = null;
    }
    conditions.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const sql = `DELETE FROM \`${this.tableName}\` WHERE ${conditions.join(' AND ')}`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
};

Model.prototype.updateOne = function(query, update, callback) {
  const sets = [];
  const values = [];
  
  for (let field in update) {
    let value = update[field];
    if (value === undefined) {
      value = null;
    } else if (value instanceof Date) {
      // 处理日期对象，转换为MySQL可接受的格式
      value = value.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof value === 'object' && value !== null) {
      // 确保正确处理嵌套对象和数组
      value = JSON.stringify(value);
    }
    sets.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const conditions = [];
  for (let field in query) {
    let value = query[field];
    if (value === undefined) {
      value = null;
    }
    conditions.push(`\`${field}\` = ?`);
    values.push(value);
  }
  
  const sql = `UPDATE \`${this.tableName}\` SET ${sets.join(', ')} WHERE ${conditions.join(' AND ')} LIMIT 1`;
  const promise = this.connection.execute(sql, values);
  
  if (callback && typeof callback === 'function') {
    promise.then(result => callback(null, result)).catch(error => callback(error));
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
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
    // 使用回调时，返回this以支持链式调用
    return this;
  } else {
    // 不使用回调时，返回Promise以支持Promise链
    return promise;
  }
};

module.exports = Model;