import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearReviewError,
  fetchDoctorOwnReviews,
} from "../../features/review/reviewSlice";

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

function DoctorReviewsPage() {
  const dispatch = useAppDispatch();

  const {
    doctorReviews,
    doctorOwnSummary,
    doctorPagination,
    isLoading,
    error,
  } = useAppSelector((state) => state.reviews);

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");

  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 20,
      status,
      rating,
    };
  }, [status, rating]);

  useEffect(() => {
    dispatch(fetchDoctorOwnReviews(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReviewError());
  }, [error, dispatch]);

  return (
    <DashboardLayout
      title="My Reviews"
      description="View patient feedback and rating summary."
    >
      <main className="mx-auto max-w-[1120px]">
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">
              Average Rating
            </p>

            <p className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-[#111827]">
              <Star size={24} fill="currentColor" className="text-[#F59E0B]" />
              {doctorOwnSummary?.averageRating || 0}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">
              Total Approved Reviews
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#111827]">
              {doctorOwnSummary?.totalReviews || 0}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">
              Listed Reviews
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#111827]">
              {doctorPagination?.totalReviews || 0}
            </p>
          </div>
        </section>

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
        ) : doctorReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
            <h2 className="text-xl font-extrabold text-[#111827]">
              No reviews found
            </h2>
          </div>
        ) : (
          <div className="space-y-4">
            {doctorReviews.map((review) => (
              <article
                key={review._id}
                className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#111827]">
                      {getPatientName(review)}
                    </h2>

                    <div className="mt-2 flex items-center gap-1 text-[#F59E0B]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={16}
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
                    className={`rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${getStatusClass(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#374151]">
                  {review.description}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default DoctorReviewsPage;