"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Star,
  ChevronRight,
  Utensils,
  Wine,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ChatWidget from "@/components/chat/ChatWidget";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80",
];

const MENU_HIGHLIGHTS = [
  {
    name: "Blue Cheese Naan",
    description: "Roquefort, truffle honey, toasted walnuts — our signature crossover",
    price: "₹850",
    tag: "Signature",
  },
  {
    name: "Daulat ki Chaat",
    description: "Deconstructed saffron milk cake, rose petal, pistachio crumble",
    price: "₹950",
    tag: "Chef's Pick",
  },
  {
    name: "Mishti Doi Cannoli",
    description: "Bengali yogurt meets Sicilian pastry, date palm jaggery",
    price: "₹750",
    tag: "Dessert",
  },
  {
    name: "Pulled Pork Phulka Taco",
    description: "Slow-cooked heritage pork, raw mango salsa, kokum glaze",
    price: "₹1,100",
    tag: "Popular",
  },
];

const ACCOLADES = [
  { text: "Asia's 50 Best Restaurants", year: "2023-2025" },
  { text: "Michelin Selected", year: "Since 2024" },
  { text: "Times Food Award — Best Fine Dining", year: "2024" },
];

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 60
            ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                Indian Accent
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#menu" className="hover:text-white transition-colors">Menu</a>
            <a href="#accolades" className="hover:text-white transition-colors">Accolades</a>
            <a href="#visit" className="hover:text-white transition-colors">Visit</a>
          </div>
          <a
            href="#visit"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-[#E35222] hover:bg-[#c9441a] text-white text-sm font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
          >
            Reserve a Table
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background images with crossfade */}
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-[2000ms]"
            style={{ opacity: i === currentImage ? 1 : 0 }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${img})` }}
            />
          </div>
        ))}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/70 via-[#0a0a0f]/50 to-[#0a0a0f]" />

        {/* Parallax content */}
        <div
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm text-slate-200 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Asia&apos;s 50 Best Restaurants</span>
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Indian Accent
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 font-light tracking-wide mb-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            Inventive Indian Cuisine
          </p>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Where tradition meets innovation. A culinary journey that reimagines Indian flavours through a contemporary global lens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E35222] hover:bg-[#c9441a] text-white font-semibold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-orange-600/30 hover:-translate-y-0.5"
            >
              Explore Our Menu
              <ChevronRight className="w-5 h-5" />
            </a>
            <a
              href="#visit"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full transition-all duration-300 hover:-translate-y-0.5"
            >
              Plan Your Visit
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 rounded-full bg-white/60 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="py-24 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-[#E35222] text-sm font-semibold tracking-widest uppercase mb-4">
                Our Story
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Where Every Plate{" "}
                <span className="text-[#E35222]">Tells a Story</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Indian Accent, helmed by Chef Manish Mehrotra, has been at the forefront 
                of inventive Indian cuisine since its inception. Our menu bridges the 
                familiar comfort of Indian flavors with unexpected global influences, 
                creating dishes that are at once surprising and deeply satisfying.
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Set within The Lodhi, New Delhi, our award-winning restaurant offers an 
                intimate, sophisticated dining experience that has earned recognition on 
                the world stage — including placement on Asia&apos;s 50 Best Restaurants list 
                for multiple consecutive years.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E35222]">15+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Years</div>
                </div>
                <div className="w-px h-12 bg-slate-700" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E35222]">50+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Awards</div>
                </div>
                <div className="w-px h-12 bg-slate-700" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#E35222]">3</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Locations</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80"
                  alt="Indian Accent interior"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-5 shadow-2xl max-w-[240px]">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-8 h-8 text-amber-400" />
                  <div>
                    <div className="text-sm font-semibold">Michelin Selected</div>
                    <div className="text-xs text-slate-400">Recognized for excellence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Menu Highlights ─── */}
      <section id="menu" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E35222]/[0.03] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block text-[#E35222] text-sm font-semibold tracking-widest uppercase mb-4">
              The Menu
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Chef&apos;s Highlights
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A curated selection of dishes that embody our philosophy — traditional roots, inventive expression.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {MENU_HIGHLIGHTS.map((item, i) => (
              <div
                key={item.name}
                className="group glass rounded-2xl p-6 sm:p-8 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E35222]/10 text-[#E35222] text-xs font-semibold">
                    {item.tag}
                  </span>
                  <span className="text-xl font-bold text-[#E35222]">{item.price}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-[#E35222] transition-colors">
                  {item.name}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#E35222]/40 text-[#E35222] hover:bg-[#E35222]/10 font-semibold rounded-full transition-all duration-300">
              View Full Menu
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Accolades ─── */}
      <section id="accolades" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-[#E35222] text-sm font-semibold tracking-widest uppercase mb-4">
              Recognition
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold">
              World-Class Acclaim
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {ACCOLADES.map((award, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-8 text-center hover:-translate-y-1 transition-all duration-300"
              >
                <Award className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-1">{award.text}</h3>
                <p className="text-sm text-slate-400">{award.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Visit Section ─── */}
      <section id="visit" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E35222]/[0.03] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block text-[#E35222] text-sm font-semibold tracking-widest uppercase mb-4">
              Plan Your Visit
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold">
              We&apos;d Love to Have You
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E35222]/10 flex items-center justify-center mx-auto mb-5">
                <MapPin className="w-7 h-7 text-[#E35222]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Location</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The Lodhi, Lodhi Road,<br />New Delhi 110003
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E35222]/10 flex items-center justify-center mx-auto mb-5">
                <Clock className="w-7 h-7 text-[#E35222]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Hours</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Lunch: 12:00 – 2:30 PM<br />
                Dinner: 7:00 – 10:30 PM<br />
                <span className="text-amber-400 text-xs">Open all days</span>
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#E35222]/10 flex items-center justify-center mx-auto mb-5">
                <Phone className="w-7 h-7 text-[#E35222]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Reservations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                +91 11 4363 3333<br />
                reservations@indianaccent.com
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <div className="glass rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto">
              <Sparkles className="w-10 h-10 text-[#E35222] mx-auto mb-4" />
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Have Questions?
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Our AI assistant is available 24/7 to help with menu details, reservations, 
                dietary requirements, and more. Just click the chat bubble!
              </p>
              <div className="inline-flex items-center gap-2 text-[#E35222] font-semibold">
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-800/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E35222] to-orange-600 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">Indian Accent</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Inventive Indian cuisine at The Lodhi, New Delhi. Redefining what Indian food can be.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#menu" className="hover:text-white transition-colors">Menu</a></li>
                <li><a href="#visit" className="hover:text-white transition-colors">Visit</a></li>
                <li><a href="#visit" className="hover:text-white transition-colors">Private Dining</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-[#E35222]/20 flex items-center justify-center text-slate-400 hover:text-[#E35222] transition-all">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-[#E35222]/20 flex items-center justify-center text-slate-400 hover:text-[#E35222] transition-all">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-[#E35222]/20 flex items-center justify-center text-slate-400 hover:text-[#E35222] transition-all">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/60 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>&copy; {new Date().getFullYear()} Indian Accent. All rights reserved.</p>
            <a
              href="/dashboard"
              className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
            >
              Owner Dashboard <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* ─── Chat Widget ─── */}
      <ChatWidget />
    </div>
  );
}
