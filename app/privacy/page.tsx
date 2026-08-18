import Link from 'next/link'
import { Salad, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — FoodJournal',
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base font-bold mt-6 mb-2" style={{ color: '#1a3d2b' }}>{children}</h2>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-relaxed mb-3" style={{ color: '#5c5348' }}>{children}</p>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#c8e6c9' }}>
      <div className="px-5 pt-14 pb-10 text-center safe-area-pt"
        style={{ background: 'linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Salad className="w-7 h-7 text-white" />
          <h1 className="text-2xl font-bold text-white tracking-tight">FoodJournal</h1>
        </div>
        <p className="text-[#b9f6ca] text-sm">Privacy Policy</p>
      </div>

      <div className="flex-1 px-5 py-8">
        <div className="bg-white rounded-2xl p-6 max-w-2xl mx-auto" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.08)' }}>
          <P><strong>Effective date:</strong> August 18, 2026</P>

          <P>
            FoodJournal (&quot;we&quot;, &quot;us&quot;) provides an AI-powered nutrition tracking app.
            This policy explains what information we collect, how we use it, and the choices you have.
          </P>

          <H2>Information We Collect</H2>
          <P><strong>Account information:</strong> name, email address, and a securely hashed password. We never store your password in plain text.</P>
          <P><strong>Profile &amp; goals:</strong> age, height, weight, gender, and nutrition targets you choose to enter.</P>
          <P><strong>Food data:</strong> photos you take of your meals, AI-generated nutrition estimates (calories, protein, carbs, fat, fiber), and any edits you make to them.</P>
          <P><strong>Body stats:</strong> weight and body fat percentage entries you log, and any goals you set.</P>
          <P><strong>Cravings conversations:</strong> messages you send in the Cravings feature, and cuisine/dietary preferences you save.</P>
          <P><strong>Device permissions:</strong> camera and photo library access (to capture or select food photos) and microphone access (for voice input in Cravings). These are only used in the moment you actively use that feature — we do not access them in the background.</P>

          <H2>How We Use Your Information</H2>
          <P>We use your information to operate the app: analyzing food photos, generating nutrition estimates, providing coaching advice, powering the Cravings assistant, and sending you password reset emails when requested. We do not sell your personal information, and we do not use it for third-party advertising.</P>

          <H2>Third-Party Service Providers</H2>
          <P>We rely on a small number of trusted providers to run the app:</P>
          <P>• <strong>Anthropic (Claude AI)</strong> — processes food photos and text to generate nutrition estimates and coaching responses.</P>
          <P>• <strong>Turso</strong> — hosts our database, where your account and food-log data are stored, scoped to your account only.</P>
          <P>• <strong>Resend</strong> — delivers transactional emails, such as password reset links.</P>
          <P>• <strong>Vercel</strong> — hosts the application itself.</P>
          <P>Each provider only receives the data necessary to perform its specific function.</P>

          <H2>Voice Input</H2>
          <P>The Cravings feature&apos;s voice input uses your device&apos;s built-in speech recognition. Audio is processed on-device by your operating system — only the resulting transcribed text is sent to our servers, never raw audio.</P>

          <H2>Data Storage &amp; Security</H2>
          <P>Passwords are hashed before storage and never stored or transmitted in plain text. All traffic between your device and our servers is encrypted (HTTPS/TLS). Your data is scoped to your account and is not visible to other users.</P>

          <H2>Your Choices</H2>
          <P>You can edit or delete individual food entries and body stat logs at any time within the app. To request full deletion of your account and associated data, contact us at the email below and we&apos;ll process your request.</P>

          <H2>Not Medical Advice</H2>
          <P>FoodJournal provides general nutrition information and is not a substitute for professional medical advice. Always consult a doctor or registered dietitian for medical decisions, including those related to eating disorders or other health conditions.</P>

          <H2>Children&apos;s Privacy</H2>
          <P>FoodJournal is not directed at children under 13, and we do not knowingly collect personal information from children under 13.</P>

          <H2>Changes to This Policy</H2>
          <P>We may update this policy from time to time. Material changes will be reflected by updating the effective date above.</P>

          <H2>Contact Us</H2>
          <P>Questions about this policy or your data? Email us at{' '}
            <a href="mailto:support@foodsjournal.online" className="font-semibold" style={{ color: '#007a2e' }}>
              support@foodsjournal.online
            </a>.
          </P>

          <Link href="/login" className="flex items-center gap-2 text-sm font-semibold mt-6" style={{ color: '#9c8e7e' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
