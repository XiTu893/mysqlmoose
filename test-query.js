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
    profile: Object,
    createdAt: Date
  });
  
  // 创建Model
  var User = mysqlmoose.model('User', userSchema);
  
  // 创建测试数据
  console.log('Creating test users...');
  await User.create({ name: 'John Doe', age: 30, isActive: true });
  await User.create({ name: 'Jane Smith', age: 25, isActive: true });
  await User.create({ name: 'Bob Johnson', age: 35, isActive: false });
  console.log('Test users created');
  
  // 测试链式调用 - where + sort + exec
  console.log('\nTesting chained query with where and sort:');
  User.find()
    .where('isActive', true)
    .sort('age', 'desc')
    .exec((error, users) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Active users sorted by age (desc):', users);
      }
    });
  
  // 测试链式调用 - in + exec
  console.log('\nTesting chained query with in:');
  User.find()
    .in('age', [25, 30])
    .exec()
    .then(users => {
      console.log('Users with age 25 or 30:', users);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  // 测试链式调用 - ne + exec
  console.log('\nTesting chained query with ne:');
  User.find()
    .ne('name', 'John Doe')
    .exec((error, users) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Users not named John Doe:', users);
      }
    });
  
  // 测试链式调用 - regex + exec
  console.log('\nTesting chained query with regex:');
  User.find()
    .regex('name', '^J')
    .exec()
    .then(users => {
      console.log('Users with name starting with J:', users);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  // 测试findOne with callback
  console.log('\nTesting findOne with callback:');
  User.findOne({ name: 'John Doe' }, (error, user) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Found user by name:', user);
    }
  });
  
  // 测试findById with callback
  console.log('\nTesting findById with callback:');
  User.find({ name: 'Jane Smith' })
    .exec()
    .then(users => {
      if (users.length > 0) {
        const userId = users[0].id;
        User.findById(userId, (error, user) => {
          if (error) {
            console.error('Error:', error);
          } else {
            console.log('Found user by ID:', user);
          }
        });
      }
    });
  
  // 清理测试数据
  setTimeout(async () => {
    console.log('\nCleaning up test data...');
    await User.deleteMany({});
    console.log('Test data cleaned up');
    
    // 关闭连接
    console.log('Closing connection...');
    await connection.end();
    console.log('Connection closed');
  }, 2000);
}).catch(error => {
  console.error('Error:', error);
});