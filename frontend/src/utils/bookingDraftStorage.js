const BOOKING_DRAFT_KEY = "dentacare_booking_draft";

export const saveBookingDraft = (draft) => {
  if (!draft?.doctorId) return;

  sessionStorage.setItem(
    BOOKING_DRAFT_KEY,
    JSON.stringify(draft)
  );
};

export const getBookingDraft = (doctorId = null) => {
  try {
    const data = sessionStorage.getItem(BOOKING_DRAFT_KEY);

    if (!data) return null;

    const draft = JSON.parse(data);

    if (doctorId && draft?.doctorId !== doctorId) {
      return null;
    }

    return draft;
  } catch {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    return null;
  }
};

export const clearBookingDraft = () => {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
};