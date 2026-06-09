import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, Star, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useSearchParams } from "react-router-dom";
import {
  approveReview,
  clearReviewError,
  fetchAdminReviews,
  rejectReview,
} from "../../features/review/reviewSlice";

const getDoctorName = (review) => {
  const doctor = review.doctorId;

  if (!doctor) return "Doctor";

  return `Dr. ${[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}`;
};

const getPatientName = (review) => {
  return review.patientId?.username || review.patientId?.email || "Patient";
};

const getStatusClass = (status) => {
  if (status === "approved") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-orange-200 bg-orange-50 text-orange-700";
};

function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctorId") || "";
  const { adminReviews, adminPagination, isLoading, isSaving, error } =
    useAppSelector((state) => state.reviews);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [rating, setRating] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 20,
      search,
      status,
      rating,
    doctorId: doctorIdFromUrl,
    };
  }, [search, status, rating ,doctorIdFromUrl]);

  useEffect(() => {
    dispatch(fetchAdminReviews(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReviewError());
  }, [error, dispatch]);

  const handleApprove = async (reviewId) => {
    try {
      const result = await dispatch(approveReview(reviewId)).unwrap();
      toast.success(result.message || "Review approved successfully");
    } catch (err) {
      toast.error(err || "Failed to approve review");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget?._id) return;

    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const result = await dispatch(
        rejectReview({
          reviewId: rejectTarget._id,
          rejectionReason: rejectionReason.trim(),
        })
      ).unwrap();

      toast.success(result.message || "Review rejected successfully");
      setRejectTarget(null);
      setRejectionReason("");
    } catch (err) {
      toast.error(err || "Failed to reject review");
    }
  };

  return (
    <DashboardLayout
      title="Reviews"
      description="Moderate patient reviews before they appear publicly."
    >
      <main className="mx-auto max-w-[1180px]">
        <section className="mb-6 grid gap-4 md:grid-cols-[1fr_180px_180px]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4">
            <Search size={18} className="text-[#9CA3AF]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, doctor, review..."
              className="h-full flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
            />
          </div>

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

        <section className="rounded-3xl border border-[#EEF0F6] bg-white shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
          {isLoading ? (
            <div className="p-10 text-center text-sm font-bold text-[#6B7280]">
              Loading reviews...
            </div>
          ) : adminReviews.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-extrabold text-[#111827]">
                No reviews found
              </h2>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px] text-left">
                <thead>
                  <tr className="border-b border-[#EEF0F6] text-xs uppercase tracking-[0.8px] text-[#9CA3AF]">
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Review</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {adminReviews.map((review) => (
                    <tr
                      key={review._id}
                      className="border-b border-[#EEF0F6] last:border-0"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-[#111827]">
                          {getPatientName(review)}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          {review.patientId?.email}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-[#111827]">
                          {getDoctorName(review)}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          {review.doctorId?.specialization?.displayName ||
                            review.doctorId?.specialization?.name ||
                            "Specialist"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1 text-[#F59E0B]">
                          <Star size={17} fill="currentColor" />
                          <span className="text-sm font-extrabold text-[#111827]">
                            {review.rating}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="line-clamp-2 max-w-[300px] text-sm leading-6 text-[#374151]">
                          {review.description}
                        </p>

                        {review.editedAfterApproval && (
                          <p className="mt-1 text-xs font-bold text-orange-600">
                            Edited after approval
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusClass(
                            review.status
                          )}`}
                        >
                          {review.status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isSaving || review.status === "approved"}
                            onClick={() => handleApprove(review._id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <CheckCircle2 size={18} />
                          </button>

                          <button
                            type="button"
                            disabled={isSaving || review.status === "rejected"}
                            onClick={() => setRejectTarget(review)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {adminPagination && (
          <p className="mt-4 text-sm font-bold text-[#6B7280]">
            Showing {adminReviews.length} of {adminPagination.totalReviews} reviews
          </p>
        )}

        {rejectTarget && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
              <h2 className="text-xl font-extrabold text-[#111827]">
                Reject Review
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                Add a clear reason. Patient can see why the review was rejected.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                placeholder="Example: Review contains inappropriate language..."
                className="mt-4 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold outline-none focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
              />

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectionReason("");
                  }}
                  className="h-11 rounded-2xl px-5 text-sm font-extrabold text-[#6B7280] transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <Button
                  type="button"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={handleReject}
                  fullWidth={false}
                  className="min-w-[150px]"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default AdminReviewsPage;