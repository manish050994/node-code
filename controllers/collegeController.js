const College = require('../models/College');
const Log = require('../models/Logs');


exports.addCollege = async (req, res) => {
const { name, code, address } = req.body;
const college = await College.create({ name, code, address });
await Log.create({ actor: req.user?.email || 'system', action: 'Added college', target: college.name, collegeId: college._id });
res.json(college);
};


exports.updateCollege = async (req, res) => {
const { id } = req.params;
const updates = req.body;
const college = await College.findByIdAndUpdate(id, updates, { new: true });
res.json(college);
};


exports.toggleCollege = async (req, res) => {
const { id } = req.params;
const college = await College.findById(id);
college.status = !college.status;
await college.save();
await Log.create({ actor: req.user?.email || 'system', action: college.status ? 'Enabled college' : 'Disabled college', target: college.name, collegeId: college._id });
res.json(college);
};


exports.listColleges = async (req, res) => {
const list = await College.find();
res.json(list);
};


exports.deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    // कॉलेज find करो
    const college = await College.findByIdAndDelete(id);

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Log entry create करो
    await Log.create({
      actor: req.user?.email || "system",
      action: "Deleted college",
      target: college.name,
      collegeId: college._id,
    });

    res.json({ message: "College deleted successfully", college });
  } catch (error) {
    console.error("Error deleting college:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
