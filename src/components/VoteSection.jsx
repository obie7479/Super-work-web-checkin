import React, { useState, useEffect } from 'react';
import { getVoteOptions, submitVote, checkVote, getUserVote } from '../services/vote';
import VoteResults from './VoteResults';
import './VoteSection.css';

export default function VoteSection({ user }) {
  const [voteOptions, setVoteOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(true); // ตรวจสอบสถานะการโหวต
  const [error, setError] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState({}); // { workJob: selectedOption }
  const [userVotedOptions, setUserVotedOptions] = useState({}); // { workJob: votedOption } - ตัวเลือกที่ผู้ใช้โหวตไปแล้ว
  const [submitting, setSubmitting] = useState({}); // { workJob: true/false }
  const [votedStatus, setVotedStatus] = useState({}); // { workJob: true/false }
  const [message, setMessage] = useState({}); // { workJob: message }
  const [messageType, setMessageType] = useState({}); // { workJob: 'success'|'error'|'info' }

  useEffect(() => {
    if (user?.id) {
      loadVoteOptions();
    }
  }, [user?.id]);

  const loadVoteOptions = async () => {
    setLoading(true);
    setCheckingVoteStatus(true);
    setError(null);
    
    try {
      const result = await getVoteOptions();
      
      if (result.success) {
        setVoteOptions(result.voteOptions || []);
        
        // ตรวจสอบสถานะการโหวตของแต่ละงานก่อนแสดง UI
        if (result.voteOptions && result.voteOptions.length > 0) {
          await checkVoteStatuses(result.voteOptions);
        }
      } else {
        setError(result.error || 'Unable to load vote options');
      }
    } catch (err) {
      setError('An error occurred while loading vote options');
      console.error('Error loading vote options:', err);
    } finally {
      setLoading(false);
      setCheckingVoteStatus(false);
    }
  };

  const checkVoteStatuses = async (options) => {
    if (!user?.id || !options || options.length === 0) return;
    
    try {
      // ดึงข้อมูลการโหวตของผู้ใช้ทั้งหมด (เรียกครั้งเดียว)
      const userVoteResult = await getUserVote(user.id);
      
      // ตรวจสอบว่า getUserVote action มีอยู่หรือไม่ (ถ้า error message บอกว่า Invalid action)
      if (userVoteResult.error && userVoteResult.error.includes('Invalid action')) {
        console.warn('[VoteSection] getUserVote action not available, using checkVote fallback');
        // ใช้ checkVote แทน (fallback)
        const statusPromises = options.map(async (option) => {
          const result = await checkVote(user.id, option.workJob);
          return {
            workJob: option.workJob,
            hasVoted: result.hasVoted || false
          };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(status => {
          statusMap[status.workJob] = status.hasVoted;
        });
        
        setVotedStatus(statusMap);
        return;
      }
      
      if (userVoteResult.success && userVoteResult.userVotes) {
        setUserVotedOptions(userVoteResult.userVotes);
        
        // ตั้งค่า selectedVotes สำหรับตัวเลือกที่โหวตไปแล้ว
        const votedSelections = {};
        const statusMap = {};
        
        // ใช้ข้อมูลจาก getUserVote เพื่อตั้งค่า status (ไม่ต้องเรียก checkVote ซ้ำ)
        options.forEach(option => {
          if (userVoteResult.userVotes[option.workJob]) {
            votedSelections[option.workJob] = userVoteResult.userVotes[option.workJob];
            statusMap[option.workJob] = true; // มีการโหวตแล้ว
          } else {
            statusMap[option.workJob] = false; // ยังไม่โหวต
          }
        });
        
        setSelectedVotes(votedSelections);
        setVotedStatus(statusMap);
      } else {
        // ถ้า getUserVote ล้มเหลว ให้ใช้ checkVote แทน (fallback)
        const statusPromises = options.map(async (option) => {
          const result = await checkVote(user.id, option.workJob);
          return {
            workJob: option.workJob,
            hasVoted: result.hasVoted || false
          };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(status => {
          statusMap[status.workJob] = status.hasVoted;
        });
        
        setVotedStatus(statusMap);
      }
    } catch (error) {
      console.error('Error checking vote statuses:', error);
      // ถ้าเกิด error ให้ตั้งค่า default
      const statusMap = {};
      options.forEach(option => {
        statusMap[option.workJob] = false;
      });
      setVotedStatus(statusMap);
    }
  };

  const handleOptionSelect = (workJob, option) => {
    if (votedStatus[workJob]) {
      setMessage({
        ...message,
        [workJob]: 'You have already voted for this work'
      });
      setMessageType({
        ...messageType,
        [workJob]: 'info'
      });
      return;
    }
    
    setSelectedVotes({
      ...selectedVotes,
      [workJob]: option
    });
    
    // ล้างข้อความเมื่อเลือกตัวเลือกใหม่
    setMessage({
      ...message,
      [workJob]: ''
    });
  };

  const handleSubmitVote = async (workJob) => {
    if (!user?.id) {
      setMessage({
        ...message,
        [workJob]: 'User data not found'
      });
      setMessageType({
        ...messageType,
        [workJob]: 'error'
      });
      return;
    }

    const selectedOption = selectedVotes[workJob];
    if (!selectedOption) {
        setMessage({
          ...message,
          [workJob]: 'Please select an option before voting'
        });
      setMessageType({
        ...messageType,
        [workJob]: 'error'
      });
      return;
    }

    if (votedStatus[workJob]) {
      setMessage({
        ...message,
        [workJob]: 'You have already voted for this work'
      });
      setMessageType({
        ...messageType,
        [workJob]: 'info'
      });
      return;
    }

    setSubmitting({
      ...submitting,
      [workJob]: true
    });

    const userName = user.displayName || `${user.firstName} ${user.lastName}`.trim() || 'Unknown User';

    try {
      const result = await submitVote(user.id, userName, workJob, selectedOption);

      if (result.success) {
        setMessage({
          ...message,
          [workJob]: result.message || 'Vote submitted successfully'
        });
        setMessageType({
          ...messageType,
          [workJob]: 'success'
        });
        
        // อัพเดทสถานะการโหวต
        setVotedStatus({
          ...votedStatus,
          [workJob]: true
        });
        
        // อัพเดท userVotedOptions เพื่อแสดงตัวเลือกที่โหวตไปแล้ว
        setUserVotedOptions({
          ...userVotedOptions,
          [workJob]: selectedOption
        });
        
        // ตั้งค่า selectedVotes เพื่อแสดงตัวเลือกที่โหวตไปแล้ว
        setSelectedVotes({
          ...selectedVotes,
          [workJob]: selectedOption
        });
      } else {
        if (result.duplicate) {
          setMessage({
            ...message,
            [workJob]: 'You have already voted for this work'
          });
          setMessageType({
            ...messageType,
            [workJob]: 'info'
          });
          setVotedStatus({
            ...votedStatus,
            [workJob]: true
          });
        } else {
          setMessage({
            ...message,
            [workJob]: result.message || 'Vote submission failed'
          });
          setMessageType({
            ...messageType,
            [workJob]: 'error'
          });
        }
      }
    } catch (err) {
      setMessage({
        ...message,
        [workJob]: 'An error occurred while voting'
      });
      setMessageType({
        ...messageType,
        [workJob]: 'error'
      });
      console.error('Vote submission error:', err);
    } finally {
      setSubmitting({
        ...submitting,
        [workJob]: false
      });
    }
  };

  if (loading || checkingVoteStatus) {
    return (
      <div className="vote-section">
        <div className="vote-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{loading ? 'Loading vote options...' : 'Checking vote status...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-section">
        <div className="vote-container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={loadVoteOptions} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!voteOptions || voteOptions.length === 0) {
    return (
      <div className="vote-section">
        <div className="vote-container">
          <div className="empty-container">
            <p>No vote options available at this time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vote-section">
      <div className="vote-header">
        <h2>Voting System</h2>
        <p className="subtitle">Select the option you want to vote for</p>
      </div>
      
      {voteOptions.map((voteOption, index) => (
        <div key={index} className="vote-container">
          <div className="vote-work-title">
            <h3>{voteOption.workJob}</h3>
            {votedStatus[voteOption.workJob] && (
              <span className="voted-badge">✓ Voted</span>
            )}
          </div>
          
          <div className="vote-options">
            {voteOption.options.map((option, optIndex) => {
              const isSelected = selectedVotes[voteOption.workJob] === option;
              const isUserVoted = userVotedOptions[voteOption.workJob] === option;
              const isDisabled = votedStatus[voteOption.workJob] || submitting[voteOption.workJob];
              
              return (
                <label
                  key={optIndex}
                  className={`vote-option ${isSelected ? 'selected' : ''} ${isUserVoted ? 'user-voted' : ''} ${isDisabled ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name={`vote-${voteOption.workJob}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(voteOption.workJob, option)}
                    disabled={isDisabled}
                  />
                  <span className="option-text">
                    {option}
                    {isUserVoted && votedStatus[voteOption.workJob] && (
                      <span className="voted-indicator"> (You voted for this option)</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          
          {message[voteOption.workJob] && (
            <div className={`message ${messageType[voteOption.workJob] || ''}`}>
              {message[voteOption.workJob]}
            </div>
          )}
          
          <button
            className={`submit-vote-button ${votedStatus[voteOption.workJob] ? 'disabled' : ''} ${submitting[voteOption.workJob] ? 'loading' : ''}`}
            onClick={() => handleSubmitVote(voteOption.workJob)}
            disabled={votedStatus[voteOption.workJob] || submitting[voteOption.workJob] || !selectedVotes[voteOption.workJob]}
          >
            {submitting[voteOption.workJob] ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : votedStatus[voteOption.workJob] ? (
              '✓ Voted'
            ) : (
              'Submit Vote'
            )}
          </button>
          
          <VoteResults workJob={voteOption.workJob} />
        </div>
      ))}
    </div>
  );
}

