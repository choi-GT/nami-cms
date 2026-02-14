
import React, { useState } from 'react';

const PythonCodeExport: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const pythonCode = `import pandas as pd
import re

def normalize_contact(contact):
    """숫자만 남기기"""
    if pd.isna(contact): return ""
    return re.sub(r'[^0-9]', '', str(contact))

def clean_name(name):
    """특수문자 제거 및 공백 제거"""
    if pd.isna(name): return ""
    return re.sub(r'[^a-zA-Z0-9가-힣]', '', str(name)).strip()

def find_column(df, synonyms):
    """유사 컬럼명 찾기"""
    for col in df.columns:
        clean_col = str(col).lower().replace(" ", "")
        if any(s.lower() in clean_col for s in synonyms):
            return col
    return None

def has_name_overlap(name1, name2):
    """이름 포함 관계 확인 (엄격한 규칙)"""
    n1, n2 = clean_name(name1), clean_name(name2)
    if len(n1) < 2 or len(n2) < 2:
        return False
    # 한 이름이 다른 이름에 포함되어 있어야 함
    return (n1 in n2) or (n2 in n1)

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

    # 1. 과거 이력 분석 (입실 완료 대상)
    complete_status = ['입실 완료', '입실완료']
    df_complete = df_history[df_history[h_status].astype(str).str.contains('|'.join(complete_status))].copy()
    df_complete['norm_contact'] = df_complete[h_contact].apply(normalize_contact)

    # 연락처별로 그룹화한 뒤, 성함 유사성 클러스터링
    loyal_groups = {} # contact -> list of {name, count}
    
    for _, row in df_complete.iterrows():
        contact = row['norm_contact']
        name = str(row[h_name]).strip()
        if not contact or not name: continue
        
        if contact not in loyal_groups:
            loyal_groups[contact] = []
            
        found = False
        for person in loyal_groups[contact]:
            if has_name_overlap(name, person['name']):
                person['count'] += 1
                found = True
                break
        if not found:
            loyal_groups[contact].append({'name': name, 'count': 1})

    # 2. 오늘 예약 분석 (예약 대기, 입금 완료 대상)
    today_target_status = ['예약 대기', '예약대기', '입금 완료', '입금완료']
    df_today_target = df_today[df_today[t_status].astype(str).str.contains('|'.join(today_target_status))].copy()
    df_today_target['norm_contact'] = df_today_target[t_contact].apply(normalize_contact)

    # 3. 매칭
    results = []
    for _, row in df_today_target.iterrows():
        contact = row['norm_contact']
        name = str(row[t_name]).strip()
        
        if contact in loyal_groups:
            for person in loyal_groups[contact]:
                if has_name_overlap(name, person['name']) and person['count'] >= threshold:
                    results.append({
                        '고객명': row[t_name],
                        '연락처': row[t_contact],
                        '총 방문 횟수': person['count'],
                        '현재 상태': row[t_status]
                    })
                    break

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
