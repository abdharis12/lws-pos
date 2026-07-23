import React from 'react';
import { LogoSeal } from './logoseal';
import { Coffee, Utensils, Sparkles, ChevronRight, Award } from 'lucide-react';
import { Head } from '@inertiajs/react';

interface HeroProps {
  onOpenReservation: () => void;
  onExploreMenu: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenReservation, onExploreMenu }) => {
  return (
    <section className="relative bg-[#4F6B6A] text-[#FAF8F5] overflow-hidden pt-10 pb-16 lg:py-24 border-b border-[#CFC0A4]/30">

           <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex justify-center items-center">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none">
          <circle cx="500" cy="500" r="450" stroke="#CFC0A4" strokeWidth="2" strokeDasharray="10 15" />
          <circle cx="500" cy="500" r="350" stroke="#CFC0A4" strokeWidth="1" />
          <path d="M 100 500 Q 500 100 900 500" stroke="#CFC0A4" strokeWidth="2" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text Content & Brand Statement */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#233433] border border-[#CFC0A4]/40 text-[#CFC0A4] text-xs font-sans-clean font-medium tracking-widest uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-[#CFC0A4]" />
              <span>Bubur Ayam dengan cita rasa yang khas</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif-display text-3xl sm:text-5xl xl:text-6xl font-normal leading-[1.15] text-[#FAF8F5] tracking-tight">
              Kehangatan <span className="italic font-serif-classic text-[#CFC0A4]">Nusantara</span> dalam Kemewahan <span className="gold-shine-text font-serif-display font-medium">Klasik Eropa</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg font-sans-clean font-light text-[#FAF8F5]/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Selamat datang di <strong className="font-semibold text-[#CFC0A4]">LW's by Bubur Kang LW</strong>. Tempat bertemunya tradisi cita rasa bubur artisanal Nusantara dengan resep keluarga yang diwariskan dari generasi ke generasi.
            </p>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3 text-xs font-sans-clean text-[#FAF8F5]/90">
              <div className="flex items-center gap-2 bg-[#233433]/70 border border-[#CFC0A4]/25 px-3.5 py-2 rounded-md">
                <Utensils className="w-3.5 h-3.5 text-[#CFC0A4]" />
                <span>Authentic Porridge</span>
              </div>
              <div className="flex items-center gap-2 bg-[#233433]/70 border border-[#CFC0A4]/25 px-3.5 py-2 rounded-md">
                <Coffee className="w-3.5 h-3.5 text-[#CFC0A4]" />
                <span>Specialty Tea</span>
              </div>
              <div className="flex items-center gap-2 bg-[#233433]/70 border border-[#CFC0A4]/25 px-3.5 py-2 rounded-md">
                <Award className="w-3.5 h-3.5 text-[#CFC0A4]" />
                <span>Artisanal Bakery</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                    onClick={onExploreMenu}
                    className="w-full sm:w-auto px-8 py-4 rounded-md bg-[#CFC0A4] text-[#233433] font-sans-clean font-bold text-xs tracking-widest uppercase hover:bg-[#FAF8F5] transition-all duration-300 shadow-xl flex items-center justify-center gap-2 group"
                >
                    <span>Jelajahi Menu & Spesialisasi</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={onOpenReservation}
                    className="w-full sm:w-auto px-8 py-4 rounded-md bg-[#233433] border border-[#CFC0A4] text-[#CFC0A4] font-sans-clean font-semibold text-xs tracking-widest uppercase hover:bg-[#CFC0A4] hover:text-[#233433] transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <span>Reservasi Meja</span>
                </button>
            </div>

            {/* Quick Operating Info Bar */}
            <div className="pt-6 border-t border-[#CFC0A4]/20 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left text-xs font-sans-clean text-[#FAF8F5]/80">
              <div>
                <p className="text-[#CFC0A4] font-serif-classic text-sm italic">Jam Operasional</p>
                <p className="font-medium mt-0.5">Senin - Minggu: 07:00 - 20:00</p>
              </div>
              <div>
                <p className="text-[#CFC0A4] font-serif-classic text-sm italic">Suasana</p>
                <p className="font-medium mt-0.5">Classic European & Terrace</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[#CFC0A4] font-serif-classic text-sm italic">Lokasi Flagship</p>
                <p className="font-medium mt-0.5">Jl. Angkatan 45 - Palembang</p>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Frame with Logo Seal & Bistro Ambience Showcase */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Elegant Border Frame Container */}
            <div className="relative w-full max-w-md bg-[#233433] rounded-2xl p-6 border-2 border-[#CFC0A4]/40 shadow-2xl overflow-hidden group">
              
              {/* Corner Decorative Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#CFC0A4]"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#CFC0A4]"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#CFC0A4]"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#CFC0A4]"></div>

              {/* Main Visual Image: European Bistro Atmosphere */}
              <div className="relative h-80 rounded-lg overflow-hidden border border-[#CFC0A4]/30 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                  alt="LW's European Classic Cafe Interior"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 brightness-90"
                />
                
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#233433] via-[#233433]/30 to-transparent"></div>

                {/* Floating Seal Badge in Image Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#4F6B6A]/90 rounded-full border border-[#CFC0A4] shadow-2xl backdrop-blur-sm">
                    <LogoSeal />
                  </div>
                </div>

                {/* Image Overlay Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs text-[#FAF8F5] bg-[#233433]/80 backdrop-blur-md px-3 py-2 rounded border border-[#CFC0A4]/20">
                  <span className="font-serif-classic italic text-[#CFC0A4]">Est. 2024 • Palembang</span>
                  <span className="font-sans-clean text-[11px] font-semibold text-[#FAF8F5]">LW's by Bubur Kang LW</span>
                </div>
              </div>

              {/* Featured Quote Box */}
              <div className="mt-5 p-4 rounded-lg bg-[#4F6B6A] border border-[#CFC0A4]/20 text-center">
                <p className="font-serif-classic text-base italic text-[#CFC0A4]">
                  "Nikmati perpaduan harmonis antara sedap gurih bubur warisan keluarga dari generasi ke generasi."
                </p>
                <p className="font-sans-clean text-[11px] text-[#FAF8F5]/80 mt-2 uppercase tracking-widest font-semibold">
                  — Founder LW's by Bubur Kang LW
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
