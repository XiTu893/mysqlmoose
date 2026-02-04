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
    profile: Object, // JSON类型字段
    createdAt: Date
  });
  
  // 创建Model
  var User = mysqlmoose.model('User', userSchema);
  
  // 创建测试数据
  console.log('Creating test users with nested JSON data...');
  await User.create({
    name: 'John Doe',
    profile: {
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'New York',
        zip: '10001'
      },
      phone: '555-1234'
    },
    createdAt: new Date()
  });
  
  await User.create({
    name: 'Jane Smith',
    profile: {
      email: 'jane@example.com',
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        zip: '90210'
      },
      phone: '555-5678'
    },
    createdAt: new Date()
  });
  
  console.log('Test users created');
  
  // 测试嵌套字段查询 - where
  console.log('\nTesting nested JSON query with where:');
  User.find()
    .where('profile.email', 'john@example.com')
    .exec((error, users) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Users with email john@example.com:', users);
      }
    });
  
  // 测试嵌套字段查询 - 多层嵌套
  console.log('\nTesting deep nested JSON query:');
  User.find()
    .where('profile.address.city', 'Los Angeles')
    .exec()
    .then(users => {
      console.log('Users in Los Angeles:', users);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  // 测试嵌套字段查询 - ne
  console.log('\nTesting nested JSON query with ne:');
  User.find()
    .ne('profile.address.city', 'New York')
    .exec((error, users) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Users not in New York:', users);
      }
    });
  
  // 测试嵌套字段查询 - in
  console.log('\nTesting nested JSON query with in:');
  User.find()
    .in('profile.address.city', ['New York', 'Los Angeles'])
    .exec()
    .then(users => {
      console.log('Users in New York or Los Angeles:', users);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
  // 测试嵌套字段查询 - regex
  console.log('\nTesting nested JSON query with regex:');
  User.find()
    .regex('profile.email', '@example\.com$')
    .exec()
    .then(users => {
      console.log('Users with email ending with @example.com:', users);
    })
    .catch(error => {
      console.error('Error:', error);
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