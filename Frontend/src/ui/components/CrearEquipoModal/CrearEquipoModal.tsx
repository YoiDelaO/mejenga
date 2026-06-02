import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Shield } from 'lucide-react';
import { ImageCropperModal } from '../ImageCropper/ImageCropperModal';

interface CrearEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teamData: { name: string, description: string, modality: 'Fútbol 5' | 'Fútbol 7' | 'Ambas', shieldBase64?: string }) => void;
}

export const CrearEquipoModal: React.FC<CrearEquipoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modality, setModality] = useState<'Fútbol 5' | 'Fútbol 7' | 'Ambas'>('Fútbol 5');
  const [shieldBase64, setShieldBase64] = useState<string | null>(null);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageForCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    setShieldBase64(croppedBase64);
    setSelectedImageForCrop(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess({
        name,
        description,
        modality,
        shieldBase64: shieldBase64 || undefined
      });
      setName('');
      setDescription('');
      setModality('Fútbol 5');
      setShieldBase64(null);
    }, 1500);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Fundar un Nuevo Equipo">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <label style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: shieldBase64 ? `url(${shieldBase64}) center/cover` : 'var(--color-surface-hover)', 
              border: '2px dashed var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)',
              cursor: 'pointer', overflow: 'hidden'
            }}>
              {!shieldBase64 && (
                <div style={{ textAlign: 'center' }}>
                  <Shield size={24} />
                  <div style={{ fontSize: '0.6rem', marginTop: '4px' }}>Subir Escudo</div>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
            </label>
          </div>

          <div className="mj-input-group">
            <label className="mj-input-label">Nombre del Equipo</label>
            <input 
              type="text" 
              className="mj-input-field" 
              placeholder="Ej: Los Galácticos FC"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="mj-input-group">
            <label className="mj-input-label">Descripción</label>
            <textarea 
              className="mj-input-field" 
              placeholder="¿Qué tipo de jugadores buscan? ¿Qué días juegan?"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'none' }}
              required
            />
          </div>

          <div className="mj-input-group">
            <label className="mj-input-label">Modalidad Principal</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              {(['Fútbol 5', 'Fútbol 7', 'Ambas'] as const).map(mod => (
                <div 
                  key={mod}
                  onClick={() => setModality(mod)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${modality === mod ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: modality === mod ? 'rgba(0, 242, 96, 0.1)' : 'transparent',
                    color: modality === mod ? 'var(--color-primary)' : 'var(--color-text-main)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: modality === mod ? 600 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {mod}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" fullWidth disabled={!name.trim() || !description.trim() || isSubmitting}>
            {isSubmitting ? 'Creando equipo...' : 'Crear Equipo'}
          </Button>
        </form>
      </Modal>

      {selectedImageForCrop && (
        <ImageCropperModal
          isOpen={!!selectedImageForCrop}
          onClose={() => setSelectedImageForCrop(null)}
          imageSrc={selectedImageForCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
