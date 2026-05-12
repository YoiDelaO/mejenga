import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import type { User } from '../../../core/types';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updates: Partial<User>) => Promise<void>;
}

const POSITIONS = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];
const MODALITIES = ['Fútbol 5', 'Fútbol 7', 'Ambas'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age?.toString() || '');
  const [city, setCity] = useState(user.location?.city || '');
  const [country, setCountry] = useState(user.location?.country || '');
  const [primaryPosition, setPrimaryPosition] = useState(user.position || '');
  const [secondaryPosition, setSecondaryPosition] = useState(user.secondaryPosition || '');
  const [modality, setModality] = useState(user.modality || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAge(user.age?.toString() || '');
      setCity(user.location?.city || '');
      setCountry(user.location?.country || '');
      setPrimaryPosition(user.position || '');
      setSecondaryPosition(user.secondaryPosition || '');
      setModality(user.modality || '');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        age: age ? parseInt(age, 10) : undefined,
        location: { city, country },
        position: primaryPosition,
        secondaryPosition,
        modality: modality as User['modality'],
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
      <Button onClick={handleSubmit} isLoading={isSaving}>Guardar Cambios</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" footer={footer}>
      <form onSubmit={handleSubmit} className="mj-edit-profile-form">
        
        <div className="mj-edit-profile-section">
          <h4>Información Básica</h4>
          <Input 
            type="text" 
            placeholder="Nombre completo" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            type="number" 
            placeholder="Edad (ej. 24)" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
          />
          <div className="mj-edit-location">
            <Input 
              type="text" 
              placeholder="Ciudad" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              required 
            />
            <Input 
              type="text" 
              placeholder="País" 
              value={country} 
              onChange={(e) => setCountry(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="mj-edit-profile-section">
          <h4>Posición Principal</h4>
          <div className="mj-pill-group">
            {POSITIONS.map((pos) => (
              <button
                key={`primary-${pos}`}
                type="button"
                className={`mj-pill-button ${primaryPosition === pos ? 'active' : ''}`}
                onClick={() => setPrimaryPosition(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="mj-edit-profile-section">
          <h4>Posición Secundaria (Opcional)</h4>
          <div className="mj-pill-group">
            <button
              type="button"
              className={`mj-pill-button ${!secondaryPosition ? 'active' : ''}`}
              onClick={() => setSecondaryPosition('')}
            >
              Ninguna
            </button>
            {POSITIONS.filter(p => p !== primaryPosition).map((pos) => (
              <button
                key={`secondary-${pos}`}
                type="button"
                className={`mj-pill-button ${secondaryPosition === pos ? 'active' : ''}`}
                onClick={() => setSecondaryPosition(secondaryPosition === pos ? '' : pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div className="mj-edit-profile-section">
          <h4>Modalidad de Juego</h4>
          <div className="mj-pill-group">
            {MODALITIES.map((mod) => (
              <button
                key={`modality-${mod}`}
                type="button"
                className={`mj-pill-button ${modality === mod ? 'active' : ''}`}
                onClick={() => setModality(mod)}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
