import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  RefreshCcw,
  Star,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ReviewFormModal from "../../components/reviews/ReviewFormModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearReviewError,
  deleteMyReview,
  fetchMyReviews,
  updateMyReview,
} from "../../features/review/reviewSlice";

const REVIEW_PAGE_LIMIT = 5;

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

  const fullName = [doctor.firstName, doctor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName ? `Dr. ${fullName}` : "Doctor";
};

const getAppointmentDate = (review) => {
  const appointment = review.appointmentId;

  if (!appointment?.appointmentDate) return "N/A";

  return new Date(`${appointment.appointmentDate}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

function MyReviewsPage() {
  const dispatch = useAppDispatch();

  const {
    myReviews,
    myPagination,
    isLoading,
    isSaving,
    isDeleting,
    error,
  } = useAppSelector((state) => state.reviews);

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const queryParams = useMemo(() => {
    return {
      page,
      limit: REVIEW_PAGE_LIMIT,
      status: status || undefined,
      rating: rating || undefined,
    };
  }, [page, status, rating]);

  useEffect(() => {
    dispatch(fetchMyReviews(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReviewError());
  }, [error, dispatch]);

  const pagination = myPagination || {
    page,
    limit: REVIEW_PAGE_LIMIT,
    totalReviews: myReviews.length,
    totalPages: 1,
  };

  const currentPage = Number(pagination.page || page);
  const totalPages = Math.max(Number(pagination.totalPages || 1), 1);
  const totalReviews = Number(pagination.totalReviews || 0);
  const limit = Number(pagination.limit || REVIEW_PAGE_LIMIT);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const showingText = useMemo(() => {
    if (totalReviews === 0) {
      return "Showing 0 reviews";
    }

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalReviews);

    return `Showing ${start} - ${end} of ${totalReviews} reviews`;
  }, [currentPage, limit, totalReviews]);

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleRatingChange = (value) => {
    setRating(value);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(fetchMyReviews(queryParams));
  };

  const handlePreviousPage = () => {
    if (!canGoPrevious || isLoading) return;

    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (!canGoNext || isLoading) return;

    setPage((prev) => prev + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      const result = await dispatch(deleteMyReview(deleteTarget._id)).unwrap();

      toast.success(result.message || "Review deleted successfully");
      setDeleteTarget(null);

      const nextPage =
        myReviews.length === 1 && page > 1 ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        dispatch(
          fetchMyReviews({
            ...queryParams,
            page: nextPage,
          })
        );
      }
    } catch (err) {
      toast.error(err || "Failed to delete review");
    }
  };

  const handleUpdateReview = async ({ rating, description }) => {
    if (!editTarget?._id) return;

    if (!description.trim()) {
      toast.error("Review description is required");
      return;
    }

    try {
      const result = await dispatch(
        updateMyReview({
          reviewId: editTarget._id,
          payload: {
            rating,
            description: description.trim(),
          },
        })
      ).unwrap();

      toast.success(result.message || "Review updated successfully");
      setEditTarget(null);

      dispatch(fetchMyReviews(queryParams));
    } catch (err) {
      toast.error(err || "Failed to update review");
    }
  };

  return (
    <DashboardLayout
      title="My Reviews"
      description="Manage the reviews you submitted for completed appointments."
    >
      <main className="mx-auto max-w-[1120px]">
        <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={rating}
              onChange={(event) => handleRatingChange(event.target.value)}
              className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F8F7FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#F0F1FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </section>

        {isLoading ? (
          <div className="rounded-3xl bg-white p-10 text-center text-sm font-bold text-[#6B7280] dark:bg-slate-900 dark:text-slate-400">
            Loading reviews...
          </div>
        ) : myReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
              No reviews found
            </h2>

            <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
              You can review doctors after completing appointments.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {myReviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  onEdit={() => setEditTarget(review)}
                  onDelete={() => setDeleteTarget(review)}
                />
              ))}
            </div>

            <PaginationControls
              showingText={showingText}
              page={currentPage}
              totalPages={totalPages}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              isLoading={isLoading}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          </>
        )}

        <ReviewFormModal
          open={Boolean(editTarget)}
          loading={isSaving}
          mode="edit"
          initialReview={editTarget}
          appointment={editTarget?.appointmentId || null}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdateReview}
        />

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

function ReviewCard({ review, onEdit, onDelete }) {
  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
            {getDoctorName(review)}
          </h2>

          <p className="mt-1 text-sm font-semibold text-[#6B7280] dark:text-slate-400">
            Appointment: {getAppointmentDate(review)}
          </p>

          <div className="mt-3 flex items-center gap-1 text-[#F59E0B]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={17}
                fill={index < Number(review.rating) ? "currentColor" : "none"}
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

      <p className="mt-5 whitespace-pre-line text-sm leading-6 text-[#374151] dark:text-slate-300">
        {review.description}
      </p>

      {review.status === "rejected" && review.rejectionReason && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">
          Rejection reason: {review.rejectionReason}
        </div>
      )}

      {review.editedAfterApproval && (
        <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm font-bold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
          This review was edited after approval and is waiting for admin approval
          again.
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F0F1FF] px-4 text-xs font-extrabold text-[#9381FF] transition hover:bg-[#E6E7FF]"
        >
          <Edit size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}

function PaginationControls({
  showingText,
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-[#EEF0F6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {showingText}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="rounded-2xl bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-[#111827] dark:bg-slate-950 dark:text-slate-100">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default MyReviewsPage;