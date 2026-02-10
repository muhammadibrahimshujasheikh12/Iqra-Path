
import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="py-10 space-y-12 max-w-4xl mx-auto pb-40 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-cinzel font-black text-white">Privacy <span className="text-[#D4AF37]">Policy</span></h1>
        <p className="text-gray-500 font-light">Last Updated: October 2023</p>
      </div>

      <div className="premium-card p-10 rounded-[2.5rem] space-y-10 border border-white/10 bg-[#0a0a0a]">
         <p className="text-gray-300 font-light leading-relaxed">
            At IqraPath, we consider your privacy a sacred trust (Amanah). This policy outlines how we handle your data with the utmost respect and security, following both international standards and Islamic ethical principles.
         </p>

         <div className="space-y-6">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37] shrink-0"><Database size={24} /></div>
               <div className="space-y-2">
                  <h3 className="font-cinzel font-bold text-white text-lg">Data Collection</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                     We collect only what is necessary for your spiritual journey: your email for authentication, your location for accurate prayer times, and your progress data (bookmarks, tracker logs) to synchronize across devices.
                  </p>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0"><Lock size={24} /></div>
               <div className="space-y-2">
                  <h3 className="font-cinzel font-bold text-white text-lg">Security</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                     Your data is encrypted in transit and at rest using industry-standard protocols. We do not sell your personal data to advertisers. Your spiritual habits are private between you and your Creator.
                  </p>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="p-3 bg-green-500/10 rounded-xl text-green-500 shrink-0"><Eye size={24} /></div>
               <div className="space-y-2">
                  <h3 className="font-cinzel font-bold text-white text-lg">Your Rights</h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                     You have the right to request a full export of your data or a complete deletion of your account at any time via your profile settings.
                  </p>
               </div>
            </div>
         </div>

         <div className="pt-8 border-t border-white/5">
            <p className="text-xs text-gray-600">
               For any privacy concerns, please contact our support team at privacy@iqrapath.com.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
