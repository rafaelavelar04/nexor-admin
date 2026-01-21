import { toast } from "sonner";

export const showSuccess = (message: string, options?: { description?: string }) => {
  toast.success(message, {
    description: options?.description,
  });
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};