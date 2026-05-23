import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import doctorSlotReducer from "../features/doctor/doctorSlotSlice";
import publicDoctorReducer from "../features/doctor/publicDoctorSlice";
import reportReducer from "../features/reports/reportSlice";
import appointmentReducer from "../features/appointment/appointmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctorSlots: doctorSlotReducer,
    publicDoctors: publicDoctorReducer,
    reports: reportReducer,
    appointments: appointmentReducer,
  },
});