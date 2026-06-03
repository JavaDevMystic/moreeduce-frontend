import { BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-sm">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-black tracking-tight">MoreEduce</span>
          </Link>
          <p className="text-sm text-slate-500 leading-relaxed">
            MoreEduce - zamonaviy texnologiyalar va tajribali ustozlar yordamida bilim olishingiz uchun eng qulay platforma. Biz bilan yangi marralarni zabt eting.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-wider">Yordam</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link to="/contact" className="hover:text-primary transition-colors">Biz bilan aloqa</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition-colors">Ko'p so'raladigan savollar</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition-colors">Foydalanish shartlari</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-wider">Yo'nalishlar</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link to="/" className="hover:text-primary transition-colors">Dasturlash</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Grafik Dizayn</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">Xorijiy tillar</Link></li>
            <li><Link to="/" className="hover:text-primary transition-colors">SMM va Marketing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-black mb-6 text-sm uppercase tracking-wider">Aloqa</h4>
          <div className="text-sm text-slate-500 space-y-3">
            <p className="flex items-center gap-2">O'zbekiston, Toshkent sh., Lorem Ko'chasi, 10-uy</p>
            <p className="mt-2">Tel: +998 (90) 123-45-67</p>
            <p>Mail: info@moreeduce.uz</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          Copyright © {new Date().getFullYear()} MoreEduce. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
