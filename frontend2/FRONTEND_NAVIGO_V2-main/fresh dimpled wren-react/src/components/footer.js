import React from 'react'

import Script from 'dangerous-html/react'

import './footer.css'

const Footer = (props) => {
  return (
    <div className="footer-container1">
      <footer className="footer-root">
        <div className="footer-wave-divider">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            data-name="Layer 1"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="footer-wave-fill"
            ></path>
          </svg>
        </div>
        <div className="footer-wrapper">
          <div className="footer-grid">
            <div className="footer-brand-column">
              <div className="footer-logo-container">
                <svg
                  fill="none"
                  width="32"
                  xmlns="http://www.w3.org/2000/svg"
                  height="32"
                  stroke="var(--color-primary)"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="footer-logo-icon"
                >
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8L4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1l3 2l2 3l1-1v-3l3-2l3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2"></path>
                </svg>
                <span className="footer-brand-name">ItineraFlow</span>
              </div>
              <p className="footer-description section-content">
                Empowering travel agencies with AI-driven itineraries and
                seamless ERP management. The future of travel planning is here.
              </p>
              <div className="footer-social-links">
                <a href="#">
                  <div aria-label="Facebook" className="footer-social-icon">
                    <svg
                      fill="none"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                      height="20"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div aria-label="Twitter" className="footer-social-icon">
                    <svg
                      fill="none"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                      height="20"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 4.01c-1 .49-1.98.689-3 .99c-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4c0 0-4.182 7.433 4 11c-1.872 1.247-3.739 2.088-6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58-1.04 6.522-3.723 7.651-7.742a13.8 13.8 0 0 0 .497-3.753c0-.249 1.51-2.772 1.818-4.013z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div aria-label="Instagram" className="footer-social-icon">
                    <svg
                      fill="none"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                      height="20"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="2"
                        y="2"
                        rx="5"
                        ry="5"
                        width="20"
                        height="20"
                      ></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div aria-label="LinkedIn" className="footer-social-icon">
                    <svg
                      fill="none"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                      height="20"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle r="2" cx="4" cy="4"></circle>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
            <div className="footer-nav-column">
              <h2 className="section-subtitle footer-nav-title">Platform</h2>
              <ul className="footer-nav-list">
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>AI Trip Planner</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>Agency Management</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>Real-time Metrics</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>Quotation Generator</span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-nav-column">
              <h2 className="section-subtitle footer-nav-title">Resources</h2>
              <ul className="footer-nav-list">
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>Help Center</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>API Documentation</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>Partner Program</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="#">
                    <div className="footer-nav-link">
                      <span>System Status</span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-cta-column">
              <h2 className="section-subtitle footer-nav-title">
                Stay Updated
              </h2>
              <p className="section-content footer-cta-text">
                Join our newsletter for the latest AI travel tech updates.
              </p>
              <form
                action="/subscribe"
                method="POST"
                data-form-id="514df78f-dfb8-4ff0-9855-05a7286d935b"
                className="footer-newsletter-form"
              >
                <div className="footer-input-group">
                  <input
                    type="email"
                    id="thq_textinput_r0hn"
                    name="textinput"
                    required="true"
                    aria-label="Email address"
                    placeholder="Enter your email"
                    data-form-field-id="thq_textinput_r0hn"
                    className="footer-input"
                  />
                  <button
                    id="thq_button_VSlo"
                    name="button"
                    type="submit"
                    data-form-field-id="thq_button_VSlo"
                    className="btn-primary btn footer-submit-btn btn-sm"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-legal">
              <span className="footer-copyright">
                &amp;copy; 2026 ItineraFlow. All rights reserved.
              </span>
              <div className="footer-legal-links">
                <a href="#">
                  <div className="footer-legal-link">
                    <span>Privacy Policy</span>
                  </div>
                </a>
                <a href="#">
                  <div className="footer-legal-link">
                    <span>Terms of Service</span>
                  </div>
                </a>
                <a href="#">
                  <div className="footer-legal-link">
                    <span>Cookies</span>
                  </div>
                </a>
              </div>
            </div>
            <div className="footer-theme-indicator">
              <span className="footer-status-dot"></span>
              <span className="footer-status-text">System Online</span>
            </div>
          </div>
        </div>
      </footer>
      <div className="footer-container2">
        <div className="footer-container3">
          <Script
            html={`<script defer data-name="footer-interactions">
(function(){
  const footerNewsletterForm = document.querySelector(".footer-newsletter-form")

  if (footerNewsletterForm) {
    footerNewsletterForm.addEventListener("submit", (e) => {
      const emailInput = footerNewsletterForm.querySelector(".footer-input")
      const submitBtn = footerNewsletterForm.querySelector(".footer-submit-btn")

      if (emailInput.checkValidity()) {
        const originalText = submitBtn.textContent
        submitBtn.disabled = true
        submitBtn.textContent = "Subscribed!"
        submitBtn.style.backgroundColor = "#2ecc71"
        submitBtn.style.borderColor = "#2ecc71"

        // Reset after 3 seconds for demo purposes
        setTimeout(() => {
          submitBtn.disabled = false
          submitBtn.textContent = originalText
          submitBtn.style.backgroundColor = ""
          submitBtn.style.borderColor = ""
          footerNewsletterForm.reset()
        }, 3000)
      }
    })
  }

  // Subtle stagger reveal for footer columns on scroll
  const observerOptions = {
    threshold: 0.1,
  }

  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const columns = entry.target.querySelectorAll(".footer-brand-column, .footer-nav-column, .footer-cta-column")
        columns.forEach((col, index) => {
          col.style.opacity = "0"
          col.style.transform = "translateY(20px)"
          col.style.transition = \`opacity 0.6s ease \${index * 0.1}s, transform 0.6s ease \${index * 0.1}s\`

          requestAnimationFrame(() => {
            col.style.opacity = "1"
            col.style.transform = "translateY(0)"
          })
        })
        footerObserver.unobserve(entry.target)
      }
    })
  }, observerOptions)

  const footerGrid = document.querySelector(".footer-grid")
  if (footerGrid) {
    footerObserver.observe(footerGrid)
  }
})()
</script>`}
          ></Script>
        </div>
      </div>
    </div>
  )
}

export default Footer
