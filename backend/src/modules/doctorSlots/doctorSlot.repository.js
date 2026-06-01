import DoctorSlot from "../../models/DoctorSlot.js"

export const createDoctorSlotDay=(payload)=>{
    return DoctorSlot.create(payload)
}

export const findSlotDayByDoctorAndDate=(doctorId,date)=>{
    return DoctorSlot.findOne({
        doctorId,
        date
    })
}

export const findSlotDaysByDoctorAndDateRange=(doctorId,dates)=>{
    return DoctorSlot.find({
        doctorId,
        date:{
            $in:dates,
        },
    }).sort({
        date:1,
    })
}

export const findSlotDayByIdAndDoctor=(slotDayId,doctorId)=>{
    return DoctorSlot.findOne({
        _id:slotDayId,
        doctorId,
    })
}

export const saveSlotDay =(slotDay)=>{
    return slotDay.save();
}