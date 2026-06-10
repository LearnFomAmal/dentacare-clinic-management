import Appointment from "../../models/Appointment.js";
import Chat from "../../models/Chat.js";
import ChatMessage from "../../models/ChatMessage.js";

const chatPopulate = [
  {
    path: "patientId",
    select: "username email personalInfo.profileImage",
  },
  {
    path: "doctorId",
    select: "firstName lastName email specialization professionalInfo.profileImage",
  },
  {
    path: "appointmentId",
    select: "appointmentDate startTime endTime status paymentStatus",
  },
];

export const findAppointmentForChat = ({ appointmentId }) => {
  return Appointment.findById(appointmentId)
    .select(
      "_id patientId doctorId appointmentDate startTime endTime status paymentStatus"
    )
    .populate([
      {
        path: "patientId",
        select: "username email personalInfo.profileImage accountStatus",
      },
      {
        path: "doctorId",
        select:
          "firstName lastName email specialization professionalInfo accountStatus",
      },
    ]);
};

export const findChatByAppointmentId = ({ appointmentId }) => {
  return Chat.findOne({
    appointmentId,
    isActive: true,
  });
};

export const findChatById = ({ chatId }) => {
  return Chat.findOne({
    _id: chatId,
    isActive: true,
  });
};

export const createChat = async ({ payload }) => {
  const chats = await Chat.create([payload]);
  return chats[0];
};

export const saveChat = (chat) => {
  return chat.save();
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

export const findChatsForPatient = ({ patientId, skip, limit }) => {
  return Chat.find({
    patientId,
    isActive: true,
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

export const countChatsForPatient = ({ patientId }) => {
  return Chat.countDocuments({
    patientId,
    isActive: true,
  });
};

export const findChatsForDoctor = ({ doctorId, skip, limit }) => {
  return Chat.find({
    doctorId,
    isActive: true,
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

export const countChatsForDoctor = ({ doctorId }) => {
  return Chat.countDocuments({
    doctorId,
    isActive: true,
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