import { useEffect, useMemo, useState } from "react";
import { Edit, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearReviewError,
  deleteMyReview,
  fetchMyReviews,
} from "../../features/review/reviewSlice";

const getStatusClass = (status) => {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
};

const getDoctorName = (review) => {
  const doctor = review.doctorId;

  if (!doctor) return "Doctor";

  return `Dr. ${[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}`;
};

const getAppointmentDate = (review) => {
  const appointment = review.appointmentId;

  if (!appointment?.appointmentDate) return "N/A";

  return new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function MyReviewsPage() {
  const dispatch = useAppDispatch();

  const { myReviews, myPagination, isLoading, isDeleting, error } =
    useAppSelector((state) => state.reviews);

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 20,
      status,
      rating,
    };
  }, [status, rating]);

  useEffect(() => {
    dispatch(fetchMyReviews(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReviewError());
  }, [error, dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      const result = await dispatch(deleteMyReview(deleteTarget._id)).unwrap();

      toast.success(result.message || "Review deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete review");
    }
  };

  return (
    <DashboardLayout
      title="My Reviews"
      description="Manage the reviews you submitted for completed appointments."
    >
      <main className="mx-auto max-w-[1120px]">
        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </section>

        {isLoading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280]">
            Loading reviews...
          </div>
        ) : myReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
            <h2 className="text-xl font-extrabold text-[#111827]">
              No reviews found
            </h2>

            <p className="mt-2 text-sm text-[#6B7280]">
              You can review doctors after completing appointments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <article
                key={review._id}
                className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#111827]">
                      {getDoctorName(review)}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-[#6B7280]">
                      Appointment: {getAppointmentDate(review)}
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-[#F59E0B]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={17}
                          fill={
                            index < Number(review.rating)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusClass(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-[#374151]">
                  {review.description}
                </p>

                {review.status === "rejected" && review.rejectionReason && (
                  <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    Rejection reason: {review.rejectionReason}
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F0F1FF] px-4 text-xs font-extrabold text-[#9381FF]"
                  >
                    <Edit size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(review)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-extrabold text-red-600"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {myPagination && (
          <p className="mt-4 text-sm font-bold text-[#6B7280]">
            Showing {myReviews.length} of {myPagination.totalReviews} reviews
          </p>
        )}

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete Review"
          description="Are you sure you want to delete this review?"
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </main>
    </DashboardLayout>
  );
}

export default MyReviewsPage;