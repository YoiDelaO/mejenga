import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import getCroppedImg from '../../../utils/cropImage';
import type { Area } from '../../../utils/cropImage';
import './ImageCropperModal.css';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
        Cancelar
      </Button>
      <Button onClick={handleSave} isLoading={isProcessing}>
        Guardar Foto
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustar Foto" footer={footer}>
      <div className="mj-cropper-container">
        <div className="mj-cropper-wrapper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
          />
        </div>
        <div className="mj-cropper-controls">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mj-zoom-slider"
          />
        </div>
      </div>
    </Modal>
  );
};
