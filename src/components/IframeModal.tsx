
import { X } from 'lucide-react';

interface IframeModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

const IframeModal = ({ isOpen, url, onClose }: IframeModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="relative w-full h-full max-w-6xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center z-50 transition-all"
          aria-label="Close offer wall"
        >
          <X className="w-5 h-5" />
        </button>
        <iframe
          src={url}
          className="w-full h-full rounded-lg border border-gray-700 bg-gray-900"
          title="Offer Wall"
        />
      </div>
    </div>
  );
};

export default IframeModal;
