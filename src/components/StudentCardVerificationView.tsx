import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Upload, Camera, AlertCircle, CheckCircle2, LogOut, Info, ArrowRight, Eye } from 'lucide-react';

interface StudentCardVerificationViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentCardVerificationView: React.FC<StudentCardVerificationViewProps> = ({ onNotify }) => {
  const { profile, updateProfileData, logout } = useAuth();
  const [ine, setIne] = useState(profile?.ine || '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
  const [cardImage, setCardImage] = useState<string | null>(profile?.studentCardPhotoUrl || null);
  const [submitting, setSubmitting] = useState(false);
  const [showSample, setShowSample] = useState(false);

  // Handle image capture or file pick with canvas compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Veuillez sélectionner un fichier image valide (JPG, PNG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to ~800px max width to store cleanly in Firestore
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 900;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setCardImage(compressedDataUrl);
          onNotify('Photo de la carte chargée avec succès !', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ine.trim()) {
      onNotify('Veuillez saisir votre Numéro INE.', 'error');
      return;
    }
    if (!cardImage) {
      onNotify('Veuillez fournir la photo de votre Carte Unique d\'Étudiant ISSEG.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfileData({
        ine: ine.trim().toUpperCase(),
        birthDate,
        studentCardPhotoUrl: cardImage,
        verificationStatus: 'approved'
      });
      onNotify('Carte d\'étudiant validée ! Bienvenue sur ISSEG Connect.', 'success');
    } catch (err: any) {
      onNotify('Erreur lors de la validation : ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fc] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#10152f] via-[#0878b9] to-[#10152f] p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-2.5 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center">
            <img src="/isseg-logo.png" alt="ISSEG" className="w-full h-full object-contain" />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase mb-1">
            Contrôle d'accès académique
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Vérification de la Carte Unique de l'Étudiant
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-md mx-auto">
            Pour accéder à la communauté ISSEG, vous devez justifier de votre inscription en fournissant votre carte d'étudiant universitaire.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Reference Notice */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Document officiel exigé (Guinée / ISSEG) :</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-800">
              Votre carte doit porter le drapeau <strong>Guinéen 🇬🇳</strong>, la mention <strong>« CARTE UNIQUE DE L'ETUDIANT »</strong>, votre numéro <strong>INE</strong>, et le logo avec <strong>« INSTITUT SUPERIEUR DES SCIENCES DE L'EDUCATION DE GUINEE »</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowSample(!showSample)}
              className="text-[#0878b9] font-bold text-[11px] underline flex items-center gap-1 mt-1 hover:text-[#07558c]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showSample ? 'Masquer le modèle de carte' : 'Voir le modèle officiel en exemple'}</span>
            </button>
          </div>

          {/* Sample Card Model Preview */}
          {showSample && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center animate-fade-in space-y-2">
              <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 max-w-xs mx-auto">
                <img
                  src="/sample-carte-etudiant.jpg"
                  alt="Modèle Carte Unique Étudiant ISSEG"
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Exemple officiel de la Carte Unique délivrée par l'ISSEG de Lambanyi.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitVerification} className="space-y-4">
            {/* INE Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Numéro INE (Identifiant National de l'Étudiant) *
              </label>
              <input
                type="text"
                required
                value={ine}
                onChange={(e) => setIne(e.target.value.toUpperCase())}
                placeholder="Ex : BAMH0504463138"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold tracking-wider uppercase focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Figure sur le recto de votre carte unique sous le nom.
              </span>
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date de naissance (optionnel)
              </label>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="JJ/MM/AAAA (ex: 05/04/2005)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-[#0878b9] focus:outline-none"
              />
            </div>

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Photo de votre Carte Unique de l'Étudiant *
              </label>

              {cardImage ? (
                <div className="relative rounded-2xl border-2 border-emerald-500 p-2 bg-emerald-50/40 text-center space-y-2">
                  <div className="max-h-56 overflow-hidden rounded-xl shadow-sm border border-emerald-200 mx-auto">
                    <img
                      src={cardImage}
                      alt="Votre Carte Unique"
                      className="w-full h-auto object-contain max-h-56 mx-auto"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Photo prête pour validation</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <label className="cursor-pointer px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 shadow-xs">
                      <span>Reprendre une autre photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#0878b9] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition-colors group">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0878b9] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <strong className="text-xs sm:text-sm font-bold text-slate-800">
                    Prendre en photo ou importer ma carte
                  </strong>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Assurez-vous que le nom, l'INE et le logo ISSEG soient bien lisibles et nets.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={submitting || !cardImage || !ine.trim()}
                className="w-full py-3 bg-[#0878b9] hover:bg-[#07558c] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Validation en cours...' : 'Valider ma carte et accéder à l\'application'}</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Changer de compte ou se déconnecter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
