/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */

function Query(connection) {
  this.connection = connection;
  this.sql = '';
  this.values = [];
  this.tableName = '';
  this.conditions = [];
  this.sortFields = [];
}

Query.prototype.from = function(tableName) {
  this.tableName = tableName;
  return this;
};

Query.prototype.where = function(field, value) {
  if (typeof field === 'object') {
    for (let key in field) {
      this.addCondition(key, value);
    }
  } else {
    this.addCondition(field, value);
  }
  return this;
};

Query.prototype.addCondition = function(field, value) {
  // 检查是否是嵌套字段查询
  if (field.includes('.')) {
    // 处理嵌套字段查询，使用JSON_EXTRACT函数
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') = ?`);
    this.values.push(value);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` = ?`);
    this.values.push(value);
  }
};

Query.prototype.in = function(field, values) {
  if (Array.isArray(values) && values.length > 0) {
    const placeholders = values.map(() => '?').join(', ');
    if (field.includes('.')) {
      // 处理嵌套字段查询
      const parts = field.split('.');
      const columnName = parts[0];
      const jsonPath = parts.slice(1).map(part => part).join('.');
      this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') IN (${placeholders})`);
    } else {
      // 普通字段查询
      this.conditions.push(`\`${field}\` IN (${placeholders})`);
    }
    this.values = this.values.concat(values);
  }
  return this;
};

Query.prototype.equals = function(field, value) {
  if (field.includes('.')) {
    // 处理嵌套字段查询
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') = ?`);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` = ?`);
  }
  this.values.push(value);
  return this;
};

Query.prototype.ne = function(field, value) {
  if (field.includes('.')) {
    // 处理嵌套字段查询
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') != ?`);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` != ?`);
  }
  this.values.push(value);
  return this;
};

Query.prototype.regex = function(field, pattern) {
  if (field.includes('.')) {
    // 处理嵌套字段查询
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') REGEXP ?`);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` REGEXP ?`);
  }
  this.values.push(pattern);
  return this;
};

Query.prototype.lte = function(field, value) {
  if (field.includes('.')) {
    // 处理嵌套字段查询
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') <= ?`);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` <= ?`);
  }
  this.values.push(value);
  return this;
};

Query.prototype.gte = function(field, value) {
  if (field.includes('.')) {
    // 处理嵌套字段查询
    const parts = field.split('.');
    const columnName = parts[0];
    const jsonPath = parts.slice(1).map(part => part).join('.');
    this.conditions.push(`JSON_EXTRACT(\`${columnName}\`, '$.${jsonPath}') >= ?`);
  } else {
    // 普通字段查询
    this.conditions.push(`\`${field}\` >= ?`);
  }
  this.values.push(value);
  return this;
};

Query.prototype.sort = function(field, direction) {
  const dir = direction === 'desc' ? 'DESC' : 'ASC';
  this.sortFields.push(`\`${field}\` ${dir}`);
  return this;
};

Query.prototype.buildSQL = function() {
  this.sql = `SELECT * FROM \`${this.tableName}\``;
  
  if (this.conditions.length > 0) {
    this.sql += ` WHERE ${this.conditions.join(' AND ')}`;
  }
  
  if (this.sortFields.length > 0) {
    this.sql += ` ORDER BY ${this.sortFields.join(', ')}`;
  }
  
  return this.sql;
};

Query.prototype.exec = function(callback) {
  this.buildSQL();
  
  // 处理values数组中的undefined值，将其转换为null
  const processedValues = this.values.map(value => value === undefined ? null : value);
  
  const promise = this.connection.execute(this.sql, processedValues)
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
  
  return promise;
};

module.exports = Query;