import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mj-modal-overlay" onClick={onClose}>
      <div className="mj-modal" onClick={e => e.stopPropagation()}>
        <div className="mj-modal__header">
          <h3>{title}</h3>
          <button className="mj-modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="mj-modal__content">
          {children}
        </div>
        {footer && (
          <div className="mj-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
