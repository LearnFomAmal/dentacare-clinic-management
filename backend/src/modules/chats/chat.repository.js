import Appointment from "../../models/Appointment.js";
import Chat from "../../models/Chat.js";
import ChatMessage from "../../models/ChatMessage.js";

const READABLE_CHAT_STATUSES = ["approved", "completed", "cancelled"];
const READABLE_PAYMENT_STATUSES = ["paid", "refunded"];

export const chatPopulate = [
  {
    path: "patientId",
    select: "username email personalInfo profileImage accountStatus",
  },
  {
    path: "doctorId",
    select:
      "firstName lastName email specialization professionalInfo stats accountStatus verification",
  },
  {
    path: "appointmentId",
    select:
      "appointmentDate startTime endTime status paymentStatus pricing approval cancellation completedAt",
  },
];

const getReadableAppointmentIdsForPatient = async (patientId) => {
  const appointments = await Appointment.find({
    patientId,
    status: {
      $in: READABLE_CHAT_STATUSES,
    },
    paymentStatus: {
      $in: READABLE_PAYMENT_STATUSES,
    },
  })
    .select("_id")
    .lean();

  return appointments.map((appointment) => appointment._id);
};

const getReadableAppointmentIdsForDoctor = async (doctorId) => {
  const appointments = await Appointment.find({
    doctorId,
    status: {
      $in: READABLE_CHAT_STATUSES,
    },
    paymentStatus: {
      $in: READABLE_PAYMENT_STATUSES,
    },
  })
    .select("_id")
    .lean();

  return appointments.map((appointment) => appointment._id);
};

export const findAppointmentForChat = ({ appointmentId }) => {
  return Appointment.findById(appointmentId)
    .select(
      "_id patientId doctorId appointmentDate startTime endTime status paymentStatus pricing approval cancellation completedAt"
    )
    .populate([
      {
        path: "patientId",
        select: "username email personalInfo profileImage accountStatus",
      },
      {
        path: "doctorId",
        select:
          "firstName lastName email specialization professionalInfo stats accountStatus verification",
      },
    ]);
};

export const findChatByAppointmentId = ({ appointmentId }) => {
  return Chat.findOne({
    appointmentId,
    isActive: true,
  });
};

export const findPopulatedChatByAppointmentId = ({ appointmentId }) => {
  return Chat.findOne({
    appointmentId,
    isActive: true,
  }).populate(chatPopulate);
};

export const findChatById = ({ chatId }) => {
  return Chat.findOne({
    _id: chatId,
    isActive: true,
  });
};

export const findPopulatedChatById = ({ chatId }) => {
  return Chat.findOne({
    _id: chatId,
    isActive: true,
  }).populate(chatPopulate);
};

export const createChat = async ({ payload }) => {
  const chats = await Chat.create([payload]);
  return chats[0];
};

export const saveChat = (chat) => {
  return chat.save();
};

export const populateChat = (chat) => {
  return chat.populate(chatPopulate);
};

export const createChatMessage = async ({ payload }) => {
  const messages = await ChatMessage.create([payload]);
  return messages[0];
};

export const findMessagesByChatId = ({ chatId, skip, limit }) => {
  return ChatMessage.find({
    chatId,
  })
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countMessagesByChatId = ({ chatId }) => {
  return ChatMessage.countDocuments({
    chatId,
  });
};

export const findChatsForPatient = async ({ patientId, skip, limit }) => {
  const appointmentIds = await getReadableAppointmentIdsForPatient(patientId);

  if (appointmentIds.length === 0) {
    return [];
  }

  return Chat.find({
    patientId,
    isActive: true,
    appointmentId: {
      $in: appointmentIds,
    },
  })
    .populate(chatPopulate)
    .sort({
      lastMessageAt: -1,
      updatedAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countChatsForPatient = async ({ patientId }) => {
  const appointmentIds = await getReadableAppointmentIdsForPatient(patientId);

  if (appointmentIds.length === 0) {
    return 0;
  }

  return Chat.countDocuments({
    patientId,
    isActive: true,
    appointmentId: {
      $in: appointmentIds,
    },
  });
};

export const findChatsForDoctor = async ({ doctorId, skip, limit }) => {
  const appointmentIds = await getReadableAppointmentIdsForDoctor(doctorId);

  if (appointmentIds.length === 0) {
    return [];
  }

  return Chat.find({
    doctorId,
    isActive: true,
    appointmentId: {
      $in: appointmentIds,
    },
  })
    .populate(chatPopulate)
    .sort({
      lastMessageAt: -1,
      updatedAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countChatsForDoctor = async ({ doctorId }) => {
  const appointmentIds = await getReadableAppointmentIdsForDoctor(doctorId);

  if (appointmentIds.length === 0) {
    return 0;
  }

  return Chat.countDocuments({
    doctorId,
    isActive: true,
    appointmentId: {
      $in: appointmentIds,
    },
  });
};

export const markMessagesAsReadForReceiver = ({
  chatId,
  receiverId,
  receiverRole,
}) => {
  return ChatMessage.updateMany(
    {
      chatId,
      receiverId,
      receiverRole,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};