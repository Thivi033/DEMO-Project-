/**
 * Test Users Database
 * For demo/testing purposes only - DO NOT use in production
 *
 * All test passwords follow the pattern: firstname123!
 * Example: kavinda123!, obhasha123!, etc.
 */

const testUsers = [
  {
    id: 'usr_001',
    name: 'Kavinda Senarathne',
    email: 'kavindasenarathne94@gmail.com',
    password: 'kavinda123!',
    role: 'SUPER_ADMIN',
    alias: 'FE',
    title: 'Founding Engineer',
    active: true
  },
  {
    id: 'usr_002',
    name: 'Yasiru Swaris',
    email: 'yasiruswaris@gmail.com',
    password: 'yasiru123!',
    role: 'MANAGER',
    alias: 'PM',
    title: 'Product Manager',
    active: true
  },
  {
    id: 'usr_003',
    name: 'Obhasha',
    email: 'Obhasha@live.com',
    password: 'obhasha123!',
    role: 'ADMIN',
    alias: 'TL',
    title: 'Tech Lead',
    active: true
  },
  {
    id: 'usr_004',
    name: 'Chamindu JS',
    email: 'chamindujs@gmail.com',
    password: 'chamindu123!',
    role: 'MEMBER',
    alias: 'INT1',
    title: 'Intern',
    active: true
  },
  {
    id: 'usr_005',
    name: 'Kavish Can',
    email: 'kavishcan2002@gmail.com',
    password: 'kavish123!',
    role: 'EDITOR',
    alias: 'SE',
    title: 'Software Engineer',
    active: true
  },
  {
    id: 'usr_006',
    name: 'Kirulu',
    email: 'Kirulu11@gmail.com',
    password: 'kirulu123!',
    role: 'MEMBER',
    alias: 'INT2',
    title: 'Intern',
    active: true
  },
  {
    id: 'usr_007',
    name: 'Pasindu E',
    email: 'pasindue@outlook.com',
    password: 'pasindu123!',
    role: 'CONTRIBUTOR',
    alias: 'ASE1',
    title: 'Associate Software Engineer',
    active: true
  },
  {
    id: 'usr_008',
    name: 'Yasith Hennayake',
    email: 'yasith.hennayake@gmail.com',
    password: 'yasith123!',
    role: 'MEMBER',
    alias: 'INT3',
    title: 'Intern',
    active: true
  },
  {
    id: 'usr_009',
    name: 'Shakya Dhamindu',
    email: 'Shakyadhamindu@gmail.com',
    password: 'shakya123!',
    role: 'CONTRIBUTOR',
    alias: 'ASE2',
    title: 'Associate Software Engineer',
    active: true
  },
  {
    id: 'usr_010',
    name: 'Dihas Liyanage',
    email: 'dihasliyanage42@gmail.com',
    password: 'dihas123!',
    role: 'CONTRIBUTOR',
    alias: 'ASE3',
    title: 'Associate Software Engineer',
    active: true
  },
  {
    id: 'usr_011',
    name: 'Nimna Perera',
    email: 'nimnaperera98@gmail.com',
    password: 'nimna123!',
    role: 'MODERATOR',
    alias: 'SSE',
    title: 'Senior Software Engineer',
    active: true
  },
  {
    id: 'usr_012',
    name: 'Senarathna Koliya',
    email: 'senarathnakoliya@gmail.com',
    password: 'senarathna123!',
    role: 'CONTRIBUTOR',
    alias: 'ASE4',
    title: 'Associate Software Engineer',
    active: true
  },
  {
    id: 'usr_013',
    name: 'Thevinu Senaratne',
    email: 'thevinusenaratne@gmail.com',
    password: 'thevinu123!',
    role: 'CONTRIBUTOR',
    alias: 'TA',
    title: 'Technology Associate',
    active: true
  }
];

/**
 * Find user by email
 */
function findUserByEmail(email) {
  return testUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find user by ID
 */
function findUserById(id) {
  return testUsers.find(u => u.id === id);
}

/**
 * Authenticate user (for testing only - passwords are plain text)
 */
function authenticateTestUser(email, password) {
  const user = findUserByEmail(email);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.active) {
    return { success: false, message: 'Account is inactive' };
  }

  if (user.password !== password) {
    return { success: false, message: 'Invalid password' };
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return {
    success: true,
    message: 'Authentication successful',
    user: userWithoutPassword
  };
}

/**
 * Get all users (without passwords)
 */
function getAllUsers() {
  return testUsers.map(({ password, ...user }) => user);
}

module.exports = {
  testUsers,
  findUserByEmail,
  findUserById,
  authenticateTestUser,
  getAllUsers
};
