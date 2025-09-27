const bcrypt = require('bcryptjs');

const testPassword = async () => {
  const password = 'password123';
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.FSC9Vm';
  
  console.log('Testing password:', password);
  console.log('Against hash:', storedHash);
  
  try {
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password match:', isMatch);
    
    // Also test generating a new hash
    const newHash = await bcrypt.hash(password, 12);
    console.log('New hash generated:', newHash);
    
    const newHashMatch = await bcrypt.compare(password, newHash);
    console.log('New hash match:', newHashMatch);
    
  } catch (error) {
    console.error('Bcrypt error:', error);
  }
};

testPassword();