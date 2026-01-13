import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { 
  User, Link, Calculator, RefreshCcw, X, ChevronRight,
  ArrowLeftRight, Grid, Instagram, Globe
} from 'lucide-react';

// --- 獨立時鐘組件 ---
const LiveClock = memo(() => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-3 sm:px-6 hover:bg-white/10 h-full flex flex-col items-end justify-center leading-none border-l border-white/10 transition-colors">
      <span className="mb-0.5 font-medium text-white tracking-tighter shadow-sm text-sm sm:text-base">
        {time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </span>
      <span className="text-[9px] sm:text-[10px] opacity-80 text-white font-light uppercase tracking-wider">
        {time.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
      </span>
    </div>
  );
});

const App = () => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeApp, setActiveApp] = useState('info'); 

  // --- 匯率配置 ---
  const rates = { TWD: 1, USD: 0.031, JPY: 4.58, EUR: 0.028, GBP: 0.024, HKD: 0.24, CNY: 0.22, KRW: 41.5, AUD: 0.046 };
  const currencyNames = { TWD: "台幣", USD: "美金", JPY: "日圓", EUR: "歐元", GBP: "英鎊", HKD: "港幣", CNY: "人民幣", KRW: "韓元", AUD: "澳幣" };
  const currencyFlags = { TWD: "🇹🇼", USD: "🇺🇸", JPY: "🇯🇵", EUR: "🇪🇺", GBP: "🇬🇧", HKD: "🇭🇰", CNY: "🇨🇳", KRW: "🇰🇷", AUD: "🇦🇺" };

  // --- 匯率狀態 ---
  const [currencyAmount, setCurrencyAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('TWD');
  const [toCurrency, setToCurrency] = useState('USD');
  const convertedResult = useMemo(() => 
    (currencyAmount * (rates[toCurrency] / rates[fromCurrency])).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [currencyAmount, fromCurrency, toCurrency, rates]
  );

  // --- 計算機狀態 ---
  const [calcDisplay, setCalcDisplay] = useState('0');

  // --- 全域鍵盤監聽 ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZoomed) return;
      if (activeApp === 'currency') {
        if (/^[0-9]$/.test(e.key)) setCurrencyAmount(prev => Number(String(prev === 0 ? '' : prev) + e.key));
        else if (e.key === 'Backspace') setCurrencyAmount(prev => Math.floor(prev / 10));
      }
      if (activeApp === 'calc') {
        if (/^[0-9+\-*/.]$/.test(e.key)) {
          e.preventDefault();
          setCalcDisplay(prev => (prev === '0' || prev === '錯誤') ? e.key : prev + e.key);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          try {
            const sanitized = calcDisplay.replace(/[^-+*/.0-9]/g, '');
            const result = new Function(`return ${sanitized}`)();
            setCalcDisplay(String(result));
          } catch { setCalcDisplay('錯誤'); }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (e.key === 'Escape') setCalcDisplay('0');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeApp, isZoomed, calcDisplay]);

  const handleCalcBtn = (val) => {
    if (val === 'C') setCalcDisplay('0');
    else if (val === '=') {
      try {
        const sanitized = calcDisplay.replace(/[^-+*/.0-9]/g, '');
        const result = new Function(`return ${sanitized}`)();
        setCalcDisplay(String(result));
      } catch { setCalcDisplay('錯誤'); }
    } else setCalcDisplay(prev => (prev === '0' || prev === '錯誤') ? val : prev + val);
  };

  /**
   * 響應式視窗容器
   * 手機版：滿版顯示
   * 電腦版：增加底部空間 (bottom-20) 避免壓縮
   */
  const WindowFrame = ({ title, icon: IconComp, children, id, bgColor = "bg-white" }) => (
    <div className={`
      absolute transition-all duration-500 rounded-xl border border-neutral-300 overflow-hidden z-50 shadow-2xl
      ${activeApp === id ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
      top-2 left-2 right-2 bottom-14
      sm:top-6 sm:left-24 sm:right-6 sm:bottom-20
      ${bgColor}
    `} style={{ transform: activeApp === id ? 'translateZ(0)' : 'scale(0.95)' }}>
      <div className="h-10 sm:h-12 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 border-b border-neutral-100 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <IconComp size={16} className="text-neutral-400" />
          <span className="text-[10px] sm:text-[11px] text-neutral-800 font-bold tracking-[0.1em] uppercase truncate max-w-[150px]">{title}</span>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors" onClick={() => setActiveApp('')}>
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth h-[calc(100%-40px)] sm:h-[calc(100%-48px)]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans p-0 sm:p-4 antialiased">
      <div 
        className="relative w-full h-full sm:w-auto sm:h-auto group transition-all duration-700 ease-in-out will-change-transform"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => { setIsZoomed(false); setActiveApp(''); }}
        style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}
      >
        <div 
          className={`
            relative bg-[#111] transition-all duration-700 transform
            w-full h-full sm:w-[820px] sm:h-[600px]
            sm:p-4 sm:rounded-[2.5rem] sm:border-[1px] sm:border-white/5 
            sm:shadow-[0_50px_100px_rgba(0,0,0,0.8)]
            ${isZoomed ? 'sm:scale-105 sm:-translate-y-2' : 'scale-100'}
          `}
          style={{ backfaceVisibility: 'hidden', transform: isZoomed ? 'scale(1.05) translateY(-8px) translateZ(0)' : 'scale(1) translateZ(0)' }}
        >
          
          <div className="relative w-full h-full bg-[#000] overflow-hidden select-none sm:rounded-2xl sm:border sm:border-white/5 shadow-inner">
            
            {/* 背景裝飾 */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isZoomed ? 'opacity-100' : 'opacity-60 sm:opacity-40'}`}>
               <div className="absolute inset-0 bg-[#004275]" />
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-black/80" />
               <div className="absolute top-[30%] left-[-10%] w-[120%] h-[1px] bg-white/10 rotate-[15deg] blur-sm" />
            </div>

            {/* 介面內容層 */}
            <div className={`relative h-full z-30 flex flex-col transition-all duration-700 ${isZoomed ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-95'}`} style={{ backfaceVisibility: 'hidden' }}>
              
              {/* 側邊導航 */}
              <div className="flex-1 p-6 sm:p-10 flex flex-col gap-6 sm:gap-10 w-fit items-center">
                {[
                  { id: 'info', icon: User, label: '個人簡介' },
                  { id: 'shorten', icon: Link, label: '縮短網址' },
                  { id: 'calc', icon: Calculator, label: '計算工具' },
                  { id: 'currency', icon: RefreshCcw, label: '匯率轉換' },
                ].map((item) => (
                  <div key={item.id} onClick={(e) => { e.stopPropagation(); setActiveApp(item.id); }} className="flex flex-col items-center justify-center p-1 group cursor-pointer pointer-events-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-md group-hover:bg-white/20 group-active:scale-90 transition-all shadow-lg mb-2">
                      <item.icon size={20} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    {/* 清晰文字優化 */}
                    <span className="text-[10px] sm:text-[11px] text-white font-medium tracking-normal leading-tight px-1 transition-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* 視窗組件集 */}
              <WindowFrame title="個人簡介" icon={User} id="info" bgColor="bg-[#fffdfa]">
                <div className="h-full flex flex-col items-center">
                  <div className="w-full py-12 px-6 sm:py-20 sm:px-10 text-center border-b border-neutral-100">
                     <div className="text-[9px] font-black text-amber-800/40 tracking-[0.5em] uppercase mb-8 font-mono">始於 2026</div>
                     <h2 className="text-4xl sm:text-7xl font-light tracking-tighter text-neutral-900 mb-4 font-serif uppercase leading-none">Litsou</h2>
                     <div className="w-12 h-0.5 bg-amber-600 mx-auto mb-6" />
                     <p className="text-xs sm:text-sm text-neutral-400 tracking-[0.2em] font-serif italic">好久沒寫code</p>
                  </div>
                  <div className="max-w-xl w-full p-8 sm:p-14 space-y-16 sm:space-y-24 text-center">
                     <section className="space-y-6">
                        <div className="text-[9px] font-black text-amber-700 uppercase tracking-[0.4em]">當前追求</div>
                        <h3 className="text-xl sm:text-2xl text-neutral-800 font-serif leading-snug">目前經營電商同時製作二手平台</h3>
                        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">致力於商業邏輯與技術美學的完美平衡。</p>
                     </section>
                     <section className="flex flex-col items-center border-t border-neutral-100 pt-12 sm:pt-16">
                        <div className="text-[9px] font-black text-amber-700 uppercase tracking-[0.4em] mb-4">品牌經營</div>
                        <h4 className="text-2xl sm:text-3xl font-serif text-neutral-900 mb-6 font-semibold">搞鼠鼠 GAOSUSU</h4>
                        <a href="https://www.instagram.com/gaosusu.shop/" target="_blank" rel="noopener noreferrer" className="px-8 py-3 sm:px-10 sm:py-4 border border-neutral-900 text-neutral-900 text-[9px] font-black tracking-[0.4em] uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300">追蹤 Instagram</a>
                     </section>
                     <section className="bg-neutral-900 text-white p-10 sm:p-14 rounded-sm text-center shadow-2xl">
                        <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 font-mono text-center">開發中</div>
                        <h4 className="text-xl sm:text-3xl font-serif text-center">真正 C2C 二手交易平台</h4>
                     </section>
                  </div>
                </div>
              </WindowFrame>

              <WindowFrame title="匯率轉換" icon={RefreshCcw} id="currency" bgColor="bg-[#fffdfa]">
                <div className="h-full flex flex-col justify-center p-6 sm:p-20">
                  <div className="max-w-2xl mx-auto w-full space-y-8 sm:space-y-16">
                    <div className="flex justify-between items-end border-b border-neutral-100 pb-4">
                       <h2 className="text-lg sm:text-3xl font-serif text-neutral-900 tracking-tight">匯率換算器</h2>
                       <span className="text-[8px] sm:text-[9px] font-black text-amber-700 uppercase tracking-[0.3em]">即時數據</span>
                    </div>
                    <div className="space-y-6 sm:space-y-10">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                         <div className="w-full sm:w-48 relative">
                            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full text-base sm:text-xl font-serif bg-transparent border-b border-neutral-200 py-2 outline-none appearance-none cursor-pointer focus:border-amber-600 transition-colors uppercase">
                               {Object.keys(rates).map(cur => <option key={cur} value={cur}>{currencyFlags[cur]} {cur}</option>)}
                            </select>
                            <ChevronRight size={12} className="absolute right-0 bottom-4 rotate-90 text-neutral-300 pointer-events-none" />
                         </div>
                         <div className="flex-1 text-right">
                            <div className="text-4xl sm:text-6xl font-light font-serif text-neutral-900 tracking-tighter leading-none">{currencyAmount.toLocaleString()}</div>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-1">{currencyNames[fromCurrency]}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="h-[1px] flex-1 bg-neutral-100"></div>
                         <button onClick={() => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); }} className="p-2 sm:p-4 rounded-full border border-neutral-100 hover:text-amber-600 hover:border-amber-600 transition-all active:scale-90 shadow-sm">
                            <ArrowLeftRight size={18} />
                         </button>
                         <div className="h-[1px] flex-1 bg-neutral-100"></div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                         <div className="w-full sm:w-48 relative">
                            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full text-base sm:text-xl font-serif bg-transparent border-b border-neutral-200 py-2 outline-none appearance-none cursor-pointer focus:border-amber-600 transition-colors uppercase">
                               {Object.keys(rates).map(cur => <option key={cur} value={cur}>{currencyFlags[cur]} {cur}</option>)}
                            </select>
                            <ChevronRight size={12} className="absolute right-0 bottom-4 rotate-90 text-neutral-300 pointer-events-none" />
                         </div>
                         <div className="flex-1 text-right">
                            <div className="text-4xl sm:text-6xl font-light font-serif text-amber-600 tracking-tighter leading-none">{convertedResult}</div>
                            <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-1">{currencyNames[toCurrency]}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </WindowFrame>

              <WindowFrame title="計算工具" icon={Calculator} id="calc" bgColor="bg-[#fffdfa]">
                <div className="h-full flex flex-col justify-center px-6 py-4 sm:px-20 sm:py-10">
                  <div className="max-w-md mx-auto w-full">
                    <div className="flex justify-between items-end border-b border-neutral-100 pb-2">
                       <h2 className="text-lg sm:text-2xl font-serif text-neutral-900 tracking-tight">計算機</h2>
                       <span className="text-[9px] font-black text-amber-700 uppercase tracking-[0.3em]">數學奧妙</span>
                    </div>
                    <div className="text-right py-4 sm:py-8">
                       <label className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.4em] mb-1 block">當前算式</label>
                       <div className="text-4xl sm:text-7xl font-light font-serif text-neutral-900 tracking-tighter truncate border-b-2 border-neutral-900 pb-2 min-h-[50px] sm:min-h-[80px] leading-none">
                          {calcDisplay}
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                       {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                         <button 
                            key={btn} 
                            onClick={() => handleCalcBtn(btn)} 
                            className={`py-3 sm:py-5 font-serif text-lg sm:text-xl transition-all rounded-sm active:scale-95
                              ${btn === '=' ? 'bg-neutral-900 text-white shadow-lg' : 'bg-white border border-neutral-100 text-neutral-600 hover:bg-neutral-50'}
                              ${btn === 'C' ? 'text-amber-700 font-bold' : ''}
                            `}
                         >
                            {btn === '*' ? '×' : btn === '/' ? '÷' : btn}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </WindowFrame>

              <WindowFrame title="縮短網址" icon={Link} id="shorten">
                <div className="h-full flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-white space-y-8 sm:space-y-12">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100 shadow-inner">
                    <Link size={32} className="text-neutral-300" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl sm:text-5xl font-serif text-neutral-900 tracking-tighter">縮短網址</h3>
                    <p className="text-[10px] text-amber-700 font-black tracking-[0.4em] uppercase">私有縮網址服務系統</p>
                  </div>
                  <button 
                    onClick={() => window.open('https://u.lit-sou.com', '_blank')}
                    className="group bg-neutral-900 text-white w-full sm:w-auto px-10 py-4 sm:px-16 sm:py-6 rounded-sm flex items-center justify-center gap-4 sm:gap-8 hover:opacity-90 transition-all active:scale-95 shadow-2xl"
                  >
                    <span className="font-black text-[10px] sm:text-[12px] tracking-[0.4em] uppercase">立即前往</span>
                    <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </WindowFrame>

              {/* 底部工作列 - 增加內距避免壓縮 */}
              <div className="h-12 sm:h-16 bg-black/95 backdrop-blur-2xl flex items-center justify-between px-0 z-[60] border-t border-white/5 shrink-0 overflow-hidden mt-auto">
                <div className="flex h-full items-center pointer-events-auto">
                  <div className="px-4 sm:px-6 flex items-center justify-center hover:bg-white/10 text-white cursor-pointer opacity-30">
                    <Grid size={20} />
                  </div>
                  {[
                    { id: 'info', icon: User, label: '個人簡介' },
                    { id: 'shorten', icon: Link, label: '縮短網址' },
                    { id: 'calc', icon: Calculator, label: '計算工具' },
                    { id: 'currency', icon: RefreshCcw, label: '匯率轉換' },
                  ].map(app => (
                    <div key={app.id} 
                         title={app.label}
                         onClick={(e) => { e.stopPropagation(); setActiveApp(app.id); }} 
                         className={`h-full px-4 sm:px-6 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all relative ${activeApp === app.id ? 'bg-white/5' : ''}`}>
                      <app.icon size={20} className={`${activeApp === app.id ? 'text-white' : 'text-white/40'} transition-colors`} />
                      {activeApp === app.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-amber-600 shadow-[0_0_15px_#d97706]" />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center h-full">
                  <LiveClock />
                </div>
              </div>
            </div>

            {/* 待機鎖屏 */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none z-[20] ${isZoomed ? 'opacity-0' : 'opacity-100'}`}>
                <div className="mt-8 flex flex-col items-center gap-4">
                    <span className="text-[10px] sm:text-[11px] text-white/40 tracking-[1.2em] font-black uppercase ml-[1.2em] drop-shadow-lg">LITSOU</span>
                    <div className="w-12 h-[1px] bg-white/10 overflow-hidden relative">
                        <div className="absolute inset-0 bg-blue-500 animate-[loading_2s_infinite_ease-in-out]"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        select { appearance: none; -webkit-appearance: none; }
        .antialiased {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `}</style>
    </div>
  );
};

export default App;