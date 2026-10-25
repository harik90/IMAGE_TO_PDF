import React from 'react';
import { Link } from 'react-router-dom';
import { toolsRegistry } from '../tools/registry';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

interface Props {
  onOpenSearch?: () => void;
}

export const HomePage: React.FC<Props> = () => {
  const featuredTools = toolsRegistry.filter(t => t.featured);
  const otherTools = toolsRegistry.filter(t => !t.featured);

  const sandTool = featuredTools[0] || toolsRegistry[0];
  const irisTool = featuredTools[1] || toolsRegistry[1];

  return (
    <div className="page-container home-craft-container">
      {/* Slot 1: Quiet Hero Intro */}
      <section className="quiet-hero">
        <div className="section-title-row">
          <span className="section-title-bold">local file studio</span>
          <span className="accent-script-note">*(quiet &amp; in-memory)*</span>
        </div>

        <h1 className="quiet-hero-title">
          Private client-side tools for images and PDFs.
        </h1>

        <p className="quiet-hero-desc">
          Zero server uploads, zero telemetry. Every operation runs strictly in local device memory using WebAssembly and canvas.
        </p>
      </section>

      {/* Slot 2: Highlight Pair (Tilted Sand & Iris Cards) */}
      <section className="highlight-pair-section" aria-label="Core featured tools">
        <div className="highlight-pair-grid">
          {/* Left Tilted Card (Sand) */}
          <Link
            to={sandTool.route}
            className="highlight-card card-sand tilt-left"
          >
            <div className="card-header-line">
              <span className="card-accent-label">01 · primary</span>
              <span className="card-handwritten">*(drop photos or scans)*</span>
            </div>

            <div className="card-content-block">
              <div className="card-title-line">
                <h2 className="highlight-title">{sandTool.name}</h2>
                <ArrowRight size={15} className="card-arrow" />
              </div>
              <p className="highlight-desc">{sandTool.description}</p>
            </div>

            <div className="card-action-bar">
              <span className="card-action-text">open tool</span>
              <span className="typographic-arrow">→</span>
            </div>
          </Link>

          {/* Right Tilted Card (Iris) */}
          <Link
            to={irisTool.route}
            className="highlight-card card-iris tilt-right"
          >
            <div className="card-header-line">
              <span className="card-accent-label">02 · primary</span>
              <span className="card-handwritten">*(honest byte diff)*</span>
            </div>

            <div className="card-content-block">
              <div className="card-title-line">
                <h2 className="highlight-title">{irisTool.name}</h2>
                <ArrowRight size={15} className="card-arrow" />
              </div>
              <p className="highlight-desc">{irisTool.description}</p>
            </div>

            <div className="card-action-bar">
              <span className="card-action-text">open tool</span>
              <span className="typographic-arrow">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Slot 3: Live Panel (Sage Card with Nested Inset Well) */}
      <section className="live-panel-section" aria-label="Runtime telemetry">
        <div className="craft-card card-sage live-sage-card">
          <div className="live-card-topline">
            <div className="live-status-heading">
              <span className="live-status-dot" aria-hidden="true"></span>
              <span className="live-status-title">browser runtime engine</span>
            </div>
            <span className="accent-script-note">*(live state)*</span>
          </div>

          <div className="nested-inset-well">
            <div className="well-stat-col">
              <span className="well-stat-label">execution</span>
              <span className="well-stat-value">100% in-memory wasm</span>
            </div>
            <div className="well-stat-col">
              <span className="well-stat-label">network egress</span>
              <span className="well-stat-value">0 bytes / air-gapped</span>
            </div>
            <div className="well-stat-col">
              <span className="well-stat-label">installed models</span>
              <span className="well-stat-value">300 dpi hindi + eng</span>
            </div>
            <div className="well-stat-col">
              <span className="well-stat-label">storage persist</span>
              <span className="well-stat-value">volatile ram only</span>
            </div>
          </div>
        </div>
      </section>

      {/* Slot 4: Indexed List (Numbered 01, 02... with ↳ sub-lines) */}
      <section className="indexed-list-section" aria-label="All file utilities">
        <div className="section-title-row" style={{ marginBottom: '12px' }}>
          <span className="section-title-bold">all utilities</span>
          <span className="accent-script-note">*(indexed library)*</span>
        </div>

        <div className="indexed-rows-container">
          {otherTools.map((tool, idx) => {
            const indexString = String(idx + 1).padStart(2, '0');
            return (
              <Link
                key={tool.id}
                to={tool.route}
                className="indexed-tool-row"
              >
                <div className="row-main-wrap">
                  <div className="row-top-line">
                    <span className="row-mono-idx">{indexString}.</span>
                    <span className="row-tool-name">{tool.name}</span>
                    <ArrowUpRight size={13} className="row-arrow" />
                  </div>
                  <div className="row-sub-comment">
                    <span className="sub-branch-symbol">↳</span>
                    <span className="sub-comment-text">{tool.description}</span>
                  </div>
                </div>

                <div className="row-category-badge">
                  <span>{tool.category}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
