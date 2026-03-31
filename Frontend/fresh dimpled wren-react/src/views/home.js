import React from 'react'

import Script from 'dangerous-html/react'
import { Helmet } from 'react-helmet'

import Navigation from '../components/navigation'
import Footer from '../components/footer'
import './home.css'

const Home = (props) => {
  return (
    <div className="home-container1">
      <Helmet>
        <title>Fresh Dimpled Wren</title>
        <meta property="og:title" content="Fresh Dimpled Wren" />
        <link
          rel="canonical"
          href="https://fresh-dimpled-wren-0vz607.teleporthq.app/"
        />
        <meta
          property="og:url"
          content="https://fresh-dimpled-wren-0vz607.teleporthq.app/"
        />
      </Helmet>
      <Navigation></Navigation>
      <div className="home-container2">
        <div className="home-container3">
          <Script
            html={`<style>
section {
  position: relative;
  overflow: hidden;
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface);
}
</style>`}
          ></Script>
        </div>
      </div>
      <section className="platform-hero">
        <div className="hero-bg-media">
          <video
            src="https://videos.pexels.com/video-files/6561429/6561429-hd_1280_720_50fps.mp4"
            loop="true"
            muted="true"
            poster="https://images.pexels.com/videos/6561429/pictures/preview-0.jpg"
            autoPlay="true"
            playsInline="true"
          ></video>
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content-wrapper">
          <div className="hero-text-region">
            <h1 className="hero-title">
              ItineraFlow: The Future of Travel Agency ERP
            </h1>
            <p className="hero-subtitle">
              Empower your agency with AI-driven itinerary planning and seamless
              operational control. Scalable, efficient, and built for modern
              travel professionals.
            </p>
            <div className="hero-cta-group">
              <a href="#login-admin">
                <div className="btn-primary btn">
                  <span>Platform Admin</span>
                </div>
              </a>
              <a href="#login-agency">
                <div className="btn btn-secondary">
                  <span>Agency Admin</span>
                </div>
              </a>
              <a href="#login-agent">
                <div className="btn btn-accent">
                  <span>Agent Login</span>
                </div>
              </a>
            </div>
            <div className="hero-badge">
              <div className="badge-icon">
                <svg
                  fill="none"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <span>Enterprise-grade Security &amp; Role-based Access</span>
            </div>
          </div>
          <div className="hero-visual-region">
            <div className="hero-glass-card">
              <div className="card-header">
                <div className="dot red"></div>
                <div className="yellow dot"></div>
                <div className="green dot"></div>
              </div>
              <img
                alt="AI Dashboard Preview"
                src="https://images.pexels.com/photos/30530403/pexels-photo-30530403.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1500"
              />
            </div>
          </div>
        </div>
        <div className="hero-diagonal-divider"></div>
      </section>
      <section className="core-features">
        <div className="features-inner">
          <div className="features-header">
            <h2 className="section-title">Intelligent Agency Infrastructure</h2>
            <p className="section-subtitle">
              A comprehensive suite of tools designed to automate your workflow.
            </p>
          </div>
          <div className="features-bento-grid">
            <div className="bento-cell cell-hero">
              <div className="cell-content">
                <div className="icon-wrapper">
                  <svg
                    fill="none"
                    width="32"
                    xmlns="http://www.w3.org/2000/svg"
                    height="32"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zm6-4v2m-3 8v9m6-9v9M5 16l4-2m6 0l4 2M9 18h6M10 8v.01M14 8v.01"></path>
                  </svg>
                </div>
                <h3 className="section-title">AI Trip Planner</h3>
                <p className="section-content">
                  Generate hyper-personalized itineraries in seconds. Our AI
                  analyzes global travel trends and client preferences to craft
                  the perfect journey.
                </p>
              </div>
              <img
                alt="AI Planning"
                src="https://images.pexels.com/photos/16094057/pexels-photo-16094057.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1500"
                className="cell-img"
              />
            </div>
            <div className="bento-cell cell-small">
              <div className="cell-content">
                <h3 className="section-subtitle">Role-Based Access</h3>
                <p className="section-content">
                  Granular permissions for Admins, Agents, and Accountants.
                </p>
              </div>
            </div>
            <div className="bento-cell cell-small">
              <div className="cell-content">
                <h3 className="section-subtitle">
                  Reservations &amp; Invoicing
                </h3>
                <p className="section-content">
                  Automated booking management and financial tracking.
                </p>
              </div>
            </div>
            <div className="bento-cell cell-small">
              <div className="cell-content">
                <h3 className="section-subtitle">Agent Quotation Tools</h3>
                <p className="section-content">
                  Create professional quotes with real-time inventory data.
                </p>
              </div>
            </div>
            <div className="bento-cell cell-small">
              <div className="cell-content">
                <h3 className="section-subtitle">Real-time Analytics</h3>
                <p className="section-content">
                  Global KPIs and agency-specific performance metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="role-highlights">
        <div className="role-inner">
          <h2 className="section-title">One Platform, Every Perspective</h2>
          <div className="role-bento-layout">
            <div className="role-cell role-main">
              <div className="role-card-content">
                <span className="role-tag">Agency Admin</span>
                <h3 className="section-title">Master Your Operations</h3>
                <p className="section-content">
                  Oversee every aspect of your agency. From client management to
                  reservation pipelines and automated invoicing, ItineraFlow
                  puts you in the driver&apos;s seat of your business growth.
                </p>
                <ul className="role-list">
                  <li>
                    <span>Manage team performance</span>
                  </li>
                  <li>
                    <span>Real-time inventory sync</span>
                  </li>
                  <li>
                    <span>Financial reporting &amp; audits</span>
                  </li>
                </ul>
              </div>
              <img
                alt="Agency Dashboard"
                src="https://images.pexels.com/photos/7439127/pexels-photo-7439127.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=1500"
              />
            </div>
            <div className="role-column">
              <div className="role-side role-cell">
                <div className="role-card-content">
                  <span className="role-tag">Agent</span>
                  <h3 className="section-subtitle">AI-Powered Sales</h3>
                  <p className="section-content">
                    Generate complex itineraries and send professional
                    quotations in minutes, not hours.
                  </p>
                </div>
              </div>
              <div className="role-side role-cell">
                <div className="role-card-content">
                  <span className="role-tag">Accountant</span>
                  <h3 className="section-subtitle">Precision Finance</h3>
                  <p className="section-content">
                    Secure, view-only access to invoices and payment tracking
                    for seamless auditing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="platform-stats">
        <div className="stats-inner">
          <div className="stats-bento">
            <div className="stat-large stat-cell">
              <div className="stat-content">
                <h2 className="hero-title">85%</h2>
                <p className="section-subtitle">Reduction in Planning Time</p>
                <p className="section-content">
                  Our AI engine automates the heavy lifting, allowing agents to
                  focus on high-touch client relationships and closing deals
                  faster.
                </p>
              </div>
            </div>
            <div className="stat-column">
              <div className="stat-cell stat-small">
                <h3 className="section-title">12k+</h3>
                <p className="section-content">Bookings Managed Monthly</p>
              </div>
              <div className="stat-cell stat-small">
                <h3 className="section-title">450+</h3>
                <p className="section-content">Global Agencies Onboarded</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="product-tour">
        <div className="tour-inner">
          <div className="tour-layout">
            <div className="tour-video-container">
              <div className="video-wrapper">
                <video
                  src="https://videos.pexels.com/video-files/31121315/13297527_640_360_25fps.mp4"
                  poster="https://images.pexels.com/videos/31121315/pictures/preview-0.jpg"
                  controls="true"
                ></video>
                <div className="video-play-hint">
                  <svg
                    fill="var(--color-primary)"
                    width="48"
                    xmlns="http://www.w3.org/2000/svg"
                    height="48"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            </div>
            <div className="tour-content">
              <h2 className="section-title">See ItineraFlow In Action</h2>
              <p className="section-content">
                Watch how our AI-powered itinerary planner transforms a simple
                request into a professional multi-day journey with pricing,
                maps, and activity details in under 60 seconds.
              </p>
              <div className="tour-features">
                <div className="tour-feature-item">
                  <svg
                    fill="none"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    stroke="var(--color-primary)"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Live Dashboard Demo</span>
                </div>
                <div className="tour-feature-item">
                  <svg
                    fill="none"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    stroke="var(--color-primary)"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>AI Itinerary Generation</span>
                </div>
                <div className="tour-feature-item">
                  <svg
                    fill="none"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                    height="20"
                    stroke="var(--color-primary)"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Quotation Workflow</span>
                </div>
              </div>
              <button className="btn btn-lg btn-outline">
                Request Custom Demo
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="testimonials">
        <div className="testimonials-inner">
          <h2 className="section-title">Trusted by Global Travel Leaders</h2>
          <div id="testimonialCarousel" className="carousel-container">
            <div className="carousel-track">
              <div className="testimonial-card">
                <p className="section-content">
                  &quot;ItineraFlow has completely revolutionized how our agents
                  work. The AI planner isn&apos;t just a gimmick; it&apos;s a
                  powerful tool that saves us hours on every booking.&quot;
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <span className="author-name">Sarah Jenkins</span>
                    <span className="author-role">
                      Director, Horizon Travel Group
                    </span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="section-content">
                  &quot;The role-based access is exactly what we needed. Our
                  accountant can pull reports without interfering with bookings,
                  and our agents have everything they need in one tab.&quot;
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <span className="author-name">Marcello Rossi</span>
                    <span className="author-role">
                      Owner, Elite European Tours
                    </span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="section-content">
                  &quot;Scaling our agency was difficult until we found
                  ItineraFlow. The automated invoicing and reservation system
                  handles the volume we could never manage manually.&quot;
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <span className="author-name">Elena Vance</span>
                    <span className="author-role">
                      Operations Manager, Global Escapes
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="carousel-controls">
              <button aria-label="Previous" className="carousel-btn prev">
                <svg
                  fill="none"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </button>
              <button aria-label="Next" className="carousel-btn next">
                <svg
                  fill="none"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="get-started-cta">
        <div className="cta-diagonal-bg"></div>
        <div className="cta-inner">
          <div className="cta-content">
            <h2 className="hero-title">Ready to Elevate Your Agency?</h2>
            <p className="section-subtitle">
              Join hundreds of agencies already using ItineraFlow to drive
              efficiency and delight travelers.
            </p>
            <div className="cta-actions">
              <a href="#signup">
                <div className="btn-primary btn btn-xl">
                  <span>Start Free Trial</span>
                </div>
              </a>
              <a href="#demo">
                <div className="btn btn-xl btn-outline">
                  <span>Request Private Demo</span>
                </div>
              </a>
              <a href="#sales">
                <div className="btn btn-link">
                  <span>Contact Sales Team</span>
                </div>
              </a>
            </div>
          </div>
          <div className="cta-decoration">
            <div className="floating-orbit">
              <div className="item-1 orbit-item">
                <span>AI</span>
              </div>
              <div className="item-2 orbit-item">
                <span>ERP</span>
              </div>
              <div className="item-3 orbit-item">
                <span>CMS</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="home-container4">
        <div className="home-container5">
          <Script
            html={`<style>
        @keyframes orbitRotate {from {transform: rotate(0deg);}
to {transform: rotate(360deg);}}@keyframes counterRotate {from {transform: rotate(0deg);}
to {transform: rotate(-360deg);}}
        </style> `}
          ></Script>
        </div>
      </div>
      <div className="home-container6">
        <div className="home-container7">
          <Script
            html={`<script defer data-name="itineraflow-interactions">
(function(){
  // Testimonial Carousel Logic
  const track = document.querySelector(".carousel-track")
  const cards = document.querySelectorAll(".testimonial-card")
  const nextBtn = document.querySelector(".carousel-btn.next")
  const prevBtn = document.querySelector(".carousel-btn.prev")

  let currentIndex = 0

  function updateCarousel() {
    const cardWidth = cards[0].offsetWidth + 24 // Including gap
    track.style.transform = \`translateX(-\${currentIndex * cardWidth}px)\`

    // Disable buttons at boundaries
    prevBtn.style.opacity = currentIndex === 0 ? "0.5" : "1"
    prevBtn.style.pointerEvents = currentIndex === 0 ? "none" : "auto"

    const visibleCards = window.innerWidth > 991 ? 3 : window.innerWidth > 767 ? 2 : 1
    const maxIndex = cards.length - visibleCards

    nextBtn.style.opacity = currentIndex >= maxIndex ? "0.5" : "1"
    nextBtn.style.pointerEvents = currentIndex >= maxIndex ? "none" : "auto"
  }

  nextBtn.addEventListener("click", () => {
    const visibleCards = window.innerWidth > 991 ? 3 : window.innerWidth > 767 ? 2 : 1
    if (currentIndex < cards.length - visibleCards) {
      currentIndex++
      updateCarousel()
    }
  })

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--
      updateCarousel()
    }
  })

  // Handle window resize to keep carousel aligned
  window.addEventListener("resize", updateCarousel)

  // Initial call
  updateCarousel()

  // Scroll Reveal Animation (Simple version for Medium level)
  const revealElements = document.querySelectorAll(".bento-cell, .role-cell, .stat-cell")

  const revealOnScroll = () => {
    revealElements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight - 100
      if (isVisible) {
        el.style.opacity = "1"
        el.style.transform = "translateY(0)"
      }
    })
  }

  // Set initial styles for reveal
  revealElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(20px)"
    el.style.transition = "all 0.6s ease-out"
  })

  window.addEventListener("scroll", revealOnScroll)
  revealOnScroll() // Trigger once on load
})()
</script>`}
          ></Script>
        </div>
      </div>
      <Footer></Footer>
      <a href="https://play.teleporthq.io/signup">
        <div aria-label="Sign up to TeleportHQ" className="home-container8">
          <svg
            width="24"
            height="24"
            viewBox="0 0 19 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="home-icon26"
          >
            <path
              d="M9.1017 4.64355H2.17867C0.711684 4.64355 -0.477539 5.79975 -0.477539 7.22599V13.9567C-0.477539 15.3829 0.711684 16.5391 2.17867 16.5391H9.1017C10.5687 16.5391 11.7579 15.3829 11.7579 13.9567V7.22599C11.7579 5.79975 10.5687 4.64355 9.1017 4.64355Z"
              fill="#B23ADE"
            ></path>
            <path
              d="M10.9733 12.7878C14.4208 12.7878 17.2156 10.0706 17.2156 6.71886C17.2156 3.3671 14.4208 0.649963 10.9733 0.649963C7.52573 0.649963 4.73096 3.3671 4.73096 6.71886C4.73096 10.0706 7.52573 12.7878 10.9733 12.7878Z"
              fill="#FF5C5C"
            ></path>
            <path
              d="M17.7373 13.3654C19.1497 14.1588 19.1497 15.4634 17.7373 16.2493L10.0865 20.5387C8.67402 21.332 7.51855 20.6836 7.51855 19.0968V10.5141C7.51855 8.92916 8.67402 8.2807 10.0865 9.07221L17.7373 13.3654Z"
              fill="#2874DE"
            ></path>
          </svg>
          <span className="home-text26">Built in TeleportHQ</span>
        </div>
      </a>
    </div>
  )
}

export default Home
