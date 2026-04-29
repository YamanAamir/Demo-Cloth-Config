import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Mail, Phone, School, MessageSquare, Loader2, CheckCircle, ChevronDown, Search, BookOpen } from 'lucide-react';
import { sendInquiry, getPublicSchools, getClassesBySchool } from '../api/api';

const InquiryModal = ({ isOpen, onClose }) => {
  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    req_for: 'student',
    school_id: '',
    class_id: '',
    message: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // School dropdown
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  // Class dropdown
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef(null);

  // Reset form every time modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setErrors({});
      setSubmitted(false);
      setSchoolSearch('');
      setClassSearch('');
      setClasses([]);
      fetchSchools();
    }
  }, [isOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(e.target)) {
        setSchoolDropdownOpen(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch classes when school changes
  useEffect(() => {
    if (form.school_id) {
      fetchClasses(form.school_id);
    } else {
      setClasses([]);
      setForm(prev => ({ ...prev, class_id: '' }));
    }
  }, [form.school_id]);

  const fetchSchools = async () => {
    setSchoolsLoading(true);
    try {
      const res = await getPublicSchools();
      if (res.data?.success) setSchools(res.data.data || []);
    } catch (err) {
      console.error('Kunne ikke hente skoler:', err);
    } finally {
      setSchoolsLoading(false);
    }
  };

  const fetchClasses = async (schoolId) => {
    setClassesLoading(true);
    setClasses([]);
    setForm(prev => ({ ...prev, class_id: '' }));
    try {
      const res = await getClassesBySchool(schoolId);
      if (res.data?.success) setClasses(res.data.data || []);
    } catch (err) {
      console.error('Kunne ikke hente klasser:', err);
    } finally {
      setClassesLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedSchool = schools.find(s => String(s.id) === String(form.school_id));
  const selectedClass = classes.find(c => String(c.id) === String(form.class_id));

  const filteredSchools = schools.filter(s =>
    s.name?.toLowerCase().includes(schoolSearch.toLowerCase())
  );
  const filteredClasses = classes.filter(c =>
    c.name?.toLowerCase().includes(classSearch.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Navn er påkrævet';
    if (!form.email.trim()) e.email = 'E-mail er påkrævet';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ugyldig e-mailadresse';
    if (!form.phone.trim()) e.phone = 'Telefonnummer er påkrævet';
    if (!form.school_id) e.school_id = 'Vælg venligst en skole';
    if (!form.message.trim()) e.message = 'Besked er påkrævet';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSchoolSelect = (school) => {
    setForm(prev => ({ ...prev, school_id: String(school.id), class_id: '' }));
    if (errors.school_id) setErrors(prev => ({ ...prev, school_id: undefined }));
    setSchoolSearch('');
    setSchoolDropdownOpen(false);
  };

  const handleClassSelect = (cls) => {
    setForm(prev => ({ ...prev, class_id: String(cls.id) }));
    setClassSearch('');
    setClassDropdownOpen(false);
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setIsLoading(true);
    try {
      const res = await sendInquiry(form);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrors({ general: res.data?.message || 'Noget gik galt. Prøv venligst igen.' });
      }
    } catch (err) {
      console.error('Forespørgselsfejl:', err);
      setErrors({ general: err.response?.data?.message || 'Kunne ikke sende forespørgsel. Prøv venligst igen.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all duration-200 outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm';
  const labelBase = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';

  // Reusable searchable dropdown renderer
  const renderDropdown = ({
    ref, label, icon: Icon, placeholder, loadingText, emptyText,
    isOpen: open, setOpen, search, setSearch,
    loading, filtered, selected, onSelect, error,
  }) => (
    <div ref={ref}>
      <label className={labelBase}>
        <Icon className="inline w-3 h-3 mr-1 mb-0.5" />
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl flex items-center justify-between text-sm font-medium transition-all duration-200 ${
            error
              ? 'border-red-400 bg-red-50'
              : open
              ? 'border-green-500 bg-white ring-2 ring-green-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className={selected ? 'text-slate-700' : 'text-slate-400'}>
            {loading ? loadingText : selected ? selected.name : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Søg..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {loading ? (
                <li className="px-4 py-3 text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Henter...
                </li>
              ) : filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-400 text-center">{emptyText}</li>
              ) : (
                filtered.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-green-50 hover:text-green-700 ${
                        selected && String(selected.id) === String(item.id)
                          ? 'bg-green-50 text-green-700 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Send forespørgsel</h2>
              <p className="text-green-100 text-xs">Vi vender tilbage til dig hurtigst muligt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh] custom-scrollbar-premium">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Forespørgsel sendt!</h3>
                <p className="text-slate-500 text-sm">
                  Tak fordi du kontaktede os. Vi har modtaget din forespørgsel og vil kontakte dig på{' '}
                  <span className="font-semibold text-slate-700">{form.email}</span> snarest.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                Luk
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
                  {errors.general}
                </div>
              )}

              {/* Navn */}
              <div>
                <label className={labelBase}>
                  <User className="inline w-3 h-3 mr-1 mb-0.5" />
                  Fulde navn
                </label>
                <input
                  type="text"
                  placeholder="Indtast dit fulde navn"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={`${inputBase} ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* E-mail */}
              <div>
                <label className={labelBase}>
                  <Mail className="inline w-3 h-3 mr-1 mb-0.5" />
                  E-mailadresse
                </label>
                <input
                  type="email"
                  placeholder="din@email.dk"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className={`${inputBase} ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Telefon */}
              <div>
                <label className={labelBase}>
                  <Phone className="inline w-3 h-3 mr-1 mb-0.5" />
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  placeholder="+45 12 34 56 78"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className={`${inputBase} ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Forespørgsel som */}
              <div>
                <label className={labelBase}>Forespørgsel som</label>
                <div className="flex gap-3">
                  {[
                    { value: 'student', label: 'Elev' },
                    { value: 'class_rep', label: 'Klasserepræsentant' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('req_for', opt.value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                        form.req_for === opt.value
                          ? 'bg-green-600 border-green-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skole dropdown */}
              {renderDropdown({
                ref: schoolDropdownRef,
                label: 'Skole',
                icon: School,
                placeholder: 'Vælg din skole',
                loadingText: 'Henter skoler...',
                emptyText: 'Ingen skoler fundet',
                isOpen: schoolDropdownOpen,
                setOpen: setSchoolDropdownOpen,
                search: schoolSearch,
                setSearch: setSchoolSearch,
                loading: schoolsLoading,
                filtered: filteredSchools,
                selected: selectedSchool,
                onSelect: handleSchoolSelect,
                error: errors.school_id,
              })}

              {/* Klasse dropdown — vises kun når skole er valgt */}
              {form.school_id && renderDropdown({
                ref: classDropdownRef,
                label: 'Klasse (valgfri)',
                icon: BookOpen,
                placeholder: classesLoading ? 'Henter klasser...' : classes.length === 0 ? 'Ingen klasser tilgængelige' : 'Vælg din klasse',
                loadingText: 'Henter klasser...',
                emptyText: 'Ingen klasser fundet',
                isOpen: classDropdownOpen,
                setOpen: setClassDropdownOpen,
                search: classSearch,
                setSearch: setClassSearch,
                loading: classesLoading,
                filtered: filteredClasses,
                selected: selectedClass,
                onSelect: handleClassSelect,
                error: errors.class_id,
              })}

              {/* Besked */}
              <div>
                <label className={labelBase}>
                  <MessageSquare className="inline w-3 h-3 mr-1 mb-0.5" />
                  Besked
                </label>
                <textarea
                  rows={4}
                  placeholder="Beskriv din forespørgsel eller dine ønsker..."
                  value={form.message}
                  onChange={e => handleChange('message', e.target.value)}
                  className={`${inputBase} resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sender...</>
              ) : (
                <><Send className="w-4 h-4" /> Send forespørgsel</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default InquiryModal;
