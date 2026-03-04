import Swal from 'sweetalert2';

// SweetAlert2 Utility Functions

export const showSuccess = (message: string, title: string = 'สำเร็จ!') => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3b82f6',
    });
};

export const showError = (message: string, title: string = 'เกิดข้อผิดพลาด!') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444',
    });
};

export const showWarning = (message: string, title: string = 'คำเตือน!') => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#f59e0b',
    });
};

export const showInfo = (message: string, title: string = 'ข้อมูล') => {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3b82f6',
    });
};

export const showConfirm = async (
    message: string,
    title: string = 'ยืนยันการดำเนินการ'
): Promise<boolean> => {
    const result = await Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
    });

    return result.isConfirmed;
};

export const showDeleteConfirm = async (
    message: string,
    subtitle?: string,
    confirmText: string = 'ลบ'
) => {
    const result = await Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการดำเนินการ',
        html: subtitle
            ? `${message}<br/><small class="text-gray-500">${subtitle}</small>`
            : message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
    });

    return result;
};

export const showLoading = (message: string = 'กำลังดำเนินการ...') => {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

export const closeLoading = () => {
    Swal.close();
};

// Toast notifications (แจ้งเตือนแบบมุมจอ)
export const showToastSuccess = (message: string) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });

    Toast.fire({
        icon: 'success',
        title: message,
    });
};

export const showToastError = (message: string) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    Toast.fire({
        icon: 'error',
        title: message,
    });
};

export const showToastInfo = (message: string) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    Toast.fire({
        icon: 'info',
        title: message,
    });
};
