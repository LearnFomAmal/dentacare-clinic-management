import DoctorEarning from "../../models/DoctorEarning.js";

export const getDoctorEarningSummary = async ({
  doctorId,
  todayStart,
  todayEnd,
  monthStart,
  monthEnd,
}) => {
  const pipeline = [
    {
      $match: {
        doctorId,
        earningStatus: "earned",
      },
    },
    {
      $group: {
        _id: null,

        totalEarned: {
          $sum: "$earnedAmount",
        },

        todayEarned: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$earnedAt", todayStart] },
                  { $lt: ["$earnedAt", todayEnd] },
                ],
              },
              "$earnedAmount",
              0,
            ],
          },
        },

        monthlyEarned: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$earnedAt", monthStart] },
                  { $lt: ["$earnedAt", monthEnd] },
                ],
              },
              "$earnedAmount",
              0,
            ],
          },
        },

        totalTransactions: {
          $sum: 1,
        },
      },
    },
  ];

  const result = await DoctorEarning.aggregate(pipeline);

  return (
    result[0] || {
      totalEarned: 0,
      todayEarned: 0,
      monthlyEarned: 0,
      totalTransactions: 0,
    }
  );
};

export const getDoctorEarningTransactions = ({
  doctorId,
  skip,
  limit,
}) => {
  return DoctorEarning.find({
    doctorId,
  })
    .populate({
      path: "patientId",
      select: "username email personalInfo",
    })
    .populate({
      path: "appointmentId",
      select: "appointmentDate startTime endTime status paymentStatus completedAt",
    })
    .sort({
      earnedAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countDoctorEarningTransactions = ({ doctorId }) => {
  return DoctorEarning.countDocuments({
    doctorId,
  });
};