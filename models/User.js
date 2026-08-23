import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "HOD", "Supervisor", "Team Leader", "Team Member", "HOD, Supervisor"],
      required: true,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    studentRegNo: { type: String }, // For students
    designation: { type: String }, // For teachers
    profilePicture: { type: String },
    phone: { type: String, default: "" },
    interests: [{ type: String }],
    isFirstLogin: { type: Boolean, default: true },
    firstLoginAt: { type: Date },
    tempPasswordExpires: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
