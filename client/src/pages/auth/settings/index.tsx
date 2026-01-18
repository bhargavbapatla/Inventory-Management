import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/authContext";
import { toast } from "react-hot-toast";
import { Modal, Box } from "@mui/material";
import Button from "../../../components/Button";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleDeleteAccount = () => {
    handleOpen()
    // setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    toast.success("Account deleted");
    logout();
    navigate("/signup");
    setConfirmOpen(false);
  };

  const handleOpen = () => {
    setMounted(true);
    requestAnimationFrame(() => setConfirmOpen(true));
  };


  return (
    <div className="p-2">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col min-h-[320px]">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Settings
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Manage your account information.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </span>
              <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-900">
                {user?.email || "Not available"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full inline-flex items-center justify-center py-2 text-sm font-medium"
            variant="secondary"
          >
            Delete Account
          </Button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${confirmOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}>
          <div className={`absolute inset-0 bg-black/40 ${confirmOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} onClick={() => setConfirmOpen(false)} />
          <div
            className={`relative w-full max-w-md mx-4 rounded-xl bg-white shadow-lg ${confirmOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transform transition-all duration-200 ease-out`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                Confirm Account Deletion
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete your account? This action
                cannot be undone.
              </p>
            </div>
            <div className="px-5 py-4 border-t">
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  fullWidth={false}
                  className="px-3 py-1 text-sm"
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  fullWidth={false}
                  className="px-3 py-1 text-sm"
                  variant="primary"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
