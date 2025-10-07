const { Op } = require('sequelize');
const db = require('../models');

function pad(number, length) {
  return number.toString().padStart(length, '0');
}

async function generateAndSetLoginId(user, transaction) {
  const createdAt = user.createdAt || new Date();
  const MM = pad(createdAt.getMonth() + 1, 2);
  const YY = pad(createdAt.getFullYear() % 100, 2);
  const MMYY = MM + YY;
  let base;

  switch (user.role) {
    case 'superadmin':
      base = 'SA' + pad(user.id, 4);
      break;
    case 'collegeadmin':
      const college = await db.College.findByPk(user.collegeId, { transaction });
      if (!college) {
        console.warn(`College not found for user ID ${user.id}, collegeId: ${user.collegeId}`);
        throw new Error('College not found');
      }
      base =  'CA' + college.code + pad(user.collegeId, 4);
      break;
    case 'teacher':
      const teacher = await db.Teacher.findByPk(user.teacherId, { transaction });
      if (!teacher) {
        console.warn(`Teacher not found for user ID ${user.id}, teacherId: ${user.teacherId}`);
        throw new Error(`Teacher not found for teacherId: ${user.teacherId}`);
      }
      base = "TA"+ user.teacherId +teacher.employeeId;
      console.log(`Teacher found: ${teacher.id}, employeeId: ${teacher.employeeId}`); // Debug log
      break;
    case 'student':
      if (!user.studentId) {
        console.warn(`Student ID not set for user ID ${user.id}`);
        throw new Error('Student ID not set');
      }
      const student = await db.Student.findByPk(user.studentId, { transaction });
      if (!student) {
        console.warn(`Student not found for user ID ${user.id}, studentId: ${user.studentId}`);
        throw new Error(`Student not found for studentId: ${user.studentId}`);
      }
      base = 'ST' + pad(user.studentId, 4) + student.rollNo;
      console.log(`Student found: ${student.id}, rollNo: ${student.rollNo}`); // Debug log
      break;
    case 'parent':
      const parent = await db.Parent.findByPk(user.parentId, { transaction });
      if (!parent) {
        console.warn(`Parent not found for user ID ${user.id}, parentId: ${user.parentId}`);
        throw new Error('Parent not found');
      }
      base = 'PA' + pad(parent.id, 4);
      break;
    default:
      throw new Error('Invalid role');
  }

  let loginId = base + MMYY;
  let counter = 0;
  let uniqueLoginId = loginId;
  while (await db.User.findOne({ where: { loginId: uniqueLoginId }, transaction })) {
    counter++;
    uniqueLoginId = loginId + pad(counter, 2);
  }

  console.log(`Updating user ID ${user.id} with loginId: ${uniqueLoginId}`); // Debug log
  await user.update({ loginId: uniqueLoginId }, { transaction });
  return uniqueLoginId;
}

module.exports = { generateAndSetLoginId };