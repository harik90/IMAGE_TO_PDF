import React, { ReactNode } from 'react';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  icon: (props?: { className?: string }) => ReactNode;
  route: string;
  accent: 'amber' | 'indigo' | 'green';
  component: React.ComponentType;
  howItWorks?: string;
  faq?: string;
}

export interface QueuedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  rotation?: number;
  width?: number;
  height?: number;
  pageCount?: number;
}
