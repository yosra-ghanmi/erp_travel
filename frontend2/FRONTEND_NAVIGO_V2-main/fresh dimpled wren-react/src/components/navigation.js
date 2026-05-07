import React from 'react'
import { Link } from 'react-router-dom'

import Script from 'dangerous-html/react'

import './navigation.css'

const Navigation = (props) => {
  return (
    <div className="navigation-container1">
      <nav id="itineraflow-nav" className="navigation-sidebar-container">
        <div className="navigation-sidebar-wrapper">
          <div className="navigation-brand-area">
            <Link to="/">
              <div className="navigation-brand-link">
                <div className="navigation-logo-icon">
                  <svg
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M2 22h20M6.36 17.4L4 17l-2-4l1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12L5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.4 2.4 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>
                <span className="navigation-brand-name section-title">
                  ItineraFlow
                </span>
              </div>
            </Link>
            <button
              id="nav-toggle"
              aria-label="Toggle Menu"
              aria-expanded="false"
              className="navigation-mobile-toggle"
            >
              <svg
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
          </div>
          <div id="nav-menu" className="navigation-main-content">
            <div className="navigation-scroll-area">
              <div className="navigation-group">
                <span className="navigation-group-label">Core Platform</span>
                <ul className="navigation-list">
                  <li className="navigation-item">
                    <Link to="/">
                      <div className="navigation-link active">
                        <span className="navigation-icon">
                          <svg
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <g
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                rx="1"
                                width="7"
                                height="9"
                              ></rect>
                              <rect
                                x="14"
                                y="3"
                                rx="1"
                                width="7"
                                height="5"
                              ></rect>
                              <rect
                                x="14"
                                y="12"
                                rx="1"
                                width="7"
                                height="9"
                              ></rect>
                              <rect
                                x="3"
                                y="16"
                                rx="1"
                                width="7"
                                height="5"
                              ></rect>
                            </g>
                          </svg>
                        </span>
                        <span className="navigation-text">Global Metrics</span>
                      </div>
                    </Link>
                  </li>
                  <li className="navigation-item">
                    <Link to="/">
                      <div className="navigation-link">
                        <span className="navigation-icon">
                          <svg
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <g
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"></path>
                              <circle r="4" cx="9" cy="7"></circle>
                            </g>
                          </svg>
                        </span>
                        <span className="navigation-text">Agency Admin</span>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="navigation-group">
                <span className="navigation-group-label">Operations</span>
                <ul className="navigation-list">
                  <li className="navigation-item">
                    <Link to="/">
                      <div className="navigation-link">
                        <span className="navigation-icon">
                          <svg
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M2 22h20M6.36 17.4L4 17l-2-4l1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12L5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.4 2.4 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                        </span>
                        <span className="navigation-text">AI Trip Planner</span>
                      </div>
                    </Link>
                  </li>
                  <li className="navigation-item">
                    <Link to="/">
                      <div className="navigation-link">
                        <span className="navigation-icon">
                          <svg
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <g
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M15.828 14.829a4 4 0 0 1-5.656 0a4 4 0 0 1 0-5.657a4 4 0 0 1 5.656 0"></path>
                              <path d="M4 3a1 1 0 0 1 1-1a1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1a1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2a1 1 0 0 1-1-1zm4 9h5"></path>
                            </g>
                          </svg>
                        </span>
                        <span className="navigation-text">Accountant View</span>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="navigation-user-footer">
              <div className="navigation-user-info">
                <div className="navigation-user-avatar">
                  <span>AD</span>
                </div>
                <div className="navigation-user-details">
                  <span className="navigation-user-name">Platform Admin</span>
                  <span className="navigation-user-role">Super User</span>
                </div>
              </div>
              <Link to="/">
                <div aria-label="Settings" className="navigation-settings-btn">
                  <svg
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                      <circle r="3" cx="12" cy="12"></circle>
                    </g>
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="navigation-container2">
        <div className="navigation-container3">
          <Script
            html={`<style>
        @keyframes slideDown {from {opacity: 0;
transform: translateY(-10px);}
to {opacity: 1;
transform: translateY(0);}}
        </style> `}
          ></Script>
        </div>
      </div>
      <div className="navigation-container4">
        <div className="navigation-container5">
          <Script
            html={`<script defer data-name="itineraflow-navigation">
(function(){
  const navToggle = document.getElementById("nav-toggle")
  const navMenu = document.getElementById("nav-menu")
  const navLinks = document.querySelectorAll(".navigation-link")

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open")
      navToggle.setAttribute("aria-expanded", isOpen)

      const icon = navToggle.querySelector("svg")
      if (isOpen) {
        icon.innerHTML = '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>'
        document.body.style.overflow = "hidden"
      } else {
        icon.innerHTML = '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>'
        document.body.style.overflow = ""
      }
    })
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"))
      link.classList.add("active")

      if (window.innerWidth <= 767) {
        navMenu.classList.remove("is-open")
        navToggle.setAttribute("aria-expanded", "false")
        document.body.style.overflow = ""
        const icon = navToggle.querySelector("svg")
        icon.innerHTML = '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>'
      }
    })
  })

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      navMenu.classList.remove("is-open")
      document.body.style.overflow = ""
    }
  })
})()
</script>`}
          ></Script>
        </div>
      </div>
    </div>
  )
}

export default Navigation
