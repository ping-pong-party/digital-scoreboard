interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'success' | 'warning';
}

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  const variantColors = {
    danger: 'from-red-500 to-red-700',
    success: 'from-green-500 to-green-700',
    warning: 'from-yellow-500 to-yellow-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl p-12 shadow-2xl border-4 border-gray-700 max-w-3xl mx-8">
        {/* Title */}
        <h2 className={`text-6xl font-black mb-8 text-center bg-gradient-to-r ${variantColors[variant]} bg-clip-text text-transparent`}>
          {title}
        </h2>

        {/* Message */}
        <p className="text-4xl text-white text-center mb-12 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-8">
          <button
            onClick={onCancel}
            className="px-12 py-8 bg-gray-700 hover:bg-gray-600 text-white text-4xl font-bold rounded-xl transition-colors"
            autoFocus
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-12 py-8 bg-gradient-to-r ${variantColors[variant]} hover:brightness-110 text-white text-4xl font-bold rounded-xl transition-all`}
          >
            {confirmText}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-8 text-center text-gray-500 text-2xl">
          <kbd className="bg-gray-800 px-4 py-2 rounded">ESC</kbd> to cancel
        </div>
      </div>
    </div>
  );
}
