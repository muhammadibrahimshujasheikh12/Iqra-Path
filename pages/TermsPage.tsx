
import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="py-10 space-y-12 max-w-4xl mx-auto pb-40 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-cinzel font-black text-white">Terms & <span className="text-[#D4AF37]">Conditions</span></h1>
        <p className="text-gray-500 font-light">Effective Date: October 2023</p>
      </div>

      <div className="premium-card p-10 rounded-[2.5rem] space-y-10 border border-white/10 bg-[#0a0a0a]">
         <p className="text-gray-300 font-light leading-relaxed">
            Welcome to IqraPath. By accessing our application, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
         </p>

         <div className="space-y-8">
            <section className="space-y-3">
               <h3 className="flex items-center gap-2 font-cinzel font-bold text-white text-lg">
                  <CheckCircle2 size={18} className="text-[#D4AF37]" /> Acceptable Use
               </h3>
               <p className="text-sm text-gray-500 font-light leading-relaxed pl-7">
                  IqraPath is a platform for spiritual growth. Users are expected to maintain respectful behavior in community features (Social, Comments). Hate speech, harassment, or unverified religious claims are strictly prohibited and may result in account termination.
               </p>
            </section>

            <section className="space-y-3">
               <h3 className="flex items-center gap-2 font-cinzel font-bold text-white text-lg">
                  <AlertTriangle size={18} className="text-red-500" /> Content Disclaimer
               </h3>
               <p className="text-sm text-gray-500 font-light leading-relaxed pl-7">
                  While we strive for authenticity by sourcing content from verified Islamic texts, IqraPath is an educational tool, not a substitute for scholarly fatwas. Always consult local scholars for specific jurisprudential (Fiqh) rulings tailored to your situation.
               </p>
            </section>

            <section className="space-y-3">
               <h3 className="flex items-center gap-2 font-cinzel font-bold text-white text-lg">
                  <Scale size={18} className="text-blue-500" /> Intellectual Property
               </h3>
               <p className="text-sm text-gray-500 font-light leading-relaxed pl-7">
                  The Qur'an text and translations are open source or used with permission. The unique design, code, and "IqraPath" branding are the intellectual property of our organization.
               </p>
            </section>
         </div>

         <div className="pt-8 border-t border-white/5">
            <p className="text-xs text-gray-600">
               We reserve the right to modify these terms at any time. Continued use of the app signifies your acceptance of updated terms.
            </p>
         </div>
      </div>
    </div>
  );
};

export default TermsPage;
