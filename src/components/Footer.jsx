import React from "react";
import { useLibrary } from "../context/LibraryContext.jsx";

export const Footer = ({ showToast: propShowToast }) => {
  const libraryContext = useLibrary();
  const showToast = propShowToast || libraryContext?.showToast;

  return (
    <footer className="footer" id="footer">
      <div className="container">

        <div className="footer-grid">

          {/* Footer Brand */}
          <div className="footer-brand">
            <a href="#" className="brand">
              <img
                src="/nrilogo.png"
                alt="DR. RVR NRI Logo"
                className="brand-logo-img"
              />

              <div className="brand-text">
                <span className="brand-title">
                  DR. RVR NRI INSTITUTE OF TECHNOLOGY
                </span>

                <span className="brand-subtitle">
                  DEEMED TO BE UNIVERSITY
                </span>
              </div>
            </a>

            <p>
              Empowering faculty, researchers, and students with
              state-of-the-art digital knowledge infrastructure and
              open academic resources.
            </p>
          </div>

          {/* Digital Library */}
          <div>
            <h4 className="footer-title">
              Digital Library
            </h4>

            <ul className="footer-links">
              <li>
                <a href="#catalog">
                  Engineering Textbooks
                </a>
              </li>

              <li>
                <a href="#catalog">
                  Pharmacy Journals
                </a>
              </li>

              <li>
                <a href="#catalog">
                  Management Case Studies
                </a>
              </li>

              <li>
                <a href="#catalog">
                  Scopus Indexed Journals
                </a>
              </li>

              <li>
                <a href="#catalog">
                  Faculty Publications
                </a>
              </li>
            </ul>
          </div>

          {/* Library Services */}
          <div>
            <h4 className="footer-title">
              Library Services
            </h4>

            <ul className="footer-links">

              <li>
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast?.("Digital Remote Access Active", "info");
                  }}
                >
                  Remote Off-Campus Access
                </a>
              </li>

              <li>
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast?.("Requesting Book Renewal...", "info");
                  }}
                >
                  Book Renewal Portal
                </a>
              </li>

              <li>
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast?.("Study Room Reservation Ready", "info");
                  }}
                >
                  Study Room Reservation
                </a>
              </li>

              <li>
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast?.("Inter-Library Loan Desk Open", "info");
                  }}
                >
                  Inter-Library Loan (ILL)
                </a>
              </li>

            </ul>
          </div>

          {/* University Address */}
          <div>
            <h4 className="footer-title">
              University Address
            </h4>

            <p
              style={{
                fontSize: "0.84rem",
                color: "var(--text-muted)",
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              DR. RVR NRI Institute of Technology
              <br />

              Deemed to be University Campus
              <br />

              Pothavarappadu (V), Agiripalli (M)
              <br />

              Vijayawada / Eluru Road, AP - 521212
              <br />

              <strong
                style={{
                  color: "var(--accent-orange-bright)",
                }}
              >
                Email:
              </strong>{" "}
              library@rvrnriit.edu.in
            </p>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">

          <div>
            © 2026 DR. RVR NRI INSTITUTE OF TECHNOLOGY
            (Deemed to be University). All Rights Reserved.
          </div>

          <div>
            Interactive E-Book Reader Engine built for
            high-performance academic UI/UX
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
