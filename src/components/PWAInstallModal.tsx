import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Apple, Laptop, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose, onNotify }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'pc'>(
    isIOS ? 'ios' : 'android'
  );

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      onNotify?.('Application installée avec succès !', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-100 animate-fade-in relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-md border border-slate-100 flex items-center justify-center flex-shrink-0">
            <img src="/isseg-logo.png" alt="ISSEG" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#10152f]">
              Installer ISSEG Connect
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Accède à l'application comme une app native, sans navigateur
            </p>
          </div>
        </div>

        {/* Native quick install button if browser triggers beforeinstallprompt */}
        {isInstallable && !isInstalled && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#07558c]">
                  Installation en 1 clic disponible !
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Ton navigateur supporte l'installation directe.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="px-4 py-2.5 bg-[#0878b9] hover:bg-[#07558c] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Installer</span>
              </button>
            </div>
          </div>
        )}

        {isInstalled && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>L'application ISSEG Connect est déjà installée sur ton appareil.</span>
          </div>
        )}

        {/* Tabs for detailed platform instructions */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Guide d'installation par appareil :
          </label>
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'android'
                  ? 'bg-white text-[#10152f] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'ios'
                  ? 'bg-white text-[#10152f] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('pc')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePlatform === 'pc'
                  ? 'bg-white text-[#10152f] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>PC / Mac</span>
            </button>
          </div>

          {/* Android Steps */}
          {activePlatform === 'android' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 border border-slate-200/70">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0878b9] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700">
                  Ouvre <strong>Google Chrome</strong> et rends-toi sur l'adresse de l'application.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0878b9] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700">
                  Appuie sur le menu à <strong>trois points (⋮)</strong> en haut à droite de Chrome.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0878b9] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-700">
                  Sélectionne <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0878b9] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <p className="text-slate-700">
                  Confirme avec <strong>Installer</strong> : l'icône ISSEG apparaît avec tes autres applications Android !
                </p>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {activePlatform === 'ios' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 border border-slate-200/70">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8060ed] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700">
                  Ouvre le site dans <strong>Safari</strong> sur ton iPhone ou iPad.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8060ed] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700 flex items-center gap-1.5 flex-wrap">
                  Appuie sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 text-[#0878b9] inline" /> en bas de l'écran.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8060ed] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-700 flex items-center gap-1.5 flex-wrap">
                  Fais défiler la liste vers le bas et touche <strong>« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 text-slate-600 inline" />.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8060ed] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <p className="text-slate-700">
                  Touche <strong>Ajouter</strong> en haut à droite. L'application est installée sur ton écran d'accueil sans barre d'adresse !
                </p>
              </div>
            </div>
          )}

          {/* PC / Mac Steps */}
          {activePlatform === 'pc' && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 border border-slate-200/70">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#10152f] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-700">
                  Ouvre <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#10152f] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-700">
                  Clique sur la petite icône d'installation <strong>(ordinateur avec flèche vers le bas)</strong> située tout à droite dans la barre d'adresse URL.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#10152f] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-700">
                  Clique sur <strong>Installer</strong>. L'application s'ouvrira dans sa propre fenêtre indépendante sur votre bureau.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benefits list */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Mode plein écran natif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Accessible hors connexion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Lancement ultra rapide</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Consommation de données réduite</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
