import React, { useState } from 'react';
import { LogoSeal } from './logoseal';
import { Calendar, Clock, Users, MapPin, CheckCircle2, Sparkles, X, Phone, User, Mail, MessageSquare } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    guests: '2',
    seating: 'Indoor Salon Elegat',
    occasion: 'Regular Dining',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
  };

  const bookingCode = `LW-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#233433] border-2 border-[#CFC0A4] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-[#FAF8F5] my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#4F6B6A] text-[#FAF8F5] flex items-center justify-center border border-[#CFC0A4]/40 hover:bg-[#CFC0A4] hover:text-[#233433] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="text-center space-y-2 border-b border-[#CFC0A4]/20 pb-5">
              <div className="flex justify-center mb-2">
                <LogoSeal size={70} />
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
                Reservasi Meja Elegat
              </h2>
              <p className="font-sans-clean text-xs text-[#CFC0A4] italic font-serif-classic">
                "Pengalaman Santap Istimewa di LW's by Bubur Kang LW"
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 font-sans-clean text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nama Lengkap Tamu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. M. Lintang Negara PW"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                  />
                </div>

                {/* Time Slot */}
                <div className="space-y-1">
                  <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Jam Kedatangan *
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                  >
                    <option value="08:00">08:00 WIB (Breakfast)</option>
                    <option value="10:00">10:00 WIB (Morning Coffee)</option>
                    <option value="12:30">12:30 WIB (Lunch Time)</option>
                    <option value="15:30">15:30 WIB (High Tea & Pastry)</option>
                    <option value="18:30">18:30 WIB (Fine Dinner)</option>
                    <option value="20:00">20:00 WIB (Evening Drinks)</option>
                  </select>
                </div>

                {/* Guests */}
                <div className="space-y-1">
                  <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Jumlah Tamu *
                  </label>
                  <select
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                  >
                    <option value="1">1 Orang (Solo Dining)</option>
                    <option value="2">2 Orang (Romantic / Duo)</option>
                    <option value="4">4 Orang (Small Group)</option>
                    <option value="6">6 Orang (Family Dining)</option>
                    <option value="10">8-10 Orang (Private Event)</option>
                  </select>
                </div>
              </div>

              {/* Seating Area */}
              <div className="space-y-1">
                <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Pilihan Area Meja
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'Indoor Salon Elegat', name: 'Indoor Salon', desc: 'Sofa beludru & marmer' },
                    { id: 'Teras Garden Paris', name: 'Teras Garden Paris', desc: 'Bistro outdoor segar' },
                    { id: 'Chef Vault VIP Room', name: 'VIP Vault Room', desc: 'Privat & mewah' },
                  ].map((area) => (
                    <button
                      type="button"
                      key={area.id}
                      onClick={() => setFormData({ ...formData, seating: area.id })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        formData.seating === area.id
                          ? 'bg-[#CFC0A4] text-[#233433] border-[#CFC0A4] font-bold'
                          : 'bg-[#4F6B6A] text-[#FAF8F5] border-[#CFC0A4]/30 hover:border-[#CFC0A4]'
                      }`}
                    >
                      <p className="text-xs font-semibold">{area.name}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">{area.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[#CFC0A4] font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Catatan Khusus (Momen Spesial / Alergi)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ulang tahun pernikahan, minta meja dekat jendela..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#4F6B6A] border border-[#CFC0A4]/30 rounded-lg p-2.5 text-[#FAF8F5] focus:outline-none focus:border-[#CFC0A4]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-[#CFC0A4] text-[#233433] font-sans-clean font-bold text-xs uppercase tracking-widest hover:bg-[#FAF8F5] transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Konfirmasi Reservasi Saya</span>
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* Confirmation Success Voucher */
          <div className="p-8 text-center space-y-6 animate-fadeIn">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#CFC0A4]/20 border-2 border-[#CFC0A4] flex items-center justify-center text-[#CFC0A4]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-sans-clean font-semibold uppercase tracking-widest text-[#CFC0A4]">
                Reservasi Berhasil Dikonfirmasi
              </span>
              <h3 className="font-serif-display text-2xl font-bold text-[#FAF8F5]">
                Sampai Jumpa di Maison de LW's
              </h3>
              <p className="text-xs text-[#FAF8F5]/80 font-sans-clean max-w-md mx-auto">
                Voucer reservasi digital Anda telah berhasil dibuat. Tim kami telah menyiapkan meja terbaik untuk Anda.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="p-5 rounded-xl bg-[#4F6B6A] border border-[#CFC0A4]/40 text-left space-y-3 font-sans-clean text-xs relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#CFC0A4]/20 pb-3">
                <div>
                  <p className="text-[10px] text-[#CFC0A4] uppercase tracking-widest">Kode Booking Digital</p>
                  <p className="font-mono text-lg font-bold text-[#FAF8F5]">{bookingCode}</p>
                </div>
                <LogoSeal size={40} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[#FAF8F5]">
                <div>
                  <p className="text-[#CFC0A4] text-[10px]">Atas Nama</p>
                  <p className="font-semibold">{formData.name}</p>
                </div>
                <div>
                  <p className="text-[#CFC0A4] text-[10px]">Nomor WhatsApp</p>
                  <p className="font-semibold">{formData.phone}</p>
                </div>
                <div>
                  <p className="text-[#CFC0A4] text-[10px]">Tanggal & Jam</p>
                  <p className="font-semibold">{formData.date} • {formData.time} WIB</p>
                </div>
                <div>
                  <p className="text-[#CFC0A4] text-[10px]">Area Meja & Tamu</p>
                  <p className="font-semibold">{formData.seating} ({formData.guests} Tamu)</p>
                </div>
              </div>

              {formData.notes && (
                <div className="pt-2 border-t border-[#CFC0A4]/20 text-[11px] italic text-[#CFC0A4]">
                  Catatan: "{formData.notes}"
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setStep('form');
                  onClose();
                }}
                className="w-full py-3 rounded-lg bg-[#CFC0A4] text-[#233433] font-sans-clean font-bold text-xs uppercase tracking-wider hover:bg-[#FAF8F5]"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
