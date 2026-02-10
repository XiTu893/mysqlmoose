/**
 * mysqlmoose - A mongoose-compatible API for MySQL 8.0
 * Copyright (c) 2026 28491599@qq.com
 * Licensed under the GPL v2 license.
 */
/**
 * 
 * @param {*} definition 
 * 样例:{
 *   {
      name: {type: String, default: 'Unknown'},
   age: {type: Number, default: 0},
   isActive: {type: Boolean, default: true},
   profile: {
     email: {type: String, default: 'Unknown'},
      address: {type: String, default: 'Unknown'},
      phone: {type: String, default: 'Unknown'}
    }, // 将存储为JSON类型
    createdAt: {type: Date, default: Date.now}
  
  }
 */
function Schema(definition) {
  this.definition = this.parseDefinition(definition);
}

Schema.prototype.parseDefinition = function(definition) {
  const parsedDefinition = {};
  
  for (let field in definition) {
    const fieldDef = definition[field];
    
    if (typeof fieldDef === 'object' && fieldDef !== null) {
      // 处理复杂字段定义，如 {type: String, default: 'Unknown'}
      if (fieldDef.type) {
        parsedDefinition[field] = {
          type: fieldDef.type,
          default: fieldDef.default
        };
      } else {
        // 处理嵌套对象，如 profile: { email: String, ... }
        parsedDefinition[field] = {
          type: Object,
          nested: this.parseDefinition(fieldDef)
        };
      }
    } else {
      // 处理简单字段定义，如 name: String
      parsedDefinition[field] = {
        type: fieldDef
      };
    }
  }
  
  return parsedDefinition;
};

module.exports = Schema;