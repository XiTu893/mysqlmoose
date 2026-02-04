var mysqlmoose = require('./index');

// 连接数据库
mysqlmoose.connect({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'test'
}).then(async (connection) => {
  console.log('Connected to MySQL database');
  
  // 定义Schema
  var userSchema = mysqlmoose.Schema({
    name: String,
    age: Number,
    isActive: Boolean,
    profile: Object, // 将存储为JSON类型
    createdAt: Date
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
  
  // 查询所有用户
  console.log('Finding all users...');
  var users = await User.find({});
  console.log('All users:', users);
  
  // 根据条件查询
  console.log('Finding user by name...');
  var user = await User.findOne({ name: 'John Doe' });
  console.log('Found user:', user);
  
  // 根据ID查询
  console.log('Finding user by ID...');
  var userById = await User.findById(newUser.id);
  console.log('Found user by ID:', userById);
  
  // 更新用户
  console.log('Updating user...');
  await User.update({ id: newUser.id }, { age: 31, isActive: false });
  console.log('Updated user');
  
  // 再次查询以确认更新
  var updatedUser = await User.findById(newUser.id);
  console.log('Updated user:', updatedUser);
  
  // 删除用户
  console.log('Deleting user...');
  await User.deleteOne({ id: newUser.id });
  console.log('Deleted user');
  
  // 再次查询以确认删除
  var deletedUser = await User.findById(newUser.id);
  console.log('User after deletion:', deletedUser);
  
  // 关闭连接
  console.log('Closing connection...');
  await connection.end();
  console.log('Connection closed');
}).catch(error => {
  console.error('Error:', error);
});