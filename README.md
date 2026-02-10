# mysqlmoose

A mongoose-compatible API for MySQL 8.0, written in ES5 for Node.js.

# mysqlmoose（中文）

一个兼容 mongoose API 的 MySQL 8.0 客户端，使用 ES5 为 Node.js 编写。

## 兼容 MongoDB 的使用方式

mysqlmoose 设计为兼容 mongoose API，使开发者可以使用类似 MongoDB 的方式操作 MySQL 数据库。这意味着你可以：

1. **使用相同的 Schema 定义语法**：可以像在 mongoose 中一样定义数据模型的结构，包括字段类型、默认值等。

2. **使用相同的 CRUD 操作**：可以使用 `create`、`find`、`findOne`、`findById`、`update`、`deleteOne`、`deleteMany` 等方法，与 mongoose 中的用法一致。

3. **支持嵌套对象**：可以像在 MongoDB 中一样定义和存储嵌套对象，mysqlmoose 会自动将其存储为 MySQL 8.0 的 JSON 类型字段。

4. **支持嵌套字段查询**：可以使用点符号（如 `profile.email`）查询嵌套对象中的字段，mysqlmoose 会自动转换为 MySQL 的 JSON 函数查询。

5. **支持链式查询**：可以使用链式调用构建复杂的查询条件，如 `User.find().where('age').in([30, 25]).exec()`。

6. **支持回调和 Promise**：可以使用回调函数或 Promise 处理异步操作，与 mongoose 的用法一致。

## 示例对比

### MongoDB (mongoose) 用法：

```javascript
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/test');

// 定义 Schema
const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  age: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  profile: {
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

// 创建 Model
const User = mongoose.model('User', userSchema);

// 创建文档
const newUser = await User.create({
  name: 'John Doe',
  age: 30,
  isActive: true,
  profile: {
    email: 'john@example.com',
    address: '123 Main St',
    phone: '555-1234'
  }
});

// 查询文档
const user = await User.findOne({ 'profile.email': 'john@example.com' });
```

### MySQL (mysqlmoose) 用法：

```javascript
const mysqlmoose = require('./index');

// 连接数据库
mysqlmoose.connect({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

// 定义 Schema
const userSchema = new mysqlmoose.Schema({
  name: { type: String, default: '' },
  age: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  profile: {
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

// 创建 Model
const User = mysqlmoose.model('User', userSchema);

// 创建文档
const newUser = await User.create({
  name: 'John Doe',
  age: 30,
  isActive: true,
  profile: {
    email: 'john@example.com',
    address: '123 Main St',
    phone: '555-1234'
  }
});

// 查询文档
const user = await User.find({ 'profile.email': 'john@example.com' });
```

可以看到，两种用法几乎完全一致，这使得开发者可以轻松地在 MySQL 和 MongoDB 之间切换，或者在同一项目中同时使用两种数据库。

## Features

- Compatible with mongoose API
- Connects to MySQL 8.0
- Supports Schema definition with default values
- Auto-creates and adjusts tables based on Schema
- Stores first-level fields directly in tables
- Stores object fields as JSON type in MySQL
- Supports basic CRUD operations
- Supports callback and Promise-based API
- Supports nested field queries using MySQL JSON functions
- Supports chained queries
- Uses connection pools for better performance

## Installation

```bash
npm install
```

## Usage

### Connect to Database

```javascript
var mysqlmoose = require('./index');

mysqlmoose.connect({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'test',
  port: 3306
}).then(connection => {
  console.log('Connected to MySQL database');
  // Your code here
}).catch(error => {
  console.error('Error connecting to database:', error);
});
```

### Define Schema

```javascript
var userSchema = new mysqlmoose.Schema({
  name: {type: String, default: ''},
  age: {type: Number, default: 0},
  isActive: {type: Boolean, default: true},
  profile: {
    email: {type: String, default: ''},
    address: {type: String, default: ''},
    phone: {type: String, default: ''}
  }, // Will be stored as JSON type
  createdAt: {type: Date, default: Date.now}
});
```

### Create Model

```javascript
var User = mysqlmoose.model('User', userSchema);
```

### CRUD Operations

#### Create

```javascript
// Using async/await
var newUser = await User.create({
  name: 'John Doe',
  age: 30,
  isActive: true,
  profile: {
    email: 'john@example.com',
    address: '123 Main St',
    phone: '555-1234'
  },
  createdAt: new Date()
});

// Using callback
User.create({
  name: 'Jane Smith',
  age: 25,
  isActive: true,
  profile: {
    email: 'jane@example.com',
    address: '456 Elm St',
    phone: '555-5678'
  },
  createdAt: new Date()
}, (err, user) => {
  if (err) {
    console.error('Error creating user:', err);
  } else {
    console.log('Created user:', user);
  }
});
```

#### Find

```javascript
// Find all users
var users = await User.find({});

// Find all users with callback
User.find({}, (err, users) => {
  if (err) {
    console.error('Error finding users:', err);
  } else {
    console.log('All users:', users);
  }
});

// Find user by condition
var user = await User.findOne({ name: 'John Doe' });

// Find user by ID
var userById = await User.findById(1);

// Find user by ID with callback
User.findById(1, (err, user) => {
  if (err) {
    console.error('Error finding user by ID:', err);
  } else {
    console.log('Found user by ID:', user);
  }
});

// Find user by nested field
var userByEmail = await User.find({ 'profile.email': 'john@example.com' });

// Using chained query
var chainedUser = await User.find().where('age').in([30, 25]).exec();
```

#### Update

```javascript
// Update user
await User.update({ id: 1 }, { age: 31, isActive: false });

// Update user with callback
User.update({ id: 1 }, { age: 32 }, (err, result) => {
  if (err) {
    console.error('Error updating user:', err);
  } else {
    console.log('Updated user:', result);
  }
});

// Update nested field
await User.update({ id: 1 }, { 
  profile: {
    email: 'john.doe@example.com',
    address: '789 Oak St',
    phone: '555-9876'
  }
});
```

#### Delete

```javascript
// Delete one user
await User.deleteOne({ id: 1 });

// Delete one user with callback
User.deleteOne({ name: 'Jane Smith' }, (err, result) => {
  if (err) {
    console.error('Error deleting user:', err);
  } else {
    console.log('Deleted user:', result);
  }
});

// Delete multiple users
await User.deleteMany({ isActive: false });
```

### Table Structure Auto-adjustment

mysqlmoose automatically checks and adjusts table structures based on Schema definitions:

- If the table doesn't exist, it will be created
- If fields are missing, they will be added
- If field types are inconsistent, they will be modified

### Connection Pool

mysqlmoose uses connection pools for better performance:

- Connection pools are created automatically
- Connections are released back to the pool after use
- Connection pools are automatically closed when the application exits

## Example

See `example.js` for a complete example of how to use mysqlmoose.

## License

GPL v2

## Author

28491599@qq.com