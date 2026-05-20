import { useEffect, useState } from "react";
import {
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";

import { getCurrentAdminApi } from "../../features/admin/adminService";
import {
  createSpecialtyApi,
  deleteSpecialtyApi,
  getAllSpecialtiesApi,
  updateSpecialtyApi,
  updateSpecialtyStatusApi,
} from "../../features/admin/specialtyService";

import { specialtySchema } from "../../schemas/admin.schema";

function AdminProfilePage() {
  const [admin, setAdmin] = useState(null);
  const [specialties, setSpecialties] = useState([]);

  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);

  const [editingSpecialty, setEditingSpecialty] = useState(null);

  const [statusModal, setStatusModal] = useState({
    open: false,
    specialty: null,
    nextStatus: null,
  });

  const [deleteSpecialtyModal, setDeleteSpecialtyModal] = useState({
    open: false,
    specialty: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingSpecialty, setIsDeletingSpecialty] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: {
      errors: createErrors,
      isSubmitting: isCreating,
    },
  } = useForm({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: {
      errors: editErrors,
      isSubmitting: isEditing,
    },
  } = useForm({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchAdmin = async () => {
    try {
      setIsLoadingAdmin(true);

      const response = await getCurrentAdminApi();

      setAdmin(response.data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch admin profile";

      toast.error(message);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      setIsLoadingSpecialties(true);

      const response = await getAllSpecialtiesApi();

      setSpecialties(response.data || []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch specialties";

      toast.error(message);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
    fetchSpecialties();
  }, []);

  const onCreateSpecialty = async (data) => {
    try {
      const response = await createSpecialtyApi({
        name: data.name,
        description: data.description || "",
      });

      toast.success(response.message || "Specialty created successfully");

      resetCreateForm({
        name: "",
        description: "",
      });

      await fetchSpecialties();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create specialty";

      toast.error(message);
    }
  };

  const startEditSpecialty = (specialty) => {
    setEditingSpecialty(specialty);

    resetEditForm({
      name: specialty.displayName || specialty.name || "",
      description: specialty.description || "",
    });
  };

  const cancelEditSpecialty = () => {
    setEditingSpecialty(null);

    resetEditForm({
      name: "",
      description: "",
    });
  };

  const onEditSpecialty = async (data) => {
    if (!editingSpecialty?._id) return;

    try {
      const response = await updateSpecialtyApi(editingSpecialty._id, {
        name: data.name,
        description: data.description || "",
      });

      toast.success(response.message || "Specialty updated successfully");

      setEditingSpecialty(null);

      await fetchSpecialties();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update specialty";

      toast.error(message);
    }
  };

  const openStatusModal = (specialty) => {
    const nextStatus =
      specialty.status === "active" ? "inactive" : "active";

    setStatusModal({
      open: true,
      specialty,
      nextStatus,
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      specialty: null,
      nextStatus: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusModal.specialty?._id || !statusModal.nextStatus) return;

    try {
      setIsUpdatingStatus(true);

      const response = await updateSpecialtyStatusApi(
        statusModal.specialty._id,
        statusModal.nextStatus
      );

      toast.success(response.message || "Specialty status updated");

      closeStatusModal();

      await fetchSpecialties();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update specialty status";

      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openDeleteSpecialtyModal = (specialty) => {
    setDeleteSpecialtyModal({
      open: true,
      specialty,
    });
  };

  const closeDeleteSpecialtyModal = () => {
    setDeleteSpecialtyModal({
      open: false,
      specialty: null,
    });
  };

  const confirmDeleteSpecialty = async () => {
    if (!deleteSpecialtyModal.specialty?._id) return;

    try {
      setIsDeletingSpecialty(true);

      const response = await deleteSpecialtyApi(
        deleteSpecialtyModal.specialty._id
      );

      toast.success(response.message || "Specialty deleted successfully");

      closeDeleteSpecialtyModal();

      await fetchSpecialties();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete specialty";

      toast.error(message);
    } finally {
      setIsDeletingSpecialty(false);
    }
  };

  const activeCount = specialties.filter(
    (item) => item.status === "active"
  ).length;

  const inactiveCount = specialties.filter(
    (item) => item.status === "inactive"
  ).length;

  return (
    <DashboardLayout title="Admin Profile">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
        <div className="space-y-6">
          <SettingsSection
            title="Admin Account"
            description="Clinic admin profile and access information."
          >
            {isLoadingAdmin ? (
              <p className="text-sm text-[#595F69] dark:text-slate-400">
                Loading admin profile...
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B8B8FF]/40 text-[#4C59A6] dark:bg-[#B8B8FF]/20 dark:text-[#B8B8FF]">
                    <ShieldCheck size={30} />
                  </div>

                  <div>
                    <h2 className="font-manrope text-2xl font-extrabold text-[#2D333B] dark:text-slate-100">
                      {admin?.username || "Admin"}
                    </h2>

                    <p className="text-sm text-[#595F69] dark:text-slate-400">
                      Clinic Administrator
                    </p>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <AdminInfoRow
                    icon={UserRound}
                    label="Username"
                    value={admin?.username || "Not available"}
                  />

                  <AdminInfoRow
                    icon={Mail}
                    label="Email"
                    value={admin?.email || "Not available"}
                  />

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#595F69] dark:text-slate-400">
                      <ShieldCheck size={16} />
                      Role
                    </span>

                    <span className="font-semibold capitalize text-[#4C59A6] dark:text-[#B8B8FF]">
                      {admin?.role || "admin"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </SettingsSection>

          <SettingsSection
            title="Specialty Overview"
            description="Quick summary of clinic specialties."
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69] dark:text-slate-400">
                  Active
                </p>

                <p className="mt-2 font-manrope text-3xl font-extrabold text-[#4C59A6] dark:text-[#B8B8FF]">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69] dark:text-slate-400">
                  Inactive
                </p>

                <p className="mt-2 font-manrope text-3xl font-extrabold text-[#2D333B] dark:text-slate-100">
                  {inactiveCount}
                </p>
              </div>
            </div>
          </SettingsSection>
        </div>

        <div className="space-y-6">
          <SettingsSection
            title="Create Specialty"
            description="Add a new dental specialty for doctors."
          >
            <form
              onSubmit={handleCreateSubmit(onCreateSpecialty)}
              className="space-y-5"
            >
              <Input
                label="Specialty Name"
                name="name"
                placeholder="Orthodontics"
                register={registerCreate}
                error={createErrors.name}
                icon={Stethoscope}
              />

              <Textarea
                label="Description"
                name="description"
                placeholder="Describe this specialty..."
                register={registerCreate}
                error={createErrors.description}
                rows={3}
              />

              <Button
                type="submit"
                loading={isCreating}
                fullWidth={false}
                className="min-w-[190px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus size={17} />
                  Add Specialty
                </span>
              </Button>
            </form>
          </SettingsSection>

          <SettingsSection
            title="Manage Specialties"
            description="Edit specialty details or change active status."
          >
            {isLoadingSpecialties ? (
              <p className="text-sm text-[#595F69] dark:text-slate-400">
                Loading specialties...
              </p>
            ) : specialties.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FAFC] p-6 text-center dark:bg-slate-950">
                <p className="text-sm font-medium text-[#595F69] dark:text-slate-400">
                  No specialties found. Create your first specialty.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {specialties.map((specialty) => {
                  const isSpecialtyEditing =
                    editingSpecialty?._id === specialty._id;

                  return (
                    <div
                      key={specialty._id}
                      className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5 dark:border-slate-800 dark:bg-slate-950"
                    >
                      {isSpecialtyEditing ? (
                        <form
                          onSubmit={handleEditSubmit(onEditSpecialty)}
                          className="space-y-4"
                        >
                          <Input
                            label="Specialty Name"
                            name="name"
                            placeholder="Orthodontics"
                            register={registerEdit}
                            error={editErrors.name}
                            icon={Stethoscope}
                          />

                          <Textarea
                            label="Description"
                            name="description"
                            placeholder="Describe this specialty..."
                            register={registerEdit}
                            error={editErrors.description}
                            rows={3}
                          />

                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="submit"
                              loading={isEditing}
                              fullWidth={false}
                              className="min-w-[150px]"
                            >
                              Save Changes
                            </Button>

                            <button
                              type="button"
                              onClick={cancelEditSpecialty}
                              className="rounded-3xl border border-[rgba(172,178,189,0.2)] bg-white px-6 py-3 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#B8B8FF] dark:hover:text-[#B8B8FF]"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-manrope text-lg font-extrabold text-[#2D333B] dark:text-slate-100">
                                {specialty.displayName || specialty.name}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                                  specialty.status === "active"
                                    ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {specialty.status}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-[#595F69] dark:text-slate-400">
                              {specialty.description ||
                                "No description provided."}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditSpecialty(specialty)}
                              className="flex items-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 py-2 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#B8B8FF] dark:hover:text-[#B8B8FF]"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => openStatusModal(specialty)}
                              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                                specialty.status === "active"
                                  ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                                  : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
                              }`}
                            >
                              {specialty.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteSpecialtyModal(specialty)}
                              className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SettingsSection>
        </div>
      </div>

      <ConfirmModal
        open={statusModal.open}
        title={
          statusModal.nextStatus === "inactive"
            ? "Deactivate Specialty?"
            : "Activate Specialty?"
        }
        description={`Are you sure you want to ${
          statusModal.nextStatus === "inactive" ? "deactivate" : "activate"
        } "${
          statusModal.specialty?.displayName ||
          statusModal.specialty?.name ||
          "this specialty"
        }"?`}
        confirmText={
          statusModal.nextStatus === "inactive" ? "Deactivate" : "Activate"
        }
        cancelText="Cancel"
        danger={statusModal.nextStatus === "inactive"}
        loading={isUpdatingStatus}
        onConfirm={confirmStatusChange}
        onCancel={closeStatusModal}
      />

      <ConfirmModal
        open={deleteSpecialtyModal.open}
        title="Delete Specialty?"
        description={`Are you sure you want to delete "${
          deleteSpecialtyModal.specialty?.displayName ||
          deleteSpecialtyModal.specialty?.name ||
          "this specialty"
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={isDeletingSpecialty}
        onConfirm={confirmDeleteSpecialty}
        onCancel={closeDeleteSpecialtyModal}
      />
    </DashboardLayout>
  );
}

function AdminInfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(172,178,189,0.15)] pb-3 dark:border-slate-800">
      <span className="flex items-center gap-2 text-[#595F69] dark:text-slate-400">
        <Icon size={16} />
        {label}
      </span>

      <span className="font-semibold text-[#2D333B] dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

export default AdminProfilePage;