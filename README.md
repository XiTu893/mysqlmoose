# mysqlmoose

A mongoose-compatible API for MySQL 8.0, written in ES5 for Node.js.

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