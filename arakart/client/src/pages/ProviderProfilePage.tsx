import React from 'react';
import { useParams } from 'react-router-dom';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Provider Profile</h1>
      <p className="text-ink-muted mt-2">Provider ID: {id}</p>
    </div>
  );
};
