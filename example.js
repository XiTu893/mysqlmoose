var mysqlmoose = require('./index');

// 连接数据库
mysqlmoose.connect({
  host: 'sql.freedb.tech',
  user: 'freedb_testuser',
  password: 'gd#STjfqeBK&Vw6',
  database: 'freedb_tesetmysl',
  port: 3306
}).then(async (connection) => {
  console.log('Connected to MySQL database');
  
  // 定义Schema
  var userSchema = new mysqlmoose.Schema({
    name: {type: String, default: ''},
    age: {type: Number, default: 0},
    isActive: {type: Boolean, default: true},
    profile: {
      email: {type: String, default: ''},
      address: {type: String, default: ''},
      phone: {type: String, default: ''}
    }, // 将存储为JSON类型
    createdAt: {type: Date, default: Date.now}
  
  });
  
  // 创建Model
  var User = mysqlmoose.model('User', userSchema);
  
  // 创建文档
  console.log('Creating user...');
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
  console.log('Created user:', newUser);
  
  // 使用回调方式创建文档
  console.log('Creating user with callback...');
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
      console.log('Created user with callback:', user);
    }
  });
  
  // 查询所有用户
  console.log('Finding all users...');
  var users = await User.find({});
  console.log('All users:', users);
  
  // 使用回调方式查询所有用户
  console.log('Finding all users with callback...');
  User.find({}, (err, users) => {
    if (err) {
      console.error('Error finding users:', err);
    } else {
      console.log('All users with callback:', users);
    }
  });
  
  // 根据条件查询
  console.log('Finding user by name...');
  var user = await User.findOne({ name: 'John Doe' });
  console.log('Found user:', user);
  
  // 根据嵌套字段查询
  console.log('Finding user by email...');
  var userByEmail = await User.find({ 'profile.email': 'john@example.com' });
  console.log('Found user by email:', userByEmail);
  
  // 使用链式查询
  console.log('Finding user with chained query...');
  var chainedUser = await User.find().where('age').in([30, 25]).exec();
  console.log('Found user with chained query:', chainedUser);
  
  // 根据ID查询
  console.log('Finding user by ID...');
  var userById = await User.findById(newUser.id);
  console.log('Found user by ID:', userById);
  
  // 使用回调方式根据ID查询
  console.log('Finding user by ID with callback...');
  User.findById(newUser.id, (err, user) => {
    if (err) {
      console.error('Error finding user by ID:', err);
    } else {
      console.log('Found user by ID with callback:', user);
    }
  });
  
  // 更新用户
  console.log('Updating user...');
  await User.update({ id: newUser.id }, { age: 31, isActive: false });
  console.log('Updated user');
  
  // 更新嵌套字段
  console.log('Updating user profile...');
  await User.update({ id: newUser.id }, { 
    profile: {
      email: 'john.doe@example.com',
      address: '789 Oak St',
      phone: '555-9876'
    }
  });
  console.log('Updated user profile');
  
  // 使用回调方式更新用户
  console.log('Updating user with callback...');
  User.update({ id: newUser.id }, { age: 32 }, (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
    } else {
      console.log('Updated user with callback:', result);
    }
  });
  
  // 再次查询以确认更新
  var updatedUser = await User.findById(newUser.id);
  console.log('Updated user:', updatedUser);
  
  // 删除用户
  console.log('Deleting user...');
  await User.deleteOne({ id: newUser.id });
  console.log('Deleted user');
  
  // 使用回调方式删除用户
  console.log('Deleting user with callback...');
  User.deleteOne({ name: 'Jane Smith' }, (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
    } else {
      console.log('Deleted user with callback:', result);
    }
  });
  
  // 再次查询以确认删除
  var deletedUser = await User.findById(newUser.id);
  console.log('User after deletion:', deletedUser);
  
  // 注意：现在使用的是连接池，不需要手动关闭连接
  // 连接池会在应用程序退出时自动关闭
}).catch(error => {
  console.error('Error:', error);
});