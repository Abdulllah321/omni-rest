import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Moon, Sun, Menu, X, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Docs',            href: '/docs' },
  { label: 'Getting Started', href: '/docs/getting-started' },
  { label: 'API Reference',   href: '/docs/api-reference' },
  { label: 'Examples',        href: '/docs/examples' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [dark,      setDark]      = useState(false)
  const [mounted,   setMounted]   = useState(false)
  const router  = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored      = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark      = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    setMounted(true)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [router.pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const isActive = (href: string) =>
    href === '/docs'
      ? router.pathname === '/docs'
      : router.pathname.startsWith(href)

  return (
    <header className="navbar-host">
      <nav className={`navbar-bar${scrolled ? ' navbar-bar--scrolled' : ''}`}>
        <span className="navbar-accent-line" />

        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <Image src="/logo-removebg.png" alt="Omni Rest" width={32} height={32} className="navbar-logo-img" />
          <span className="navbar-logo-text">
            Omni<span className="text-gradient">Rest</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="navbar-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`navbar-link${isActive(link.href) ? ' navbar-link--active' : ''}`}>
                {link.label}
                {isActive(link.href) && <span className="navbar-link-dot" />}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {mounted && (
            <button onClick={toggleTheme} aria-label="Toggle theme" className="navbar-icon-btn">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <a href="https://github.com/Abdulllah321/omni-rest" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="navbar-icon-btn navbar-github">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          <Link href="/docs/getting-started" className="navbar-cta">
            Get Started <ArrowRight size={13} />
          </Link>

          <button onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu" className="navbar-icon-btn navbar-hamburger">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div ref={menuRef} className={`navbar-mobile${menuOpen ? ' navbar-mobile--open' : ''}`}>
        <ul className="navbar-mobile-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`navbar-mobile-link${isActive(link.href) ? ' navbar-mobile-link--active' : ''}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/docs/getting-started" className="navbar-mobile-cta">
          Get Started <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  )
}
