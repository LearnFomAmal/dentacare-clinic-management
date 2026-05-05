import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
             trim: true,
        },
        email:{
            type: String,
            required: true,
            unique: true,
           lowercase: true,
           trim: true,
        },
        password:{
            type:String,
            required: true,
            select: false, // 🔒 Security boost
     },
        role:{
            type:String,
            enum:["patient","admin"],
            default:"patient",
        },
        personalInfo:{
            dateOfBirth:Date,
            gender:{
                type:String,
                enum:["male","female","other"],
            },
            phoneNumber:String,
            bloodGroup:String,
            profileImage:{
                type:String,
            default:"",
            },
        },
            settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
    },

    referral: {
      referralCode: {
        type: String,
        unique: true,
        sparse: true, // ⚡ Essential for unique fields that might be empty
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      hasCompletedFirstAppointment: {
        type: Boolean,
        default: false,
      },
    },

    accountStatus: {
       isVerified: {
        type: Boolean,
        default: false,
      },
      isBlocked: {
        type: Boolean,
        default: false,
      },
    },

    walletSummary: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalEarned: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }

);

const User=mongoose.model('User' , userSchema);
export default User