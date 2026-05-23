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