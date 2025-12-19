import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getVoteResults } from '../services/vote';
import './VoteResults.css';

export default function VoteResults({ workJob }) {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const fetchResultsRef = useRef(null);
  const lastExpandedRef = useRef(expanded);
  const lastWorkJobRef = useRef(workJob);
  const intervalSetupRef = useRef(false); // Flag to prevent multiple interval setups
  const fetchTimeoutRef = useRef(null); // Store timeout for cleanup

  const fetchResults = useCallback(async () => {
    if (!workJob || isFetchingRef.current) return;
    
    // ถ้ายังไม่ expanded และโหลดไปแล้ว ให้ไม่เรียกซ้ำ
    if (!lastExpandedRef.current && hasLoadedOnceRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      const result = await getVoteResults(workJob);
      
      if (result.success) {
        setResults(result.results || []);
        setTotalVotes(result.totalVotes || 0);
      } else {
        setError(result.error || 'Unable to fetch vote results');
      }
    } catch (err) {
      setError('An error occurred while fetching vote results');
      console.error('Error fetching vote results:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [workJob]); // ไม่ใส่ expanded เพื่อป้องกัน loop

  // Store fetchResults in ref to avoid dependency issues
  useEffect(() => {
    fetchResultsRef.current = fetchResults;
  }, [fetchResults]);

  useEffect(() => {
    // ตรวจสอบว่า expanded หรือ workJob เปลี่ยนจริงๆ หรือไม่
    const expandedChanged = lastExpandedRef.current !== expanded;
    const workJobChanged = lastWorkJobRef.current !== workJob;
    
    // อัพเดท refs
    lastExpandedRef.current = expanded;
    lastWorkJobRef.current = workJob;

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!workJob) return;

    const fetchFn = fetchResultsRef.current;
    if (!fetchFn) {
      // ถ้ายังไม่มี fetchFn ให้รอสักครู่แล้วลองใหม่
      const timeout = setTimeout(() => {
        if (fetchResultsRef.current && !isFetchingRef.current) {
          if (expanded) {
            fetchResultsRef.current();
          } else if (!hasLoadedOnceRef.current) {
            fetchResultsRef.current();
            hasLoadedOnceRef.current = true;
          }
        }
      }, 100);
      return () => clearTimeout(timeout);
    }

    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (expanded) {
      // When expanded, fetch immediately only if state actually changed and not already fetching
      if (expandedChanged && !isFetchingRef.current) {
        // Use a small delay to ensure refs are updated
        fetchTimeoutRef.current = setTimeout(() => {
          if (fetchResultsRef.current && !isFetchingRef.current && lastExpandedRef.current) {
            fetchResultsRef.current();
          }
          fetchTimeoutRef.current = null;
        }, 50);
      }
      
      // Auto-refresh disabled - only refresh when user clicks refresh button or when expanded changes
      // Removed auto-refresh to prevent unnecessary API calls and loops
    } else {
      // When collapsed, stop auto-refresh completely
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        intervalSetupRef.current = false;
      }
      
      // Load once when not expanded (to show vote count in button)
      // Only if workJob changed or hasn't loaded yet
      if ((workJobChanged || !hasLoadedOnceRef.current) && !isFetchingRef.current) {
        fetchFn();
        hasLoadedOnceRef.current = true;
      }
    }

    return () => {
      // Clear timeout if exists
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      // Clear interval if exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        intervalSetupRef.current = false;
      }
    };
  }, [workJob, expanded]); // ไม่ใส่ fetchResults ใน dependency array เพื่อป้องกัน loop

  // Reset hasLoadedOnceRef when workJob changes
  useEffect(() => {
    if (lastWorkJobRef.current !== workJob) {
      hasLoadedOnceRef.current = false;
      isFetchingRef.current = false;
      lastWorkJobRef.current = workJob;
      intervalSetupRef.current = false;
      // Clear interval when workJob changes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset expanded state when workJob changes
      setExpanded(false);
    }
  }, [workJob]);


  // คำนวณเปอร์เซ็นต์
  const getPercentage = (count) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  // หาค่าสูงสุดสำหรับแสดง progress bar
  const getMaxCount = () => {
    if (results.length === 0) return 1;
    return Math.max(...results.map(r => r.count), 1);
  };

  if (!workJob) {
    return null;
  }

  if (!expanded) {
    return (
      <div className="vote-results-container">
        <button 
          className="results-toggle-button"
          onClick={() => setExpanded(true)}
        >
          <span className="results-icon">📊</span>
          <span>View Results</span>
          {totalVotes > 0 && (
            <span className="results-count">({totalVotes} votes)</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="vote-results-container expanded">
      <div className="results-header">
        <h4>📊 Vote Results</h4>
        <div className="results-header-actions">
          <button 
            className="refresh-results-button"
            onClick={fetchResults}
            disabled={loading}
            aria-label="Refresh results"
            title="Refresh results"
          >
            🔄
          </button>
          <button 
            className="close-results-button"
            onClick={() => setExpanded(false)}
            aria-label="Close results"
          >
            ×
          </button>
        </div>
      </div>

      {loading && (
        <div className="results-loading">
          <div className="spinner"></div>
          <p>Loading results...</p>
        </div>
      )}

      {error && (
        <div className="results-error">
          <p>⚠️ {error}</p>
          <button onClick={fetchResults} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="results-empty">
            <p>📭 No vote results yet</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <div className="results-summary">
            <div className="summary-item">
              <span className="summary-label">Total</span>
              <span className="summary-value">{totalVotes} votes</span>
            </div>
          </div>

          <div className="results-list">
            {results.map((result, index) => {
              const percentage = getPercentage(result.count);
              const maxCount = getMaxCount();
              const barWidth = maxCount > 0 ? (result.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className="result-option">{result.option}</span>
                    <span className="result-count">{result.count} votes ({percentage}%)</span>
                  </div>
                  <div className="result-bar-container">
                    <div 
                      className="result-bar"
                      style={{ width: `${barWidth}%` }}
                    >
                      <div className="result-bar-fill"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

