import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import doctorSlotReducer from "../features/doctor/doctorSlotSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctorSlots: doctorSlotReducer,
  },
});