import React from 'react';
import './UserProfile.css';

export default function UserProfile({ user }) {
  if (!user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img 
          src={user.avatarURL || '/default-avatar.png'} 
          alt={user.displayName || 'User'}
          className="avatar"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150?text=User';
          }}
        />
        <div className="profile-info">
          <h2 className="display-name">
            {user.firstName} {user.lastName}
          </h2>
          <p className="role">{user.role}</p>
          <p className="team">{user.team?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="profile-details">
        <div className="detail-item">
          <span className="label">ตำแหน่ง:</span>
          <span className="value">{user.position?.name || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="label">องค์กร:</span>
          <span className="value">{user.joinOrganization?.organization?.name || 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="label">สถานะ:</span>
          <span className="value">{user.statusJoinedOrganization || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

