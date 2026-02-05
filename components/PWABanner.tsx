import React, { useEffect, useMemo, useState } from 'react';
import { BusinessSettings } from '../types';

interface PWABannerProps {
  settings: BusinessSettings;
}

/**
 * Banner PWA (Opção A — sempre aparece quando habilitado):
 * - Mostra automaticamente em TODA visita (quando habilitado no Admin),
 *   mas some quando o site já está rodando como app (standalone).
 * - Android/Chrome: usa beforeinstallprompt quando disponível; se não, mostra instruções em um modal.
 * - iOS/Safari: não existe prompt automático, então mostra um modal com instruções refinadas.
 *
 * Observação importante:
 * - O navegador NÃO garante que o evento beforeinstallprompt vai aparecer sempre.
 * - Em alguns aparelhos, o usuário só consegue instalar via menu do navegador.
 */
const HIDE_SESSION_KEY = 'pwa_hide_session_v2';
const HIDE_UNTIL_KEY = 'pwa_hide_until_v2'; // timestamp ms

const shouldHideByTime = () => {
  try {
    const until = Number(localStorage.getItem(HIDE_UNTIL_KEY) || '0');
    return until > Date.now();
  } catch {
    return false;
  }
};

const PWABanner: React.FC<PWABannerProps> = ({ settings }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  const isStandalone = useMemo(() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-ignore
        (window.navigator as any).standalone === true
      );
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!settings.enablePWABanner) return;

    // Se está rodando como app (standalone), nunca mostra.
    if (isStandalone) return;

    // Se o usuário já fechou nessa sessão, não mostra de novo até fechar a aba/navegador.
    if (sessionStorage.getItem(HIDE_SESSION_KEY) === '1') return;

    // Se o usuário clicou em "Já instalei" e escolheu esconder por um tempo.
    if (shouldHideByTime()) return;

    // Detectar iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Mostra automaticamente após um pequeno delay (pra não "pular" na tela)
    const t = window.setTimeout(() => setShowBanner(true), 900);

    // Captura o evento do Chrome (Android) quando disponível
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Quando instala, esconde o banner nessa sessão.
    const handleInstalled = () => {
      sessionStorage.setItem(HIDE_SESSION_KEY, '1');
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [settings.enablePWABanner, isStandalone]);

  const handleInstallClick = async () => {
    // Android/Chrome com suporte ao prompt nativo
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        // Se aceitou, o appinstalled deve disparar. Mesmo assim, escondemos nessa sessão.
        if (choice?.outcome === 'accepted') {
          sessionStorage.setItem(HIDE_SESSION_KEY, '1');
          setShowBanner(false);
        }
      } catch {
        // ignora
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // iOS ou Android sem prompt: mostra modal com instruções refinadas
    setShowHowTo(true);
  };

  const handleDismissForSession = () => {
    sessionStorage.setItem(HIDE_SESSION_KEY, '1');
    setShowBanner(false);
    setShowHowTo(false);
  };

  const handleAlreadyInstalled = () => {
    // Em vez de esconder pra sempre (o que gerava confusão),
    // escondemos por 30 dias (basta limpar o cache/localStorage pra voltar).
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(HIDE_UNTIL_KEY, String(Date.now() + thirtyDays));
    } catch {
      // ignora
    }
    setShowHowTo(false);
    setShowBanner(false);
  };

  if (!settings.enablePWABanner) return null;
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in">
      {/* MODAL DE INSTRUÇÕES */}
      {showHowTo && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1F3B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-white font-bold uppercase tracking-wide text-sm">
                    Instalar o App
                  </h3>
                  <p className="text-gray-300 text-xs mt-1">
                    Siga o passo a passo abaixo. Leva menos de 30 segundos.
                  </p>
                </div>
                <button
                  onClick={() => setShowHowTo(false)}
                  className="text-gray-300 hover:text-white p-1"
                  aria-label="Fechar instruções"
                  title="Fechar"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {isIOS ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-share-square"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">1) Toque em Compartilhar</p>
                        <p className="text-gray-300 text-xs">
                          No Safari, toque no ícone <b>Compartilhar</b> (um quadrado com seta para cima).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-plus-square"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">2) Adicionar à Tela de Início</p>
                        <p className="text-gray-300 text-xs">
                          Role a lista e toque em <b>“Adicionar à Tela de Início”</b>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">3) Confirmar</p>
                        <p className="text-gray-300 text-xs">
                          Toque em <b>Adicionar</b>. Pronto! O app vai aparecer na sua tela inicial.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-300 bg-white/5 border border-white/10 rounded-xl p-3">
                    Dica: se você estiver no Chrome do iPhone, abra este site no <b>Safari</b> para conseguir instalar.
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-ellipsis-v"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">1) Abra o menu do navegador</p>
                        <p className="text-gray-300 text-xs">
                          No Chrome, toque em <b>⋮</b> (três pontinhos) no canto superior direito.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-download"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">2) Instalar / Adicionar</p>
                        <p className="text-gray-300 text-xs">
                          Toque em <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">3) Confirmar</p>
                        <p className="text-gray-300 text-xs">
                          Confirme a instalação. O app vai aparecer na tela inicial.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-300 bg-white/5 border border-white/10 rounded-xl p-3">
                    Se não aparecer “Instalar app”, geralmente é porque o navegador não liberou o prompt (isso é normal).
                    Nesse caso, use “Adicionar à tela inicial”.
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => setShowHowTo(false)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-white/10"
              >
                Entendi
              </button>
              <button
                onClick={handleAlreadyInstalled}
                className="flex-1 bg-[#C1121F] hover:bg-[#A00F19] text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
              >
                Já instalei
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER */}
      <div className="bg-[#0B1F3B]/95 backdrop-blur-md border border-[#C1121F]/30 rounded-xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        {/* Subtle Barber Pole Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 barber-pole"></div>

        <div className="flex justify-between items-start pt-2">
          <div className="flex-1">
            <h4 className="text-white font-bold font-oswald uppercase tracking-wide text-sm mb-1">
              {settings.name || 'Fio & Navalha'}
            </h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              {settings.pwaBannerText || 'Adicione à tela inicial para agendar mais rápido!'}
            </p>
          </div>

          <button
            onClick={handleDismissForSession}
            className="text-gray-500 hover:text-white p-1 -mt-1 -mr-1"
            aria-label="Fechar"
            title="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Botões (sempre iguais no iOS e Android) */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-[#C1121F] hover:bg-[#A00F19] text-white py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
          >
            Instalar App
          </button>
          <button
            onClick={handleDismissForSession}
            className="px-4 py-2 rounded border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5"
          >
            Depois
          </button>
        </div>

        <button
          onClick={handleAlreadyInstalled}
          className="text-[10px] text-gray-300 hover:text-white underline underline-offset-2 self-start mt-1"
        >
          Já instalei
        </button>
      </div>
    </div>
  );
};

export default PWABanner;
