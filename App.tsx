
import React, { useState } from 'react';
import { parseExcel, analyzeLoyalty } from './utils/excelProcessor.ts';
import { MatchResult } from './types.ts';

const App: React.FC = () => {
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [todayFile, setTodayFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState<number>(2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<MatchResult | null>(null);

  const handleAnalysis = async () => {
    if (!historyFile || !todayFile) {
      setError('두 개의 파일을 모두 업로드해주세요.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const historyData = await parseExcel(historyFile);
      const todayData = await parseExcel(todayFile);
      
      const analysisResults = analyzeLoyalty(historyData, todayData, threshold);
      setResults(analysisResults);
    } catch (err) {
      console.error(err);
      setError('파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setHistoryFile(null);
    setTodayFile(null);
    setResults(null);
    setError(null);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <i className="fas fa-hotel text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">호텔 단골 고객 분석 도구</h1>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Hotel Analytics v1.0
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10">
        {/* Intro Section */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">단골 고객을 즉시 확인하세요</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            과거 예약 이력과 오늘의 예약 명단을 비교하여, 재방문 횟수가 높은 VIP 고객을 자동으로 식별합니다.
          </p>
        </div>

        {/* Input Controls */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
              <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i className="fas fa-history text-indigo-500"></i> 1단계: 과거 예약 이력 파일
              </label>
              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${historyFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => setHistoryFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center">
                  <i className={`fas ${historyFile ? 'fa-file-excel text-indigo-600' : 'fa-cloud-upload-alt text-slate-400'} text-4xl mb-3`}></i>
                  <span className="text-sm font-medium text-slate-600">
                    {historyFile ? historyFile.name : 'Excel 파일을 드래그하거나 클릭하여 업로드'}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">대상: "입실 완료" 명단</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md">
              <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-day text-emerald-500"></i> 2단계: 오늘 예약 명단 파일
              </label>
              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${todayFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400'}`}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => setTodayFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center">
                  <i className={`fas ${todayFile ? 'fa-file-excel text-emerald-600' : 'fa-cloud-upload-alt text-slate-400'} text-4xl mb-3`}></i>
                  <span className="text-sm font-medium text-slate-600">
                    {todayFile ? todayFile.name : 'Excel 파일을 드래그하거나 클릭하여 업로드'}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">대상: "예약 대기", "입금 완료" 명단</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                <i className="fas fa-cog text-slate-400"></i> 분석 설정
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">단골 기준 방문 횟수 (N회 이상)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="w-12 h-10 flex items-center justify-center bg-indigo-600 text-white font-bold rounded-lg shadow-inner">
                      {threshold}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <i className="fas fa-info-circle mr-1"></i>
                    <strong>분석 로직:</strong> <br/>
                    1. 연락처(숫자만 추출)가 일치하는지 먼저 확인합니다. <br/>
                    2. 이름 중 2글자 이상이 서로 포함되거나 일치하는 경우 최종 매칭됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}
              
              <button
                onClick={handleAnalysis}
                disabled={isAnalyzing || !historyFile || !todayFile}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                  isAnalyzing || !historyFile || !todayFile 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> 분석 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i> 분석 시작하기
                  </>
                )}
              </button>

              <button
                onClick={reset}
                className="w-full py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {results !== null && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
              <div className="bg-slate-800 p-6 flex items-center justify-between">
                <h3 className="text-white font-bold text-xl flex items-center gap-3">
                  <i className="fas fa-list-check text-emerald-400"></i> 
                  오늘 방문한 단골 고객 리스트
                  <span className="ml-2 text-sm font-normal text-slate-400">({results.length}명 검색됨)</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium bg-slate-700 px-3 py-1 rounded-full">
                  고객 클릭 시 예약 상세 정보 표시
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">현재 상태</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">총 방문 횟수</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">구분</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.length > 0 ? (
                      results.map((item, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedCustomer(item)}
                          className="hover:bg-indigo-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-800 underline decoration-indigo-200 decoration-2 underline-offset-4">{item.customerName}</td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-sm">{item.contact}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              item.todayStatus.includes('입금') 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.todayStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                              {item.totalVisits}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.totalVisits >= 5 ? (
                              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">VVIP</span>
                            ) : (
                              <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">단골</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <i className="fas fa-search text-slate-200 text-5xl mb-4"></i>
                            <p className="text-slate-400 font-medium text-lg">단골 고객 매칭 결과가 없습니다.</p>
                            <p className="text-slate-400 text-sm mt-1">기준 횟수를 낮추거나 데이터 파일을 다시 확인해주세요.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-xl font-bold">{selectedCustomer.customerName} 고객 상세 정보</h3>
                  <p className="text-indigo-100 text-sm">{selectedCustomer.contact}</p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                {/* Today's Booking Section */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-calendar-check text-indigo-500"></i> 오늘의 예약 정보
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                      <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">입실일 (오늘)</label>
                      <p className="text-lg font-bold text-indigo-900">{selectedCustomer.checkInDate || '-'}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                      <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">퇴실일 (오늘)</label>
                      <p className="text-lg font-bold text-indigo-900">{selectedCustomer.checkOutDate || '-'}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                      <label className="text-[10px] font-black text-indigo-400 uppercase block mb-1">객실명</label>
                      <p className="text-lg font-bold text-indigo-900">{selectedCustomer.todayRoomName || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Visit History Section (Table Format) */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fas fa-history text-slate-400"></i> 과거 방문 이력 리스트 ({selectedCustomer.totalVisits}회)
                  </h4>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">순서</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">입실일 (Check-in)</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">퇴실일 (Check-out)</th>
                          <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter">객실명</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {[...selectedCustomer.history].reverse().map((visit, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-slate-400">#{selectedCustomer.history.length - i}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{visit.checkIn}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{visit.checkOut}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{visit.roomName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-200">
                    <i className="fas fa-award"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase">누적 방문 횟수</p>
                    <p className="text-sm text-emerald-800 font-medium">총 <strong>{selectedCustomer.totalVisits}회</strong> 방문하신 소중한 고객님입니다.</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition shadow-xl"
                >
                  상세 보기 닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">&copy; 2024 Hotel Loyalty Analytics System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
