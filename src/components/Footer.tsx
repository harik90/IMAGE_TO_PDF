import React from 'react';
import { GitHubStarButton } from './GitHubStarButton';
import { ThemeToggle } from './ThemeToggle';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <span className="footer-copy">© image_to_pdf · Private by design</span>
          <span className="footer-sep">·</span>
          <span className="footer-privacy-note">
            <ShieldCheck size={13} className="footer-shield" />
            Your files never leave your device. The only network request is the public GitHub star count.
          </span>
        </div>

        <div className="footer-right">
          <GitHubStarButton compact />
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
};
