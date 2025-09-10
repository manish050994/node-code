const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const User = require('../models/User');
const College = require('../models/College');


exports.registerSuperAdmin = async (req, res) => {
const { name, email, password ,role} = req.body;
const hashed = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, password: hashed, role: role });
res.json({ id: user._id, email: user.email });
};


exports.login = async (req, res) => {
const { email, password, collegeCode } = req.body;
const user = await User.findOne({ email }).populate('collegeId');
if (!user) return res.status(404).json({ message: 'User not found' });
const match = await bcrypt.compare(password, user.password);
if (!match) return res.status(401).json({ message: 'Invalid credentials' });
if (user.role === 'collegeadmin' && user.collegeId && user.collegeId.code !== collegeCode) {
return res.status(403).json({ message: 'Invalid college code' });
}
const token = jwt.sign({ id: user._id, role: user.role, collegeId: user.collegeId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
};