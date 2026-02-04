# mysqlmoose

A mongoose-compatible API for MySQL 8.0, written in ES5 for Node.js.

## Features

- Compatible with mongoose API
- Connects to MySQL 8.0
- Supports Schema definition
- Auto-creates tables based on Schema
- Stores first-level fields directly in tables
- Stores object fields as JSON type in MySQL
- Supports basic CRUD operations

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
  database: 'test'
}).then(connection => {
  console.log('Connected to MySQL database');
  // Your code here
}).catch(error => {
  console.error('Error connecting to database:', error);
});
```

### Define Schema

```javascript
var userSchema = mysqlmoose.Schema({
  name: String,
  age: Number,
  isActive: Boolean,
  profile: Object, // Will be stored as JSON
  createdAt: Date
});
```

### Create Model

```javascript
var User = mysqlmoose.model('User', userSchema);
```

### CRUD Operations

#### Create

```javascript
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
```

#### Find

```javascript
// Find all users
var users = await User.find({});

// Find user by condition
var user = await User.findOne({ name: 'John Doe' });

// Find user by ID
var userById = await User.findById(1);
```

#### Update

```javascript
await User.update({ id: 1 }, { age: 31, isActive: false });
```

#### Delete

```javascript
// Delete one user
await User.deleteOne({ id: 1 });

// Delete multiple users
await User.deleteMany({ isActive: false });
```

## Example

See `example.js` for a complete example of how to use mysqlmoose.

## License

GPL v2