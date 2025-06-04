import React, { useState, useRef, useEffect } from 'react';

interface Entry {
  key: number;
  value: string;
  bucket: number;
  id: string;
}

const BUCKET_COUNT = 10;
const KEY_OPTIONS = Array.from({ length: 10 }, (_, i) => 10 + i); // [10, 11, ..., 19]
const VALUE_OPTIONS = [
  'Apple', 'Banana', 'Cat', 'Dog', 'Elephant', 'Fox', 'Grape', 'Horse', 'Iguana', 'Jaguar'
];

function sumOfDigits(n: number) {
  return n.toString().split('').reduce((acc, d) => acc + Number(d), 0);
}

function hash(key: number) {
  return sumOfDigits(key) % BUCKET_COUNT;
}

const SunIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <path strokeLinecap="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 111.7 4.7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8v4h4" />
  </svg>
);

const LinkedHashMapVisualizer: React.FC = () => {
  const [buckets, setBuckets] = useState<Entry[][]>(Array(BUCKET_COUNT).fill(null).map(() => []));
  const [linkedList, setLinkedList] = useState<Entry[]>([]);
  const [message, setMessage] = useState('');
  const [dark, setDark] = useState(false);
  const [operation, setOperation] = useState<'put' | 'get' | 'remove' | 'containsKey' | 'keySet' | 'values'>('put');
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const linkedListContainerRef = useRef<HTMLDivElement>(null);
  const lastNodeRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'red' | 'green' | null>(null);

  // Auto-scroll and highlight when linkedList changes (put)
  useEffect(() => {
    if (highlightedId && linkedList.length > 0) {
      const idx = linkedList.findIndex(e => e.id === highlightedId);
      if (idx !== -1 && lastNodeRef.current && linkedListContainerRef.current) {
        lastNodeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    }
  }, [highlightedId, linkedList]);

  // Helper to find entry in bucket
  const findEntryInBucket = (bucket: Entry[], key: number) => bucket.find(e => e.key === key);

  // PUT handler
  const handlePut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey || inputValue === '') {
      setMessage('Please enter both key and value.');
      return;
    }
    const keyNum = Number(inputKey);
    if (isNaN(keyNum)) {
      setMessage('Key must be a number.');
      return;
    }
    const bucketIdx = hash(keyNum);
    let updated = false;
    let newEntryId = keyNum.toString();
    setBuckets(prevBuckets => {
      const newBuckets = prevBuckets.map(arr => [...arr]);
      const bucket = newBuckets[bucketIdx];
      const entryIdx = bucket.findIndex(e => e.key === keyNum);
      if (entryIdx !== -1) {
        bucket[entryIdx].value = inputValue;
        updated = true;
        newEntryId = bucket[entryIdx].id;
      } else {
        const newEntry: Entry = { key: keyNum, value: inputValue, bucket: bucketIdx, id: keyNum.toString() };
        bucket.push(newEntry);
        newEntryId = newEntry.id;
      }
      return newBuckets;
    });
    setLinkedList(prevList => {
      const idx = prevList.findIndex(e => e.key === keyNum);
      if (idx !== -1) {
        const newList = [...prevList];
        newList[idx].value = inputValue;
        return newList;
      } else {
        return [...prevList, { key: keyNum, value: inputValue, bucket: bucketIdx, id: keyNum.toString() }];
      }
    });
    setMessage(updated
      ? ` put(${keyNum}, "${inputValue}") → updated existing node; value changed to "${inputValue}".`
      : ` put(${keyNum}, "${inputValue}") → inserted into Bucket ${bucketIdx} and appended to tail.`
    );
    setInputKey('');
    setInputValue('');
    setResult(null);
    setHighlightColor('yellow');
    setHighlightedId(newEntryId);
    setTimeout(() => {
      setHighlightedId(null);
      setHighlightColor(null);
    }, 1000);
  };

  // GET handler
  const handleGet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey) {
      setMessage('Please enter a key.');
      return;
    }
    const keyNum = Number(inputKey);
    if (isNaN(keyNum)) {
      setMessage('Key must be a number.');
      return;
    }
    const bucketIdx = hash(keyNum);
    const entry = buckets[bucketIdx].find(e => e.key === keyNum);
    if (entry) {
      setMessage(` get(${keyNum}) → "${entry.value}".`);
      setResult(entry.value);
      highlightNode(keyNum, 'green');
    } else {
      setMessage(`❌ get(${keyNum}) returned null (not present).`);
      setResult(null);
    }
    setInputKey('');
  };

  // REMOVE handler
  const handleRemove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey) {
      setMessage('Please enter a key.');
      return;
    }
    const keyNum = Number(inputKey);
    if (isNaN(keyNum)) {
      setMessage('Key must be a number.');
      return;
    }
    const bucketIdx = hash(keyNum);
    let found = false;
    const entry = linkedList.find(e => e.key === keyNum);
    if (entry) {
      setHighlightedId(entry.id);
      setHighlightColor('red');
      setTimeout(() => {
        setBuckets(prevBuckets => {
          const newBuckets = prevBuckets.map(arr => [...arr]);
          const bucket = newBuckets[bucketIdx];
          const entryIdx = bucket.findIndex(e => e.key === keyNum);
          if (entryIdx !== -1) {
            bucket.splice(entryIdx, 1);
            found = true;
          }
          return newBuckets;
        });
        setLinkedList(prevList => prevList.filter(e => e.key !== keyNum));
        setMessage(found
          ? `remove(${keyNum}) → node removed from Bucket ${bucketIdx} and unlinked from list.`
          : ''
        );
        setInputKey('');
        setResult(null);
        setHighlightedId(null);
        setHighlightColor(null);
      }, 1000);
      if (lastNodeRef.current && linkedListContainerRef.current) {
        lastNodeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    } else {
      setBuckets(prevBuckets => {
        const newBuckets = prevBuckets.map(arr => [...arr]);
        const bucket = newBuckets[bucketIdx];
        const entryIdx = bucket.findIndex(e => e.key === keyNum);
        if (entryIdx !== -1) {
          bucket.splice(entryIdx, 1);
          found = true;
        }
        return newBuckets;
      });
      setLinkedList(prevList => prevList.filter(e => e.key !== keyNum));
      setMessage(found
        ? `remove(${keyNum}) → node removed from Bucket ${bucketIdx} and unlinked from list.`
        : ''
      );
      setInputKey('');
      setResult(null);
    }
  };

  // CONTAINS KEY handler
  const handleContainsKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey) {
      setMessage('Please enter a key.');
      return;
    }
    const keyNum = Number(inputKey);
    if (isNaN(keyNum)) {
      setMessage('Key must be a number.');
      return;
    }
    const bucketIdx = hash(keyNum);
    const found = buckets[bucketIdx].some(e => e.key === keyNum);
    setMessage(found
      ? `🔑 containsKey(${keyNum}) → true.`
      : `❌ containsKey(${keyNum}) → false.`
    );
    setInputKey('');
    setResult(null);
    highlightNode(keyNum, 'green');
  };

  // KEYSET handler
  const handleKeySet = () => {
    const keys = linkedList.map(e => e.key);
    setMessage(`KeySet() → [${keys.join(', ')}]`);
    setResult(keys);
  };

  // VALUES handler
  const handleValues = () => {
    const values = linkedList.map(e => e.value);
    setMessage(`Values() → [${values.map(v => `"${v}"`).join(', ')}]`);
    setResult(values);
  };

  const handleReset = () => {
    setBuckets(Array(BUCKET_COUNT).fill(null).map(() => []));
    setLinkedList([]);
    setMessage('');
  };

  const handleToggleTheme = () => {
    setDark((d) => !d);
  };

  // Helper to highlight node by key and color
  const highlightNode = (key: number, color: 'red' | 'green') => {
    const entry = linkedList.find(e => e.key === key);
    if (entry) {
      setHighlightedId(entry.id);
      setHighlightColor(color);
      setTimeout(() => {
        setHighlightedId(null);
        setHighlightColor(null);
      }, 1000);
    }
  };

  // For get, remove, containsKey forms, use only keys present in linkedList
  const presentKeys = linkedList.map(e => e.key);

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${dark ? 'bg-gray-900' : 'bg-gray-100'}` + (dark ? ' dark' : '')}>
      <div
        className="relative flex flex-col items-center justify-center w-full max-w-[580px] max-h-[650px] min-h-[650px] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-auto"
        style={{ height: 650 }}
      >
        {/* Top right controls */}
        <div className="absolute top-2 right-2 flex gap-3 z-10">
          <button onClick={handleReset} title="Reset" className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <ResetIcon />
          </button>
          <button onClick={handleToggleTheme} title="Toggle dark/light mode" className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        <div className="w-full flex flex-col items-center justify-center px-2">
          <h1 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-500 bg-clip-text">
            LinkedHashMap:Visualization
          </h1>
          {/* Operation Selector */}
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            {['put', 'get', 'remove', 'containsKey', 'keySet', 'values'].map(op => (
              <button
                key={op}
                onClick={() => { setOperation(op as any); setMessage(''); setInputKey(''); setInputValue(''); setResult(null); }}
                className={`px-3 py-1 rounded-lg border font-semibold transition-all ${operation === op ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900'}`}
              >
                {op === 'put' && 'Put'}
                {op === 'get' && 'Get'}
                {op === 'remove' && 'Remove'}
                {op === 'containsKey' && 'ContainsKey'}
                {op === 'keySet' && 'KeySet'}
                {op === 'values' && 'Values'}
              </button>
            ))}
          </div>
          {/* Dynamic Input Area */}
          <div className="mb-2 w-full flex flex-col items-center">
            {operation === 'put' && (
              <form className="flex gap-2" onSubmit={handlePut}>
                <label className="flex items-center gap-1">Key:
                  <select className="border rounded px-2 py-1" value={inputKey} onChange={e => setInputKey(e.target.value)}>
                    <option value="">Select</option>
                    {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1">Value:
                  <select className="border rounded px-2 py-1" value={inputValue} onChange={e => setInputValue(e.target.value)}>
                    <option value="">Select</option>
                    {VALUE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <button type="submit" className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">put()</button>
              </form>
            )}
            {operation === 'get' && (
              <form className="flex gap-2" onSubmit={handleGet}>
                <label className="flex items-center gap-1">Key:
                  <select className="border rounded px-2 py-1" value={inputKey} onChange={e => setInputKey(e.target.value)}>
                    <option value="">Select</option>
                    {presentKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <button type="submit" className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">get()</button>
              </form>
            )}
            {operation === 'remove' && (
              <form className="flex gap-2" onSubmit={handleRemove}>
                <label className="flex items-center gap-1">Key:
                  <select className="border rounded px-2 py-1" value={inputKey} onChange={e => setInputKey(e.target.value)}>
                    <option value="">Select</option>
                    {presentKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <button type="submit" className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">remove()</button>
              </form>
            )}
            {operation === 'containsKey' && (
              <form className="flex gap-2" onSubmit={handleContainsKey}>
                <label className="flex items-center gap-1">Key:
                  <select className="border rounded px-2 py-1" value={inputKey} onChange={e => setInputKey(e.target.value)}>
                    <option value="">Select</option>
                    {presentKeys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <button type="submit" className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">containsKey()</button>
              </form>
            )}
            {operation === 'keySet' && (
              <button className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" onClick={handleKeySet}>keySet()</button>
            )}
            {operation === 'values' && (
              <button className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" onClick={handleValues}>values()</button>
            )}
          </div>
          {/* Status/Message Area */}
          {message && (
            <p className="mt-2 text-sm text-gray-600 text-center animate-fade-in dark:text-gray-300">{message}</p>
          )}
          {operation === 'put' && inputKey !== '' && !isNaN(Number(inputKey)) && (
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              <div>Sample Hash Function: (sum of digits % 10)</div>
              <div>({inputKey.split('').join(' + ')}) % 10 = {sumOfDigits(Number(inputKey)) % 10}</div>
            </div>
          )}
          {/* Linked List */}
          <div className="flex flex-col items-center mt-6 w-full">
            <div className="flex flex-row items-center gap-4 w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 pl-4" ref={linkedListContainerRef}>
              {linkedList.length === 0 ? (
                <div className="flex flex-col items-center">
                  <div className="border border-black dark:border-white rounded w-24 h-12 flex flex-row items-stretch bg-white dark:bg-gray-800">
                    <div className="flex-1 flex items-center justify-center border-r border-black dark:border-white text-xs">null</div>
                    <div className="flex-1 flex items-center justify-center bg-blue-50 dark:bg-gray-700 font-bold text-sm border-r border-black dark:border-white text-gray-400"> </div>
                    <div className="flex-1 flex items-center justify-center text-xs">null</div>
                  </div>
                </div>
              ) : (
                linkedList.map((entry, idx) => (
                  <React.Fragment key={entry.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`border border-black dark:border-white rounded min-w-[8rem] h-14 flex flex-row items-stretch bg-white dark:bg-gray-800 ${highlightedId === entry.id && highlightColor === 'yellow' ? 'bg-yellow-200 transition-colors duration-500' : ''} ${highlightedId === entry.id && highlightColor === 'red' ? 'border-4 border-red-500 transition-colors duration-500' : ''} ${highlightedId === entry.id && highlightColor === 'green' ? 'border-4 border-green-500 transition-colors duration-500' : ''}`}
                        ref={idx === linkedList.length - 1 ? lastNodeRef : undefined}
                      >
                        <div className="flex-1 flex items-center justify-center border-r border-black dark:border-white text-xs">
                          {idx === 0 ? 'null' : 'Prev'}
                        </div>
                        <div className="flex-1 flex-grow min-w-21 flex items-center justify-center bg-blue-100 dark:bg-blue-900 font-bold text-sm border-r border-black dark:border-white px-4 py-2 break-words">
                          {entry.key} → "{entry.value}"
                        </div>
                        <div className="flex-1 flex items-center justify-center text-xs">
                          {idx === linkedList.length - 1 ? 'null' : 'Next'}
                        </div>
                      </div>
                    </div>
                    {idx < linkedList.length - 1 && (
                      <span className="text-2xl mx-2 text-gray-500 dark:text-gray-300">⇄</span>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">Doubly Linked List (insertion order)</div>
          </div>
          {/* Buckets below */}
          <div className="flex flex-row gap-3 justify-center mt-10 w-full flex-wrap">
            {buckets.map((bucket, i) => (
              <div key={i} className="flex flex-col items-center w-[120px] min-h-[80px] p-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded">
                  <div className="font-semibold border-b border-black dark:border-white w-full text-center py-1 bg-gray-100 dark:bg-gray-700 text-xs">Bucket {i}</div>
                <div className="flex-1 flex flex-col items-center justify-start gap-y-2 w-full mt-2">
                    {bucket.length === 0 ? (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">(empty)</span>
                    ) : (
                      bucket.map(entry => (
                      <div key={entry.id} className="border rounded px-2 py-1 bg-blue-100 text-sm truncate w-full">
                        {entry.key} → "{entry.value}"
                        </div>
                      ))
                    )}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default LinkedHashMapVisualizer; 