import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import doctorSlotReducer from "../features/doctor/doctorSlotSlice";
import publicDoctorReducer from "../features/doctor/publicDoctorSlice";
import reportReducer from "../features/reports/reportSlice";
import appointmentReducer from "../features/appointment/appointmentSlice";
import couponReducer from "../features/coupon/couponSlice";
import referralReducer from "../features/referral/referralSlice";
import walletReducer from "../features/wallet/walletSlice";
import bannerReducer from "../features/banner/bannerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctorSlots: doctorSlotReducer,
    publicDoctors: publicDoctorReducer,
    reports: reportReducer,
    appointments: appointmentReducer,
    coupons: couponReducer,
    referrals: referralReducer,
    wallet: walletReducer,
    banners: bannerReducer,
  },
});