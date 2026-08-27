import Template from "../models/Template.js";

export const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({})
      .populate("uploader", "name role")
      .populate("department", "name")
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate("uploader", "name role")
      .populate("department", "name");
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ message: "Template not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
    const template = await Template.create({
      ...req.body,
      fileUrl: fileUrl || req.body.fileUrl,
      uploader: req.user._id
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (template) {
      const updateData = { ...req.body };
      if (req.file) {
        updateData.fileUrl = `/uploads/${req.file.filename}`;
      }
      Object.assign(template, updateData);
      const updatedTemplate = await template.save();
      res.json(updatedTemplate);
    } else {
      res.status(404).json({ message: "Template not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (template) {
      await template.deleteOne();
      res.json({ message: "Template removed" });
    } else {
      res.status(404).json({ message: "Template not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
