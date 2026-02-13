
import React, { useState } from 'react';

const PythonCodeExport: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const pythonCode = `import pandas as pd
import re

def normalize_contact(contact):
    """숫자만 남기기"""
    if pd.isna(contact): return ""
    return re.sub(r'[^0-9]', '', str(contact))

def find_column(df, synonyms):
    """유사 컬럼명 찾기"""
    for col in df.columns:
        clean_col = str(col).lower().replace(" ", "")
        if any(s.lower() in clean_col for s in synonyms):
            return col
    return None

def has_name_overlap(name1, name2):
    """이름 두 글자 이상 일치 여부"""
    if not name1 or not name2: return False
    n1, n2 = str(name1), str(name2)
    common = set(n1) & set(n2)
    return len(common) >= 2

def analyze_loyalty(history_path, today_path, threshold=2):
    # 엑셀 로드
    df_history = pd.read_excel(history_path)
    df_today = pd.read_excel(today_path)

    # 컬럼 매핑 사전
    synonyms = {
        'name': ['고객명', '이름', '성함', '예약자명', 'Customer'],
        'contact': ['연락처', '전화번호', '휴대폰', 'Phone'],
        'status': ['상태', '진행상태', 'Status']
    }

    h_name = find_column(df_history, synonyms['name'])
    h_contact = find_column(df_history, synonyms['contact'])
    h_status = find_column(df_history, synonyms['status'])

    t_name = find_column(df_today, synonyms['name'])
    t_contact = find_column(df_today, synonyms['contact'])
    t_status = find_column(df_today, synonyms['status'])

    # 1. 과거 이력 분석 (입실 완료)
    complete_status = ['입실 완료', '입실완료']
    df_complete = df_history[df_history[h_status].astype(str).str.contains('|'.join(complete_status))]
    
    # 방문 횟수 집계
    df_complete['normalized_contact'] = df_complete[h_contact].apply(normalize_contact)
    loyalty_counts = df_complete.groupby('normalized_contact').agg({
        h_name: 'first',
        'normalized_contact': 'count'
    }).rename(columns={'normalized_contact': 'visit_count'})

    loyal_customers = loyalty_counts[loyalty_counts['visit_count'] >= threshold]

    # 2. 오늘 예약 분석 (예약 대기, 입금 완료)
    today_target_status = ['예약 대기', '예약대기', '입금 완료', '입금완료']
    df_today_target = df_today[df_today[t_status].astype(str).str.contains('|'.join(today_target_status))].copy()
    df_today_target['normalized_contact'] = df_today_target[t_contact].apply(normalize_contact)

    # 3. 매칭
    results = []
    for _, row in df_today_target.iterrows():
        contact = row['normalized_contact']
        if contact in loyal_customers.index:
            loyal_info = loyal_customers.loc[contact]
            if has_name_overlap(row[t_name], loyal_info[h_name]):
                results.append({
                    '고객명': row[t_name],
                    '연락처': row[t_contact],
                    '총 방문 횟수': loyal_info['visit_count'],
                    '현재 상태': row[t_status]
                })

    return pd.DataFrame(results)

# 사용 예시:
# result_df = analyze_loyalty('past_history.xlsx', 'today_reservations.xlsx', threshold=2)
# print(result_df.to_string(index=False))`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-300 p-6 rounded-xl overflow-hidden mt-8 shadow-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <i className="fab fa-python text-yellow-400"></i> Python 분석 코드
        </h3>
        <button
          onClick={copyToClipboard}
          className="bg-slate-700 hover:bg-slate-600 transition text-sm px-4 py-2 rounded-md flex items-center gap-2 text-white"
        >
          {copied ? <><i className="fas fa-check"></i> 복사됨</> : <><i className="fas fa-copy"></i> 코드 복사</>}
        </button>
      </div>
      <pre className="text-sm font-mono overflow-x-auto p-4 bg-slate-950 rounded-lg custom-scrollbar">
        <code>{pythonCode}</code>
      </pre>
    </div>
  );
};

export default PythonCodeExport;
