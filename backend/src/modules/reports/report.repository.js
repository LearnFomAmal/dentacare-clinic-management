import Appointment from "../../models/Appointment.js";
import Report from "../../models/Report.js";

export const createReport = (payload) => {
  return Report.create(payload);
};

export const findDraftReportByIdAndPatient = (reportId, patientId) => {
  return Report.findOne({
    _id: reportId,
    patientId,
    status: "draft",
  });
};

export const findDraftReportsByPatient = (patientId) => {
  return Report.find({
    patientId,
    status: "draft",
  }).sort({
    createdAt: -1,
  });
};

export const updateReportById = (reportId, payload) => {
  return Report.findByIdAndUpdate(reportId, payload, {
    new: true,
    runValidators: true,
  });
};

export const findCompletedAppointmentForDoctor = ({
  appointmentId,
  doctorId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
    status: "completed",
    paymentStatus: "paid",
  });
};

export const addReportSummaryToAppointment = ({
  appointmentId,
  report,
}) => {
  return Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $push: {
        reports: {
          reportId: report._id,
          title: report.title,
          reportType: report.reportType,
          fileUrl: report.file?.url || "",
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const findPatientAppointmentForReports = ({
  appointmentId,
  patientId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    patientId,
  }).select("_id patientId doctorId status paymentStatus");
};

export const findDoctorAppointmentForReports = ({
  appointmentId,
  doctorId,
}) => {
  return Appointment.findOne({
    _id: appointmentId,
    doctorId,
  }).select("_id patientId doctorId status paymentStatus");
};

export const findAppointmentReportsForPatient = ({
  appointmentId,
  patientId,
}) => {
  return Report.find({
    appointmentId,
    patientId,
    status: "attached",
    isVisibleToPatient: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
};

export const findAppointmentReportsForDoctor = ({
  appointmentId,
  doctorId,
}) => {
  return Report.find({
    appointmentId,
    doctorId,
    status: "attached",
    isVisibleToDoctor: true,
  })
    .sort({
      createdAt: -1,
    })
    .lean();
};