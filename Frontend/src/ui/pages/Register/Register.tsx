import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Mail, Lock, User as UserIcon, MapPin, Map, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import { LocationService } from '../../../core/services/LocationService';
import type { Country, Region, Locality } from '../../../core/services/LocationService';
import '../Login/Auth.css';

const POSITIONS = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];
const MODALITIES = ['Fútbol 5', 'Fútbol 7', 'Ambas'];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    position: '',
    secondaryPosition: '',
    modality: '' as 'Fútbol 5' | 'Fútbol 7' | 'Ambas' | '',
    countryId: '',
    regionId: '',
    localityId: ''
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  React.useEffect(() => {
    LocationService.getCountries().then(setCountries);
  }, []);

  React.useEffect(() => {
    if (formData.countryId) {
      setIsLoadingLocations(true);
      LocationService.getRegions(formData.countryId).then(data => {
        setRegions(data);
        setIsLoadingLocations(false);
      });
    } else {
      setRegions([]);
    }
  }, [formData.countryId]);

  React.useEffect(() => {
    if (formData.regionId) {
      setIsLoadingLocations(true);
      LocationService.getLocalities(formData.regionId).then(data => {
        setLocalities(data);
        setIsLoadingLocations(false);
      });
    } else {
      setLocalities([]);
    }
  }, [formData.regionId]);

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && (!formData.name || !formData.email || !formData.password)) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (step === 1 && (formData.name.length < 5 || formData.name.length > 15)) {
      setError("El nombre debe tener entre 5 y 15 caracteres.");
      return;
    }
    if (step === 2 && (!formData.position || !formData.modality)) {
      setError("Selecciona al menos tu posición principal y modalidad.");
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId || !formData.regionId || !formData.localityId) {
      setError("Por favor completa toda tu ubicación.");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        position: formData.position,
        secondaryPosition: formData.secondaryPosition,
        modality: formData.modality as any,
        location: {
          countryId: formData.countryId,
          countryName: countries.find(c => c.id === formData.countryId)?.name || '',
          regionId: formData.regionId,
          regionName: regions.find(r => r.id === formData.regionId)?.name || '',
          localityId: formData.localityId,
          localityName: localities.find(l => l.id === formData.localityId)?.name || ''
        }
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
      setIsLoading(false);
    }
  };

  return (
    <div className="mj-auth-page">
      <div className="mj-auth-container">
        <div className="mj-auth-header" style={{ position: 'relative' }}>
          {step > 1 && (
            <button 
              type="button"
              onClick={handleBack} 
              style={{ position: 'absolute', left: 0, top: '5px', background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="mj-auth-title">Mejengas</h1>
          <p className="mj-auth-subtitle">
            {step === 1 ? "Crea tu cuenta de jugador" : 
             step === 2 ? "Perfil de Jugador" : 
             "Tu Ubicación"}
          </p>
        </div>

        <div className="mj-auth-step-indicator">
          <div className={`mj-auth-step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`mj-auth-step-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`mj-auth-step-dot ${step >= 3 ? 'active' : ''}`} />
        </div>

        {error && (
          <div className="mj-auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 3 ? handleRegister : handleNext} className="mj-auth-form">
          {/* STEP 1: CREDENTIALS */}
          {step === 1 && (
            <>
              <Input 
                label="Nombre de Usuario" 
                type="text" 
                placeholder="Ej. JuanPerez99"
                leftIcon={<UserIcon size={18} />}
                value={formData.name}
                onChange={e => updateForm('name', e.target.value)}
                maxLength={15}
                required
                error={
                  formData.name.length > 0 && formData.name.length < 5
                    ? `Mínimo 5 caracteres (${formData.name.length}/15)`
                    : undefined
                }
              />
              {/* Contador de caracteres */}
              <div style={{
                textAlign: 'right',
                fontSize: '0.75rem',
                marginTop: '-12px',
                marginBottom: '4px',
                color: formData.name.length < 5
                  ? 'var(--color-text-muted)'
                  : formData.name.length <= 15
                  ? 'var(--color-primary)'
                  : 'var(--color-danger)',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}>
                {formData.name.length}/15
              </div>
              <Input 
                label="Correo Electrónico" 
                type="email" 
                placeholder="jugador@ejemplo.com"
                leftIcon={<Mail size={18} />}
                value={formData.email}
                onChange={e => updateForm('email', e.target.value)}
                required
              />
              <Input 
                label="Edad" 
                type="number" 
                placeholder="24"
                leftIcon={<UserIcon size={18} />}
                value={formData.age}
                onChange={e => updateForm('age', e.target.value)}
                required
              />
              <Input 
                label="Contraseña" 
                type="password" 
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                value={formData.password}
                onChange={e => updateForm('password', e.target.value)}
                required
              />
              <Button type="submit" fullWidth size="lg">Siguiente</Button>
            </>
          )}

          {/* STEP 2: PLAYER INFO */}
          {step === 2 && (
            <>
              <div>
                <h4 className="mj-form-group-title">Posición Principal *</h4>
                <div className="mj-pills-group">
                  {POSITIONS.map(pos => (
                    <button
                      key={pos}
                      type="button"
                      className={`mj-pill-button ${formData.position === pos ? 'active' : ''}`}
                      onClick={() => updateForm('position', pos)}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mj-form-group-title">Posición Secundaria (Opcional)</h4>
                <div className="mj-pills-group">
                  <button
                    type="button"
                    className={`mj-pill-button ${!formData.secondaryPosition ? 'active' : ''}`}
                    onClick={() => updateForm('secondaryPosition', '')}
                  >
                    Ninguna
                  </button>
                  {POSITIONS.map(pos => (
                    <button
                      key={`sec-${pos}`}
                      type="button"
                      className={`mj-pill-button ${formData.secondaryPosition === pos ? 'active' : ''}`}
                      onClick={() => updateForm('secondaryPosition', formData.secondaryPosition === pos ? '' : pos)}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mj-form-group-title">Modalidad de Juego *</h4>
                <div className="mj-pills-group">
                  {MODALITIES.map(mod => (
                    <button
                      key={mod}
                      type="button"
                      className={`mj-pill-button ${formData.modality === mod ? 'active' : ''}`}
                      onClick={() => updateForm('modality', mod)}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" fullWidth size="lg">Siguiente</Button>
            </>
          )}

          {/* STEP 3: LOCATION */}
          {step === 3 && (
            <>
              <div className="mj-input-group">
                <label className="mj-input-label">País *</label>
                <select 
                  className="mj-input-field"
                  value={formData.countryId}
                  onChange={e => {
                    updateForm('countryId', e.target.value);
                    updateForm('regionId', '');
                    updateForm('localityId', '');
                  }}
                  required
                >
                  <option value="">Selecciona un país</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="mj-input-group">
                <label className="mj-input-label">Región / Ciudad / Estado *</label>
                <select 
                  className="mj-input-field"
                  value={formData.regionId}
                  onChange={e => {
                    updateForm('regionId', e.target.value);
                    updateForm('localityId', '');
                  }}
                  disabled={!formData.countryId || isLoadingLocations}
                  required
                >
                  <option value="">{isLoadingLocations ? 'Cargando regiones...' : 'Selecciona una región'}</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="mj-input-group">
                <label className="mj-input-label">Localidad / Cantón / Municipio *</label>
                <select 
                  className="mj-input-field"
                  value={formData.localityId}
                  onChange={e => updateForm('localityId', e.target.value)}
                  disabled={!formData.regionId || isLoadingLocations}
                  required
                >
                  <option value="">{isLoadingLocations ? 'Cargando localidades...' : 'Selecciona una localidad'}</option>
                  {localities.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Completar Registro
              </Button>
            </>
          )}
        </form>

        {step === 1 && (
          <p className="mj-auth-footer">
            ¿Ya tienes cuenta? <Link to="/login" className="mj-auth-link">Inicia sesión</Link>
          </p>
        )}
      </div>
    </div>
  );
};
