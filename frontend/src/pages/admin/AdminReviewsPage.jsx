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

const REVIEW_PAGE_LIMIT = 10;

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

const getPageNumbers = ({ currentPage, totalPages }) => {
  const pages = [];

  const safeTotalPages = Math.max(Number(totalPages || 1), 1);
  const safeCurrentPage = Math.min(
    Math.max(Number(currentPage || 1), 1),
    safeTotalPages
  );

  const start = Math.max(safeCurrentPage - 2, 1);
  const end = Math.min(safeCurrentPage + 2, safeTotalPages);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
};

function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const doctorIdFromUrl = searchParams.get("doctorId") || "";

  const { adminReviews, adminPagination, isLoading, isSaving, error } =
    useAppSelector((state) => state.reviews);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(1);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: REVIEW_PAGE_LIMIT,
    };

    if (appliedSearch.trim()) {
      params.search = appliedSearch.trim();
    }

    if (status) {
      params.status = status;
    }

    if (rating) {
      params.rating = rating;
    }

    if (doctorIdFromUrl) {
      params.doctorId = doctorIdFromUrl;
    }

    return params;
  }, [page, appliedSearch, status, rating, doctorIdFromUrl]);

  useEffect(() => {
    dispatch(fetchAdminReviews(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReviewError());
  }, [error, dispatch]);

  useEffect(() => {
    setPage(1);
  }, [doctorIdFromUrl]);

  const currentPage = Number(adminPagination?.page || page || 1);
  const totalPages = Math.max(Number(adminPagination?.totalPages || 1), 1);
  const totalReviews = Number(adminPagination?.totalReviews || 0);

  const pageNumbers = getPageNumbers({
    currentPage,
    totalPages,
  });

  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < totalPages && !isLoading;

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleRatingChange = (event) => {
    setRating(event.target.value);
    setPage(1);
  };

  const handleApprove = async (reviewId) => {
    try {
      const result = await dispatch(approveReview(reviewId)).unwrap();

      toast.success(result.message || "Review approved successfully");

      dispatch(fetchAdminReviews(queryParams));
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

      dispatch(fetchAdminReviews(queryParams));
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
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 grid gap-4 md:grid-cols-[1fr_180px_180px_130px]"
        >
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4">
            <Search size={18} className="text-[#9CA3AF]" />

            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search patient, doctor, review..."
              className="h-full flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none"
            />
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={rating}
            onChange={handleRatingChange}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-[#9381FF] px-5 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
          >
            Search
          </button>
        </form>

        {doctorIdFromUrl && (
          <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#6B7280]">
            Showing reviews filtered by selected doctor.
          </div>
        )}

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

              <p className="mt-2 text-sm font-semibold text-[#6B7280]">
                Try changing the search, status, rating, or doctor filter.
              </p>
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
                          {review.patientId?.email || "N/A"}
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
                            title="Approve review"
                          >
                            <CheckCircle2 size={18} />
                          </button>

                          <button
                            type="button"
                            disabled={isSaving || review.status === "rejected"}
                            onClick={() => setRejectTarget(review)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Reject review"
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

        {adminPagination && totalReviews > 0 && (
          <section className="mt-5 flex flex-col gap-4 rounded-3xl border border-[#EEF0F6] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-[#6B7280]">
              Showing {adminReviews.length} of {totalReviews} reviews · Page{" "}
              {currentPage} of {totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="h-10 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 min-w-10 rounded-2xl px-4 text-sm font-extrabold transition ${
                    currentPage === pageNumber
                      ? "bg-[#9381FF] text-white shadow-[0_10px_22px_rgba(147,129,255,0.25)]"
                      : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#9381FF] hover:text-[#9381FF]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="h-10 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
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