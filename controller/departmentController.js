import Department from "../models/Department.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}).populate("hod", "name email").lean();
    
    // For each department, calculate real-time number of projects and supervisors
    const enrichedDepartments = await Promise.all(departments.map(async (dept) => {
      const projectCount = await Project.countDocuments({ department: dept._id });
      const supervisorCount = await User.countDocuments({ department: dept._id, role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } });
      return {
        ...dept,
        projects: projectCount,
        supervisors: supervisorCount
      };
    }));
    
    res.json(enrichedDepartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const departmentDoc = await Department.findById(req.params.id).populate("hod", "name email");
    if (departmentDoc) {
      const department = departmentDoc.toJSON();
      const projectCount = await Project.countDocuments({ department: department._id });
      const supervisorCount = await User.countDocuments({ department: department._id, role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } });
      res.json({
        ...department,
        projects: projectCount,
        supervisors: supervisorCount
      });
    } else {
      res.status(404).json({ message: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const deptData = { ...req.body };
    if (!deptData.hod || deptData.hod === "") {
      delete deptData.hod;
    }
    
    // Check if a department with the same name already exists
    if (deptData.name) {
      const existingName = await Department.findOne({
        name: { $regex: new RegExp("^" + deptData.name.trim() + "$", "i") }
      });
      if (existingName) {
        return res.status(400).json({ message: `A department named "${deptData.name}" already exists. Please choose a unique name.` });
      }
    }
    
    let department = await Department.create(deptData);

    // If an HOD is assigned, update their department and role automatically
    if (department.hod) {
      const newHod = await User.findById(department.hod);
      if (newHod) {
        newHod.department = department._id;
        newHod.role = "HOD"; // Force HOD role on assignment
        await newHod.save();
      }
    }

    department = await Department.findById(department._id).populate("hod", "name email");
    const departmentJson = department.toJSON();
    departmentJson.projects = 0;
    departmentJson.supervisors = 0;

    res.status(201).json(departmentJson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (department) {
      const oldHodId = department.hod;
      const deptData = { ...req.body };
      if (deptData.hod === "") {
        deptData.hod = null;
      }

      // Check if another department with the target name already exists
      if (deptData.name && deptData.name !== department.name) {
        const existingName = await Department.findOne({
          name: { $regex: new RegExp("^" + deptData.name.trim() + "$", "i") },
          _id: { $ne: req.params.id }
        });
        if (existingName) {
          return res.status(400).json({ message: `A department named "${deptData.name}" already exists. Please choose a unique name.` });
        }
      }

      Object.assign(department, deptData);
      const updatedDepartmentDoc = await department.save();
      const updatedDepartment = await Department.findById(updatedDepartmentDoc._id).populate("hod", "name email");

      // If HOD changed or was assigned
      if (deptData.hod && String(deptData.hod) !== String(oldHodId)) {
        // Clear department from old HOD if there was one
        if (oldHodId) {
          const oldHod = await User.findById(oldHodId);
          if (oldHod) {
            oldHod.department = undefined;
            await oldHod.save();
          }
        }
        
        // Update new HOD
        const newHod = await User.findById(deptData.hod);
        if (newHod) {
          newHod.department = department._id;
          newHod.role = "HOD"; // Force HOD role on assignment
          await newHod.save();
        }
      } else if (deptData.hod === null || deptData.hod === "") {
        // HOD was cleared
        if (oldHodId) {
          const oldHod = await User.findById(oldHodId);
          if (oldHod) {
            oldHod.department = undefined;
            await oldHod.save();
          }
        }
      }

       const projCount = await Project.countDocuments({ department: updatedDepartment._id });
       const supCount = await User.countDocuments({ department: updatedDepartment._id, role: { $in: ["Supervisor", "HOD", "HOD, Supervisor"] } });
 
       res.json({
         ...updatedDepartment.toJSON(),
         projects: projCount,
         supervisors: supCount
       });
    } else {
      res.status(404).json({ message: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (department) {
      const deptId = department._id;
      // Soft unassign users belonging to the deleted department
      await User.updateMany({ department: deptId }, { $unset: { department: 1 } });
      // Soft unassign projects belonging to the deleted department
      await Project.updateMany({ department: deptId }, { $unset: { department: 1 } });
      
      await department.deleteOne();
      res.json({ message: "Department removed" });
    } else {
      res.status(404).json({ message: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleDepartmentStatus = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (department) {
      department.isActive = !department.isActive;
      await department.save();
      res.json({ message: `Department ${department.isActive ? 'activated' : 'deactivated'}`, isActive: department.isActive });
    } else {
      res.status(404).json({ message: "Department not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
