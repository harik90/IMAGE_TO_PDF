import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { MoreMenu } from '../components/MoreMenu';
import { ArrowRight, Grid, Sparkles } from 'lucide-react';

interface Props {
  onOpenSearch?: () => void;
}

export const HomePage: React.FC<Props> = ({ onOpenSearch }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const featuredTools = toolsRegistry.filter(t => t.featured);
  const totalToolsCount = toolsRegistry.length;
  const remainingCount = totalToolsCount - featuredTools.length;

  return (
    <div className="page-container home-container">
      {/* Compact Hero */}
      <section className="home-hero-compact">
        <div className="home-hero-badge-row">
          <PrivacyBadge />
        </div>

        <h1 className="home-hero-headline">
          Private, instant file tools in your browser.
        </h1>

        <p className="home-hero-subtext">
          Zero uploads, zero servers, zero tracking. All PDF and image conversions run directly inside local device memory.
        </p>
      </section>

      {/* Featured Tools Grid (Small & Compact 112-140px cards) */}
      <section className="home-featured-section" aria-label="Featured file tools">
        <div className="section-label-row">
          <span className="section-label">Core Tools</span>
          <span className="section-meta">100% Client-Side Memory</span>
        </div>

        <div className="home-compact-grid">
          {featuredTools.map(tool => (
            <Link
              key={tool.id}
              to={tool.route}
              className="compact-tool-card featured-gold-border"
            >
              <div className="card-top-row">
                <div className="compact-icon-wrap">
                  {tool.icon({ size: 18 })}
                </div>
                <div className="card-sparkle-pill">
                  <Sparkles size={11} />
                  <span>Featured</span>
                </div>
              </div>

              <div className="card-body">
                <div className="card-title-row">
                  <h2 className="card-title">{tool.name}</h2>
                  <ArrowRight size={14} className="hover-arrow" />
                </div>
                <p className="card-description">{tool.description}</p>
              </div>
            </Link>
          ))}

          {/* More Tools Tile */}
          <button
            type="button"
            className="compact-tool-card more-tools-tile"
            onClick={() => setIsMoreOpen(true)}
            aria-label={`View ${remainingCount} more tools`}
          >
            <div className="card-top-row">
              <div className="compact-icon-wrap more-icon-wrap">
                <Grid size={18} />
              </div>
              <span className="count-pill">+{remainingCount} tools</span>
            </div>

            <div className="card-body">
              <div className="card-title-row">
                <h2 className="card-title">More file utilities</h2>
                <ArrowRight size={14} className="hover-arrow" />
              </div>
              <p className="card-description">
                PDF merge, split, rotate, 300 DPI Hindi/English OCR, base64 encoder, and metadata.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* More Tools Modal / Sheet */}
      <MoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
};
