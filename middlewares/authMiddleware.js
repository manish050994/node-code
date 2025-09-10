const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized' });
const token = authHeader.split(' ')[1];
try {
const decoded = jwt.verify(token, config.jwtSecret);
req.user = await User.findById(decoded.id).select('-password');
next();
} catch (err) {
return res.status(401).json({ message: 'Token invalid' });
}
};


exports.authorize = (...allowedRoles) => (req, res, next) => {
if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
next();
};


exports.superAdminOnly = (req, res, next) => {
if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
next();
};